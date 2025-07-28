const mongoose = require('mongoose');

const pairwiseComparisonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  // Location being ranked
  newLocationData: {
    visitType: {
      type: String,
      required: true,
      enum: ['neighborhood', 'country']
    },
    neighborhoodName: String,
    boroughName: String,
    countryName: String,
    visited: Boolean,
    notes: String,
    visitDate: Date,
    preSelectedCategory: {
      type: String,
      enum: ['Bad', 'Mid', 'Good']
    }
  },
  // Binary search state
  searchState: {
    sortedVisitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visit' }],
    currentLow: { type: Number, default: 0 },
    currentHigh: Number,
    currentMid: Number,
    comparisonsCompleted: { type: Number, default: 0 },
    totalComparisons: Number
  },
  // Comparison history
  comparisons: [{
    compareVisitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
    newLocationBetter: Boolean,
    timestamp: { type: Date, default: Date.now }
  }],
  // Final result
  isComplete: {
    type: Boolean,
    default: false
  },
  finalScore: Number,
  finalCategory: {
    type: String,
    enum: ['Bad', 'Mid', 'Good']
  },
  // Auto-cleanup
  expiresAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
pairwiseComparisonSchema.index({ userId: 1, sessionId: 1 });
pairwiseComparisonSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

// Method to get current comparison
pairwiseComparisonSchema.methods.getCurrentComparison = async function() {
  if (this.isComplete) return null;
  
  const { sortedVisitIds, currentMid } = this.searchState;
  if (currentMid >= sortedVisitIds.length) return null;
  
  const Visit = mongoose.model('Visit');
  const compareVisit = await Visit.findById(sortedVisitIds[currentMid]).populate('neighborhoodId countryId');
  
  return {
    sessionId: this.sessionId,
    newLocation: this.newLocationData,
    compareVisit: compareVisit,
    progress: {
      current: this.searchState.comparisonsCompleted,
      total: this.searchState.totalComparisons
    }
  };
};

// Method to process comparison result
pairwiseComparisonSchema.methods.processComparison = function(newLocationBetter) {
  const { currentLow, currentHigh, currentMid } = this.searchState;
  
  // Record comparison
  this.comparisons.push({
    compareVisitId: this.searchState.sortedVisitIds[currentMid],
    newLocationBetter: newLocationBetter
  });
  
  this.searchState.comparisonsCompleted++;
  
  // Update binary search bounds
  if (newLocationBetter) {
    this.searchState.currentHigh = currentMid;
  } else {
    this.searchState.currentLow = currentMid + 1;
  }
  
  // Check if search is complete
  if (this.searchState.currentLow >= this.searchState.currentHigh) {
    this.isComplete = true;
    return this.calculateFinalScore();
  }
  
  // Calculate next mid point
  this.searchState.currentMid = Math.floor((this.searchState.currentLow + this.searchState.currentHigh) / 2);
  
  return null; // More comparisons needed
};

// Method to calculate final score based on insertion position
pairwiseComparisonSchema.methods.calculateFinalScore = async function() {
  const Visit = mongoose.model('Visit');
  const insertionIndex = this.searchState.currentLow;
  const sortedVisitIds = this.searchState.sortedVisitIds;
  
  let finalScore;
  
  // Get category bounds for pre-selected category
  const bounds = {
    'Good': { min: 7.0, max: 10.0 },
    'Mid': { min: 4.0, max: 6.9 },
    'Bad': { min: 0.0, max: 3.9 }
  };
  
  if (sortedVisitIds.length === 0) {
    // First item - place in middle of selected category, or Good if no category selected
    const targetCategory = this.newLocationData.preSelectedCategory || 'Good';
    const categoryBounds = bounds[targetCategory];
    finalScore = (categoryBounds.min + categoryBounds.max) / 2;
  } else if (insertionIndex === 0) {
    // Better than best item - constrain to category bounds if pre-selected
    const bestVisit = await Visit.findById(sortedVisitIds[0]);
    if (this.newLocationData.preSelectedCategory) {
      const categoryBounds = bounds[this.newLocationData.preSelectedCategory];
      finalScore = Math.min(bestVisit.rating + 1.0, categoryBounds.max);
    } else {
      finalScore = Math.min(bestVisit.rating + 1.0, 10.0);
    }
  } else if (insertionIndex >= sortedVisitIds.length) {
    // Worse than worst item - constrain to category bounds if pre-selected
    const worstVisit = await Visit.findById(sortedVisitIds[sortedVisitIds.length - 1]);
    if (this.newLocationData.preSelectedCategory) {
      const categoryBounds = bounds[this.newLocationData.preSelectedCategory];
      finalScore = Math.max(worstVisit.rating - 1.0, categoryBounds.min);
    } else {
      finalScore = Math.max(worstVisit.rating - 1.0, 0.0);
    }
  } else {
    // Between two items
    const upperVisit = await Visit.findById(sortedVisitIds[insertionIndex - 1]);
    const lowerVisit = await Visit.findById(sortedVisitIds[insertionIndex]);
    finalScore = (upperVisit.rating + lowerVisit.rating) / 2;
    
    // Check if rebalancing needed
    if (Math.abs(upperVisit.rating - lowerVisit.rating) < 0.0001) {
      finalScore = await this.triggerRebalancing(upperVisit.category);
    }
  }
  
  // Set category - use pre-selected category if available, otherwise determine from score
  if (this.newLocationData.preSelectedCategory) {
    this.finalCategory = this.newLocationData.preSelectedCategory;
  } else {
    // Fallback to score-based categorization
    if (finalScore >= 7.0) this.finalCategory = 'Good';
    else if (finalScore >= 4.0) this.finalCategory = 'Mid';
    else this.finalCategory = 'Bad';
  }
  
  this.finalScore = finalScore;
  return { score: finalScore, category: this.finalCategory };
};

// Method to trigger rebalancing for a category
pairwiseComparisonSchema.methods.triggerRebalancing = async function(category) {
  const Visit = mongoose.model('Visit');
  
  // Get category bounds
  const bounds = {
    'Good': { min: 7.0, max: 10.0 },
    'Mid': { min: 4.0, max: 6.9 },
    'Bad': { min: 0.0, max: 3.9 }
  };
  
  const { min, max } = bounds[category];
  
  // Get all visits in this category for this user
  const categoryVisits = await Visit.find({
    userId: this.userId,
    category: category,
    rating: { $exists: true, $ne: null }
  }).sort({ rating: -1 });
  
  if (categoryVisits.length <= 1) return (min + max) / 2;
  
  // Redistribute scores evenly
  categoryVisits.forEach((visit, index) => {
    visit.rating = min + (max - min) * (categoryVisits.length - 1 - index) / (categoryVisits.length - 1);
  });
  
  // Save all visits
  await Promise.all(categoryVisits.map(visit => visit.save()));
  
  // Return middle score for new item
  return (min + max) / 2;
};

module.exports = mongoose.model('PairwiseComparison', pairwiseComparisonSchema);
const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  neighborhoodId: {
    type: String,
    required: true,
    trim: true
  },
  visited: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  visitDate: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  walkabilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
}, {
  timestamps: true
});

visitSchema.index({ userId: 1, neighborhoodId: 1 }, { unique: true });
visitSchema.index({ neighborhoodId: 1 });
visitSchema.index({ userId: 1 });

// Pre-save middleware to update neighborhood's average rating
visitSchema.post('save', async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const neighborhood = await Neighborhood.findOne({ _id: this.neighborhoodId });
  if (neighborhood) {
    await neighborhood.calculateAverageRating();
  }
});

// Pre-remove middleware to update neighborhood's average rating
visitSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Neighborhood = mongoose.model('Neighborhood');
    const neighborhood = await Neighborhood.findOne({ _id: doc.neighborhoodId });
    if (neighborhood) {
      await neighborhood.calculateAverageRating();
    }
  }
});

// Method to get full neighborhood and borough details
visitSchema.methods.getFullDetails = async function() {
  const Neighborhood = mongoose.model('Neighborhood');
  const Borough = mongoose.model('Borough');
  const User = mongoose.model('User');
  
  const neighborhood = await Neighborhood.findOne({ _id: this.neighborhoodId });
  const borough = neighborhood ? await Borough.findOne({ _id: neighborhood.boroughId }) : null;
  const user = await User.findOne({ _id: this.userId });
  
  return {
    ...this.toObject(),
    neighborhood: neighborhood ? { name: neighborhood.name, borough: borough?.name } : null,
    user: user ? { username: user.username, email: user.email } : null
  };
};

// Static method to get user's visit statistics
visitSchema.statics.getUserStats = async function(userId) {
  const userVisits = await this.find({ userId: userId });
  const Neighborhood = mongoose.model('Neighborhood');
  const Borough = mongoose.model('Borough');
  
  let totalVisits = 0;
  let totalNeighborhoods = userVisits.length;
  let ratings = [];
  let boroughsVisitedSet = new Set();
  
  for (const visit of userVisits) {
    if (visit.visited) {
      totalVisits++;
      const neighborhood = await Neighborhood.findOne({ _id: visit.neighborhoodId });
      if (neighborhood) {
        boroughsVisitedSet.add(neighborhood.boroughId);
      }
    }
    if (visit.rating) {
      ratings.push(visit.rating);
    }
  }
  
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  
  return {
    totalVisits,
    totalNeighborhoods,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    boroughsVisited: boroughsVisitedSet.size
  };
};

// Static method to get neighborhood popularity
visitSchema.statics.getNeighborhoodPopularity = async function(limit = 10) {
  const visitedNeighborhoods = await this.aggregate([
    { $match: { visited: true } },
    {
      $group: {
        _id: '$neighborhoodId',
        visitCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        uniqueVisitors: { $addToSet: '$userId' }
      }
    },
    { $sort: { visitCount: -1, avgRating: -1 } },
    { $limit: limit }
  ]);
  
  const Neighborhood = mongoose.model('Neighborhood');
  const Borough = mongoose.model('Borough');
  
  const result = [];
  for (const item of visitedNeighborhoods) {
    const neighborhood = await Neighborhood.findOne({ _id: item._id });
    const borough = neighborhood ? await Borough.findOne({ _id: neighborhood.boroughId }) : null;
    
    result.push({
      neighborhood: item._id,
      neighborhoodName: neighborhood?.name || 'Unknown',
      boroughName: borough?.name || 'Unknown',
      visitCount: item.visitCount,
      avgRating: item.avgRating ? Math.round(item.avgRating * 10) / 10 : null,
      uniqueVisitors: item.uniqueVisitors.length
    });
  }
  
  return result;
};

module.exports = mongoose.model('Visit', visitSchema);
const Visit = require('../models/Visit');
const PairwiseComparison = require('../models/PairwiseComparison');
const { v4: uuidv4 } = require('uuid');

/**
 * Initialize a pairwise ranking session for a new location
 */
const initializePairwiseSession = async (userId, newLocationData, preSelectedCategory = null) => {
  // Get user's existing visits of the same type and metropolitan area, sorted by rating (descending)
  // If preSelectedCategory is provided, only get visits from that category
  let existingVisits;
  
  if (newLocationData.visitType === 'neighborhood') {
    // For neighborhoods, we need to filter by the same borough/city context
    // First, find the location to get its parent area
    let parentAreaQuery = {};
    
    if (newLocationData.boroughName) {
      // Find borough-based neighborhoods
      const borough = await require('../models/Borough').findOne({ name: newLocationData.boroughName });
      if (borough) {
        // Get all neighborhoods in this borough
        const neighborhoodsInBorough = await require('../models/Neighborhood').find({ 
          boroughId: borough._id.toString() 
        });
        const neighborhoodIds = neighborhoodsInBorough.map(n => n._id.toString());
        parentAreaQuery = { neighborhoodId: { $in: neighborhoodIds } };
      }
    } else {
      // Try city-based neighborhoods  
      const city = await require('../models/City').findOne({ name: newLocationData.boroughName });
      if (city) {
        const neighborhoodsInCity = await require('../models/Neighborhood').find({ 
          cityId: city._id.toString() 
        });
        const neighborhoodIds = neighborhoodsInCity.map(n => n._id.toString());
        parentAreaQuery = { neighborhoodId: { $in: neighborhoodIds } };
      }
    }
    
    const query = {
      userId: userId,
      visitType: newLocationData.visitType,
      rating: { $exists: true, $ne: null },
      ...parentAreaQuery
    };
    
    // Filter by pre-selected category if provided
    if (preSelectedCategory) {
      query.category = preSelectedCategory;
    }
    
    existingVisits = await Visit.find(query).sort({ rating: -1 });
    
  } else if (newLocationData.visitType === 'country') {
    // For countries, compare all countries (no metropolitan area filtering)
    const query = {
      userId: userId,
      visitType: newLocationData.visitType,
      rating: { $exists: true, $ne: null }
    };
    
    // Filter by pre-selected category if provided
    if (preSelectedCategory) {
      query.category = preSelectedCategory;
    }
    
    existingVisits = await Visit.find(query).sort({ rating: -1 });
  } else {
    existingVisits = [];
  }

  const sessionId = uuidv4();
  const totalComparisons = existingVisits.length > 0 ? Math.ceil(Math.log2(existingVisits.length + 1)) : 0;

  // Create comparison session
  const comparisonSession = new PairwiseComparison({
    userId: userId,
    sessionId: sessionId,
    newLocationData: newLocationData,
    searchState: {
      sortedVisitIds: existingVisits.map(visit => visit._id),
      currentLow: 0,
      currentHigh: existingVisits.length,
      currentMid: existingVisits.length > 0 ? Math.floor(existingVisits.length / 2) : 0,
      comparisonsCompleted: 0,
      totalComparisons: totalComparisons
    }
  });

  await comparisonSession.save();

  // Return first comparison or complete immediately if no existing visits
  if (existingVisits.length === 0) {
    comparisonSession.isComplete = true;
    const result = await comparisonSession.calculateFinalScore();
    await comparisonSession.save();
    return { isComplete: true, result: result, sessionId: sessionId };
  }

  const firstComparison = await comparisonSession.getCurrentComparison();
  return { isComplete: false, comparison: firstComparison };
};

/**
 * Process a comparison result and return next comparison or final result
 */
const processComparison = async (sessionId, newLocationBetter) => {
  const session = await PairwiseComparison.findOne({ 
    sessionId: sessionId,
    isComplete: false
  });

  if (!session) {
    throw new Error('Comparison session not found or already completed');
  }

  const result = await session.processComparison(newLocationBetter);
  await session.save();

  if (session.isComplete) {
    return { isComplete: true, result: result };
  }

  const nextComparison = await session.getCurrentComparison();
  return { isComplete: false, comparison: nextComparison };
};

/**
 * Get user's ranked visits by category, optionally filtered by metropolitan area
 */
const getUserRankings = async (userId, visitType = null, category = null, metropolitanArea = null) => {
  const query = {
    userId: userId,
    rating: { $exists: true, $ne: null },
    ratingType: 'pairwise'
  };

  if (visitType) query.visitType = visitType;
  if (category) query.category = category;

  // Add metropolitan area filtering for neighborhoods
  if (visitType === 'neighborhood' && metropolitanArea) {
    // Find neighborhoods in the specified metropolitan area
    let neighborhoodIds = [];
    
    // Try as borough first
    const borough = await require('../models/Borough').findOne({ name: metropolitanArea });
    if (borough) {
      const neighborhoodsInBorough = await require('../models/Neighborhood').find({ 
        boroughId: borough._id.toString() 
      });
      neighborhoodIds = neighborhoodsInBorough.map(n => n._id.toString());
    } else {
      // Try as city
      const city = await require('../models/City').findOne({ name: metropolitanArea });
      if (city) {
        const neighborhoodsInCity = await require('../models/Neighborhood').find({ 
          cityId: city._id.toString() 
        });
        neighborhoodIds = neighborhoodsInCity.map(n => n._id.toString());
      }
    }
    
    if (neighborhoodIds.length > 0) {
      query.neighborhoodId = { $in: neighborhoodIds };
    }
  }

  const visits = await Visit.find(query)
    .sort({ category: 1, rating: -1 })
    .populate('neighborhoodId countryId');

  // Group by category
  const rankings = {
    Good: visits.filter(v => v.category === 'Good'),
    Mid: visits.filter(v => v.category === 'Mid'),
    Bad: visits.filter(v => v.category === 'Bad')
  };

  return rankings;
};

/**
 * Create a visit using the pairwise ranking result
 */
const createVisitFromPairwiseResult = async (sessionId) => {
  const session = await PairwiseComparison.findOne({ 
    sessionId: sessionId,
    isComplete: true
  });

  if (!session) {
    throw new Error('Completed comparison session not found');
  }

  const { newLocationData } = session;
  const visitData = {
    userId: session.userId,
    visitType: newLocationData.visitType,
    visited: newLocationData.visited || false,
    notes: newLocationData.notes || '',
    visitDate: newLocationData.visitDate,
    rating: session.finalScore,
    ratingType: 'pairwise',
    category: session.finalCategory
  };

  // Add location-specific fields
  if (newLocationData.visitType === 'neighborhood') {
    visitData.neighborhoodName = newLocationData.neighborhoodName;
    visitData.boroughName = newLocationData.boroughName;
  } else if (newLocationData.visitType === 'country') {
    visitData.countryName = newLocationData.countryName;
  }

  // Use existing visits API logic to resolve location IDs
  return visitData;
};

/**
 * Check if rebalancing is needed for a category
 */
const checkRebalancingNeeded = async (userId, category) => {
  const visits = await Visit.find({
    userId: userId,
    category: category,
    rating: { $exists: true, $ne: null },
    ratingType: 'pairwise'
  }).sort({ rating: -1 });

  if (visits.length < 2) return false;

  // Check for gaps smaller than threshold
  for (let i = 0; i < visits.length - 1; i++) {
    if (Math.abs(visits[i].rating - visits[i + 1].rating) < 0.0001) {
      return true;
    }
  }

  return false;
};

/**
 * Rebalance scores within a category
 */
const rebalanceCategory = async (userId, category) => {
  const bounds = {
    'Good': { min: 7.0, max: 10.0 },
    'Mid': { min: 4.0, max: 6.9 },
    'Bad': { min: 0.0, max: 3.9 }
  };

  const { min, max } = bounds[category];

  const visits = await Visit.find({
    userId: userId,
    category: category,
    rating: { $exists: true, $ne: null },
    ratingType: 'pairwise'
  }).sort({ rating: -1 });

  if (visits.length <= 1) return visits.length;

  // Redistribute scores evenly within category bounds
  visits.forEach((visit, index) => {
    visit.rating = min + (max - min) * (visits.length - 1 - index) / (visits.length - 1);
  });

  // Save all visits
  await Promise.all(visits.map(visit => visit.save()));

  return visits.length;
};

/**
 * Get comparison session by ID
 */
const getComparisonSession = async (sessionId) => {
  return await PairwiseComparison.findOne({ sessionId: sessionId });
};

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = async () => {
  const result = await PairwiseComparison.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount;
};

module.exports = {
  initializePairwiseSession,
  processComparison,
  getUserRankings,
  createVisitFromPairwiseResult,
  checkRebalancingNeeded,
  rebalanceCategory,
  getComparisonSession,
  cleanupExpiredSessions
};
const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');
const {
  initializePairwiseSession,
  processComparison,
  getUserRankings,
  createVisitFromPairwiseResult,
  rebalanceCategory,
  getComparisonSession
} = require('../utils/pairwiseRanking');

const router = express.Router();

// Start a new pairwise ranking session
router.post('/start', auth, async (req, res) => {
  try {
    const { visitType, neighborhoodName, boroughName, countryName, visited, notes, visitDate, category } = req.body;

    console.log('🚀 POST /pairwise/start: Starting pairwise ranking for user:', req.user._id.toString());
    console.log('📍 POST /pairwise/start: Location data:', { visitType, neighborhoodName, boroughName, countryName, category });

    if (!visitType || !['neighborhood', 'country'].includes(visitType)) {
      return res.status(400).json({ error: 'visitType must be either "neighborhood" or "country"' });
    }

    // Validate required location data
    if (visitType === 'neighborhood' && (!neighborhoodName || !boroughName)) {
      return res.status(400).json({ error: 'neighborhoodName and boroughName are required for neighborhood visits' });
    }
    if (visitType === 'country' && !countryName) {
      return res.status(400).json({ error: 'countryName is required for country visits' });
    }
    
    // Validate category if provided
    if (category && !['Good', 'Mid', 'Bad'].includes(category)) {
      return res.status(400).json({ error: 'category must be one of: Good, Mid, Bad' });
    }

    const newLocationData = {
      visitType,
      neighborhoodName,
      boroughName,
      countryName,
      visited: visited || false,
      notes: notes || '',
      visitDate,
      preSelectedCategory: category
    };

    const result = await initializePairwiseSession(req.user._id.toString(), newLocationData, category);

    if (result.isComplete) {
      console.log('✅ POST /pairwise/start: No existing visits in category, auto-completed with score:', result.result.score);
      return res.json({
        isComplete: true,
        result: result.result,
        message: category ? `No existing visits in ${category} category to compare. Location automatically ranked.` : 'No existing visits to compare. Location automatically ranked.'
      });
    }

    console.log('🔄 POST /pairwise/start: Session created, first comparison ready');
    res.json({
      isComplete: false,
      comparison: result.comparison
    });
  } catch (error) {
    console.error('❌ POST /pairwise/start: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a comparison result
router.post('/compare', auth, async (req, res) => {
  try {
    const { sessionId, newLocationBetter } = req.body;

    console.log('🔄 POST /pairwise/compare: Processing comparison for session:', sessionId);
    console.log('📊 POST /pairwise/compare: New location better:', newLocationBetter);

    if (!sessionId || typeof newLocationBetter !== 'boolean') {
      return res.status(400).json({ error: 'sessionId and newLocationBetter (boolean) are required' });
    }

    // Verify session belongs to user
    const session = await getComparisonSession(sessionId);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Comparison session not found' });
    }

    const result = await processComparison(sessionId, newLocationBetter);

    if (result.isComplete) {
      console.log('✅ POST /pairwise/compare: Ranking complete with score:', result.result.score);
      return res.json({
        isComplete: true,
        result: result.result,
        sessionId: sessionId
      });
    }

    console.log('🔄 POST /pairwise/compare: Next comparison ready');
    res.json({
      isComplete: false,
      comparison: result.comparison
    });
  } catch (error) {
    console.error('❌ POST /pairwise/compare: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create visit from completed pairwise ranking
router.post('/create-visit', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log('💾 POST /pairwise/create-visit: Creating visit from session:', sessionId);

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Get the completed session
    const session = await getComparisonSession(sessionId);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Comparison session not found' });
    }

    if (!session.isComplete) {
      return res.status(400).json({ error: 'Comparison session is not complete' });
    }

    // Prepare visit data
    const visitData = await createVisitFromPairwiseResult(sessionId);

    // Use existing visits API logic to create the visit
    // This reuses all the existing location resolution logic
    const visitsRouter = require('./visits');
    
    // Create a mock request with the visit data
    const mockReq = {
      user: req.user,
      body: visitData
    };

    // For now, create the visit directly using the existing logic from visits.js
    // This ensures we reuse all location validation and resolution
    let locationId, existingVisit;

    if (visitData.visitType === 'neighborhood') {
      // Borough lookup logic (copied from visits.js)
      const borough = await mongoose.model('Borough').findOne({ name: visitData.boroughName });
      if (borough) {
        const Neighborhood = require('../models/Neighborhood');
        const neighborhood = await Neighborhood.findOne({ 
          name: visitData.neighborhoodName,
          boroughId: borough._id.toString()
        });
        if (!neighborhood) {
          return res.status(404).json({ error: 'Neighborhood not found' });
        }
        locationId = neighborhood._id.toString();
        visitData.neighborhoodId = locationId;
      } else {
        // City lookup logic
        const city = await mongoose.model('City').findOne({ name: visitData.boroughName });
        if (city) {
          const Neighborhood = require('../models/Neighborhood');
          const neighborhood = await Neighborhood.findOne({ 
            name: visitData.neighborhoodName,
            cityId: city._id.toString()
          });
          if (!neighborhood) {
            return res.status(404).json({ error: 'Neighborhood not found' });
          }
          locationId = neighborhood._id.toString();
          visitData.neighborhoodId = locationId;
        } else {
          return res.status(404).json({ error: 'Borough or city not found' });
        }
      }

      existingVisit = await Visit.findOne({ 
        userId: req.user._id.toString(), 
        neighborhoodId: locationId,
        visitType: 'neighborhood'
      });
    } else if (visitData.visitType === 'country') {
      const Country = require('../models/Country');
      const country = await Country.findOne({ name: visitData.countryName });
      if (!country) {
        return res.status(404).json({ error: 'Country not found' });
      }
      locationId = country._id.toString();
      visitData.countryId = locationId;

      existingVisit = await Visit.findOne({ 
        userId: req.user._id.toString(), 
        countryId: locationId,
        visitType: 'country'
      });
    }

    // Update existing visit or create new one
    if (existingVisit) {
      console.log('🔄 POST /pairwise/create-visit: Updating existing visit');
      existingVisit.visited = visitData.visited;
      existingVisit.notes = visitData.notes;
      existingVisit.visitDate = visitData.visitDate;
      existingVisit.rating = visitData.rating;
      existingVisit.category = visitData.category;
      await existingVisit.save();
      
      console.log('✅ POST /pairwise/create-visit: Visit updated successfully');
      res.json(existingVisit);
    } else {
      console.log('🆕 POST /pairwise/create-visit: Creating new visit');
      const visit = new Visit({
        userId: req.user._id.toString(),
        ...visitData
      });
      await visit.save();
      
      console.log('✅ POST /pairwise/create-visit: Visit created successfully');
      res.status(201).json(visit);
    }
  } catch (error) {
    console.error('❌ POST /pairwise/create-visit: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's rankings
router.get('/rankings', auth, async (req, res) => {
  try {
    const { visitType, category, metropolitanArea } = req.query;

    console.log('📊 GET /pairwise/rankings: Fetching rankings for user:', req.user._id.toString());
    console.log('🔍 GET /pairwise/rankings: Filters:', { visitType, category, metropolitanArea });

    const rankings = await getUserRankings(req.user._id.toString(), visitType, category, metropolitanArea);
    
    console.log('📈 GET /pairwise/rankings: Found rankings:', {
      Good: rankings.Good.length,
      Mid: rankings.Mid.length,
      Bad: rankings.Bad.length
    });

    res.json(rankings);
  } catch (error) {
    console.error('❌ GET /pairwise/rankings: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rebalance scores for a category
router.post('/rebalance', auth, async (req, res) => {
  try {
    const { category } = req.body;

    console.log('⚖️ POST /pairwise/rebalance: Rebalancing category:', category, 'for user:', req.user._id.toString());

    if (!category || !['Good', 'Mid', 'Bad'].includes(category)) {
      return res.status(400).json({ error: 'category must be one of: Good, Mid, Bad' });
    }

    const affectedCount = await rebalanceCategory(req.user._id.toString(), category);
    
    console.log('✅ POST /pairwise/rebalance: Rebalanced', affectedCount, 'visits');
    res.json({ 
      message: `Rebalanced ${affectedCount} visits in ${category} category`,
      affectedCount: affectedCount
    });
  } catch (error) {
    console.error('❌ POST /pairwise/rebalance: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comparison session details
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('🔍 GET /pairwise/session: Fetching session:', sessionId);

    const session = await getComparisonSession(sessionId);
    if (!session || session.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Comparison session not found' });
    }

    res.json({
      sessionId: session.sessionId,
      isComplete: session.isComplete,
      newLocationData: session.newLocationData,
      progress: {
        current: session.searchState.comparisonsCompleted,
        total: session.searchState.totalComparisons
      },
      finalResult: session.isComplete ? {
        score: session.finalScore,
        category: session.finalCategory
      } : null
    });
  } catch (error) {
    console.error('❌ GET /pairwise/session: Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
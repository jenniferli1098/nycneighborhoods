const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Neighborhood = require('../models/Neighborhood');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    console.log('📡 GET /visits: Fetching visits for user:', req.user._id.toString());
    const visits = await Visit.find({ userId: req.user._id.toString() })
      .sort({ updatedAt: -1 });
    console.log('📝 GET /visits: Found', visits.length, 'visits');
    console.log('📊 GET /visits: Visit details:', visits.map(v => ({ id: v._id, neighborhoodId: v.neighborhoodId, visited: v.visited })));
    res.json(visits);
  } catch (error) {
    console.error('❌ GET /visits: Error fetching visits:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { neighborhoodName, boroughName, visited, notes, visitDate, rating, walkabilityScore } = req.body;

    console.log('🆕 POST /visits: Creating visit for user:', req.user._id.toString());
    console.log('📍 POST /visits: Request data:', { neighborhoodName, boroughName, visited, notes, visitDate, rating, walkabilityScore });

    // Find the borough first, then the neighborhood
    console.log('🔍 POST /visits: Looking up borough:', boroughName);
    const borough = await mongoose.model('Borough').findOne({ name: boroughName });
    if (!borough) {
      console.error('❌ POST /visits: Borough not found:', boroughName);
      return res.status(404).json({ error: 'Borough not found' });
    }
    console.log('✅ POST /visits: Found borough:', { id: borough._id, name: borough.name });

    console.log('🔍 POST /visits: Looking up neighborhood:', neighborhoodName, 'in borough:', borough._id);
    const neighborhood = await Neighborhood.findOne({ 
      name: neighborhoodName,
      boroughId: borough._id.toString()
    });

    if (!neighborhood) {
      console.error('❌ POST /visits: Neighborhood not found:', neighborhoodName, 'in borough:', boroughName);
      return res.status(404).json({ error: 'Neighborhood not found' });
    }
    console.log('✅ POST /visits: Found neighborhood:', { id: neighborhood._id, name: neighborhood.name, boroughId: neighborhood.boroughId });

    console.log('🔍 POST /visits: Checking for existing visit for user:', req.user._id.toString(), 'neighborhood:', neighborhood._id.toString());
    const existingVisit = await Visit.findOne({ 
      userId: req.user._id.toString(), 
      neighborhoodId: neighborhood._id.toString()
    });

    if (existingVisit) {
      console.log('🔄 POST /visits: Updating existing visit:', existingVisit._id);
      existingVisit.visited = visited;
      existingVisit.notes = notes;
      existingVisit.visitDate = visitDate;
      existingVisit.rating = rating;
      existingVisit.walkabilityScore = walkabilityScore;
      await existingVisit.save();
      console.log('✅ POST /visits: Updated existing visit successfully');
      
      return res.json(existingVisit);
    }

    console.log('🆕 POST /visits: Creating new visit');
    const visit = new Visit({
      userId: req.user._id.toString(),
      neighborhoodId: neighborhood._id.toString(),
      visited,
      notes,
      visitDate,
      rating,
      walkabilityScore
    });

    console.log('💾 POST /visits: Saving new visit:', { userId: visit.userId, neighborhoodId: visit.neighborhoodId, visited: visit.visited });

    await visit.save();
    console.log('✅ POST /visits: Created new visit successfully:', visit._id);
    
    res.status(201).json(visit);
  } catch (error) {
    console.error('❌ POST /visits: Visit creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { visited, notes, visitDate, rating, walkabilityScore } = req.body;
    
    console.log('🔄 PUT /visits: Updating visit ID:', req.params.id, 'for user:', req.user._id.toString());
    console.log('📝 PUT /visits: Update data:', { visited, notes, visitDate, rating, walkabilityScore });
    
    const visit = await Visit.findOne({ 
      _id: req.params.id, 
      userId: req.user._id.toString() 
    });

    if (!visit) {
      console.error('❌ PUT /visits: Visit not found for ID:', req.params.id, 'user:', req.user._id.toString());
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('✅ PUT /visits: Found visit to update:', { id: visit._id, neighborhoodId: visit.neighborhoodId, currentVisited: visit.visited });

    visit.visited = visited;
    visit.notes = notes;
    visit.visitDate = visitDate;
    visit.rating = rating;
    visit.walkabilityScore = walkabilityScore;
    
    console.log('💾 PUT /visits: Saving updated visit');
    await visit.save();
    console.log('✅ PUT /visits: Updated visit successfully');
    
    res.json(visit);
  } catch (error) {
    console.error('❌ PUT /visits: Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ DELETE /visits: Deleting visit ID:', req.params.id, 'for user:', req.user._id.toString());
    
    const visit = await Visit.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id.toString() 
    });

    if (!visit) {
      console.error('❌ DELETE /visits: Visit not found for ID:', req.params.id, 'user:', req.user._id.toString());
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('✅ DELETE /visits: Deleted visit successfully:', { id: visit._id, neighborhoodId: visit.neighborhoodId });
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE /visits: Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's visit statistics
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('📊 GET /visits/stats: Fetching stats for user:', req.user._id.toString());
    const stats = await Visit.getUserStats(req.user._id.toString());
    console.log('📈 GET /visits/stats: Generated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ GET /visits/stats: Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
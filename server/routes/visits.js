const express = require('express');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Neighborhood = require('../models/Neighborhood');
const District = require('../models/District');
const Country = require('../models/Country');
const auth = require('../middleware/auth');
const { 
  logger, 
  findLocationData, 
  findExistingVisit, 
  updateVisitData, 
  createVisitData 
} = require('../utils/visitHelpers');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    logger.info('Fetching visits for user:', { userId: req.user._id.toString() });
    const visits = await Visit.find({ user: req.user._id.toString() })
      .populate({
        path: 'neighborhood',
        populate: {
          path: 'district',
          select: 'name type'
        }
      })
      .populate('country', 'name continent')
      .sort({ updatedAt: -1 });
    logger.success(`Found ${visits.length} visits`);
    res.json(visits);
  } catch (error) {
    logger.error('Error fetching visits:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { visitType, neighborhoodName, districtName, countryName, visited, notes, visitDate, rating, category } = req.body;
    const userId = req.user._id.toString();

    logger.info('Creating visit for user:', { userId, visitType });

    if (!visitType || !['neighborhood', 'country'].includes(visitType)) {
      return res.status(400).json({ error: 'visitType must be either "neighborhood" or "country"' });
    }

    // Find location data
    const locationData = await findLocationData(visitType, neighborhoodName, districtName, countryName);
    
    // Check for existing visit
    const existingVisit = await findExistingVisit(userId, visitType, locationData.locationId);

    if (existingVisit) {
      logger.info('Updating existing visit:', { visitId: existingVisit._id });
      updateVisitData(existingVisit, { visited, notes, visitDate, rating, category });
      await existingVisit.save();
      logger.success('Updated existing visit successfully');
      return res.json(existingVisit);
    }

    // Create new visit
    logger.info('Creating new visit');
    const visitData = createVisitData(userId, locationData, { visited, notes, visitDate, rating, category });
    const visit = new Visit(visitData);
    await visit.save();
    logger.success('Created new visit successfully:', { visitId: visit._id });
    
    res.status(201).json(visit);
  } catch (error) {
    logger.error('Visit creation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { visited, notes, visitDate, rating, category } = req.body;
    const userId = req.user._id.toString();
    
    logger.info('Updating visit:', { visitId: req.params.id, userId });
    
    const visit = await Visit.findOne({ 
      _id: req.params.id, 
      user: userId 
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    updateVisitData(visit, req.body);
    await visit.save();
    logger.success('Updated visit successfully');
    
    res.json(visit);
  } catch (error) {
    logger.error('Update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    logger.info('Deleting visit:', { visitId: req.params.id, userId });
    
    const visit = await Visit.findOneAndDelete({ 
      _id: req.params.id, 
      user: userId 
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    logger.success('Deleted visit successfully');
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    logger.error('Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get visits by type
router.get('/type/:visitType', auth, async (req, res) => {
  try {
    const { visitType } = req.params;
    
    if (!['neighborhood', 'country'].includes(visitType)) {
      return res.status(400).json({ error: 'visitType must be either "neighborhood" or "country"' });
    }
    
    logger.info(`Fetching ${visitType} visits for user:`, { userId: req.user._id.toString() });
    const visits = await Visit.find({ 
      user: req.user._id.toString(),
      visitType: visitType
    })
      .populate({
        path: 'neighborhood',
        populate: {
          path: 'district',
          select: 'name type'
        }
      })
      .populate('country', 'name continent')
      .sort({ updatedAt: -1 });
    
    logger.success(`Found ${visits.length} ${visitType} visits`);
    res.json(visits);
  } catch (error) {
    logger.error(`Error fetching ${req.params.visitType} visits:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get user's visit statistics
router.get('/stats', auth, async (req, res) => {
  try {
    logger.info('Fetching stats for user:', { userId: req.user._id.toString() });
    const stats = await Visit.getUserStats(req.user._id.toString());
    logger.success('Generated stats successfully');
    res.json(stats);
  } catch (error) {
    logger.error('Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhood popularity
router.get('/popularity/neighborhoods', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    logger.info(`Fetching top ${limit} neighborhoods`);
    const popularity = await Visit.getNeighborhoodPopularity(limit);
    logger.success('Generated neighborhood popularity successfully');
    res.json(popularity);
  } catch (error) {
    logger.error('Error fetching neighborhood popularity:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get country popularity
router.get('/popularity/countries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    logger.info(`Fetching top ${limit} countries`);
    const popularity = await Visit.getCountryPopularity(limit);
    logger.success('Generated country popularity successfully');
    res.json(popularity);
  } catch (error) {
    logger.error('Error fetching country popularity:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all visits for a given map
router.get('/map/:mapId', auth, async (req, res) => {
  try {
    const { mapId } = req.params;
    const userId = req.user._id.toString();
    
    logger.info('Fetching visits for map:', { mapId, userId });
    
    if (!mongoose.Types.ObjectId.isValid(mapId)) {
      return res.status(400).json({ error: 'Invalid map ID' });
    }
    
    const Map = require('../models/Map');
    const map = await Map.findById(mapId);
    if (!map) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    const districts = await District.find({ map: mapId });
    const districtIds = districts.map(d => d._id);
    
    if (districtIds.length === 0) {
      return res.json([]);
    }
    
    const neighborhoods = await Neighborhood.find({ district: { $in: districtIds } });
    const neighborhoodIds = neighborhoods.map(n => n._id);
    
    if (neighborhoodIds.length === 0) {
      return res.json([]);
    }
    
    const visits = await Visit.find({ 
      user: userId,
      neighborhood: { $in: neighborhoodIds },
      visitType: 'neighborhood'
    })
      .populate({
        path: 'neighborhood',
        populate: {
          path: 'district',
          select: 'name type'
        }
      })
      .sort({ updatedAt: -1 });
    
    logger.success(`Found ${visits.length} visits for map`);
    res.json(visits);
  } catch (error) {
    logger.error('Error fetching visits for map:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const District = require('../models/District');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all districts
router.get('/', async (req, res) => {
  try {
    const { type, map } = req.query;
    let query = {};
    
    if (map) {
      query.map = map;
    }
    
    let districts = await District.find(query)
      .populate('map', 'name slug type')
      .sort({ name: 1 });
    
    // Filter by map type if type parameter is provided
    if (type && ['borough', 'city'].includes(type)) {
      districts = districts.filter(district => district.map?.type === type);
    }
    
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get district by ID
router.get('/:id', async (req, res) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('map', 'name slug');
    
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    res.json(district);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get districts by map
router.get('/map/:mapId', async (req, res) => {
  try {
    const mapId = req.params.mapId;
    
    const districts = await District.find({ map: mapId })
      .populate('map', 'name slug')
      .sort({ name: 1 });
    
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get districts by map type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['borough', 'city'].includes(type)) {
      return res.status(400).json({ error: 'Invalid map type. Must be "borough" or "city"' });
    }
    
    const Map = require('../models/Map');
    const maps = await Map.find({ type });
    const mapIds = maps.map(m => m._id);
    
    const districts = await District.find({ map: { $in: mapIds } })
      .populate('map', 'name slug type')
      .sort({ name: 1 });
    
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get district neighborhoods
router.get('/:id/neighborhoods', async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    const neighborhoods = await district.getNeighborhoods();
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get district statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    const stats = await district.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const Map = require('../models/Map');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all active maps
router.get('/', async (req, res) => {
  try {
    console.log('📡 GET /maps: Fetching all active maps');
    const maps = await Map.findActive().sort({ name: 1 });
    console.log('📝 GET /maps: Found', maps.length, 'active maps');
    res.json(maps);
  } catch (error) {
    console.error('❌ GET /maps: Error fetching maps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get maps by category type
router.get('/category/:categoryType', async (req, res) => {
  try {
    const { categoryType } = req.params;
    console.log('📡 GET /maps/category: Fetching maps for category:', categoryType);
    
    if (!['borough', 'city'].includes(categoryType)) {
      return res.status(400).json({ error: 'Invalid category type. Must be "borough" or "city"' });
    }
    
    const maps = await Map.findByCategoryType(categoryType);
    console.log('📝 GET /maps/category: Found', maps.length, 'maps for category:', categoryType);
    res.json(maps);
  } catch (error) {
    console.error('❌ GET /maps/category: Error fetching maps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific map by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📡 GET /maps/:id: Fetching map with ID:', req.params.id);
    const map = await Map.findById(req.params.id);
    
    if (!map) {
      console.error('❌ GET /maps/:id: Map not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Map not found' });
    }
    
    console.log('✅ GET /maps/:id: Found map:', map.name);
    res.json(map);
  } catch (error) {
    console.error('❌ GET /maps/:id: Error fetching map:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhoods for a specific map
router.get('/:id/neighborhoods', async (req, res) => {
  try {
    console.log('📡 GET /maps/:id/neighborhoods: Fetching neighborhoods for map ID:', req.params.id);
    const map = await Map.findById(req.params.id);
    
    if (!map) {
      console.error('❌ GET /maps/:id/neighborhoods: Map not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Map not found' });
    }
    
    const neighborhoods = await map.getNeighborhoods();
    console.log('📝 GET /maps/:id/neighborhoods: Found', neighborhoods.length, 'neighborhoods for map:', map.name);
    res.json(neighborhoods);
  } catch (error) {
    console.error('❌ GET /maps/:id/neighborhoods: Error fetching neighborhoods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cities for a specific map
router.get('/:id/cities', async (req, res) => {
  try {
    console.log('📡 GET /maps/:id/cities: Fetching cities for map ID:', req.params.id);
    const map = await Map.findById(req.params.id);
    
    if (!map) {
      console.error('❌ GET /maps/:id/cities: Map not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Map not found' });
    }
    
    const cities = await map.getCities();
    console.log('📝 GET /maps/:id/cities: Found', cities.length, 'cities for map:', map.name);
    res.json(cities);
  } catch (error) {
    console.error('❌ GET /maps/:id/cities: Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get boroughs for a specific map
router.get('/:id/boroughs', async (req, res) => {
  try {
    console.log('📡 GET /maps/:id/boroughs: Fetching boroughs for map ID:', req.params.id);
    const map = await Map.findById(req.params.id);
    
    if (!map) {
      console.error('❌ GET /maps/:id/boroughs: Map not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Map not found' });
    }
    
    const boroughs = await map.getBoroughs();
    console.log('📝 GET /maps/:id/boroughs: Found', boroughs.length, 'boroughs for map:', map.name);
    res.json(boroughs);
  } catch (error) {
    console.error('❌ GET /maps/:id/boroughs: Error fetching boroughs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics for a specific map
router.get('/:id/stats', async (req, res) => {
  try {
    console.log('📡 GET /maps/:id/stats: Fetching stats for map ID:', req.params.id);
    const map = await Map.findById(req.params.id);
    
    if (!map) {
      console.error('❌ GET /maps/:id/stats: Map not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Map not found' });
    }
    
    const stats = await map.getMapStats();
    console.log('📝 GET /maps/:id/stats: Generated stats for map:', map.name);
    res.json(stats);
  } catch (error) {
    console.error('❌ GET /maps/:id/stats: Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find maps containing a specific city
router.get('/by-city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    console.log('📡 GET /maps/by-city: Finding maps containing city ID:', cityId);
    
    const maps = await Map.findByCity(cityId);
    console.log('📝 GET /maps/by-city: Found', maps.length, 'maps containing city');
    res.json(maps);
  } catch (error) {
    console.error('❌ GET /maps/by-city: Error finding maps:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find maps containing a specific borough
router.get('/by-borough/:boroughId', async (req, res) => {
  try {
    const { boroughId } = req.params;
    console.log('📡 GET /maps/by-borough: Finding maps containing borough ID:', boroughId);
    
    const maps = await Map.findByBorough(boroughId);
    console.log('📝 GET /maps/by-borough: Found', maps.length, 'maps containing borough');
    res.json(maps);
  } catch (error) {
    console.error('❌ GET /maps/by-borough: Error finding maps:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const Borough = require('../models/Borough');
const City = require('../models/City');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all boroughs
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    let query = {};
    
    if (city) {
      const cityDoc = await City.findOne({ name: city });
      if (cityDoc) {
        query.cityId = cityDoc._id;
      }
    }
    
    const boroughs = await Borough.find(query)
      .sort({ name: 1 });
    
    res.json(boroughs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get borough by ID
router.get('/:id', async (req, res) => {
  try {
    const borough = await Borough.findById(req.params.id);
    
    if (!borough) {
      return res.status(404).json({ error: 'Borough not found' });
    }
    
    res.json(borough);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get boroughs by city
router.get('/city/:cityName', async (req, res) => {
  try {
    const cityName = req.params.cityName;
    
    const city = await City.findOne({ name: cityName });
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    const boroughs = await Borough.find({ cityId: city._id })
      .sort({ name: 1 });
    
    res.json(boroughs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get borough statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const borough = await Borough.findById(req.params.id);
    
    if (!borough) {
      return res.status(404).json({ error: 'Borough not found' });
    }
    
    const stats = await borough.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
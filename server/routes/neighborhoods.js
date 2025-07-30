const express = require('express');
const Neighborhood = require('../models/Neighborhood');
const Borough = require('../models/Borough');
const City = require('../models/City');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all neighborhoods
router.get('/', async (req, res) => {
  try {
    const { borough, city, categoryType } = req.query;
    let query = {};
    
    if (categoryType) {
      query.categoryType = categoryType;
    }
    
    if (city) {
      const cityDoc = await City.findOne({ name: city });
      if (cityDoc) {
        query.cityId = cityDoc._id;
      }
    }
    
    if (borough) {
      const boroughDoc = await Borough.findOne({ name: borough });
      if (boroughDoc) {
        query.boroughId = boroughDoc._id;
      }
    }
    
    const neighborhoods = await Neighborhood.find(query)
      .sort({ name: 1 });
    
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhood by ID
router.get('/:id', async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id);
    
    if (!neighborhood) {
      return res.status(404).json({ error: 'Neighborhood not found' });
    }
    
    res.json(neighborhood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create neighborhood (admin only - for future use)
router.post('/', auth, async (req, res) => {
  try {
    const { name, boroughName, cityName, categoryType } = req.body;
    
    let neighborhood;
    if (categoryType === 'borough' && boroughName) {
      // Find the borough
      const borough = await Borough.findOne({ name: boroughName });
      if (!borough) {
        return res.status(404).json({ error: 'Borough not found' });
      }
      
      neighborhood = new Neighborhood({
        name,
        boroughId: borough._id,
        categoryType: 'borough'
      });
    } else if (categoryType === 'city' && cityName) {
      // Find the city
      const city = await City.findOne({ name: cityName });
      if (!city) {
        return res.status(404).json({ error: 'City not found' });
      }
      
      neighborhood = new Neighborhood({
        name,
        cityId: city._id,
        categoryType: 'city'
      });
    } else {
      return res.status(400).json({ error: 'Invalid categoryType or missing parent location' });
    }
    
    await neighborhood.save();
    
    res.status(201).json(neighborhood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhoods by city
router.get('/city/:cityName', async (req, res) => {
  try {
    const cityName = req.params.cityName;
    
    const city = await City.findOne({ name: cityName });
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    const neighborhoods = await Neighborhood.find({ cityId: city._id })
      .sort({ name: 1 });
    
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search neighborhoods
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const { city, categoryType } = req.query;
    
    let searchQuery = {
      name: { $regex: query, $options: 'i' }
    };
    
    if (categoryType) {
      searchQuery.categoryType = categoryType;
    }
    
    if (city) {
      const cityDoc = await City.findOne({ name: city });
      if (cityDoc) {
        searchQuery.cityId = cityDoc._id;
      }
    }
    
    const neighborhoods = await Neighborhood.find(searchQuery)
      .sort({ name: 1 });
    
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
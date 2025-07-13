const express = require('express');
const City = require('../models/City');

const router = express.Router();

// Get all cities
router.get('/', async (req, res) => {
  try {
    console.log('📡 GET /cities: Fetching all cities');
    const cities = await City.find().sort({ name: 1 });
    console.log('📝 GET /cities: Found', cities.length, 'cities');
    res.json(cities);
  } catch (error) {
    console.error('❌ GET /cities: Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cities by state
router.get('/state/:state', async (req, res) => {
  try {
    const { state } = req.params;
    console.log('📡 GET /cities/state: Fetching cities for state:', state);
    const cities = await City.find({ state: state }).sort({ name: 1 });
    console.log('📝 GET /cities/state: Found', cities.length, 'cities in', state);
    res.json(cities);
  } catch (error) {
    console.error('❌ GET /cities/state: Error fetching cities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific city by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📡 GET /cities/:id: Fetching city with ID:', req.params.id);
    const city = await City.findById(req.params.id);
    if (!city) {
      console.error('❌ GET /cities/:id: City not found for ID:', req.params.id);
      return res.status(404).json({ error: 'City not found' });
    }
    console.log('✅ GET /cities/:id: Found city:', city.name);
    res.json(city);
  } catch (error) {
    console.error('❌ GET /cities/:id: Error fetching city:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new city
router.post('/', async (req, res) => {
  try {
    const { name, state, country, metropolitanArea } = req.body;
    console.log('🆕 POST /cities: Creating city:', { name, state, country, metropolitanArea });
    
    const city = new City({
      name,
      state,
      country,
      metropolitanArea
    });
    
    await city.save();
    console.log('✅ POST /cities: Created city successfully:', city._id);
    res.status(201).json(city);
  } catch (error) {
    console.error('❌ POST /cities: City creation error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'City already exists in this state' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update a city
router.put('/:id', async (req, res) => {
  try {
    const { name, state, country, metropolitanArea } = req.body;
    console.log('🔄 PUT /cities: Updating city ID:', req.params.id);
    
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name, state, country, metropolitanArea },
      { new: true, runValidators: true }
    );
    
    if (!city) {
      console.error('❌ PUT /cities: City not found for ID:', req.params.id);
      return res.status(404).json({ error: 'City not found' });
    }
    
    console.log('✅ PUT /cities: Updated city successfully');
    res.json(city);
  } catch (error) {
    console.error('❌ PUT /cities: Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a city
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /cities: Deleting city ID:', req.params.id);
    
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) {
      console.error('❌ DELETE /cities: City not found for ID:', req.params.id);
      return res.status(404).json({ error: 'City not found' });
    }
    
    console.log('✅ DELETE /cities: Deleted city successfully:', city.name);
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE /cities: Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
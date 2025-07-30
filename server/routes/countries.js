const express = require('express');
const Country = require('../models/Country');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all countries
router.get('/', async (req, res) => {
  try {
    const { continent } = req.query;
    let query = {};
    
    if (continent) {
      query.continent = continent;
    }
    
    const countries = await Country.find(query)
      .sort({ name: 1 });
    
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get country by ID
router.get('/:id', async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create country (admin only - for future use)
router.post('/', auth, async (req, res) => {
  try {
    const { name, code, continent } = req.body;
    
    const country = new Country({
      name,
      code,
      continent
    });
    
    await country.save();
    
    res.status(201).json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update country (admin only - for future use)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, code, continent } = req.body;
    
    const country = await Country.findByIdAndUpdate(
      req.params.id,
      { name, code, continent },
      { new: true, runValidators: true }
    );
    
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    
    res.json(country);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete country (admin only - for future use)
router.delete('/:id', auth, async (req, res) => {
  try {
    const country = await Country.findByIdAndDelete(req.params.id);
    
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    
    res.json({ message: 'Country deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search countries
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const countries = await Country.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { code: { $regex: query, $options: 'i' } },
        { continent: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ name: 1 });
    
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get countries by continent
router.get('/continent/:continent', async (req, res) => {
  try {
    const continent = req.params.continent;
    
    const countries = await Country.findByContinent(continent);
    
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all continents
router.get('/meta/continents', async (req, res) => {
  try {
    const continents = await Country.distinct('continent');
    
    res.json(continents.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
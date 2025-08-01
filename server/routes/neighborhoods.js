const express = require('express');
const Neighborhood = require('../models/Neighborhood');
const District = require('../models/District');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all neighborhoods
router.get('/', async (req, res) => {
  try {
    const { district } = req.query;
    let query = {};
    
    if (district) {
      query.district = district;
    }
    
    const neighborhoods = await Neighborhood.find(query)
      .populate('district', 'name type map')
      .sort({ name: 1 });
    
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhood by ID
router.get('/:id', async (req, res) => {
  try {
    const neighborhood = await Neighborhood.findById(req.params.id)
      .populate('district', 'name type map');
    
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
    const { name, districtName } = req.body;
    
    // Find the district
    const district = await District.findOne({ name: districtName });
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    const neighborhood = new Neighborhood({
      name,
      district: district._id
    });
    
    await neighborhood.save();
    
    res.status(201).json(neighborhood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get neighborhoods by district
router.get('/district/:districtId', async (req, res) => {
  try {
    const districtId = req.params.districtId;
    
    const neighborhoods = await Neighborhood.find({ district: districtId })
      .populate('district', 'name type map')
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
    const { district } = req.query;
    
    let searchQuery = {
      name: { $regex: query, $options: 'i' }
    };
    
    if (district) {
      searchQuery.district = district;
    }
    
    const neighborhoods = await Neighborhood.find(searchQuery)
      .populate('district', 'name type map')
      .sort({ name: 1 });
    
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
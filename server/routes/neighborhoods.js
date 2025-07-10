const express = require('express');
const Neighborhood = require('../models/Neighborhood');
const Borough = require('../models/Borough');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all neighborhoods
router.get('/', async (req, res) => {
  try {
    const { borough } = req.query;
    let query = {};
    
    if (borough) {
      const boroughDoc = await Borough.findOne({ name: borough });
      if (boroughDoc) {
        query.boroughId = boroughDoc._id.toString();
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
    const { name, boroughName, description, walkabilityScore } = req.body;
    
    // Find the borough
    const borough = await Borough.findOne({ name: boroughName });
    if (!borough) {
      return res.status(404).json({ error: 'Borough not found' });
    }
    
    const neighborhood = new Neighborhood({
      name,
      boroughId: borough._id.toString(),
      description,
      walkabilityScore
    });
    
    await neighborhood.save();
    
    res.status(201).json(neighborhood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search neighborhoods
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    const neighborhoods = await Neighborhood.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ name: 1 });
    
    res.json(neighborhoods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
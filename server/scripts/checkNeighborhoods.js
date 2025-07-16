const mongoose = require('mongoose');
require('dotenv').config();
const Neighborhood = require('../models/Neighborhood');
const Borough = require('../models/Borough');
const City = require('../models/City');

async function checkNeighborhoods() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check for Upper West Side specifically
    const upperWestMatches = await Neighborhood.find({name: {$regex: 'Upper West', $options: 'i'}}).populate('boroughId');
    console.log('\nNeighborhoods matching "Upper West":');
    upperWestMatches.forEach(n => {
      console.log('- Name:', n.name, '| Borough:', n.boroughId?.name, '| Category:', n.categoryType);
    });
    
    // Check for neighborhoods that contain "West"
    const westMatches = await Neighborhood.find({name: {$regex: 'West', $options: 'i'}}).populate('boroughId').limit(10);
    console.log('\nNeighborhoods containing "West":');
    westMatches.forEach(n => {
      console.log('- Name:', n.name, '| Borough:', n.boroughId?.name);
    });
    
    // Get sample Manhattan neighborhoods
    const manhattanNeighborhoods = await Neighborhood.find({categoryType: 'borough'}).populate('boroughId').limit(15);
    console.log('\nSample NYC neighborhoods:');
    manhattanNeighborhoods.filter(n => n.boroughId?.name === 'Manhattan').forEach(n => {
      console.log('- Name:', n.name, '| Borough:', n.boroughId?.name);
    });
    
    // Count total neighborhoods
    const totalCount = await Neighborhood.countDocuments({categoryType: 'borough'});
    console.log('\nTotal NYC neighborhoods in database:', totalCount);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNeighborhoods();
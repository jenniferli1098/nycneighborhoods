const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Map = require('../models/Map');
const District = require('../models/District');
const Neighborhood = require('../models/Neighborhood');
const Visit = require('../models/Visit');

async function populateMaps() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    // Clear existing maps
    console.log('Clearing existing maps...');
    await Map.deleteMany({});

    // Get existing districts
    const nycDistricts = await District.find({ type: 'borough' });
    const bostonDistricts = await District.find({ type: 'city' });

    const maps = [];

    // NYC Neighborhoods Map (borough-based)
    if (nycDistricts.length > 0) {
      const nycMap = new Map({
        name: 'New York',
        slug: 'nyc',
        description: 'Interactive map of New York City neighborhoods organized by boroughs',
        districts: nycDistricts.map(d => d._id),
        coordinates: {
          longitude: -74.0060,
          latitude: 40.7128
        },
        zoom: 11
      });
      await nycMap.save();
      maps.push(nycMap);
      console.log('Created NYC Neighborhoods map');
    }

    // Boston Neighborhoods Map (city-based)
    if (bostonDistricts.length > 0) {
      const bostonMap = new Map({
        name: 'Boston',
        slug: 'boston',
        description: 'Interactive map of Greater Boston neighborhoods including Boston, Cambridge, and Somerville',
        districts: bostonDistricts.map(d => d._id),
        coordinates: {
          longitude: -71.0589,
          latitude: 42.3601
        },
        zoom: 12
      });
      await bostonMap.save();
      maps.push(bostonMap);
      console.log('Created Boston Neighborhoods map');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Maps created: ${maps.length}`);

    // Verify the data
    const totalMaps = await Map.countDocuments();
    console.log(`\nVerification: ${totalMaps} maps in database`);

    // Test the map methods
    for (const map of maps) {
      const districts = await map.getDistricts();
      const neighborhoods = await map.getNeighborhoods();
      const stats = await map.getMapStats();
      console.log(`\n${map.name}:`);
      console.log(`  - Districts: ${districts.length}`);
      console.log(`  - Neighborhoods: ${neighborhoods.length}`);
      console.log(`  - Stats:`, stats);
    }

  } catch (error) {
    console.error('Error populating maps:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateMaps();
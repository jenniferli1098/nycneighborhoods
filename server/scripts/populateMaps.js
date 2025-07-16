const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Map = require('../models/Map');
const City = require('../models/City');
const Borough = require('../models/Borough');

async function populateMaps() {
  try {
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = "mongodb+srv://jenniferli1098:KE8sQdRAvzIBbYPb@nycneighborhoods-cluste.lbnjlnw.mongodb.net/?retryWrites=true&w=majority&appName=nycneighborhoods-cluster";
    await mongoose.connect(MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    // Clear existing maps
    console.log('Clearing existing maps...');
    await Map.deleteMany({});

    // Get NYC city and boroughs
    const nycCity = await City.findOne({ name: 'New York City' });
    const boroughs = await Borough.find({ cityId: nycCity?._id });

    // Get Boston area cities
    const bostonCity = await City.findOne({ name: 'Boston' });
    const cambridgeCity = await City.findOne({ name: 'Cambridge' });
    const somervilleCity = await City.findOne({ name: 'Somerville' });

    const maps = [];

    // NYC Neighborhoods Map (borough-based)
    if (nycCity && boroughs.length > 0) {
      const nycMap = new Map({
        name: 'NYC Neighborhoods',
        description: 'Interactive map of New York City neighborhoods organized by boroughs',
        categoryType: 'borough',
        cityIds: [],
        boroughIds: boroughs.map(b => b._id),
        coordinates: {
          longitude: -74.0060,
          latitude: 40.7128
        },
        zoom: 11,
        isActive: true
      });
      await nycMap.save();
      maps.push(nycMap);
      console.log('Created NYC Neighborhoods map');
    }

    // Boston Neighborhoods Map (city-based)
    const bostonCityIds = [bostonCity, cambridgeCity, somervilleCity]
      .filter(city => city)
      .map(city => city._id);

    if (bostonCityIds.length > 0) {
      const bostonMap = new Map({
        name: 'Boston Neighborhoods',
        description: 'Interactive map of Greater Boston neighborhoods including Boston, Cambridge, and Somerville',
        categoryType: 'city',
        cityIds: bostonCityIds,
        boroughIds: [],
        coordinates: {
          longitude: -71.0589,
          latitude: 42.3601
        },
        zoom: 12,
        isActive: true
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
      const neighborhoods = await map.getNeighborhoods();
      const stats = await map.getMapStats();
      console.log(`\n${map.name}:`);
      console.log(`  - Category Type: ${map.categoryType}`);
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
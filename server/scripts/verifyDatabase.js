const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Country = require('../models/Country');
const City = require('../models/City');
const Borough = require('../models/Borough');
const Neighborhood = require('../models/Neighborhood');
const Map = require('../models/Map');

async function verifyDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = "mongodb+srv://jenniferli1098:KE8sQdRAvzIBbYPb@nycneighborhoods-cluste.lbnjlnw.mongodb.net/?retryWrites=true&w=majority&appName=nycneighborhoods-cluster";
    await mongoose.connect(MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    console.log('\n=== DATABASE VERIFICATION ===');

    // Count documents in each collection
    const countryCount = await Country.countDocuments();
    const cityCount = await City.countDocuments();
    const boroughCount = await Borough.countDocuments();
    const neighborhoodCount = await Neighborhood.countDocuments();
    const mapCount = await Map.countDocuments();

    console.log(`Countries: ${countryCount}`);
    console.log(`Cities: ${cityCount}`);
    console.log(`Boroughs: ${boroughCount}`);
    console.log(`Neighborhoods: ${neighborhoodCount}`);
    console.log(`Maps: ${mapCount}`);

    // Show some sample data
    console.log('\n=== SAMPLE DATA ===');
    
    // Countries by continent
    const continentCounts = await Country.aggregate([
      { $group: { _id: '$continent', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\nCountries by continent:');
    continentCounts.forEach(c => console.log(`  ${c._id}: ${c.count}`));

    // Cities
    const cities = await City.find({}).select('name state country');
    console.log('\nCities:');
    cities.forEach(city => console.log(`  ${city.name}, ${city.state}, ${city.country}`));

    // Boroughs with city info
    const boroughs = await Borough.find({}).populate('cityId', 'name').select('name cityId');
    console.log('\nBoroughs:');
    boroughs.forEach(borough => {
      const cityName = borough.cityId ? borough.cityId.name : 'Unknown';
      console.log(`  ${borough.name} (${cityName})`);
    });

    // Neighborhoods by category type
    const neighborhoodCategories = await Neighborhood.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\nNeighborhoods by category:');
    neighborhoodCategories.forEach(cat => console.log(`  ${cat._id}: ${cat.count}`));

    // Maps
    const maps = await Map.find({}).select('name categoryType isActive coordinates');
    console.log('\nMaps:');
    maps.forEach(map => {
      console.log(`  ${map.name} (${map.categoryType}) - Active: ${map.isActive}`);
      console.log(`    Coordinates: ${map.coordinates.latitude}, ${map.coordinates.longitude}`);
    });

    // Test relationships
    console.log('\n=== RELATIONSHIP VERIFICATION ===');
    
    // Test NYC data
    const nycCity = await City.findOne({ name: 'New York City' });
    if (nycCity) {
      const nycBoroughs = await Borough.find({ cityId: nycCity._id });
      console.log(`\nNYC has ${nycBoroughs.length} boroughs:`);
      
      for (const borough of nycBoroughs) {
        const boroughNeighborhoods = await Neighborhood.find({ boroughId: borough._id });
        console.log(`  ${borough.name}: ${boroughNeighborhoods.length} neighborhoods`);
      }
    }

    // Test Boston data
    const bostonCity = await City.findOne({ name: 'Boston' });
    if (bostonCity) {
      const bostonNeighborhoods = await Neighborhood.find({ cityId: bostonCity._id });
      console.log(`\nBoston has ${bostonNeighborhoods.length} neighborhoods`);
    }

    const cambridgeCity = await City.findOne({ name: 'Cambridge' });
    if (cambridgeCity) {
      const cambridgeNeighborhoods = await Neighborhood.find({ cityId: cambridgeCity._id });
      console.log(`Cambridge has ${cambridgeNeighborhoods.length} neighborhoods`);
    }

    const somervilleCity = await City.findOne({ name: 'Somerville' });
    if (somervilleCity) {
      const somervilleNeighborhoods = await Neighborhood.find({ cityId: somervilleCity._id });
      console.log(`Somerville has ${somervilleNeighborhoods.length} neighborhoods`);
    }

    console.log('\n✅ Database verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verifyDatabase();
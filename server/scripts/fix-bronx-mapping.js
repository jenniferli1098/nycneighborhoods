const mongoose = require('mongoose');
require('dotenv').config();

const Map = require('../models/Map');
const District = require('../models/District');

async function fixBronxMapping() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the New York map
    const newYorkMap = await Map.findOne({ name: 'New York' });
    if (!newYorkMap) {
      console.error('❌ New York map not found');
      process.exit(1);
    }

    console.log('📍 Found New York map:', newYorkMap._id);
    console.log('🏘️ Current districts:', newYorkMap.districts);

    // Find both Bronx districts
    const originalBronx = await District.findOne({ name: 'Bronx' });
    const newBronx = await District.findOne({ name: 'The Bronx' });

    console.log('🔍 Original Bronx:', originalBronx ? originalBronx._id : 'NOT FOUND');
    console.log('🔍 New Bronx:', newBronx ? newBronx._id : 'NOT FOUND');

    if (!originalBronx) {
      console.error('❌ Original Bronx borough not found');
      process.exit(1);
    }

    // Update the New York map to use the correct Bronx district
    const correctDistricts = [
      '68806c3977abf8bf62a199d3', // Manhattan
      '68806c3877abf8bf62a199d1', // Brooklyn  
      '68806c3877abf8bf62a199cc', // Queens
      '68806c3877abf8bf62a199c9', // Bronx (correct one)
      '68806c3877abf8bf62a199cf'  // Staten Island
    ];

    console.log('🔧 Updating New York map districts...');
    await Map.findByIdAndUpdate(newYorkMap._id, {
      districts: correctDistricts.map(id => new mongoose.Types.ObjectId(id))
    });

    console.log('✅ Successfully updated New York map');

    // Verify the update
    const updatedMap = await Map.findById(newYorkMap._id);
    console.log('✅ Updated districts:', updatedMap.districts);

    // Check how many neighborhoods each Bronx has
    const Neighborhood = require('../models/Neighborhood');
    const originalBronxNeighborhoods = await Neighborhood.countDocuments({ district: originalBronx._id });
    const newBronxNeighborhoods = newBronx ? await Neighborhood.countDocuments({ district: newBronx._id }) : 0;

    console.log(`📊 Original Bronx (${originalBronx.name}) has ${originalBronxNeighborhoods} neighborhoods`);
    console.log(`📊 New Bronx (${newBronx?.name || 'N/A'}) has ${newBronxNeighborhoods} neighborhoods`);

    console.log('🎉 Fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing Bronx mapping:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

fixBronxMapping();
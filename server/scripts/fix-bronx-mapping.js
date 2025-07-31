const mongoose = require('mongoose');
require('dotenv').config();

const Map = require('../models/Map');
const Borough = require('../models/Borough');

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
    console.log('🏘️ Current boroughIds:', newYorkMap.boroughIds);

    // Find both Bronx boroughs
    const originalBronx = await Borough.findOne({ name: 'Bronx' });
    const newBronx = await Borough.findOne({ name: 'The Bronx' });

    console.log('🔍 Original Bronx:', originalBronx ? originalBronx._id : 'NOT FOUND');
    console.log('🔍 New Bronx:', newBronx ? newBronx._id : 'NOT FOUND');

    if (!originalBronx) {
      console.error('❌ Original Bronx borough not found');
      process.exit(1);
    }

    // Update the New York map to use the correct Bronx borough
    const correctBoroughIds = [
      '68806c3977abf8bf62a199d3', // Manhattan
      '68806c3877abf8bf62a199d1', // Brooklyn  
      '68806c3877abf8bf62a199cc', // Queens
      '68806c3877abf8bf62a199c9', // Bronx (correct one)
      '68806c3877abf8bf62a199cf'  // Staten Island
    ];

    console.log('🔧 Updating New York map boroughIds...');
    await Map.findByIdAndUpdate(newYorkMap._id, {
      boroughIds: correctBoroughIds.map(id => new mongoose.Types.ObjectId(id))
    });

    console.log('✅ Successfully updated New York map');

    // Verify the update
    const updatedMap = await Map.findById(newYorkMap._id);
    console.log('✅ Updated boroughIds:', updatedMap.boroughIds);

    // Check how many neighborhoods each Bronx has
    const Neighborhood = require('../models/Neighborhood');
    const originalBronxNeighborhoods = await Neighborhood.countDocuments({ boroughId: originalBronx._id });
    const newBronxNeighborhoods = newBronx ? await Neighborhood.countDocuments({ boroughId: newBronx._id }) : 0;

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
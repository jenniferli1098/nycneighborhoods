const mongoose = require('mongoose');
require('dotenv').config();

// Import the Map model
const Map = require('../models/Map');

async function fixMapSlugs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all maps
    const maps = await Map.find({});
    console.log(`📋 Found ${maps.length} maps in database:`);
    
    for (const map of maps) {
      console.log(`  - ${map.name}: slug="${map.slug}"`);
    }

    // Fix Boston Greater Area slug
    const bostonMap = await Map.findOne({ name: 'Boston Greater Area' });
    if (bostonMap && bostonMap.slug !== 'boston') {
      console.log(`🔧 Updating Boston Greater Area slug from "${bostonMap.slug}" to "boston"`);
      bostonMap.slug = 'boston';
      await bostonMap.save();
      console.log('✅ Boston Greater Area slug updated');
    }

    // Ensure New York has correct slug
    const nycMap = await Map.findOne({ name: 'New York' });
    if (nycMap && nycMap.slug !== 'nyc') {
      console.log(`🔧 Updating New York slug from "${nycMap.slug}" to "nyc"`);
      nycMap.slug = 'nyc';
      await nycMap.save();
      console.log('✅ New York slug updated');
    }

    // Verify the changes
    console.log('\n📋 Updated maps:');
    const updatedMaps = await Map.find({});
    for (const map of updatedMaps) {
      console.log(`  - ${map.name}: slug="${map.slug}"`);
    }

    console.log('\n🎉 Map slug fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing map slugs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the script
fixMapSlugs();
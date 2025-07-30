const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Map = require('../models/Map');
const Borough = require('../models/Borough');
const City = require('../models/City');

// Map configuration data
const mapConfigData = {
  'New York': {
    description: 'New York City neighborhoods by borough',
    categoryType: 'borough',
    coordinates: { latitude: 40.8, longitude: -73.9 },
    zoom: 11
  },
  'Boston Greater Area': {
    description: 'Boston Greater Area neighborhoods by city',
    categoryType: 'city',
    coordinates: { latitude: 42.3601, longitude: -71.0589 },
    zoom: 12
  }
};

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function findOrCreateBoroughs() {
  console.log('🏘️ Finding or creating boroughs...');
  
  const boroughNames = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island'];
  const boroughs = {};
  
  for (const name of boroughNames) {
    let borough = await Borough.findOne({ name });
    if (!borough) {
      // Find New York City
      let nyc = await City.findOne({ name: 'New York' });
      if (!nyc) {
        nyc = new City({
          name: 'New York',
          state: 'New York',
          country: 'United States'
        });
        await nyc.save();
        console.log(`✅ Created NYC city: ${nyc._id}`);
      }
      
      borough = new Borough({
        name,
        cityId: nyc._id,
        city: 'New York'
      });
      await borough.save();
      console.log(`✅ Created borough: ${name} (${borough._id})`);
    }
    boroughs[name] = borough._id;
  }
  
  return boroughs;
}

async function findOrCreateCities() {
  console.log('🏙️ Finding or creating cities...');
  
  const cityNames = ['Boston', 'Cambridge', 'Somerville'];
  const cities = {};
  
  for (const name of cityNames) {
    let city = await City.findOne({ name });
    if (!city) {
      city = new City({
        name,
        state: 'Massachusetts',
        country: 'United States',
        metropolitanArea: 'Greater Boston'
      });
      await city.save();
      console.log(`✅ Created city: ${name} (${city._id})`);
    }
    cities[name] = city._id;
  }
  
  return cities;
}

async function createMaps() {
  console.log('🗺️ Creating Map documents...');
  
  const boroughs = await findOrCreateBoroughs();
  const cities = await findOrCreateCities();
  
  for (const [mapName, config] of Object.entries(mapConfigData)) {
    console.log(`\n📝 Creating map: ${mapName}`);
    
    const mapData = {
      name: mapName,
      description: config.description,
      categoryType: config.categoryType,
      coordinates: config.coordinates,
      zoom: config.zoom,
    };
    
    // Add appropriate IDs based on category type
    if (config.categoryType === 'borough') {
      mapData.boroughIds = Object.values(boroughs);
      mapData.cityIds = [];
    } else if (config.categoryType === 'city') {
      mapData.cityIds = Object.values(cities);
      mapData.boroughIds = [];
    }
    
    const map = new Map(mapData);
    await map.save();
    console.log(`✅ Created map: ${mapName} (${map._id})`);
    
    // Log the configuration
    console.log(`   - Category Type: ${map.categoryType}`);
    console.log(`   - Center: [${map.coordinates.latitude}, ${map.coordinates.longitude}]`);
    console.log(`   - Zoom: ${map.zoom}`);
    console.log(`   - Borough IDs: ${map.boroughIds.length}`);
    console.log(`   - City IDs: ${map.cityIds.length}`);
  }
}

async function verifyMaps() {
  console.log('\n🔍 Verifying created maps...');
  
  const maps = await Map.find({ isActive: true });
  
  for (const map of maps) {
    console.log(`\n📋 Map: ${map.name}`);
    console.log(`   - ID: ${map._id}`);
    console.log(`   - Category Type: ${map.categoryType}`);
    console.log(`   - Coordinates: [${map.coordinates.latitude}, ${map.coordinates.longitude}]`);
    console.log(`   - Zoom: ${map.zoom}`);
    console.log(`   - Borough IDs: ${map.boroughIds.length}`);
    console.log(`   - City IDs: ${map.cityIds.length}`);
    console.log(`   - Active: ${map.isActive}`);
  }
}

async function main() {
  console.log('🚀 Starting Maps Database Population');
  console.log('=====================================');
  
  try {
    await connectToDatabase();
    await createMaps();
    await verifyMaps();
    
    console.log('\n✅ Maps database populated successfully!');
    console.log('\n📝 Created maps:');
    console.log('   - New York (NYC boroughs)');
    console.log('   - Boston Greater Area (cities)');
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
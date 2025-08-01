const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Map = require('../models/Map');
const District = require('../models/District');
const Neighborhood = require('../models/Neighborhood');
const Visit = require('../models/Visit'); // Import Visit model for stats

async function populateDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing maps, districts, and neighborhoods...');
    await Map.deleteMany({});
    await District.deleteMany({});
    await Neighborhood.deleteMany({});

    // Step 1: Create Maps
    console.log('\n📍 Creating Maps...');
    
    const nycMap = new Map({
      name: 'New York',
      slug: 'nyc',
      description: 'Interactive map of New York City neighborhoods organized by boroughs',
      districts: [], // Will be populated after districts are created
      coordinates: {
        longitude: -74.0060,
        latitude: 40.7128
      },
      zoom: 11
    });
    await nycMap.save();
    console.log('✅ Created NYC map');

    const bostonMap = new Map({
      name: 'Boston',
      slug: 'boston',
      description: 'Interactive map of Greater Boston neighborhoods',
      districts: [], // Will be populated after districts are created
      coordinates: {
        longitude: -71.0589,
        latitude: 42.3601
      },
      zoom: 12
    });
    await bostonMap.save();
    console.log('✅ Created Boston map');

    // Step 2: Create Districts
    console.log('\n🏘️ Creating Districts...');

    // NYC Districts (boroughs)
    const nycDistricts = [
      { name: 'Manhattan', type: 'borough', map: nycMap._id },
      { name: 'Brooklyn', type: 'borough', map: nycMap._id },
      { name: 'Queens', type: 'borough', map: nycMap._id },
      { name: 'Bronx', type: 'borough', map: nycMap._id },
      { name: 'Staten Island', type: 'borough', map: nycMap._id }
    ];

    const createdNYCDistricts = [];
    for (const districtData of nycDistricts) {
      const district = new District(districtData);
      await district.save();
      createdNYCDistricts.push(district);
      console.log(`✅ Created NYC district: ${district.name}`);
    }

    // Boston Districts (cities)
    const bostonDistricts = [
      { name: 'Boston', type: 'city', map: bostonMap._id },
      { name: 'Cambridge', type: 'city', map: bostonMap._id },
      { name: 'Somerville', type: 'city', map: bostonMap._id }
    ];

    const createdBostonDistricts = [];
    for (const districtData of bostonDistricts) {
      const district = new District(districtData);
      await district.save();
      createdBostonDistricts.push(district);
      console.log(`✅ Created Boston district: ${district.name}`);
    }

    // Step 3: Update Maps with District references
    console.log('\n🔗 Updating Maps with District references...');
    
    nycMap.districts = createdNYCDistricts.map(d => d._id);
    await nycMap.save();
    console.log('✅ Updated NYC map with districts');

    bostonMap.districts = createdBostonDistricts.map(d => d._id);
    await bostonMap.save();
    console.log('✅ Updated Boston map with districts');

    // Step 4: Create Sample Neighborhoods
    console.log('\n🏠 Creating Sample Neighborhoods...');

    // NYC Neighborhoods by Borough
    const nycNeighborhoods = {
      'Manhattan': ['SoHo', 'Tribeca', 'Greenwich Village', 'East Village', 'Chelsea', 'Midtown', 'Upper East Side', 'Upper West Side', 'Harlem', 'Washington Heights'],
      'Brooklyn': ['DUMBO', 'Brooklyn Heights', 'Park Slope', 'Williamsburg', 'Bushwick', 'Red Hook', 'Crown Heights', 'Prospect Heights', 'Sunset Park', 'Bay Ridge'],
      'Queens': ['Astoria', 'Long Island City', 'Flushing', 'Forest Hills', 'Jackson Heights', 'Elmhurst', 'Woodside', 'Sunnyside', 'Corona', 'Jamaica'],
      'Bronx': ['Mott Haven', 'South Bronx', 'Hunts Point', 'Morris Heights', 'University Heights', 'Fordham', 'Belmont', 'Tremont', 'Castle Hill', 'Throggs Neck'],
      'Staten Island': ['St. George', 'Stapleton', 'Port Richmond', 'New Brighton', 'Tottenville', 'Great Kills', 'Annadale', 'Eltingville', 'Huguenot', 'Richmond']
    };

    let totalNeighborhoods = 0;
    for (const [boroughName, neighborhoods] of Object.entries(nycNeighborhoods)) {
      const district = createdNYCDistricts.find(d => d.name === boroughName);
      if (district) {
        for (const neighborhoodName of neighborhoods) {
          const neighborhood = new Neighborhood({
            name: neighborhoodName,
            district: district._id
          });
          await neighborhood.save();
          totalNeighborhoods++;
          console.log(`✅ Created NYC neighborhood: ${neighborhoodName} (${boroughName})`);
        }
      }
    }

    // Boston Neighborhoods by City/District
    const bostonNeighborhoods = {
      'Boston': ['Back Bay', 'Beacon Hill', 'North End', 'South End', 'Financial District', 'Chinatown', 'South Boston', 'Dorchester', 'Roxbury', 'Jamaica Plain'],
      'Cambridge': ['Harvard Square', 'Porter Square', 'Central Square', 'Kendall Square', 'East Cambridge', 'North Cambridge', 'West Cambridge', 'Riverside', 'Area 2/MIT', 'Strawberry Hill'],
      'Somerville': ['Davis Square', 'Union Square', 'Porter Square Area', 'Ball Square', 'Magoun Square', 'Teele Square', 'Assembly Square', 'East Somerville', 'West Somerville', 'Winter Hill']
    };

    for (const [cityName, neighborhoods] of Object.entries(bostonNeighborhoods)) {
      const district = createdBostonDistricts.find(d => d.name === cityName);
      if (district) {
        for (const neighborhoodName of neighborhoods) {
          const neighborhood = new Neighborhood({
            name: neighborhoodName,
            district: district._id
          });
          await neighborhood.save();
          totalNeighborhoods++;
          console.log(`✅ Created Boston neighborhood: ${neighborhoodName} (${cityName})`);
        }
      }
    }

    // Step 5: Verification and Summary
    console.log('\n📊 === DATABASE POPULATION SUMMARY ===');
    
    const mapCount = await Map.countDocuments();
    const districtCount = await District.countDocuments();
    const neighborhoodCount = await Neighborhood.countDocuments();
    
    console.log(`Maps: ${mapCount}`);
    console.log(`Districts: ${districtCount}`);
    console.log(`Neighborhoods: ${neighborhoodCount}`);

    // Test relationships
    console.log('\n🔍 Testing Relationships...');
    
    for (const map of [nycMap, bostonMap]) {
      const districts = await map.getDistricts();
      const neighborhoods = await map.getNeighborhoods();
      const stats = await map.getMapStats();
      
      console.log(`\n${map.name}:`);
      console.log(`  - Districts: ${districts.length}`);
      console.log(`  - Neighborhoods: ${neighborhoods.length}`);
      console.log(`  - Total Visits: ${stats.totalVisits}`);
      console.log(`  - Average Rating: ${stats.averageRating || 'No ratings yet'}`);
    }

    // Test District methods
    console.log('\n🏘️ Testing District Methods...');
    const manhattanDistrict = await District.findOne({ name: 'Manhattan' });
    if (manhattanDistrict) {
      const manhattanNeighborhoods = await manhattanDistrict.getNeighborhoods();
      const manhattanStats = await manhattanDistrict.getStats();
      console.log(`Manhattan has ${manhattanNeighborhoods.length} neighborhoods`);
      console.log(`Manhattan stats:`, manhattanStats);
    }

    console.log('\n🎉 Database population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the script
populateDatabase();
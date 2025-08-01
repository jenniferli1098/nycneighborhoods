const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Map = require('../models/Map');
const District = require('../models/District');
const Neighborhood = require('../models/Neighborhood');
const Visit = require('../models/Visit');

async function populateFromGeoJSON() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing maps, districts, and neighborhoods...');
    await Map.deleteMany({});
    await District.deleteMany({});
    await Neighborhood.deleteMany({});

    // Read GeoJSON files
    const dataDir = path.join(__dirname, '../data');
    console.log('📂 Reading GeoJSON files...');
    
    const nycGeoJSON = JSON.parse(fs.readFileSync(path.join(dataDir, 'nyc_neighborhoods.geojson'), 'utf8'));
    const bostonGeoJSON = JSON.parse(fs.readFileSync(path.join(dataDir, 'boston_cambridge_neighborhoods.geojson'), 'utf8'));
    
    console.log(`📊 Found ${nycGeoJSON.features.length} NYC neighborhoods`);
    console.log(`📊 Found ${bostonGeoJSON.features.length} Boston area neighborhoods`);

    // Step 1: Create Maps
    console.log('\n📍 Creating Maps...');
    
    const nycMap = new Map({
      name: 'New York',
      slug: 'nyc',
      description: 'Interactive map of New York City neighborhoods organized by boroughs',
      districts: [],
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
      description: 'Interactive map of Greater Boston area neighborhoods',
      districts: [],
      coordinates: {
        longitude: -71.0589,
        latitude: 42.3601
      },
      zoom: 12
    });
    await bostonMap.save();
    console.log('✅ Created Boston map');

    // Step 2: Process NYC Data
    console.log('\n🏘️ Processing NYC Districts and Neighborhoods...');
    
    // Get unique NYC boroughs from GeoJSON
    const nycBoroughs = [...new Set(nycGeoJSON.features.map(f => f.properties.borough))];
    console.log(`📍 Found NYC boroughs: ${nycBoroughs.join(', ')}`);
    
    const nycDistrictLookup = {};
    
    // Create NYC Districts (boroughs)
    for (const boroughName of nycBoroughs) {
      const district = new District({
        name: boroughName,
        type: 'borough',
        map: nycMap._id,
        description: `${boroughName} borough of New York City`
      });
      await district.save();
      nycDistrictLookup[boroughName] = district;
      console.log(`✅ Created NYC district: ${boroughName}`);
    }

    // Create NYC Neighborhoods
    let nycNeighborhoodCount = 0;
    for (const feature of nycGeoJSON.features) {
      const { neighborhood, borough } = feature.properties;
      const district = nycDistrictLookup[borough];
      
      if (district && neighborhood) {
        // Check if neighborhood already exists to avoid duplicates
        const existingNeighborhood = await Neighborhood.findOne({ 
          name: neighborhood, 
          district: district._id 
        });
        
        if (!existingNeighborhood) {
          const neighborhoodDoc = new Neighborhood({
            name: neighborhood,
            district: district._id
          });
          await neighborhoodDoc.save();
          nycNeighborhoodCount++;
          
          if (nycNeighborhoodCount % 50 === 0) {
            console.log(`📍 Created ${nycNeighborhoodCount} NYC neighborhoods...`);
          }
        }
      }
    }
    console.log(`✅ Created ${nycNeighborhoodCount} NYC neighborhoods`);

    // Step 3: Process Boston Data
    console.log('\n🏘️ Processing Boston Districts and Neighborhoods...');
    
    // Get unique cities from Boston GeoJSON
    const bostonCities = [...new Set(bostonGeoJSON.features.map(f => f.properties.city))];
    console.log(`📍 Found Boston area cities: ${bostonCities.join(', ')}`);
    
    const bostonDistrictLookup = {};
    
    // Create Boston Districts (cities)
    for (const cityName of bostonCities) {
      const district = new District({
        name: cityName,
        type: 'city',
        map: bostonMap._id,
        description: `${cityName} area neighborhoods`
      });
      await district.save();
      bostonDistrictLookup[cityName] = district;
      console.log(`✅ Created Boston district: ${cityName}`);
    }

    // Create Boston Neighborhoods
    let bostonNeighborhoodCount = 0;
    for (const feature of bostonGeoJSON.features) {
      const { neighborhood, city } = feature.properties;
      const district = bostonDistrictLookup[city];
      
      if (district && neighborhood) {
        // Check if neighborhood already exists to avoid duplicates
        const existingNeighborhood = await Neighborhood.findOne({ 
          name: neighborhood, 
          district: district._id 
        });
        
        if (!existingNeighborhood) {
          const neighborhoodDoc = new Neighborhood({
            name: neighborhood,
            district: district._id
          });
          await neighborhoodDoc.save();
          bostonNeighborhoodCount++;
        }
      }
    }
    console.log(`✅ Created ${bostonNeighborhoodCount} Boston area neighborhoods`);

    // Step 4: Update Maps with District references
    console.log('\n🔗 Updating Maps with District references...');
    
    const allNYCDistricts = Object.values(nycDistrictLookup);
    const allBostonDistricts = Object.values(bostonDistrictLookup);
    
    nycMap.districts = allNYCDistricts.map(d => d._id);
    await nycMap.save();
    console.log('✅ Updated NYC map with districts');

    bostonMap.districts = allBostonDistricts.map(d => d._id);
    await bostonMap.save();
    console.log('✅ Updated Boston map with districts');

    // Step 5: Verification and Summary
    console.log('\n📊 === DATABASE POPULATION SUMMARY ===');
    
    const mapCount = await Map.countDocuments();
    const districtCount = await District.countDocuments();
    const neighborhoodCount = await Neighborhood.countDocuments();
    
    console.log(`Maps: ${mapCount}`);
    console.log(`Districts: ${districtCount}`);
    console.log(`Neighborhoods: ${neighborhoodCount}`);

    // District breakdown
    console.log('\n🏘️ Districts by type:');
    const boroughDistricts = await District.find({ type: 'borough' });
    const cityDistricts = await District.find({ type: 'city' });
    console.log(`  Borough-type: ${boroughDistricts.length} (${boroughDistricts.map(d => d.name).join(', ')})`);
    console.log(`  City-type: ${cityDistricts.length} (${cityDistricts.map(d => d.name).join(', ')})`);

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

    // Test a few specific districts
    console.log('\n🏗️ Testing District Methods...');
    
    const manhattan = await District.findOne({ name: 'Manhattan' });
    if (manhattan) {
      const manhattanNeighborhoods = await manhattan.getNeighborhoods();
      console.log(`Manhattan has ${manhattanNeighborhoods.length} neighborhoods`);
      console.log(`Sample neighborhoods: ${manhattanNeighborhoods.slice(0, 5).map(n => n.name).join(', ')}...`);
    }

    const bostonDistrict = await District.findOne({ name: 'Boston' });
    if (bostonDistrict) {
      const bostonNeighborhoods = await bostonDistrict.getNeighborhoods();
      console.log(`Boston has ${bostonNeighborhoods.length} neighborhoods`);
      console.log(`Sample neighborhoods: ${bostonNeighborhoods.slice(0, 5).map(n => n.name).join(', ')}...`);
    }

    console.log('\n🎉 Real data population from GeoJSON completed successfully!');
    console.log('✨ Your database now contains authentic NYC and Boston neighborhood data!');

  } catch (error) {
    console.error('❌ Error populating from GeoJSON:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the script
populateFromGeoJSON();
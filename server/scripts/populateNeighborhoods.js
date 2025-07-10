const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Neighborhood = require('../models/Neighborhood');
const Borough = require('../models/Borough');

async function populateNeighborhoods() {
  try {
    console.log('Connecting to MongoDB...');
    MONGODB_URI = "mongodb+srv://jenniferli1098:KE8sQdRAvzIBbYPb@nycneighborhoods-cluste.lbnjlnw.mongodb.net/?retryWrites=true&w=majority&appName=nycneighborhoods-cluster";
    await mongoose.connect(MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Neighborhood.deleteMany({});
    await Borough.deleteMany({});

    // Read the cleaned GeoJSON file
    const geojsonPath = path.join(__dirname, '../../client/public/data/nyc_neighborhoods_clean.geojson');
    const geoData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

    console.log(`Found ${geoData.features.length} neighborhoods in GeoJSON`);

    // Extract unique boroughs
    const boroughNames = [...new Set(geoData.features.map(f => f.properties.borough))];
    console.log('Boroughs found:', boroughNames);

    // Create boroughs
    const boroughMap = {};
    for (const boroughName of boroughNames) {
      const borough = new Borough({
        name: boroughName,
        description: `${boroughName} is one of the five boroughs of New York City.`,
        neighborhoodIds: []
      });
      await borough.save();
      boroughMap[boroughName] = borough;
      console.log(`Created borough: ${boroughName}`);
    }

    // Process neighborhoods
    let created = 0;

    for (let i = 0; i < geoData.features.length; i++) {
      const feature = geoData.features[i];
      const { neighborhood: name, borough: boroughName } = feature.properties;
      
      console.log("borough id:", boroughMap[boroughName]._id);
      const neighborhood = new Neighborhood({
        name: name,
        boroughId: boroughMap[boroughName]._id.toString(),
        description: `${name} is a neighborhood in ${boroughName}, New York City.`,
        walkabilityScore: Math.floor(Math.random() * 101), // Random walkability score for demo
        averageVisitRating: null,
        totalVisits: 0
      });
      
      await neighborhood.save();
      created++;
      
      // Add neighborhood to borough's neighborhoodIds array
      boroughMap[boroughName].neighborhoodIds.push(neighborhood._id.toString());
      
      if ((i + 1) % 50 === 0) {
        console.log(`Processed ${i + 1}/${geoData.features.length} neighborhoods...`);
      }
    }

    // Save borough updates
    for (const borough of Object.values(boroughMap)) {
      await borough.save();
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Neighborhoods created: ${created}`);
    console.log(`Boroughs created: ${boroughNames.length}`);
    console.log(`Total neighborhoods: ${created}`);

    // Verify the data
    const totalNeighborhoods = await Neighborhood.countDocuments();
    const totalBoroughs = await Borough.countDocuments();
    console.log(`\nVerification:`);
    console.log(`Neighborhoods in DB: ${totalNeighborhoods}`);
    console.log(`Boroughs in DB: ${totalBoroughs}`);

  } catch (error) {
    console.error('Error populating neighborhoods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateNeighborhoods();
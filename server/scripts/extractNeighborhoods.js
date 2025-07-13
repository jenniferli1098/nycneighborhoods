const fs = require('fs');
const path = require('path');

const geoJsonPath = path.join(__dirname, '../../client/public/data/boston_cambridge_neighborhoods.geojson');
const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));

const neighborhoodsByCity = {};
data.features.forEach(feature => {
  const city = feature.properties.city;
  const name = feature.properties.name;
  if (!neighborhoodsByCity[city]) {
    neighborhoodsByCity[city] = [];
  }
  neighborhoodsByCity[city].push(name);
});

console.log('Neighborhoods by city:');
Object.keys(neighborhoodsByCity).forEach(city => {
  console.log(`\n${city}:`);
  neighborhoodsByCity[city].sort().forEach(name => {
    console.log(`  '${name}',`);
  });
});

console.log('\nTotal features:', data.features.length);
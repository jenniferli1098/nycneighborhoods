// Simple script to fix Bronx mapping via server API
// Since server is running on port 8000, we'll use the existing connection

const http = require('http');

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function fixBronxMapping() {
  try {
    console.log('🔍 Checking current map configuration...');
    
    // Get the New York map
    const maps = await makeRequest('/api/maps');
    const newYorkMap = maps.find(m => m.name === 'New York');
    
    if (!newYorkMap) {
      console.error('❌ New York map not found');
      return;
    }

    console.log('📍 New York map ID:', newYorkMap._id);
    console.log('🏘️ Current district IDs:', newYorkMap.districts);

    // Get all districts to check which Bronx we should use
    const districts = await makeRequest('/api/districts');
    const originalBronx = districts.find(b => b.name === 'Bronx');
    const newBronx = districts.find(b => b.name === 'The Bronx');

    console.log('🔍 Original Bronx ID:', originalBronx?._id);
    console.log('🔍 New Bronx ID:', newBronx?._id);

    // Check neighborhoods for each
    const allNeighborhoods = await makeRequest('/api/neighborhoods');
    const originalBronxNeighborhoods = allNeighborhoods.filter(n => n.district === originalBronx?._id);
    const newBronxNeighborhoods = allNeighborhoods.filter(n => n.district === newBronx?._id);

    console.log(`📊 Original Bronx has ${originalBronxNeighborhoods.length} neighborhoods`);
    console.log(`📊 New Bronx has ${newBronxNeighborhoods.length} neighborhoods`);

    console.log('\n🎯 DIAGNOSIS:');
    console.log(`- New York map uses: ${newYorkMap.districts.join(', ')}`);
    console.log(`- Original Bronx ID: ${originalBronx?._id} (${originalBronxNeighborhoods.length} neighborhoods)`);
    console.log(`- New Bronx ID: ${newBronx?._id} (${newBronxNeighborhoods.length} neighborhoods)`);
    
    const hasBadBronx = newYorkMap.districts.includes(newBronx?._id);
    const hasGoodBronx = newYorkMap.districts.includes(originalBronx?._id);
    
    console.log(`- Map includes bad Bronx: ${hasBadBronx}`);
    console.log(`- Map includes good Bronx: ${hasGoodBronx}`);

    if (hasBadBronx && !hasGoodBronx) {
      console.log('\n❌ PROBLEM CONFIRMED: Map uses "The Bronx" (no neighborhoods) instead of "Bronx" (has neighborhoods)');
      console.log('📝 SOLUTION: Replace "The Bronx" ID with "Bronx" ID in the map configuration');
      console.log(`   Replace: ${newBronx._id}`);
      console.log(`   With: ${originalBronx._id}`);
    } else {
      console.log('\n✅ No obvious issue found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBronxMapping();
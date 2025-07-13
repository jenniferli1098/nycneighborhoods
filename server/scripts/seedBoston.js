const mongoose = require('mongoose');
const dotenv = require('dotenv');
const City = require('../models/City');
const Neighborhood = require('../models/Neighborhood');

dotenv.config();

const BOSTON_NEIGHBORHOODS = [
  'Allston',
  'Back Bay',
  'Bay Village',
  'Beacon Hill',
  'Brighton',
  'Charlestown',
  'Chinatown',
  'Dorchester',
  'Downtown',
  'East Boston',
  'Fenway',
  'Harbor Islands',
  'Hyde Park',
  'Jamaica Plain',
  'Leather District',
  'Longwood',
  'Mattapan',
  'Mission Hill',
  'North End',
  'Roslindale',
  'Roxbury',
  'South Boston',
  'South Boston Waterfront',
  'South End',
  'West End',
  'West Roxbury'
];

const CAMBRIDGE_NEIGHBORHOODS = [
  'Area 2/MIT',
  'Baldwin',
  'Cambridge Highlands',
  'Cambridgeport',
  'East Cambridge',
  'Mid-Cambridge',
  'Neighborhood Nine',
  'North Cambridge',
  'Riverside',
  'Strawberry Hill',
  'The Port',
  'Wellington-Harrington',
  'West Cambridge'
];

const SOMERVILLE_NEIGHBORHOODS = [
  'Ward 1',
  'Ward 2',
  'Ward 3',
  'Ward 4',
  'Ward 5',
  'Ward 6',
  'Ward 7'
];

async function seedBostonData() {
  try {
    console.log('🌱 Starting Boston data seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create Boston city
    let bostonCity = await City.findOne({ name: 'Boston' });
    if (!bostonCity) {
      bostonCity = new City({
        name: 'Boston',
        state: 'Massachusetts',
        country: 'United States',
        metropolitanArea: 'Greater Boston'
      });
      await bostonCity.save();
      console.log('✅ Created Boston city');
    } else {
      console.log('ℹ️ Boston city already exists');
    }

    // Create Cambridge city
    let cambridgeCity = await City.findOne({ name: 'Cambridge' });
    if (!cambridgeCity) {
      cambridgeCity = new City({
        name: 'Cambridge',
        state: 'Massachusetts',
        country: 'United States',
        metropolitanArea: 'Greater Boston'
      });
      await cambridgeCity.save();
      console.log('✅ Created Cambridge city');
    } else {
      console.log('ℹ️ Cambridge city already exists');
    }

    // Create Somerville city
    let somervilleCity = await City.findOne({ name: 'Somerville' });
    if (!somervilleCity) {
      somervilleCity = new City({
        name: 'Somerville',
        state: 'Massachusetts',
        country: 'United States',
        metropolitanArea: 'Greater Boston'
      });
      await somervilleCity.save();
      console.log('✅ Created Somerville city');
    } else {
      console.log('ℹ️ Somerville city already exists');
    }

    // Create Boston neighborhoods
    let bostonCount = 0;
    for (const neighborhoodName of BOSTON_NEIGHBORHOODS) {
      const existing = await Neighborhood.findOne({ 
        name: neighborhoodName, 
        cityId: bostonCity._id.toString() 
      });
      
      if (!existing) {
        const neighborhood = new Neighborhood({
          name: neighborhoodName,
          cityId: bostonCity._id.toString(),
          city: 'Boston'
        });
        await neighborhood.save();
        bostonCount++;
      }
    }
    console.log(`✅ Created ${bostonCount} Boston neighborhoods`);

    // Create Cambridge neighborhoods
    let cambridgeCount = 0;
    for (const neighborhoodName of CAMBRIDGE_NEIGHBORHOODS) {
      const existing = await Neighborhood.findOne({ 
        name: neighborhoodName, 
        cityId: cambridgeCity._id.toString() 
      });
      
      if (!existing) {
        const neighborhood = new Neighborhood({
          name: neighborhoodName,
          cityId: cambridgeCity._id.toString(),
          city: 'Cambridge'
        });
        await neighborhood.save();
        cambridgeCount++;
      }
    }
    console.log(`✅ Created ${cambridgeCount} Cambridge neighborhoods`);

    // Create Somerville neighborhoods
    let somervilleCount = 0;
    for (const neighborhoodName of SOMERVILLE_NEIGHBORHOODS) {
      const existing = await Neighborhood.findOne({ 
        name: neighborhoodName, 
        cityId: somervilleCity._id.toString() 
      });
      
      if (!existing) {
        const neighborhood = new Neighborhood({
          name: neighborhoodName,
          cityId: somervilleCity._id.toString(),
          city: 'Somerville'
        });
        await neighborhood.save();
        somervilleCount++;
      }
    }
    console.log(`✅ Created ${somervilleCount} Somerville neighborhoods`);

    console.log('🎉 Boston data seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding Boston data:', error);
    process.exit(1);
  }
}

seedBostonData();
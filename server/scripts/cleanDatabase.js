const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('✅ Connected to MongoDB');

    // Drop all collections to clean up old indexes
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      if (['maps', 'districts', 'neighborhoods'].includes(collection.name)) {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`🗑️ Dropped collection: ${collection.name}`);
      }
    }

    console.log('✅ Database cleaned successfully');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

cleanDatabase();
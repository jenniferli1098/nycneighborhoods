const mongoose = require('mongoose');
require('dotenv').config();

const fixVisitIndexes = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    
    const db = mongoose.connection.db;
    const collection = db.collection('visits');
    
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log('  -', index.name, ':', Object.keys(index.key));
    });
    
    // List of old/problematic indexes to remove
    const oldIndexes = [
      'user_1_neighborhood_1_borough_1',
      'user_1_neighborhood_1', 
      'neighborhood_1_borough_1',
      'user_1_borough_1'
    ];
    
    // Drop old indexes
    for (const indexName of oldIndexes) {
      try {
        console.log(`🗑️ Dropping old index: ${indexName}`);
        await collection.dropIndex(indexName);
        console.log(`✅ Successfully dropped old index: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`ℹ️ Index ${indexName} does not exist (already removed)`);
        } else {
          console.error(`❌ Error dropping index ${indexName}:`, error.message);
        }
      }
    }
    
    // Ensure correct indexes exist
    console.log('🔧 Ensuring correct indexes exist...');
    
    // 1. Unique compound index for userId + neighborhoodId
    try {
      await collection.createIndex(
        { userId: 1, neighborhoodId: 1 }, 
        { unique: true, name: 'userId_1_neighborhoodId_1' }
      );
      console.log('✅ Ensured unique compound index: userId_1_neighborhoodId_1');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Unique compound index already exists');
      } else {
        console.error('❌ Error creating unique compound index:', error.message);
      }
    }
    
    // 2. Single field index for neighborhoodId
    try {
      await collection.createIndex(
        { neighborhoodId: 1 }, 
        { name: 'neighborhoodId_1' }
      );
      console.log('✅ Ensured single field index: neighborhoodId_1');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ neighborhoodId index already exists');
      } else {
        console.error('❌ Error creating neighborhoodId index:', error.message);
      }
    }
    
    // 3. Single field index for userId
    try {
      await collection.createIndex(
        { userId: 1 }, 
        { name: 'userId_1' }
      );
      console.log('✅ Ensured single field index: userId_1');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ userId index already exists');
      } else {
        console.error('❌ Error creating userId index:', error.message);
      }
    }
    
    console.log('📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log('  -', index.name, ':', Object.keys(index.key), index.unique ? '(unique)' : '');
    });
    
    console.log('✅ Migration complete! Only userId and neighborhoodId indexes remain.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

fixVisitIndexes();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    // Delete existing test user if it exists (to recreate with proper fields)
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      await User.deleteOne({ email: 'test@example.com' });
      console.log('Deleted existing test user to recreate with proper fields');
    }

    // Create test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });

    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('Username: testuser');
    console.log('');
    console.log('You can now log in with these credentials to test the neighborhood clicking functionality.');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();
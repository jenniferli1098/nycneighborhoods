const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    const MONGODB_URI = "mongodb+srv://jenniferli1098:KE8sQdRAvzIBbYPb@nycneighborhoods-cluste.lbnjlnw.mongodb.net/?retryWrites=true&w=majority&appName=nycneighborhoods-cluster";
    await mongoose.connect(MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nycneighborhoods');
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists:');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      console.log('Username:', existingUser.username);
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
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
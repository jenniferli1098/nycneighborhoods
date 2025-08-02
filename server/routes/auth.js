const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { contentModerationMiddleware } = require('../middleware/contentModeration');
const { formatUserResponse, createAuthResponse } = require('../utils/userHelpers');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
};

router.post('/register', 
  contentModerationMiddleware({ 
    fields: ['firstName', 'lastName', 'username'], 
    strict: true 
  }), 
  async (req, res) => {
  try {
    console.log('🆕 Registration request received for:', { 
      username: req.body.username, 
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName 
    });
    const { username, email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ Registration failed: Missing required fields');
      return res.status(400).json({ error: 'Username, email, password, first name, and last name are required' });
    }

    // Check password length
    if (password.length < 6) {
      console.log('❌ Registration failed: Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('🔍 Checking for existing user with email/username...');
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('❌ Registration failed: User already exists:', { 
        email: existingUser.email, 
        username: existingUser.username 
      });
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('💾 Creating new user...');
    const user = new User({ username, email, password, firstName, lastName });
    await user.save();
    console.log('✅ User created successfully:', { 
      id: user._id, 
      username: user.username, 
      email: user.email 
    });

    const token = generateToken(user._id);
    console.log('🎟️ JWT token generated successfully for user:', user._id);
    
    res.status(201).json(createAuthResponse(user, token));
  } catch (error) {
    console.error('❌ Registration error:', { 
      message: error.message, 
      stack: error.stack,
      email: req.body?.email,
      username: req.body?.username 
    });
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('❌ Registration validation error:', validationErrors);
      return res.status(400).json({ error: `Validation error: ${validationErrors.join(', ')}` });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      console.log('❌ Registration duplicate key error:', { field, value: error.keyValue[field] });
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request received for email:', req.body.email);
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Login failed: Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('🔍 Looking up user by email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Login failed: User not found for email:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', { id: user._id, username: user.username, email: user.email, hasGoogleId: !!user.googleId });
    
    // Check if this is a Google OAuth user trying to login with password
    if (user.googleId && !user.password) {
      console.log('❌ Login failed: Google OAuth user attempting password login');
      return res.status(400).json({ 
        error: 'This account was created with Google. Please use Google Sign-In instead.' 
      });
    }
    
    console.log('🔑 Verifying password...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Login failed: Invalid password for user:', user.email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password verified successfully');
    const token = generateToken(user._id);
    console.log('🎟️ JWT token generated for user:', user._id);
    
    console.log('✅ Login successful for user:', { id: user._id, username: user.username });
    res.json(createAuthResponse(user, token));
  } catch (error) {
    console.error('❌ Login error:', { 
      message: error.message, 
      stack: error.stack,
      email: req.body?.email 
    });
    res.status(500).json({ error: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    console.log('🔐 Google auth request received');
    const { token } = req.body;
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ error: 'Google token is required' });
    }

    console.log('🔍 Verifying Google token...');
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.log('❌ GOOGLE_CLIENT_ID not set');
      return res.status(500).json({ error: 'Google Client ID not configured' });
    }
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, given_name, family_name } = payload;
    
    console.log('✅ Google token verified for:', email);

    let user = await User.findOne({ email });
    
    if (!user) {
      // Parse name into firstName and lastName
      const nameParts = name ? name.split(' ') : [];
      const firstName = given_name || nameParts[0] || 'User';
      const lastName = family_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Google');
      
      console.log('🆕 Creating new user from Google auth');
      user = new User({
        username: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture,
        firstName,
        lastName
      });
      await user.save();
      console.log('✅ New user created:', user._id);
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = picture;
      await user.save();
    }

    const jwtToken = generateToken(user._id);
    res.json(createAuthResponse(user, jwtToken));
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    console.log('👤 Get user profile request for user:', req.user._id);
    
    console.log('✅ User profile retrieved successfully:', { id: req.user._id, username: req.user.username });
    res.json({ user: formatUserResponse(req.user) });
  } catch (error) {
    console.error('❌ Get user profile error:', { 
      message: error.message, 
      userId: req.user?._id 
    });
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', 
  auth, 
  contentModerationMiddleware({ 
    fields: ['firstName', 'lastName', 'description', 'location'], 
    strict: true 
  }), 
  async (req, res) => {
  try {
    const { firstName, lastName, description, location } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    
    // Validate field lengths
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be 500 characters or less' });
    }
    
    if (location && location.length > 100) {
      return res.status(400).json({ error: 'Location must be 100 characters or less' });
    }
    
    // Update user profile
    const updateData = { firstName, lastName };
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        description: updatedUser.description || '',
        location: updatedUser.location || ''
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `Validation error: ${validationErrors.join(', ')}` });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get user's map preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      mapPreferences: user.mapPreferences || { visibleMaps: ['nyc', 'boston', 'countries'] }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user's map preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { mapPreferences } = req.body;
    
    if (!mapPreferences || !Array.isArray(mapPreferences.visibleMaps)) {
      return res.status(400).json({ error: 'Invalid map preferences format' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { mapPreferences },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      mapPreferences: updatedUser.mapPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
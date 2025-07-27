const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { contentModerationMiddleware } = require('../middleware/contentModeration');

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
    console.log('Registration request received:', req.body);
    const { username, email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Username, email, password, first name, and last name are required' });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('Creating new user...');
    const user = new User({ username, email, password, firstName, lastName });
    await user.save();
    console.log('User created successfully:', user._id);

    const token = generateToken(user._id);
    console.log('Token generated successfully');
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description || '',
        location: user.location || '',
        mapPreferences: user.mapPreferences || { visibleMaps: ['nyc', 'boston', 'countries'] }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: `Validation error: ${validationErrors.join(', ')}` });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
    
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description || '',
        location: user.location || '',
        mapPreferences: user.mapPreferences || { visibleMaps: ['nyc', 'boston', 'countries'] }
      }
    });
  } catch (error) {
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
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description || '',
        location: user.location || '',
        mapPreferences: user.mapPreferences || { visibleMaps: ['nyc', 'boston', 'countries'] }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        description: req.user.description || '',
        location: req.user.location || '',
        mapPreferences: req.user.mapPreferences || { visibleMaps: ['nyc', 'boston', 'countries'] }
      }
    });
  } catch (error) {
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
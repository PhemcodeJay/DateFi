const express = require('express');
const User = require('../models/User');
const Match = require('../models/Match');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   PUT /api/profiles/me
// @desc    Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, age, bio, interests, preferences, location } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (age) updates.age = age;
    if (bio !== undefined) updates.bio = bio;
    if (interests) updates.interests = Array.isArray(interests) ? interests : interests.split(',').map(i => i.trim()).filter(i => i);
    if (preferences) updates.preferences = preferences;
    if (location) updates.location = location;

    const user = await User.updateProfile(req.user.id, updates);
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/profiles/photo
// @desc    Upload profile photo
router.post('/photo', auth, require('../middleware/upload').single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const photos = await User.addPhoto(req.user.id, photoUrl);
    
    res.json({ photoUrl, photos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/profiles/photo/:photoUrl
// @desc    Delete profile photo
router.delete('/photo/:photoUrl', auth, async (req, res) => {
  try {
    const photoUrl = req.params.photoUrl;
    const photos = await User.removePhoto(req.user.id, photoUrl);
    res.json({ photos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/profiles/discover
// @desc    Get profiles to discover
router.get('/discover', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preferences = user.preferences || {};
    const profiles = await User.getDiscoverable(req.user.id, preferences);
    
    res.json(profiles);
  } catch (error) {
    console.error('Discover profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/profiles/:id
// @desc    Get user profile by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
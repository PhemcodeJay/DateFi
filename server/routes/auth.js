const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { pool } = require('../config/database');
const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { email, password, name, age, gender } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ email, password, name, age, gender });

    res.status(201).json({
      _id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      bio: user.bio || '',
      photos: user.photos || [],
      preferences: user.preferences || {},
      interests: user.interests || [],
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordCorrect = await User.comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      bio: user.bio || '',
      photos: user.photos || [],
      preferences: user.preferences || {},
      interests: user.interests || [],
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      bio: user.bio || '',
      photos: user.photos || [],
      preferences: user.preferences || {},
      interests: user.interests || [],
      subscription: {
        plan: user.subscription_plan,
        startDate: user.subscription_start_date,
        endDate: user.subscription_end_date,
        paymentId: user.payment_id
      },
      isVerified: user.is_verified
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/demo-login
// @desc    Demo login - returns demo user credentials
router.post('/demo-login', async (req, res) => {
  try {
    const DEMO_EMAIL = 'demo@datefi.com';
    
    // Find demo user (should exist from seed)
    let user = await User.findByEmail(DEMO_EMAIL);
    
    if (!user) {
      return res.status(500).json({ message: 'Demo user not found. Please run seed script.' });
    }

    const token = generateToken(user.id);

    res.json({
      _id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      bio: user.bio || '',
      photos: user.photos || [],
      preferences: user.preferences || {},
      interests: user.interests || [],
      isDemo: true,
      token
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh token
router.post('/refresh', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
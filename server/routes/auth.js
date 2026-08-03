const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
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
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
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
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      bio: user.bio,
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
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
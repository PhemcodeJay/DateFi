const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/matches/like/:userId
// @desc    Like a user (create match)
router.post('/like/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'You cannot like yourself' });
    }

    // Check if match already exists
    let match = await Match.findBetween(req.user.id, userId);

    if (match) {
      if (match.status === 'matched') {
        return res.status(400).json({ message: 'Already matched' });
      }
      // Check if this is a mutual like
      if ((match.user1_id == req.user.id && match.user2_id == userId) ||
          (match.user1_id == userId && match.user2_id == req.user.id)) {
        match = await Match.updateStatus(match.id, 'matched');
        return res.json({ match: true, matchId: match.id });
      }
      return res.status(400).json({ message: 'Match already exists' });
    }

    // Create new match
    match = await Match.create({ user1_id: req.user.id, user2_id: userId, status: 'pending' });

    // Check if the other user has already liked this user (mutual match)
    const existingFromOther = await Match.findBetween(userId, req.user.id);

    if (existingFromOther) {
      await Match.updateStatus(existingFromOther.id, 'matched');
      await Match.updateStatus(match.id, 'matched');
      return res.json({ match: true, matchId: match.id });
    }

    res.json({ match: false, matchId: match.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/matches/pass/:userId
// @desc    Pass on a user
router.post('/pass/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    await Match.create({ user1_id: req.user.id, user2_id: userId, status: 'unmatched' });

    res.json({ message: 'User passed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/matches
// @desc    Get all matches for current user
router.get('/', auth, async (req, res) => {
  try {
    const matches = await Match.getMatches(req.user.id);
    
    const formattedMatches = matches.map(match => ({
      matchId: match.id,
      user: {
        _id: match.other_user_id,
        name: match.name,
        age: match.age,
        photos: match.photos || [],
        bio: match.bio
      },
      matchedAt: match.matched_at
    }));

    res.json(formattedMatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/matches/:matchId
// @desc    Unmatch a user
router.delete('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.delete(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json({ message: 'Unmatched successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
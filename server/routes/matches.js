const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { pool } = require('../config/database');
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
        
        // Emit match notification to both users
        const io = req.app.get('io');
        if (io) {
          io.to(userId.toString()).emit('new_match', {
            matchId: match.id,
            userId: req.user.id
          });
        }
        
        return res.json({ match: true, matchId: match.id });
      }
      return res.status(400).json({ message: 'Match already exists' });
    }

    // Create new match
    match = await Match.create({ user1_id: req.user.id, user2_id: userId, status: 'pending' });

    // Check if the other user has already liked this user (mutual match)
    const existingFromOther = await pool.query(`
      SELECT * FROM matches 
      WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'
    `, [userId, req.user.id]);

    if (existingFromOther.rows.length > 0) {
      await Match.updateStatus(existingFromOther.rows[0].id, 'matched');
      await Match.updateStatus(match.id, 'matched');
      
      // Emit match notification to both users
      const io = req.app.get('io');
      if (io) {
        io.to(userId.toString()).emit('new_match', {
          matchId: match.id,
          userId: req.user.id
        });
      }
      
      return res.json({ match: true, matchId: match.id });
    }

    res.json({ match: false, matchId: match.id });
  } catch (error) {
    console.error('Like user error:', error);
    res.status(500).json({ message: 'Server error' });
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
        bio: match.bio || ''
      },
      matchedAt: match.matched_at
    }));

    res.json(formattedMatches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/matches/:matchId/info
// @desc    Get specific match info for chat header
router.get('/:matchId/info', auth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    
    const matchData = await pool.query(`
      SELECT m.id as match_id,
        CASE WHEN m.user1_id = $1 THEN u2.id ELSE u1.id END as other_user_id,
        CASE WHEN m.user1_id = $1 THEN u2.name ELSE u1.name END as name,
        CASE WHEN m.user1_id = $1 THEN u2.age ELSE u1.age END as age,
        CASE WHEN m.user1_id = $1 THEN u2.photos ELSE u1.photos END as photos,
        CASE WHEN m.user1_id = $1 THEN u2.bio ELSE u1.bio END as bio
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE m.id = $2 AND (m.user1_id = $1 OR m.user2_id = $1) AND m.status = 'matched'
    `, [req.user.id, matchId]);

    if (matchData.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const match = matchData.rows[0];
    res.json({
      matchId: match.match_id,
      user: {
        _id: match.other_user_id,
        name: match.name,
        age: match.age,
        photos: match.photos || [],
        bio: match.bio || ''
      }
    });
  } catch (error) {
    console.error('Get match info error:', error);
    res.status(500).json({ message: 'Server error' });
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
    console.error('Unmatch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
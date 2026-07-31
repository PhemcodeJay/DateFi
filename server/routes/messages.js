const express = require('express');
const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { pool } = require('../config/database');
const router = express.Router();

// @route   GET /api/messages/:matchId
// @desc    Get messages for a match
router.get('/:matchId', auth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    
    // Verify match exists and user is part of it
    const match = await Match.findBetween(req.user.id, req.user.id);
    const matchData = await pool.query(`
      SELECT * FROM matches 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [matchId, req.user.id]);

    if (matchData.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const messages = await Message.findByMatchId(matchId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/messages/:matchId
// @desc    Send a message
router.post('/:matchId', auth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify match exists and user is part of it
    const matchData = await pool.query(`
      SELECT id FROM matches 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [matchId, req.user.id]);

    if (matchData.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check subscription limits for free users
    const user = await User.findById(req.user.id);
    if (user.subscription_plan === 'free') {
      const count = await Message.countTodayByUser(matchId, req.user.id);
      if (count >= 5) {
        return res.status(403).json({ 
          message: 'Daily message limit reached. Upgrade to Premium for unlimited messages.',
          requiresUpgrade: true
        });
      }
    }

    const message = await Message.create({
      match_id: matchId,
      sender_id: req.user.id,
      content: content.trim()
    });

    const messageWithSender = await pool.query(`
      SELECT m.*, u.name as sender_name, u.photos as sender_photos
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [message.id]);

    // Emit to socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('new_message', messageWithSender.rows[0]);
    }

    res.status(201).json(messageWithSender.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/messages/:matchId/read
// @desc    Mark messages as read
router.put('/:matchId/read', auth, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);

    // Verify match exists
    const matchData = await pool.query(`
      SELECT id FROM matches 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [matchId, req.user.id]);

    if (matchData.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    await Message.markAsRead(matchId, req.user.id);

    // Emit read receipt
    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('messages_read', { userId: req.user.id });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const auth = require('../middleware/auth');
const uploadMedia = require('../middleware/uploadMedia');
const { sendMessageValidation, matchIdValidation } = require('../middleware/validate');
const { messageLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { pool } = require('../config/database');
const router = express.Router();

// @route   GET /api/messages/:matchId
// @desc    Get messages for a match
router.get('/:matchId', auth, matchIdValidation, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    
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
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:matchId
// @desc    Send a text message
router.post('/:matchId', auth, messageLimiter, matchIdValidation, sendMessageValidation, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { content, type = 'text', mediaUrl } = req.body;

    if (type === 'text' && (!content || !content.trim())) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    if ((type === 'image' || type === 'video') && !mediaUrl) {
      return res.status(400).json({ message: 'Media URL is required for media messages' });
    }

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
      content: type === 'text' ? content.trim() : (content || ''),
      message_type: type,
      media_url: mediaUrl || null
    });

    const messageWithSender = await pool.query(`
      SELECT m.*, u.name as sender_name, u.photos as sender_photos
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [message.id]);

    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('new_message', messageWithSender.rows[0]);
    }

    res.status(201).json(messageWithSender.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:matchId/media
// @desc    Upload media (image/video) and send as message
router.post('/:matchId/media', auth, uploadLimiter, uploadMedia.single('media'), async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    const { content = '' } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No media file uploaded' });
    }

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

    const isVideo = req.file.mimetype.startsWith('video/');
    const messageType = isVideo ? 'video' : 'image';
    const mediaUrl = `/uploads/media/${req.file.filename}`;

    const message = await Message.create({
      match_id: matchId,
      sender_id: req.user.id,
      content: content.trim(),
      message_type: messageType,
      media_url: mediaUrl
    });

    const messageWithSender = await pool.query(`
      SELECT m.*, u.name as sender_name, u.photos as sender_photos
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [message.id]);

    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('new_message', messageWithSender.rows[0]);
    }

    res.status(201).json(messageWithSender.rows[0]);
  } catch (error) {
    console.error('Upload media error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 100MB.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:matchId/read
// @desc    Mark messages as read
router.put('/:matchId/read', auth, matchIdValidation, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);

    const matchData = await pool.query(`
      SELECT id FROM matches 
      WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
    `, [matchId, req.user.id]);

    if (matchData.rows.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    await Message.markAsRead(matchId, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(matchId.toString()).emit('messages_read', { userId: req.user.id, matchId });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
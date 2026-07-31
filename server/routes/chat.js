const express = require('express');
const Match = require('../models/Match');
const Message = require('../models/Message');
const router = express.Router();

// @route   GET /api/chat/matches
// @desc    Get all matches with last message
router.get('/matches', require('../middleware/auth').default, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const query = `
      SELECT m.id as match_id,
        CASE WHEN m.user1_id = $1 THEN u2.id ELSE u1.id END as other_user_id,
        CASE WHEN m.user1_id = $1 THEN u2.name ELSE u1.name END as name,
        CASE WHEN m.user1_id = $1 THEN u2.age ELSE u1.age END as age,
        CASE WHEN m.user1_id = $1 THEN u2.photos ELSE u1.photos END as photos,
        CASE WHEN m.user1_id = $1 THEN u2.bio ELSE u1.bio END as bio,
        m.matched_at,
        (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != $1 AND read = false) as unread_count
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE (m.user1_id = $1 OR m.user2_id = $1) AND m.status = 'matched'
      ORDER BY m.matched_at DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
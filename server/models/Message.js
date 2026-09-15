const { pool } = require('../config/database');

const Message = {
  // Create a message
  create: async (messageData) => {
    const { match_id, sender_id, content, message_type = 'text', media_url = null } = messageData;
    
    const query = `
      INSERT INTO messages (match_id, sender_id, content, message_type, media_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [match_id, sender_id, content, message_type, media_url];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get messages for a match
  findByMatchId: async (matchId, limit = 50, offset = 0) => {
    const query = `
      SELECT m.*, u.name as sender_name, u.photos as sender_photos
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.match_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [matchId, limit, offset]);
    return result.rows;
  },

  // Mark messages as read
  markAsRead: async (matchId, userId) => {
    const query = `
      UPDATE messages 
      SET read = true 
      WHERE match_id = $1 AND sender_id != $2 AND read = false
      RETURNING *
    `;
    const result = await pool.query(query, [matchId, userId]);
    return result.rows;
  },

  // Get unread count
  getUnreadCount: async (matchId, userId) => {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE match_id = $1 AND sender_id != $2 AND read = false
    `;
    const result = await pool.query(query, [matchId, userId]);
    return parseInt(result.rows[0]?.count || 0);
  },

  // Count messages sent today by user in a match
  countTodayByUser: async (matchId, userId) => {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE match_id = $1 AND sender_id = $2 AND DATE(created_at) = CURRENT_DATE
    `;
    const result = await pool.query(query, [matchId, userId]);
    return parseInt(result.rows[0]?.count || 0);
  }
};

module.exports = Message;
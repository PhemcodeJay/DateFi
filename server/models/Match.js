const { pool } = require('../config/database');

const Match = {
  // Create a match/like
  create: async (matchData) => {
    const { user1_id, user2_id, status = 'pending' } = matchData;
    
    const query = `
      INSERT INTO matches (user1_id, user2_id, status)
      VALUES ($1, $2, $3)
      ON CONFLICT (user1_id, user2_id) DO UPDATE SET status = EXCLUDED.status
      RETURNING *
    `;
    
    const values = [user1_id, user2_id, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find match between two users
  findBetween: async (user1_id, user2_id) => {
    const query = `
      SELECT * FROM matches 
      WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
    `;
    const result = await pool.query(query, [user1_id, user2_id]);
    return result.rows[0];
  },

  // Get all matches for a user
  getMatches: async (userId) => {
    const query = `
      SELECT m.*, 
        CASE WHEN m.user1_id = $1 THEN u2.id ELSE u1.id END as other_user_id,
        CASE WHEN m.user1_id = $1 THEN u2.name ELSE u1.name END as name,
        CASE WHEN m.user1_id = $1 THEN u2.age ELSE u1.age END as age,
        CASE WHEN m.user1_id = $1 THEN u2.photos ELSE u1.photos END as photos,
        CASE WHEN m.user1_id = $1 THEN u2.bio ELSE u1.bio END as bio
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE (m.user1_id = $1 OR m.user2_id = $1) AND m.status = 'matched'
      ORDER BY m.matched_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Update match status
  updateStatus: async (matchId, status) => {
    const query = `
      UPDATE matches 
      SET status = $1, matched_at = CASE WHEN $1 = 'matched' AND matched_at IS NULL THEN NOW() ELSE matched_at END
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, matchId]);
    return result.rows[0];
  },

  // Delete/unmatch
  delete: async (matchId) => {
    const query = 'DELETE FROM matches WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [matchId]);
    return result.rows[0];
  }
};

module.exports = Match;
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// User table operations
const User = {
  // Create user
  create: async (userData) => {
    const { email, password, name, age, gender } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, password, name, age, gender, subscription_plan, is_verified, is_active)
      VALUES ($1, $2, $3, $4, $5, 'free', false, true)
      RETURNING id, email, name, age, gender, subscription_plan, subscription_start_date, subscription_end_date, is_verified, is_active, created_at
    `;
    
    const values = [email, hashedPassword, name, age, gender];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find user by email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Compare password
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Update profile
  updateProfile: async (id, updates) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.age) {
      fields.push(`age = $${paramCount++}`);
      values.push(updates.age);
    }
    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramCount++}`);
      values.push(updates.bio);
    }
    if (updates.interests) {
      fields.push(`interests = $${paramCount++}`);
      values.push(JSON.stringify(updates.interests));
    }
    if (updates.preferences) {
      fields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.preferences));
    }
    if (updates.location) {
      fields.push(`location = $${paramCount++}`);
      values.push(JSON.stringify(updates.location));
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Add photo to user
  addPhoto: async (userId, photoUrl) => {
    const query = 'UPDATE users SET photos = array_append(photos, $1) WHERE id = $2 RETURNING photos';
    const result = await pool.query(query, [photoUrl, userId]);
    return result.rows[0]?.photos || [];
  },

  // Remove photo from user
  removePhoto: async (userId, photoUrl) => {
    const query = 'UPDATE users SET photos = array_remove(photos, $1) WHERE id = $2 RETURNING photos';
    const result = await pool.query(query, [photoUrl, userId]);
    return result.rows[0]?.photos || [];
  },

  // Get photos
  getPhotos: async (userId) => {
    const query = 'SELECT photos FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.photos || [];
  },

  // Update subscription
  updateSubscription: async (userId, plan, endDate) => {
    const query = `
      UPDATE users 
      SET subscription_plan = $1, subscription_start_date = NOW(), subscription_end_date = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [plan, endDate, userId]);
    return result.rows[0];
  },

  // Check if subscription is active
  isSubscriptionActive: async (userId) => {
    const query = `
      SELECT subscription_plan, subscription_end_date 
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    const user = result.rows[0];
    
    if (!user) return false;
    if (user.subscription_plan === 'free') return true;
    return user.subscription_end_date && new Date() < user.subscription_end_date;
  },

  // Get discoverable profiles
  getDiscoverable: async (currentUserId, preferences) => {
    let query = `
      SELECT id, name, age, bio, photos, interests, location, created_at
      FROM users
      WHERE id != $1 
        AND is_active = true
    `;
    
    const values = [currentUserId];
    let paramCount = 2;

    // Filter by gender preference
    if (preferences.gender && preferences.gender.length > 0) {
      query += ` AND gender = ANY($${paramCount++})`;
      values.push(preferences.gender);
    }

    // Filter by age range
    if (preferences.ageMin || preferences.ageMax) {
      query += ` AND age BETWEEN $${paramCount++} AND $${paramCount++}`;
      values.push(preferences.ageMin || 18);
      values.push(preferences.ageMax || 100);
    }

    // Exclude users already matched or passed
    query = `
      SELECT u.* FROM users u
      WHERE u.id != $1 
        AND u.is_active = true
        AND u.id NOT IN (
          SELECT CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END as other_user_id
          FROM matches
          WHERE user1_id = $1 OR user2_id = $1
        )
    `;

    const result = await pool.query(query, [currentUserId]);
    return result.rows;
  }
};

module.exports = User;
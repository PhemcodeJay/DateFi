const { pool } = require('../config/database');

const Payment = {
  // Create a payment
  create: async (paymentData) => {
    const { user_id, plan, amount, currency = 'USD', payment_id, order_id } = paymentData;
    
    const query = `
      INSERT INTO payments (user_id, plan, amount, currency, payment_id, order_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [user_id, plan, amount, currency, payment_id, order_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find by payment ID
  findByPaymentId: async (paymentId) => {
    const query = 'SELECT * FROM payments WHERE payment_id = $1';
    const result = await pool.query(query, [paymentId]);
    return result.rows[0];
  },

  // Update payment status
  updateStatus: async (paymentId, status, transactionId = null) => {
    const query = `
      UPDATE payments 
      SET status = $1, transaction_id = COALESCE($2, transaction_id)
      WHERE payment_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, transactionId, paymentId]);
    return result.rows[0];
  },

  // Update webhook data
  updateWebhookData: async (paymentId, webhookData) => {
    const query = `
      UPDATE payments 
      SET webhook_data = $1
      WHERE payment_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [JSON.stringify(webhookData), paymentId]);
    return result.rows[0];
  },

  // Get payment history for user
  getHistory: async (userId, limit = 50) => {
    const query = `
      SELECT * FROM payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }
};

module.exports = Payment;
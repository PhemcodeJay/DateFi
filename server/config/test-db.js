const { pool } = require('./database');

async function test() {
  try {
    console.log('Testing database operations...');
    
    // Test simple insert
    const result = await pool.query(
      'INSERT INTO users (email, password, name, age, gender, subscription_plan, is_verified, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      ['test@datefi.com', 'hash', 'Test User', 25, 'male', 'free', true, true]
    );
    console.log('Insert OK:', result.rows[0]);
    
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', ['test@datefi.com']);
    console.log('Cleanup OK');
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

test();

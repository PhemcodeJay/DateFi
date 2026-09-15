const { pool } = require('./database');

async function test() {
  try {
    // Check if demo user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['demo@datefi.com']);
    console.log('Demo user:', result.rows[0]);
    
    // Check all users
    const allUsers = await pool.query('SELECT id, email, name FROM users');
    console.log('\nAll users:');
    allUsers.rows.forEach(u => console.log(`  ${u.id}: ${u.email} (${u.name})`));
    
    // Check matches
    const matches = await pool.query('SELECT * FROM matches');
    console.log('\nMatches:', matches.rows);
    
    // Check messages
    const messages = await pool.query('SELECT * FROM messages');
    console.log('\nMessages:', messages.rows.length, 'messages');
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

test();

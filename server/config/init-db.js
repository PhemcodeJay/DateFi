const { pool } = require('./database');
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database tables created successfully!');
    console.log('📋 Tables created:');
    console.log('   - users');
    console.log('   - matches');
    console.log('   - messages');
    console.log('   - payments');
    console.log('\n🎉 Database is ready!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  }
};

initDatabase();
const { pool } = require('./database');

const migrateMessagesTable = async () => {
  try {
    console.log('Migrating messages table...');

    // Add message_type column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
          ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
        END IF;
      END $$;
    `);

    // Add media_url column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_url') THEN
          ALTER TABLE messages ADD COLUMN media_url TEXT;
        END IF;
      END $$;
    `);

    // Update existing messages to have type 'text'
    await pool.query(`
      UPDATE messages SET message_type = 'text' WHERE message_type IS NULL;
    `);

    console.log('Messages table migration complete!');
    console.log('- Added message_type column (text, image, video)');
    console.log('- Added media_url column for media file paths');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateMessagesTable();

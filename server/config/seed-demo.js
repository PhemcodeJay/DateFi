const bcrypt = require('bcryptjs');
const { pool } = require('./database');

const DEMO_EMAIL = 'demo@datefi.com';
const DEMO_PASSWORD = 'Demo123!';

const demoProfiles = [
  { name: 'Emma Wilson', age: 24, gender: 'female', bio: 'Adventure seeker & coffee lover', interests: ['hiking', 'coffee', 'travel', 'photography'] },
  { name: 'Sophie Chen', age: 26, gender: 'female', bio: 'Artist by day, chef by night', interests: ['art', 'cooking', 'museums', 'music'] },
  { name: 'Jessica Taylor', age: 23, gender: 'female', bio: 'Fitness enthusiast and dog mom', interests: ['fitness', 'dogs', 'brunch', 'running'] },
  { name: 'Olivia Martinez', age: 25, gender: 'female', bio: 'Bookworm and aspiring writer', interests: ['reading', 'writing', 'coffee', 'films'] },
  { name: 'Ava Johnson', age: 27, gender: 'female', bio: 'Music lover and festival goer', interests: ['music', 'festivals', 'dancing', 'travel'] },
  { name: 'Isabella Brown', age: 24, gender: 'female', bio: 'Beach lover and surfer girl', interests: ['surfing', 'beach', 'sunsets', 'swimming'] },
  { name: 'Mia Davis', age: 28, gender: 'female', bio: 'Tech nerd and gamer girl', interests: ['gaming', 'tech', 'anime', 'boardgames'] },
  { name: 'Charlotte Lee', age: 25, gender: 'female', bio: 'Plant mom and home chef', interests: ['plants', 'cocktails', 'cooking', 'design'] },
  { name: 'Liam Smith', age: 26, gender: 'male', bio: 'Software engineer and weekend hiker', interests: ['hiking', 'tech', 'coffee', 'gaming'] },
  { name: 'Noah Garcia', age: 28, gender: 'male', bio: 'Personal trainer and smoothie addict', interests: ['fitness', 'cooking', 'nutrition', 'movies'] },
];

const seedDemoData = async () => {
  try {
    console.log('Seeding demo data...');

    // Check if demo user exists
    const existingDemo = await pool.query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
    
    let demoUserId;
    
    if (existingDemo.rows.length > 0) {
      demoUserId = existingDemo.rows[0].id;
      await pool.query(`UPDATE users SET name = 'Alex Demo', age = 26, gender = 'male', bio = 'Welcome to DateFi! This is a demo account.', photos = $1, is_verified = true, subscription_plan = 'premium' WHERE id = $2`, [['/uploads/demo-avatar.svg'], demoUserId]);
    } else {
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
      const result = await pool.query(`INSERT INTO users (email, password, name, age, gender, bio, photos, subscription_plan, is_verified, is_active) VALUES ($1, $2, 'Alex Demo', 26, 'male', 'Welcome to DateFi! This is a demo account.', $3, 'premium', true, true) RETURNING id`, [DEMO_EMAIL, hashedPassword, ['/uploads/demo-avatar.svg']]);
      demoUserId = result.rows[0].id;
      console.log('Demo user created');
    }

    // Create demo profiles
    for (const profile of demoProfiles) {
      const email = `demo-${profile.name.toLowerCase().replace(/\s/g, '-')}@datefi.com`;
      const existingProfile = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existingProfile.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('Demo123!', 10);
        await pool.query(`INSERT INTO users (email, password, name, age, gender, bio, interests, photos, subscription_plan, is_verified, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'free', true, true)`, [email, hashedPassword, profile.name, profile.age, profile.gender, profile.bio, profile.interests, [`/uploads/demo-${profile.name.toLowerCase().replace(/\s/g, '-')}.jpg`]]);
      }
    }

    // Create a demo match
    const emmaResult = await pool.query("SELECT id FROM users WHERE email = 'demo-emma-wilson@datefi.com'");
    if (emmaResult.rows.length > 0) {
      const emmaId = emmaResult.rows[0].id;
      const existingMatch = await pool.query(`SELECT id FROM matches WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`, [demoUserId, emmaId]);

      if (existingMatch.rows.length === 0) {
        const matchResult = await pool.query(`INSERT INTO matches (user1_id, user2_id, status, matched_at) VALUES ($1, $2, 'matched', NOW()) RETURNING id`, [demoUserId, emmaId]);
        const matchId = matchResult.rows[0].id;
        
        const messages = [
          { sender: emmaId, content: 'Hey! I see we matched! How are you doing today?' },
          { sender: demoUserId, content: 'Hi Emma! I am doing great, thanks! Love your hiking photos!' },
          { sender: emmaId, content: 'Thank you! I just got back from Yosemite. The views were incredible!' },
          { sender: demoUserId, content: 'That sounds amazing! Any tips for a first-timer?' },
          { sender: emmaId, content: 'Definitely! Go early morning to avoid crowds. We should plan a trip together sometime!' },
        ];

        for (let i = 0; i < messages.length; i++) {
          await pool.query(`INSERT INTO messages (match_id, sender_id, content, message_type, created_at) VALUES ($1, $2, $3, 'text', NOW() - INTERVAL '${i * 5} minutes')`, [matchId, messages[i].sender, messages[i].content]);
        }
        console.log('Demo match and messages created');
      }
    }

    console.log('Demo data seeded successfully!');
    console.log('Demo Account: demo@datefi.com / Demo123!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo data:', error);
    process.exit(1);
  }
};

seedDemoData();
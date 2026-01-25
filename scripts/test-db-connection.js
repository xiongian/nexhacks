// Simple script to test database connection and verify tables exist
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database\n');

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Database Tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    // Check SMS state
    const smsStateResult = await client.query('SELECT * FROM sms_state WHERE id = $1', ['singleton']);
    if (smsStateResult.rows.length > 0) {
      console.log('\n📱 SMS State:');
      console.log(`   Consecutive Danger Count: ${smsStateResult.rows[0].consecutive_danger_count}`);
      console.log(`   Last Danger Level: ${smsStateResult.rows[0].last_danger_level || 'null'}`);
      console.log(`   Last Alert Sent: ${smsStateResult.rows[0].last_alert_sent_time || 'never'}`);
    }

    // Check alert records count
    const alertCountResult = await client.query('SELECT COUNT(*) as count FROM alert_records');
    console.log(`\n📨 Alert Records: ${alertCountResult.rows[0].count}`);

    // Check camera frames count
    const framesCountResult = await client.query('SELECT COUNT(*) as count FROM camera_frames');
    console.log(`📷 Camera Frames: ${framesCountResult.rows[0].count}`);

    // Check applied migrations
    const migrationsResult = await client.query('SELECT version, applied_at FROM schema_migrations ORDER BY applied_at');
    console.log(`\n🔄 Applied Migrations: ${migrationsResult.rows.length}`);
    migrationsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.version} (${new Date(row.applied_at).toLocaleString()})`);
    });

    console.log('\n✅ Database connection test successful!');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();

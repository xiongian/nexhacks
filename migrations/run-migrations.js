// Migration runner for Neon PostgreSQL database
// Reads SQL files from migrations/ directory and executes them in order

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.error('Please add your Neon connection string to .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Migration tracking table ready');

    // Get all migration files, sorted
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file.match(/^\d+_/))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`📋 Found ${files.length} migration file(s)`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const version = file.replace('.sql', '');
      
      // Check if already applied
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        skippedCount++;
        continue;
      }

      // Read and execute migration
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      
      if (!sql.trim()) {
        console.log(`⚠️  Skipping ${file} (empty file)`);
        continue;
      }

      console.log(`🔄 Running ${file}...`);
      
      await client.query('BEGIN');
      try {
        // Execute migration SQL
        await client.query(sql);
        
        // Record migration as applied
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Applied ${file}`);
        appliedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error in ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Applied: ${appliedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log('✅ All migrations completed');
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations };

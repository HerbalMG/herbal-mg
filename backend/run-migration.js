/**
 * Run database migration to add mobile column to users table
 * Usage: node run-migration.js
 */

require('dotenv').config();
const sql = require('./config/supabase');

async function runMigration() {
  console.log('🔄 Running database migration...\n');

  try {
    // Add mobile column
    console.log('1. Adding mobile column...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(15) UNIQUE
    `;
    console.log('✅ Mobile column added');

    // Add index on mobile
    console.log('2. Creating index on mobile...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile)
    `;
    console.log('✅ Index created');

    // Ensure role column exists
    console.log('3. Ensuring role column exists...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer'
    `;
    console.log('✅ Role column ensured');

    // Add created_at
    console.log('4. Adding created_at column...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
    `;
    console.log('✅ Created_at column added');

    // Add updated_at
    console.log('5. Adding updated_at column...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `;
    console.log('✅ Updated_at column added');

    console.log('\n✨ Migration completed successfully!');
    console.log('\nYou can now start the server with: npm start');

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('\nDetails:', error);
  } finally {
    await sql.end();
    process.exit();
  }
}

runMigration();

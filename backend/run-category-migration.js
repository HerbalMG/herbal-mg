const sql = require('./config/supabase');
const fs = require('fs');

async function runMigration() {
  try {
    const migration = fs.readFileSync('./migrations/add_image_url_to_main_category.sql', 'utf8');
    await sql.unsafe(migration);
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

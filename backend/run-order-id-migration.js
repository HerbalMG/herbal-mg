const sql = require('./config/supabase');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('Starting order ID migration...');
    
    const migration = fs.readFileSync('./migrations/change_order_id_to_varchar.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('COMMENT ON')) {
        // Skip comments for now
        continue;
      }
      console.log('Executing:', statement.substring(0, 50) + '...');
      await sql.unsafe(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Order IDs will now use format: ORD-TIMESTAMP-RANDOM');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();

#!/usr/bin/env node

/**
 * Simple migration runner script
 * Usage: node scripts/run-migration.js <migration-file.sql>
 * Example: node scripts/run-migration.js migrations/seed_main_categories.sql
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('../config/supabase');

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Please provide a migration file path');
  console.log('Usage: node scripts/run-migration.js <migration-file.sql>');
  console.log('Example: node scripts/run-migration.js migrations/seed_main_categories.sql');
  process.exit(1);
}

const migrationPath = path.resolve(__dirname, '..', migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Error: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

async function runMigration() {
  try {
    console.log(`📄 Reading migration file: ${migrationFile}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running migration...');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

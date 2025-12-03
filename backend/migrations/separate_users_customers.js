/**
 * Migration Script: Separate Users (Admin) from Customers
 * 
 * This script migrates the authentication system to separate:
 * - users table: Only for admin and limited_admin
 * - customer table: For all regular users (authenticated via OTP)
 * 
 * Run this script once to migrate your database
 */

const sql = require('../config/supabase');

async function migrate() {
  console.log('🚀 Starting migration: Separate Users and Customers\n');

  try {
    // Step 1: Create customer_session table if it doesn't exist
    console.log('📝 Step 1: Creating customer_session table...');
    await sql`
      CREATE TABLE IF NOT EXISTS customer_session (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customer(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_session_token ON customer_session(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_session_customer ON customer_session(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_session_expires ON customer_session(expires_at)`;
    console.log('✅ customer_session table created\n');

    // Step 2: Update customer table structure
    console.log('📝 Step 2: Updating customer table structure...');
    
    // Add columns if they don't exist
    try {
      await sql`ALTER TABLE customer ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;
      await sql`ALTER TABLE customer ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE customer ALTER COLUMN mobile SET NOT NULL`;
      console.log('✅ Customer table updated\n');
    } catch (err) {
      console.log('⚠️  Some columns may already exist:', err.message, '\n');
    }

    // Step 3: Create indexes on customer table
    console.log('📝 Step 3: Creating indexes on customer table...');
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_mobile ON customer(mobile)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_active ON customer(is_active)`;
    console.log('✅ Indexes created\n');

    // Step 4: Check if users table has mobile column
    console.log('📝 Step 4: Checking users table structure...');
    const [tableInfo] = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'mobile'
    `;

    if (tableInfo) {
      console.log('📝 Step 5: Migrating non-admin users to customer table...');
      
      // Migrate non-admin users with mobile numbers to customer table
      const migratedUsers = await sql`
        INSERT INTO customer (name, email, mobile, created_at, updated_at, is_active)
        SELECT 
          COALESCE(name, 'User'),
          email,
          mobile,
          created_at,
          updated_at,
          is_active
        FROM users
        WHERE role NOT IN ('admin', 'limited_admin') 
        AND mobile IS NOT NULL
        ON CONFLICT (mobile) DO NOTHING
        RETURNING id, mobile
      `;
      
      console.log(`✅ Migrated ${migratedUsers.length} users to customer table\n`);

      // Step 6: Delete non-admin users from users table
      console.log('📝 Step 6: Removing non-admin users from users table...');
      const deleted = await sql`
        DELETE FROM users 
        WHERE role NOT IN ('admin', 'limited_admin')
        RETURNING id
      `;
      console.log(`✅ Removed ${deleted.length} non-admin users from users table\n`);

      // Step 7: Remove mobile column from users table
      console.log('📝 Step 7: Removing mobile column from users table...');
      await sql`ALTER TABLE users DROP COLUMN IF EXISTS mobile`;
      console.log('✅ Mobile column removed from users table\n');
    } else {
      console.log('✅ Users table already migrated (no mobile column)\n');
    }

    // Step 8: Add constraint to users table
    console.log('📝 Step 8: Adding role constraint to users table...');
    try {
      await sql`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS check_admin_role
      `;
      await sql`
        ALTER TABLE users 
        ADD CONSTRAINT check_admin_role 
        CHECK (role IN ('admin', 'limited_admin'))
      `;
      console.log('✅ Role constraint added\n');
    } catch (err) {
      console.log('⚠️  Constraint may already exist:', err.message, '\n');
    }

    // Step 9: Update default role for users table
    console.log('📝 Step 9: Setting default role for users table...');
    await sql`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin'`;
    console.log('✅ Default role set to admin\n');

    // Step 10: Add comments for documentation
    console.log('📝 Step 10: Adding table comments...');
    await sql`COMMENT ON TABLE users IS 'Admin users only (admin, limited_admin)'`;
    await sql`COMMENT ON TABLE customer IS 'Regular customers authenticated via OTP'`;
    await sql`COMMENT ON TABLE customer_session IS 'Customer authentication sessions (OTP-based)'`;
    await sql`COMMENT ON TABLE admin_login IS 'Admin authentication sessions (password-based)'`;
    console.log('✅ Comments added\n');

    // Step 11: Clean up expired sessions
    console.log('📝 Step 11: Cleaning up expired sessions...');
    const expiredCustomer = await sql`DELETE FROM customer_session WHERE expires_at < NOW() RETURNING id`;
    const expiredAdmin = await sql`DELETE FROM admin_login WHERE expires_at < NOW() RETURNING id`;
    console.log(`✅ Cleaned up ${expiredCustomer.length} expired customer sessions`);
    console.log(`✅ Cleaned up ${expiredAdmin.length} expired admin sessions\n`);

    // Summary
    console.log('🎉 Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - users table: Now only contains admin and limited_admin users');
    console.log('  - customer table: Contains all regular customers');
    console.log('  - customer_session table: Handles customer authentication');
    console.log('  - admin_login table: Handles admin authentication\n');
    
    console.log('✅ Next steps:');
    console.log('  1. Update your frontend to use the new authentication endpoints');
    console.log('  2. Test OTP authentication flow');
    console.log('  3. Verify admin login still works');
    console.log('  4. Update any custom queries that reference users table\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrate;

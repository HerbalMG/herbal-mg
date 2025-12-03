-- ============================================================================
-- AUTHENTICATION MIGRATION: Separate Users (Admin) from Customers
-- ============================================================================
-- Run this SQL script in your Supabase SQL Editor
-- This will migrate your authentication system to separate admins from customers
-- ============================================================================

-- Step 1: Create customer_session table for customer authentication
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_session (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customer(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_session_token ON customer_session(session_token);
CREATE INDEX IF NOT EXISTS idx_customer_session_customer ON customer_session(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_session_expires ON customer_session(expires_at);

COMMENT ON TABLE customer_session IS 'Customer authentication sessions (OTP-based)';

-- Step 2: Update customer table structure
-- ============================================================================
ALTER TABLE customer ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE customer ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Make mobile required (if not already)
DO $$ 
BEGIN
    ALTER TABLE customer ALTER COLUMN mobile SET NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Step 3: Create indexes on customer table
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customer_mobile ON customer(mobile);
CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_active ON customer(is_active);

-- Step 4: Migrate non-admin users to customer table (if mobile column exists in users)
-- ============================================================================
DO $$ 
BEGIN
    -- Check if mobile column exists in users table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'mobile'
    ) THEN
        -- Migrate non-admin users with mobile numbers to customer table
        INSERT INTO customer (name, email, mobile, created_at, updated_at, is_active)
        SELECT 
            COALESCE(name, 'User'),
            email,
            mobile,
            created_at,
            updated_at,
            COALESCE(is_active, TRUE)
        FROM users
        WHERE role NOT IN ('admin', 'limited_admin') 
        AND mobile IS NOT NULL
        ON CONFLICT (mobile) DO NOTHING;
        
        RAISE NOTICE 'Migrated non-admin users to customer table';
    ELSE
        RAISE NOTICE 'Mobile column does not exist in users table - skipping migration';
    END IF;
END $$;

-- Step 5: Delete non-admin users from users table
-- ============================================================================
DELETE FROM users WHERE role NOT IN ('admin', 'limited_admin');

-- Step 6: Remove mobile column from users table (if it exists)
-- ============================================================================
ALTER TABLE users DROP COLUMN IF EXISTS mobile;

-- Step 7: Add constraint to users table to ensure only admin roles
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS check_admin_role;
    ALTER TABLE users ADD CONSTRAINT check_admin_role 
    CHECK (role IN ('admin', 'limited_admin'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 8: Set default role for users table
-- ============================================================================
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';

-- Step 9: Add table comments for documentation
-- ============================================================================
COMMENT ON TABLE users IS 'Admin users only (admin, limited_admin)';
COMMENT ON TABLE customer IS 'Regular customers authenticated via OTP';
COMMENT ON TABLE admin_login IS 'Admin authentication sessions (password-based)';

-- Step 10: Clean up expired sessions
-- ============================================================================
DELETE FROM customer_session WHERE expires_at < NOW();
DELETE FROM admin_login WHERE expires_at < NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful:

-- Check users table structure (should not have mobile column)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- Check customer table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'customer' 
-- ORDER BY ordinal_position;

-- Check customer_session table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'customer_session' 
-- ORDER BY ordinal_position;

-- Count users by role (should only show admin and limited_admin)
-- SELECT role, COUNT(*) 
-- FROM users 
-- GROUP BY role;

-- Count customers
-- SELECT COUNT(*) as total_customers FROM customer;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Verify the migration using the queries above
-- 2. Test admin login: POST /api/login
-- 3. Test customer OTP login: POST /api/auth/send-otp and /api/auth/verify-otp
-- 4. Update any custom queries that reference the users table
-- ============================================================================

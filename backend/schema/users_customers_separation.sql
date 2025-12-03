-- Migration: Separate Users (Admin) from Customers
-- This migration restructures the authentication system:
-- - users table: Only for admin and limited_admin
-- - customer table: For all regular users (authenticated via OTP)

-- Step 1: Update users table to remove mobile column and enforce admin roles
-- First, backup any non-admin users to customer table
INSERT INTO customer (name, email, mobile, created_at, updated_at)
SELECT 
    COALESCE(name, 'User'),
    email,
    mobile,
    created_at,
    updated_at
FROM users
WHERE role NOT IN ('admin', 'limited_admin') AND mobile IS NOT NULL
ON CONFLICT (mobile) DO NOTHING;

-- Step 2: Delete non-admin users from users table
DELETE FROM users WHERE role NOT IN ('admin', 'limited_admin');

-- Step 3: Remove mobile column from users table (admins don't need it)
ALTER TABLE users DROP COLUMN IF EXISTS mobile;

-- Step 4: Add constraint to ensure only admin roles in users table
ALTER TABLE users ADD CONSTRAINT check_admin_role 
CHECK (role IN ('admin', 'limited_admin'));

-- Step 5: Update customer table to ensure it has all necessary fields
ALTER TABLE customer 
    ALTER COLUMN mobile SET NOT NULL,
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_mobile ON customer(mobile);
CREATE INDEX IF NOT EXISTS idx_customer_email ON customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_active ON customer(is_active);

-- Step 7: Create customer_session table for OTP-based authentication
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

-- Step 8: Clean up expired sessions (optional, can be run periodically)
-- DELETE FROM customer_session WHERE expires_at < NOW();
-- DELETE FROM admin_login WHERE expires_at < NOW();

-- Step 9: Add comments for documentation
COMMENT ON TABLE users IS 'Admin users only (admin, limited_admin)';
COMMENT ON TABLE customer IS 'Regular customers authenticated via OTP';
COMMENT ON TABLE customer_session IS 'Customer authentication sessions (OTP-based)';
COMMENT ON TABLE admin_login IS 'Admin authentication sessions (password-based)';

-- Step 10: Update users table to make role default to 'admin'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';

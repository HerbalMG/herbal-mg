-- Add mobile column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(15) UNIQUE;

-- Add index on mobile for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

-- Ensure role column exists with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- Add created_at if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Add updated_at if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

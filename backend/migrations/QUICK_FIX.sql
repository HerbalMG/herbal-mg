-- Quick Fix: Add mobile column to users table
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- 1. Add mobile column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(15) UNIQUE;

-- 2. Add index on mobile
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

-- 3. Ensure role column exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- 4. Add created_at
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 5. Add updated_at
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 6. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- You should see 'mobile' in the results above
-- If you see it, the migration was successful! ✅

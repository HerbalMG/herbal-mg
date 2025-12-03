-- Migration: Add contact fields to address table
-- This adds full_name, email, and contact fields to the address table

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add full_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'address' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE address ADD COLUMN full_name VARCHAR(255);
    END IF;

    -- Add email column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'address' AND column_name = 'email'
    ) THEN
        ALTER TABLE address ADD COLUMN email VARCHAR(255);
    END IF;

    -- Add contact column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'address' AND column_name = 'contact'
    ) THEN
        ALTER TABLE address ADD COLUMN contact VARCHAR(20);
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'address' 
ORDER BY ordinal_position;

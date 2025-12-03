-- Add missing columns to payment table if they don't exist

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'status'
    ) THEN
        ALTER TABLE payment ADD COLUMN status VARCHAR(50) DEFAULT 'Paid';
    END IF;
END $$;

-- Add transaction_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE payment ADD COLUMN transaction_id VARCHAR(255);
    END IF;
END $$;

-- Ensure method column exists (rename payment_method if needed)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'payment_method'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'method'
    ) THEN
        ALTER TABLE payment RENAME COLUMN payment_method TO method;
    END IF;
END $$;

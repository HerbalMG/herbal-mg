-- Add PhonePe specific fields to payment table
ALTER TABLE payment 
ADD COLUMN IF NOT EXISTS merchant_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS response_code VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_merchant_transaction_id ON payment(merchant_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
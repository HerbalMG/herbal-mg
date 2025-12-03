-- Migration to change order.id from UUID to VARCHAR for custom order IDs
-- This allows us to use custom format like ORD-TIMESTAMP-RANDOM

-- Step 1: Drop foreign key constraints that reference order.id
ALTER TABLE order_item DROP CONSTRAINT IF EXISTS order_item_order_id_fkey;
ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_order_id_fkey;

-- Step 2: Change the id column type
ALTER TABLE "order" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE "order" ALTER COLUMN id TYPE VARCHAR(50);

-- Step 3: Change foreign key columns in related tables
ALTER TABLE order_item ALTER COLUMN order_id TYPE VARCHAR(50);
ALTER TABLE payment ALTER COLUMN order_id TYPE VARCHAR(50);

-- Step 4: Re-add foreign key constraints
ALTER TABLE order_item 
  ADD CONSTRAINT order_item_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE;

ALTER TABLE payment 
  ADD CONSTRAINT payment_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE;

-- Add comment
COMMENT ON COLUMN "order".id IS 'Custom order ID in format ORD-TIMESTAMP-RANDOM';

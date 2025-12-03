-- Test Replacement Image Feature

-- 1. Check if replacement_image column exists
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'order' AND column_name = 'replacement_image';

-- 2. If column doesn't exist, add it
-- ALTER TABLE "order" ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);

-- 3. Check current orders with replacement status
SELECT id, status, replacement_image, notes
FROM "order"
WHERE status = 'Replacement'
LIMIT 5;

-- 4. Add test replacement image to an existing order (REPLACE 'your-order-id' with actual order ID)
-- UPDATE "order" 
-- SET 
--   replacement_image = 'https://via.placeholder.com/400x300.png?text=Replacement+Test+Image',
--   status = 'Replacement',
--   notes = 'Test replacement request. Issues: Damaged product. Reason: Testing replacement feature.'
-- WHERE id = 'your-order-id'
-- RETURNING id, status, replacement_image;

-- 5. View all orders to find an order ID to test with
SELECT id, customer_id, status, order_date, replacement_image
FROM "order"
ORDER BY order_date DESC
LIMIT 10;

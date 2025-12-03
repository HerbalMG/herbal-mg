-- Add replacement_image column to order table
ALTER TABLE "order" 
ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);

-- Add comment
COMMENT ON COLUMN "order".replacement_image IS 'URL of the replacement request image uploaded by customer';

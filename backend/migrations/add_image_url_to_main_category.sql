-- Add image_url column to main_category table
ALTER TABLE main_category 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to the column
COMMENT ON COLUMN main_category.image_url IS 'URL of the category image';

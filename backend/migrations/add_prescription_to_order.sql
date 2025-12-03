-- Add prescription field to order table

ALTER TABLE "order" 
ADD COLUMN IF NOT EXISTS prescription_url TEXT;

COMMENT ON COLUMN "order".prescription_url IS 'URL or path to uploaded prescription image/PDF';

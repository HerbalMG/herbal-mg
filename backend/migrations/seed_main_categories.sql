-- Seed main categories with images
-- This script populates the main_category table with initial health concern categories

-- Insert categories if they don't exist
INSERT INTO main_category (name, slug, image_url) 
VALUES 
  ('Diabetes', 'diabetes', '/assets/diabetes.svg'),
  ('Skin Care', 'skin-care', '/assets/skin.svg'),
  ('Hair Care', 'hair-care', '/assets/hair.svg'),
  ('Joint, Bone & Muscle Care', 'joint-bone-muscle-care', '/assets/joint.svg'),
  ('Kidney Care', 'kidney-care', '/assets/Kidney.svg'),
  ('Liver Care', 'liver-care', '/assets/liver.svg'),
  ('Heart Care', 'heart-care', '/assets/heart.svg'),
  ('Men Wellness', 'men-wellness', '/assets/men.svg'),
  ('Women Wellness', 'women-wellness', '/assets/women.svg'),
  ('Digestive Care', 'digestive-care', '/assets/digestive.svg')
ON CONFLICT (slug) DO UPDATE 
SET 
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();

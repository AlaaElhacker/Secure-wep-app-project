-- ============================================
-- Run this ONLY if you already created the database
-- before this update (i.e. products.image currently
-- holds values like 'headphones.jpg', 'default.jpg', etc.)
--
-- If you are setting up the database for the first time,
-- just run schema.sql — it already has the real photo
-- URLs built in and you do NOT need this file.
-- ============================================

USE secure_store_js;

-- Widen the column so full image URLs fit
ALTER TABLE products MODIFY image VARCHAR(500)
    DEFAULT 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';

-- Update the 4 sample products with real photo URLs
UPDATE products SET image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' WHERE name = 'Wireless Headphones';
UPDATE products SET image = 'https://images.unsplash.com/photo-1756388371735-cc845c578200?auto=format&fit=crop&w=600&q=80' WHERE name = 'Mechanical Keyboard';
UPDATE products SET image = 'https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=600&q=80' WHERE name = 'Smart Watch';
UPDATE products SET image = 'https://images.unsplash.com/photo-1579632179504-9a6b0653e56b?auto=format&fit=crop&w=600&q=80' WHERE name = 'Portable Speaker';

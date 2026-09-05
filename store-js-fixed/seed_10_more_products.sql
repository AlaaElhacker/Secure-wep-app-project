-- ============================================
-- Run this if your database already exists and you just want to add
-- the 10 new sample products without recreating everything.
-- (If you're setting up the database for the first time, just run
-- schema.sql — it already includes these products.)
-- ============================================

USE secure_store_js;

INSERT INTO products (name, description, price, image) VALUES
('Wireless Gaming Mouse', 'Ergonomic wireless mouse with adjustable DPI and RGB lighting.', 29.99, 'https://picsum.photos/seed/gaming-mouse/600/400'),
('USB-C Hub 7-in-1', 'Expand a single USB-C port into HDMI, USB-A, SD card, and more.', 24.99, 'https://picsum.photos/seed/usb-c-hub/600/400'),
('Adjustable Laptop Stand', 'Aluminum stand that raises your laptop to eye level for better posture.', 19.99, 'https://picsum.photos/seed/laptop-stand/600/400'),
('1080p Webcam', 'Full HD webcam with built-in microphone, ideal for video calls.', 39.99, 'https://picsum.photos/seed/webcam-1080p/600/400'),
('Noise-Cancelling Earbuds', 'True wireless earbuds with active noise cancellation and charging case.', 59.99, 'https://picsum.photos/seed/earbuds-anc/600/400'),
('External SSD 1TB', 'Compact, high-speed external solid-state drive for fast backups.', 89.99, 'https://picsum.photos/seed/external-ssd/600/400'),
('Wireless Charging Pad', 'Fast Qi wireless charger compatible with most modern smartphones.', 17.99, 'https://picsum.photos/seed/wireless-charger/600/400'),
('LED Desk Lamp with USB Port', 'Dimmable desk lamp with a built-in USB charging port.', 22.99, 'https://picsum.photos/seed/desk-lamp/600/400'),
('Compact Mechanical Numpad', 'Standalone mechanical numeric keypad with hot-swappable switches.', 14.99, 'https://picsum.photos/seed/mech-numpad/600/400'),
('Monitor Arm Mount', 'Single-arm desk mount for monitors up to 32 inches, fully adjustable.', 44.99, 'https://picsum.photos/seed/monitor-arm/600/400');
INSERT INTO users (username, email, password, role) VALUES
('test1', 'test1@store.com', 'hh', 'customer');

INSERT INTO users (username, email, password, role) VALUES
('test2', 'test2@store.com', 'gg', 'customer');

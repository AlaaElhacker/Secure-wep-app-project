-- ============================================
-- Store Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS secure_store_js;
USE secure_store_js;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(255) DEFAULT '',
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped') DEFAULT 'pending',
    shipping_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@store.com', '$2b$12$mBqQf6vF4J.eU32pX3G1b.7X0eBw6c2m0y1B5j4l3n2m1k0o', 'admin');

INSERT INTO products (name, description, price, image) VALUES
('Wireless Headphones', 'Comfortable over-ear wireless headphones with noise cancellation.', 49.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches.', 79.99, 'https://images.unsplash.com/photo-1756388371735-cc845c578200?auto=format&fit=crop&w=600&q=80'),
('Smart Watch', 'Fitness tracking smart watch with heart-rate monitor.', 99.99, 'https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=600&q=80'),
('Portable Speaker', 'Bluetooth speaker with 12-hour battery life.', 34.99, 'https://images.unsplash.com/photo-1579632179504-9a6b0653e56b?auto=format&fit=crop&w=600&q=80'),
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

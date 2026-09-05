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
('admin', 'admin@store.com', '$2y$10$examplehashreplacewithrealone', 'admin');

INSERT INTO products (name, description, price, image) VALUES
('Wireless Headphones', 'Comfortable over-ear wireless headphones with noise cancellation.', 49.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches.', 79.99, 'https://images.unsplash.com/photo-1756388371735-cc845c578200?auto=format&fit=crop&w=600&q=80'),
('Smart Watch', 'Fitness tracking smart watch with heart-rate monitor.', 99.99, 'https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=600&q=80'),
('Portable Speaker', 'Bluetooth speaker with 12-hour battery life.', 34.99, 'https://images.unsplash.com/photo-1579632179504-9a6b0653e56b?auto=format&fit=crop&w=600&q=80');

// ============================================
// Database configuration
// Update these values to match your local MySQL setup
// ============================================

const mysql = require('mysql2/promise');
console.log("🔥 DB.JS LOADED");
// Prefer environment variables (see .env.example) so credentials are never
// committed to source control. Fallbacks match the original local-dev setup.
console.log({
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT
});
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'secure_store_js',
    port: Number(process.env.DB_PORT) || 3308,
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;

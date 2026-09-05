const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ============================================
// VULNERABLE VERSION (Person 5's task):
// The requireAdmin middleware is imported but never actually wired up
// to this router. There is no server-side check at all — the app relies
// only on hiding the "Admin" link in the navbar for non-admin users
// (see views/partials/header.ejs: <% if (isAdmin) { %>).
//
// Attack scenario: ANY user — even one who isn't logged in at all —
// can reach every admin capability just by navigating directly to:
//   /admin/dashboard
//   /admin/products
// and can add or delete products, since none of these routes are
// actually protected server-side (Broken Access Control).
// ============================================

router.get('/dashboard', async (req, res) => {
    const [[{ c: productCount }]] = await pool.query('SELECT COUNT(*) AS c FROM products');
    const [[{ c: orderCount }]] = await pool.query('SELECT COUNT(*) AS c FROM orders');
    const [[{ c: userCount }]] = await pool.query('SELECT COUNT(*) AS c FROM users');

    res.render('admin/dashboard', { productCount, orderCount, userCount });
});

router.get('/products', async (req, res) => {
    const [products] = await pool.query('SELECT id, name, price, image FROM products ORDER BY created_at DESC');
    res.render('admin/products', { products, error: null });
});

router.post('/products', async (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();
    const price = parseFloat(req.body.price) || 0;
    const image = (req.body.image || '').trim() ||
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';

    if (!name || price <= 0) {
        const [products] = await pool.query('SELECT id, name, price, image FROM products ORDER BY created_at DESC');
        return res.render('admin/products', { products, error: 'Name and a valid price are required.' });
    }

    await pool.query('INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)', [name, description, price, image]);
    res.redirect('/admin/products');
});

router.post('/products/:id/delete', async (req, res) => {
    const productId = parseInt(req.params.id, 10) || 0;
    if (productId > 0) {
        await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    }
    res.redirect('/admin/products');
});

module.exports = router;

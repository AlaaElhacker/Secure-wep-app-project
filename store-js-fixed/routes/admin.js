const express = require('express');
const pool = require('../config/db');
const { requireAdmin, requireCsrf } = require('../middleware/auth');

const router = express.Router();

// Only allow http(s) image URLs. Without this check an admin form (or a CSRF'd
// forged submission before this fix) could store a `javascript:`/`data:` URI or
// other unexpected scheme in the `image` field, which later gets echoed back
// into an `<img src>` attribute on every product/listing page.
function isSafeImageUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// ============================================
// SECURED VERSION (Person 5's task):
// requireAdmin checks BOTH that the user is logged in
// AND that their role is 'admin' before allowing access
// to any route in this file.
//
// In the VULNERABLE VERSION, this middleware is often
// replaced with just requireLogin, or removed entirely,
// or the check only hides the "Admin" link in the navbar
// without protecting the routes themselves — so any
// logged-in (or even anonymous) user who visits
// /admin/dashboard directly gets full access.
// ============================================
router.use(requireAdmin);

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

router.post('/products', requireCsrf, async (req, res) => {
    const name = (req.body.name || '').trim();
    const description = (req.body.description || '').trim();
    const price = parseFloat(req.body.price) || 0;
    const rawImage = (req.body.image || '').trim();
    const image = rawImage ||
        'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';

    if (!name || price <= 0) {
        const [products] = await pool.query('SELECT id, name, price, image FROM products ORDER BY created_at DESC');
        return res.render('admin/products', { products, error: 'Name and a valid price are required.' });
    }

    if (rawImage && !isSafeImageUrl(rawImage)) {
        const [products] = await pool.query('SELECT id, name, price, image FROM products ORDER BY created_at DESC');
        return res.render('admin/products', { products, error: 'Image URL must be a valid http:// or https:// link.' });
    }

    await pool.query('INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)', [name, description, price, image]);
    res.redirect('/admin/products');
});

router.post('/products/:id/delete', requireCsrf, async (req, res) => {
    const productId = parseInt(req.params.id, 10) || 0;
    if (productId > 0) {
        await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    }
    res.redirect('/admin/products');
});

module.exports = router;

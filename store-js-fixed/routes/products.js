const express = require('express');
const pool = require('../config/db');
const { isLoggedIn, requireLogin, requireCsrf } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    const search = (req.query.q || '').trim();
    let products;

    if (search) {
        [products] = await pool.query(
            'SELECT id, name, description, price, image FROM products WHERE name LIKE ?',
            [`%${search}%`]
        );
    } else {
        [products] = await pool.query(
            'SELECT id, name, description, price, image FROM products ORDER BY created_at DESC'
        );
    }

    res.render('products', { products, search });
});

router.get('/:id', async (req, res) => {
    const productId = parseInt(req.params.id, 10) || 0;

    const [productRows] = await pool.query(
        'SELECT id, name, description, price, image FROM products WHERE id = ?',
        [productId]
    );
    const product = productRows[0];

    if (!product) return res.redirect('/products');

    const [reviews] = await pool.query(
        `SELECT r.comment, r.rating, r.created_at, u.username
         FROM reviews r JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ? ORDER BY r.created_at DESC`,
        [productId]
    );

    res.render('product', { product, reviews, error: null });
});

router.post('/:id/reviews', requireLogin, requireCsrf, async (req, res) => {
    const productId = parseInt(req.params.id, 10) || 0;
    const comment = (req.body.comment || '').trim();
    const rating = parseInt(req.body.rating, 10) || 5;

    if (!comment) {
        const [productRows] = await pool.query('SELECT id, name, description, price, image FROM products WHERE id = ?', [productId]);
        const [reviews] = await pool.query(
            `SELECT r.comment, r.rating, r.created_at, u.username
             FROM reviews r JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ? ORDER BY r.created_at DESC`,
            [productId]
        );
        return res.render('product', { product: productRows[0], reviews, error: 'Comment cannot be empty.' });
    }

    await pool.query(
        'INSERT INTO reviews (product_id, user_id, comment, rating) VALUES (?, ?, ?, ?)',
        [productId, req.session.userId, comment, rating]
    );

    res.redirect(`/products/${productId}`);
});

module.exports = router;

// ============================================
// NOTE on XSS (Person 2's task):
// The review "comment" is rendered in views/product.ejs.
//
// SECURED VERSION: EJS's <%= %> tag HTML-escapes output
// automatically, so a comment like <script>alert(1)</script>
// is displayed as harmless text.
//
// VULNERABLE VERSION: change <%= review.comment %> to
// <%- review.comment %> in views/product.ejs (the "unescaped
// output" tag), which renders raw HTML/JS and allows Stored XSS.
// ============================================

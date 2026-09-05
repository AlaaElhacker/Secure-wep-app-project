const express = require('express');
const pool = require('../config/db');
const { requireCsrf } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    const cart = req.session.cart || {};
    const ids = Object.keys(cart).map(Number);

    let items = [];
    let total = 0;

    if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        const [products] = await pool.query(
            `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
            ids
        );

        items = products.map((p) => {
            const qty = cart[p.id];
            const subtotal = qty * p.price;
            total += subtotal;
            return { ...p, qty, subtotal };
        });
    }

    res.render('cart', { items, total });
});

router.post('/add', requireCsrf, (req, res) => {
    const productId = parseInt(req.body.product_id, 10) || 0;
    if (productId > 0) {
        req.session.cart = req.session.cart || {};
        req.session.cart[productId] = (req.session.cart[productId] || 0) + 1;
    }
    res.redirect('/cart');
});

router.post('/remove', requireCsrf, (req, res) => {
    const productId = parseInt(req.body.product_id, 10) || 0;
    if (req.session.cart) {
        delete req.session.cart[productId];
    }
    res.redirect('/cart');
});

module.exports = router;

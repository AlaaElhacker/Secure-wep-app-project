const express = require('express');
const pool = require('../config/db');
const { requireLogin, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, async (req, res) => {
    const [orders] = await pool.query(
        'SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [req.session.userId]
    );
    res.render('orders', { orders });
});

router.get('/checkout', requireLogin, async (req, res) => {
    const [userRows] = await pool.query('SELECT address FROM users WHERE id = ?', [req.session.userId]);
    res.render('checkout', { address: userRows[0].address });
});

router.post('/checkout', requireLogin, async (req, res) => {
    const cart = req.session.cart || {};
    const ids = Object.keys(cart).map(Number);

    if (ids.length === 0) return res.redirect('/cart');

    const [userRows] = await pool.query('SELECT address FROM users WHERE id = ?', [req.session.userId]);
    const address = userRows[0].address;

    const placeholders = ids.map(() => '?').join(',');
    const [products] = await pool.query(
        `SELECT id, price FROM products WHERE id IN (${placeholders})`,
        ids
    );

    let total = 0;
    const lineItems = products.map((p) => {
        const qty = cart[p.id];
        total += qty * p.price;
        return { productId: p.id, qty, price: p.price };
    });

    const [orderResult] = await pool.query(
        'INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)',
        [req.session.userId, total, address]
    );
    const orderId = orderResult.insertId;

    for (const item of lineItems) {
        await pool.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, item.productId, item.qty, item.price]
        );
    }

    delete req.session.cart;
    res.redirect(`/orders/${orderId}`);
});

router.get('/:id', requireLogin, async (req, res) => {
    const orderId = parseInt(req.params.id, 10) || 0;

    const [orderRows] = await pool.query(
        'SELECT id, user_id, total, status, shipping_address, created_at FROM orders WHERE id = ?',
        [orderId]
    );
    const order = orderRows[0];

    if (!order) return res.redirect('/orders');

    // ============================================
    // VULNERABLE VERSION (Person 4's task):
    // No ownership check here — any logged-in user can view ANY order by
    // simply changing the ID in the URL, regardless of who placed it.
    //
    // Attack scenario: a logged-in attacker visits
    //   /orders/1, /orders/2, /orders/3, ...
    // and incrementing through IDs reveals every other customer's order
    // details, including their full shipping address (Insecure Direct
    // Object Reference / IDOR).
    // ============================================

    const [items] = await pool.query(
        `SELECT oi.quantity, oi.price, p.name
         FROM order_items oi JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    res.render('order', { order, items });
});

module.exports = router;

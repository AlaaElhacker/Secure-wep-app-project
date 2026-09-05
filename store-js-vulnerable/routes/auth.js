const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const router = express.Router();

router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.render('register', { error: 'All fields are required.' });
    }

    // Secure: parameterized query
    const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
    );

    if (existing.length > 0) {
        return res.render('register', { error: 'Username or email already in use.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, "customer")',
        [username, email, hashed]
    );

    res.redirect('/login?registered=1');
});

router.get('/login', (req, res) => {
    res.render('login', { error: null, registered: req.query.registered });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // ============================================
    // VULNERABLE VERSION (Person 1's task):
    // Username is concatenated directly into the SQL string instead of
    // using a parameterized query/placeholder. This allows an attacker
    // to break out of the string literal and change the query's logic.
    //
    // Example payload for the "username" field:
    //   ' OR '1'='1' -- 
    // This turns the query into:
    //   SELECT id, username, password, role FROM users
    //   WHERE username = '' OR '1'='1' -- '
    // which matches the first row in the table regardless of credentials,
    // often logging the attacker in as the very first user (commonly admin).
    //
    // A more targeted payload like:
    //   admin' -- 
    // comments out the rest of the query and can also be combined with a
    // UNION SELECT to exfiltrate arbitrary data from other tables.
    // ============================================
    const sql = `SELECT id, username, password, role FROM users WHERE username = '${username}'`;
    const [rows] = await pool.query(sql);
    const user = rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
        req.session.regenerate((err) => {
            if (err) return res.render('login', { error: 'Something went wrong.', registered: null });
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            res.redirect('/products');
        });
    } else {
        res.render('login', { error: 'Invalid username or password.', registered: null });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;

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
    // console.log('LOGIN ROUTE HIT:', req.body);
    if (!username || !password) {
        return res.render('login', { error: 'Invalid username or password1.', registered: null });
    }

    try {
        const sql = `SELECT id, username, password, role FROM users WHERE username = '${username}'`;
        
        // console.log('SQL:', sql);
        const [rows] = await pool.query(sql);
        // console.log('Rows returned:', rows);
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
            res.render('login', { error: 'Invalid username or password2.', registered: null });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Invalid username or password3', registered: null });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;

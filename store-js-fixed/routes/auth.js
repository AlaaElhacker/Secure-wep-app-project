const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');

const router = express.Router();

// ============================================
// Brute-force protection on login.
// Without this, an attacker can script unlimited password guesses
// against any known username. 10 attempts / 15 min per IP is generous
// for real users but slows automated guessing dramatically.
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again in a few minutes.' },
    handler: (req, res) => {
        res.status(429).render('login', {
            error: 'Too many login attempts. Please try again in a few minutes.',
            registered: null,
        });
    },
});

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

router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    // ============================================
    // SECURED VERSION (Person 1's task):
    // Uses a parameterized query, so user input is never
    // concatenated directly into the SQL string.
    //
    // In the VULNERABLE VERSION, this would instead look like:
    //   const sql = `SELECT * FROM users WHERE username = '${username}'`;
    //   const [rows] = await pool.query(sql);
    // which allows a payload like:  ' OR '1'='1' -- 
    // to bypass authentication entirely.
    // ============================================
    const [rows] = await pool.query(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username]
    );
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

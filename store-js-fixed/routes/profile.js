const express = require('express');
const pool = require('../config/db');
const { requireLogin, getCsrfToken, checkCsrf } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, async (req, res) => {
    const [rows] = await pool.query(
        'SELECT username, email, address FROM users WHERE id = ?',
        [req.session.userId]
    );
    res.render('profile', {
        user: rows[0],
        error: null,
        success: null,
        csrfToken: getCsrfToken(req),
    });
});

router.post('/', requireLogin, async (req, res) => {
    const [rows] = await pool.query(
        'SELECT username, email, address FROM users WHERE id = ?',
        [req.session.userId]
    );
    const user = rows[0];

    // ============================================
    // SECURED VERSION (Person 3's task):
    // The form includes a hidden csrf_token field, which we
    // verify against the token stored in the session before
    // making any change to the user's data.
    //
    // In the VULNERABLE VERSION, this check would be missing
    // entirely, so a malicious site could trick a logged-in
    // user into submitting this form (e.g. via an auto-submitting
    // hidden form) and silently change their shipping address.
    // ============================================
    if (!checkCsrf(req, req.body.csrf_token)) {
        return res.render('profile', {
            user,
            error: 'Invalid or expired form submission. Please try again.',
            success: null,
            csrfToken: getCsrfToken(req),
        });
    }

    const address = (req.body.address || '').trim();
    await pool.query('UPDATE users SET address = ? WHERE id = ?', [address, req.session.userId]);
    user.address = address;

    res.render('profile', { user, error: null, success: 'Profile updated.', csrfToken: getCsrfToken(req) });
});

module.exports = router;

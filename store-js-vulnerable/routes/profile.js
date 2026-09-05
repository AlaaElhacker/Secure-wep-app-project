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
    // VULNERABLE VERSION (Person 3's task):
    // No CSRF check here — the form still contains a csrf_token field,
    // but the server never verifies it against the session before making
    // changes. Any request that hits this endpoint with a valid session
    // cookie will succeed, regardless of where it came from.
    //
    // Attack scenario: a malicious page hosted anywhere on the internet
    // includes a hidden auto-submitting form targeting this exact URL:
    //   <form action="http://TARGET/profile" method="POST">
    //     <input name="address" value="Attacker-controlled address">
    //   </form>
    //   <script>document.forms[0].submit()</script>
    // If a logged-in victim merely visits that malicious page, their
    // browser automatically submits the form WITH their session cookie,
    // silently changing their shipping address without their knowledge.
    // ============================================
    const address = (req.body.address || '').trim();
    await pool.query('UPDATE users SET address = ? WHERE id = ?', [address, req.session.userId]);
    user.address = address;

    res.render('profile', { user, error: null, success: 'Profile updated.', csrfToken: getCsrfToken(req) });
});

module.exports = router;

// ============================================
// Authentication / Authorization / CSRF helpers
// ============================================

const crypto = require('crypto');

function isLoggedIn(req) {
    return Boolean(req.session.userId);
}

function isAdmin(req) {
    return isLoggedIn(req) && req.session.role === 'admin';
}

// Middleware: redirect to login if not authenticated
function requireLogin(req, res, next) {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
}

// Middleware: redirect away if not an admin
// (This is the check "Person 5" is responsible for:
//  in the vulnerable version this middleware is skipped or missing
//  on the admin routes; in the secured version every admin route uses it)
function requireAdmin(req, res, next) {
    if (!isLoggedIn(req)) {
        return res.redirect('/login');
    }
    if (!isAdmin(req)) {
        return res.redirect('/');
    }
    next();
}

// Simple CSRF token helpers
// (Used by "Person 3" for the profile/address form)
function getCsrfToken(req) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    return req.session.csrfToken;
}

function checkCsrf(req, token) {
    if (!req.session.csrfToken || typeof token !== 'string') return false;
    const a = Buffer.from(req.session.csrfToken);
    const b = Buffer.from(token);
    // Constant-time comparison to avoid leaking the token via timing differences.
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

// Generic middleware to protect any state-changing (POST/PUT/DELETE) route.
// Renders a simple 403 page instead of silently redirecting, so an attacker's
// forged cross-site request cannot succeed even if the token is missing/wrong.
function requireCsrf(req, res, next) {
    if (checkCsrf(req, req.body && req.body.csrf_token)) {
        return next();
    }
    res.status(403).render('error', {
        title: 'Request blocked',
        message: 'Invalid or expired security token (CSRF check failed). Please go back, refresh the page, and try again.',
    });
}

module.exports = {
    isLoggedIn,
    isAdmin,
    requireLogin,
    requireAdmin,
    getCsrfToken,
    checkCsrf,
    requireCsrf,
};

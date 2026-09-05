require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const { isLoggedIn, isAdmin, getCsrfToken } = require('./middleware/auth');

const app = express();

// ============================================
// SECURITY HARDENING
// ============================================
// The session secret MUST come from an environment variable in any real
// deployment. We keep a fallback ONLY so the app still boots for local
// dev/demo purposes, but we loudly warn so nobody ships the fallback.
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.warn(
        '\n[SECURITY WARNING] SESSION_SECRET is not set in the environment.\n' +
        'Falling back to an insecure default secret for local development only.\n' +
        'Set SESSION_SECRET (see .env.example) before deploying anywhere real.\n'
    );
}

const isProduction = process.env.NODE_ENV === 'production';
// Trust the first proxy hop (needed so `secure` cookies + req.ip work
// correctly when the app sits behind a reverse proxy / load balancer).
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: SESSION_SECRET || 'change-this-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction, // only sent over HTTPS once deployed
        sameSite: 'lax',      // baseline CSRF mitigation for cross-site requests
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
}));

// Make auth/CSRF helpers available to every EJS view
app.use((req, res, next) => {
    res.locals.isLoggedIn = isLoggedIn(req);
    res.locals.isAdmin = isAdmin(req);
    res.locals.username = req.session.username || null;
    res.locals.csrfToken = getCsrfToken(req);
    next();
});

app.get('/', (req, res) => res.redirect('/products'));

app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mini Store running at http://localhost:${PORT}`));

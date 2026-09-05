const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const { isLoggedIn, isAdmin } = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'change-this-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 2 }, // 2 hours
}));

// Make auth helpers available to every EJS view
app.use((req, res, next) => {
    res.locals.isLoggedIn = isLoggedIn(req);
    res.locals.isAdmin = isAdmin(req);
    res.locals.username = req.session.username || null;
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

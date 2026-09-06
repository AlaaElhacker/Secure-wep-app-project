# Mini Store (Node.js / Express) — Web Application Security Project

The same store as the PHP version, rebuilt with Node.js, Express, EJS
and MySQL.

> ⚠️ **THIS IS THE INTENTIONALLY VULNERABLE VERSION.** It contains 5
> deliberately introduced security flaws for a security-testing/teaching
> exercise. **Do not deploy this anywhere public.** Run it only on
> localhost, with dummy/test data and test accounts.

## Vulnerabilities Implemented

| # | Vulnerability | File(s) | What was weakened |
|---|---|---|---|
| 1 | SQL Injection | `routes/auth.js` (login) | Username concatenated directly into the SQL string instead of using a placeholder. Try `' UNION SELECT 1, 'admin2', '$2b$10$Lu5WfWLIyXm/DqbD5U3Ype/V3RUL1SwlcTU.JxemoTVR2ubenfjTG', 'admin' -- h` as the username and `123` as password to bypass the password check. |
| 2 | Stored XSS | `views/product.ejs` (reviews) | Review comments rendered with EJS's unescaped `<%- %>` tag. Submit a review containing `<script>alert(document.cookie)</script>`. |
| 3 | CSRF | `routes/profile.js` | The CSRF token is generated and put in the form, but the server never checks it on submit. |
| 4 | IDOR | `routes/orders.js` (`GET /orders/:id`) | No check that the order belongs to the logged-in user — browse `/orders/1`, `/orders/2`, etc. |
| 5 | Broken Access Control | `routes/admin.js` | `requireAdmin` is imported but never applied to the router — `/admin/dashboard` and `/admin/products` are reachable by anyone, including logged-out visitors. |

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create the database:
   ```
   mysql -u root -p < schema.sql
   ```
3. Update `config/db.js` with your local MySQL credentials.
4. Generate a password hash for the sample admin account:
   ```
   node -e "require('bcrypt').hash('yourpassword',10).then(console.log)"
   ```
   and update the `password` column for the `admin` user in the database.
5. Start the server:
   ```
   npm start
   ```
6. Visit `http://localhost:3000`.

## Security Note

This vulnerable version is for **educational/testing purposes only**.
Use dummy data and test accounts. Do not deploy it publicly, do not point
it at a real database with real user data, and do not use it to test
systems you don't own or have explicit permission to test.

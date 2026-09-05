# Mini Store (Node.js / Express) — Web Application Security Project

The same store as the PHP version, rebuilt with Node.js, Express, EJS
and MySQL. This is the **baseline, secure version**.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in a real `SESSION_SECRET` and your
   MySQL credentials (or edit `config/db.js` directly — it falls back to the
   values there if the env vars aren't set).
3. Create the database:
   ```
   mysql -u root -p < schema.sql
   ```
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

If your database already existed before this update and you just want the
10 new sample products, run `seed_10_more_products.sql` instead of redoing
the whole schema.

## Additional hardening applied on top of the 5 core fixes

- **CSRF everywhere** — the profile form already had CSRF protection; it's
  now extended to *every* state-changing form (add/remove from cart,
  checkout, product reviews, admin add/delete product) via a shared
  `requireCsrf` middleware (`middleware/auth.js`) and a `csrfToken` value
  automatically available in every view.
- **Constant-time CSRF comparison** — `checkCsrf` uses `crypto.timingSafeEqual`
  instead of `===` to avoid leaking the token through timing side-channels.
- **Session secret from environment** — `SESSION_SECRET` is now read from
  `.env` (see `.env.example`) instead of being hard-coded; the app warns
  loudly at startup if it falls back to the insecure default.
- **Secure session cookies** — cookies are marked `secure` automatically
  when `NODE_ENV=production` (HTTPS-only) and use `sameSite: 'lax'` as a
  defense-in-depth CSRF mitigation.
- **Login rate limiting** — `POST /login` is now throttled (10 attempts per
  15 minutes per IP) via `express-rate-limit`, to slow down password
  brute-forcing.
- **Admin image URL validation** — the "Add Product" form now rejects
  anything that isn't a valid `http://`/`https://` URL, so it can't be used
  to smuggle a `javascript:`/`data:` URI into the stored `image` field.
- **DB credentials via environment** — `config/db.js` now reads
  `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` from the environment first.
- **10 more sample products** added to `schema.sql` / `seed_10_more_products.sql`.

## How this codebase is meant to be used

This repository is the **secured baseline**. To build the two required
project deliverables:

- **`vulnerable-version/`** — copy this codebase, then each team member
  deliberately removes/weakens the protection in their assigned file
  (see table below). Every spot to change is marked with a comment
  block starting with `SECURED VERSION (Person X's task)`.
- **`secured-version/`** — this codebase as-is (or with any additional
  hardening the team wants to add).

## Team Members & Responsibilities

| Person | Vulnerability | Files | Fix Applied |
|---|---|---|---|
| 1 | SQL Injection | `routes/auth.js` (login) | Parameterized queries (`mysql2` placeholders) instead of string concatenation |
| 2 | Stored XSS | `views/product.ejs` (reviews) | EJS's escaped `<%= %>` output tag instead of unescaped `<%- %>` |
| 3 | CSRF | `routes/profile.js`, `views/profile.ejs` | Session-stored CSRF token, verified on form submit |
| 4 | IDOR | `routes/orders.js` (`GET /orders/:id`) | Ownership check (`order.user_id === session.userId`) before showing order details |
| 5 | Broken Access Control | `routes/admin.js` | `requireAdmin` middleware applied to the whole router, checked server-side |

_(Fill in actual names next to each person above.)_

## Vulnerabilities Implemented (fill in per version)

### Vulnerable Version
- [ ] SQL Injection — login bypass with `' OR '1'='1' -- `
- [ ] Stored XSS — `<script>` payload in a product review
- [ ] CSRF — auto-submitting form changes another user's shipping address
- [ ] IDOR — changing `/orders/:id` reveals other users' orders
- [ ] Broken Access Control — non-admin can reach `/admin/dashboard` directly

### Secured Version
- [ ] All five vulnerabilities above fixed and demonstrated as working correctly

## Security Note

The vulnerable version is for **educational/testing purposes only**.
Use dummy data and test accounts. Do not deploy it publicly.

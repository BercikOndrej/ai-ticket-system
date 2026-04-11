---
name: Auth spec structure and selectors
description: Key selectors, patterns, and coverage decisions for e2e/tests/auth.spec.ts
type: project
---

Auth spec is at `e2e/tests/auth.spec.ts`. Groups are:
1. Login Page (form display, valid login, validation errors, loading state, redirect if authenticated, clear error)
2. Session Persistence (reload, direct navigation, multi-page navigation)
3. Logout (success, protected routes after logout, re-login)
4. Protected Routes (unauthenticated redirects to /login)
5. Admin Route Protection (admin access, Users link, navigation)
6. URL Handling (unknown routes)
7. Navigation Bar (user info, branding, role-based nav)

Key selectors confirmed against source:
- Email field: `page.getByLabel("Email")` — Label htmlFor="email"
- Password field: `page.getByLabel("Password")` — Label htmlFor="password"
- Submit button: `page.getByRole("button", { name: /sign in/i })`
- Logout button: `page.getByRole("button", { name: /logout/i })` — Button in Navbar
- Users nav link: `page.getByRole("link", { name: /users/i })` — Link in Navbar, Admin-only
- Client-side email error text: "Enter a valid email address"
- Client-side password error text: "Password is required"
- Server error text: "Invalid email or password" (plain div, NOT role="alert")
- Login page title: "Ticket System"
- Login page description: "Sign in to your account"
- Navbar branding: "SimpleTickets"
- Home page heading: `getByRole("heading", { name: /dashboard/i })`

Auth pattern:
- No storage state files — all tests log in via UI using helpers from `e2e/fixtures/auth.ts`
- `loginAsAdmin(page)` and `loginAsAgent(page)` handle login + redirect wait
- Credentials loaded from `server/.env.test` via dotenv in `e2e/fixtures/auth.ts`
- Both Admin and Agent users are seeded (see `server/prisma/seed.ts`)

**Why:** Needed to understand exact error messages and selector shapes before writing stable tests.
**How to apply:** Re-use these selectors and error strings in any future auth-related spec work without re-reading the source.

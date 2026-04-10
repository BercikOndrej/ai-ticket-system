---
name: Auth spec structure and selectors
description: Key selectors, patterns, and coverage decisions made when writing e2e/auth.spec.ts
type: project
---

Auth spec is at `e2e/auth.spec.ts`. Groups are:
1. Login form validation (unauthenticated)
2. Login flow (credentials-driven, unauthenticated)
3. Route protection for unauthenticated users
4. Role-based access — Admin (ADMIN_FILE storage state)
5. Role-based access — Agent (AGENT_FILE storage state)
6. Logout (ADMIN_FILE storage state)

Key selectors confirmed against source:
- Email field: `page.getByLabel("Email")` — Label htmlFor="email"
- Password field: `page.getByLabel("Password")` — Label htmlFor="password"
- Submit button: `page.getByRole("button", { name: "Sign in" })`
- Logout button: `page.getByRole("button", { name: "Logout" })` — Button in Navbar
- Users nav link: `page.getByRole("link", { name: "Users" })` — Link in Navbar, Admin-only
- Client-side email error text: "Enter a valid email address"
- Client-side password error text: "Password is required"
- Server error text: "Invalid email or password"

Routing facts:
- Catch-all `*` → Navigate to "/" → ProtectedRoute redirects to "/login" when unauthenticated
- AdminRoute checks `session.user.role !== UserRole.Admin` and redirects to "/"
- ProtectedRoute checks `!session` and redirects to "/login"
- LoginPage checks `session` and returns `<Navigate to="/" replace />` immediately

ADMIN_FILE and AGENT_FILE are exported from `e2e/setup/auth.setup.ts`.
Credentials loaded via dotenv from `server/.env.test`.

**Why:** Needed to understand exact error messages and selector shapes before writing stable tests.
**How to apply:** Re-use these selectors and error strings in any future auth-related spec work without re-reading the source.

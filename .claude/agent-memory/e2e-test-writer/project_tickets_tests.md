---
name: Tickets spec structure and selectors
description: Selectors, API wait patterns, and coverage decisions for e2e/tests/tickets.spec.ts
type: project
---

The ticket listing spec at `e2e/tests/tickets.spec.ts` tests three scenarios:

1. Admin reaches `/tickets` — logs in via `loginAsAdmin(page)`, then `waitForResponse` on `GET /api/tickets`, asserts 200 and the heading `"Tickets"` via `getByRole("heading", { name: "Tickets" })`.
2. Agent reaches `/tickets` — logs in via `loginAsAgent(page)`, same assertions. The `/api/tickets` endpoint has no role restriction beyond being authenticated.
3. Unauthenticated redirect — navigates to `/tickets`, waits for `waitForURL("/login")`, asserts Sign in button.

Auth pattern: No storage state — tests call `loginAsAdmin`/`loginAsAgent` from `e2e/fixtures/auth.ts`.

**Why:** `/tickets` is a read-only list; no CRUD flows are tested here. The endpoint (`server/src/routes/tickets.ts`) only exposes `GET /`, protected by `requireAuth` with no role check.

**How to apply:** When adding ticket CRUD tests (e.g., view detail, update status), extend this file or create a new spec following the same `waitForResponse` + login-via-UI pattern.

Key selectors:
- Page heading: `getByRole("heading", { name: "Tickets" })`
- Table column headers (from `TicketsTable.tsx`): `#`, `Subject`, `From`, `Status`, `Classification`, `Received`
- Empty state cell text: `"No tickets found."`
- Error state cell text: `"Failed to load tickets."`

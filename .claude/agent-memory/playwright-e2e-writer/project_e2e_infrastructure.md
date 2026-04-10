---
name: E2E Testing Infrastructure
description: Playwright setup, test DB, global setup pattern, webServer config, and how to run tests for this project
type: project
---

## Test Runner & Config

- **Framework:** Playwright — config at repo root `playwright.config.ts`, tests in `e2e/`
- **Run commands** (from repo root):
  - `npm run test:e2e` — headless
  - `npm run test:e2e:ui` — with Playwright UI

## Test Database

- Separate PostgreSQL DB used for tests — connection string in `server/.env.test` (gitignored)
- Use `server/.env.test.example` as the template

## Global Setup (`e2e/global-setup.ts`)

- Runs `prisma migrate deploy` then `npm run seed` against the test DB before every run
- Idempotent — safe to re-run

## Server in Tests

- Started automatically via `webServer` in `playwright.config.ts` with env vars from `server/.env.test`
- The dev DB is never touched during test runs

## Rate Limiting

- `/api/auth/sign-in` rate limiting is **production-only** (`NODE_ENV === "production"`) — disabled in dev and test environments

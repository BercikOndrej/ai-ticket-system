# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Scope & Implementation Plan

- **[project-scope.md](./project-scope.md)** — business context, problem statement, and feature list
- **[implementation-plan.md](./implementation-plan.md)** — phased build plan with tasks and details

Read both files for full context before working on new features or making architectural decisions.

## Project Overview

AI-powered ticket management system for an online course business. Customers send support emails, the system creates tickets, classifies them via Claude API, auto-responds using a knowledge base when possible, and escalates to human agents otherwise. Two roles: Admin and Agent.

## Architecture

Monorepo with two packages:

- **`client/`** — React 19 + Vite 8 + TypeScript frontend (React Router for navigation, shadcn/ui components, Tailwind CSS v4)
- **`server/`** — Express 5 + TypeScript backend, Prisma 7 ORM + PostgreSQL (planned: session-based auth, Claude API integration)

The server exposes a REST API under `/api/` (`/api/health`, `/api/me`). The client dev server runs on port 5173 and the server on port 3001.

## Commands

### Client (`client/` directory)

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Server (`server/` directory)

```bash
npm run dev       # Start with ts-node-dev (auto-restart on changes)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled JS from dist/
```

### Formatting (run in `client/` or `server/`)

```bash
npm run format        # Format all files in-place
npm run format:check  # Check formatting without writing (CI)
```

Prettier config is in `.prettierrc` at the monorepo root — both packages share it. Settings: double quotes, semicolons, trailing commas, 100-char print width.

### Database (`server/` directory)

```bash
npx prisma generate        # Generate Prisma client (into server/generated/prisma/)
npx prisma migrate dev     # Create and apply migrations
npx prisma studio          # Open database GUI
```

## Documentation

Always use the Context7 MCP (`resolve-library-id` then `query-docs`) to fetch current documentation before writing or modifying code that uses any library, framework, or API. Do not rely on training data alone — docs may have changed.

## Authentication

- **Library:** [BetterAuth](https://better-auth.com) — session-based auth
- **Server config:** `server/src/auth.ts` — uses `prismaAdapter` with PostgreSQL; email/password enabled, **sign-up is disabled** (users are seeded manually)
- **User roles:** `Admin` and `Agent` (defined in `server/src/enums.ts`); stored as an additional field on the user model, defaulting to `Agent`
- **Auth routes:** mounted at `/api/auth/*` via `toNodeHandler(auth)` in `server/src/index.ts` — this handler must be registered **before** `express.json()`
- **Protecting routes (server):** use the `requireAuth` middleware from `server/src/middleware/auth.ts`; it validates the session and attaches it to `req.authSession` (`{ user, session }`)
- **Client setup:** `client/src/lib/auth-client.ts` exports `authClient`, `signIn`, `signOut`, and `useSession` (via `createAuthClient` pointing to `http://localhost:3001`);
- **Protecting routes (client):** `ProtectedRoute` — redirects unauthenticated users to `/login`; `AdminRoute` — redirects non-admin users to `/`; nest routes inside both guards in `App.tsx` for admin-only pages

## Key Domain Concepts

- **Ticket statuses:** `Open`, `Resolved`, `Closed`
- **Ticket classifications:** `General question`, `Technical question`, `Request`, `Refund`
- **Email ingestion:** Inbound via SendGrid/Mailgun webhooks, outbound replies via their APIs

## Shared Code (core/)

- Validation schemas and other logic shared between client and server live in `core/src/` at the monorepo root
- Import them as `import { ... } from "core/schemas/<resource>"` or `import { ... } from "core/enums"` in both client and server
- The alias is configured in `client/vite.config.ts` (Vite alias + `dedupe: ['zod']`) and both `tsconfig` files (`paths`); the server dev script registers `tsconfig-paths/register` so the alias works at runtime
- Never duplicate a Zod schema — if the same shape is validated on both sides, define it once in `core/` and import it in both
- **Never use magic strings for roles** — always use the `UserRole` enum from `core/enums` (`UserRole.Admin`, `UserRole.Agent`). This applies to both client and server code, including tests. When adding a new path alias in `client/vite.config.ts`, add the matching entry to `client/tsconfig.app.json` and `server/tsconfig.json` too

## Server Route Organization

- Every resource gets its own router module at `server/src/routes/<resource>.ts` (e.g. `users.ts`, `tickets.ts`)
- Each module creates an `express.Router()`, defines all routes for that resource on it, and exports it as default
- Mount routers in `server/src/index.ts` with `app.use("/api/<resource>", router)` — keep `index.ts` free of route logic
- Middleware (`requireAuth`, `requireAdmin`), Zod schemas, and Prisma calls all live inside the route module, not in `index.ts`

## Server-Side Validation

- Always use **Zod** to validate request bodies in Express route handlers — never write manual `if`/`else` checks
- Use the shared `parseBody<T>(schema, body, res)` helper from `server/src/lib/validation.ts` — it calls `safeParse`, sends a `400` on failure, and returns the typed data or `null`; check `if (!data) return;` after calling it
- Define the Zod schema at module scope, above the route handler

## API Requests (Client)

- **axios** — shared instance at `client/src/lib/api-client.ts` with `baseURL: http://localhost:3001` and `withCredentials: true`; always import `apiClient` from there — never use raw `fetch()` or hardcode the base URL
- **TanStack Query (`@tanstack/react-query`)** — `QueryClientProvider` is set up in `client/src/main.tsx`; use `useQuery` for reads and `useMutation` for writes; the query function should call `apiClient` and return `res.data`

## UI / Styling

- **shadcn/ui** is installed in `client/` with the neutral (black & white) theme and Tailwind CSS v4
- All UI components live in `client/src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- Use shadcn components (`Button`, `Card`, `Input`, `Label`, `Separator`, etc.) for all new UI — do not write raw HTML buttons or hand-rolled form inputs

## Unit / Component Testing (Client)

**Always delegate unit/component test writing to the `unit-test-writer` sub-agent** — never write Vitest tests inline. Only write tests when explicitly asked.

Use the Agent tool with `subagent_type: "unit-test-writer"` and include in the prompt: the component or file being tested, its file path, and any relevant context (props, API calls, roles, query keys).

- **Run:** `npm test` (single run) or `npm run test:watch` (watch mode) in `client/`

## E2E Testing

**Always delegate E2E test writing to the `e2e-test-writer` sub-agent** — never write Playwright tests inline. Only write tests when explicitly asked.

Use the Agent tool with `subagent_type: "e2e-test-writer"` and include in the prompt: the feature being tested, relevant source file paths, and any context about routes, roles, or API endpoints involved.

## Environments Variables

- Always when you add new variables into `.env` file verify that all variables are included in `.env.example` too but with placeholder values
- Always when you add new variables into `server/.env.test` verify that they are included in `server/.env.test.example` too

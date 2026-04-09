# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## UI / Styling

- **shadcn/ui** is installed in `client/` with the neutral (black & white) theme and Tailwind CSS v4
- All UI components live in `client/src/components/ui/` — add new ones via `npx shadcn@latest add <component>`
- Use shadcn components (`Button`, `Card`, `Input`, `Label`, `Separator`, etc.) for all new UI — do not write raw HTML buttons or hand-rolled form inputs

## Environments Variables

- Always when you add new variables into `.env` file verify that all variables are included in `.env.example` too but with placeholder values

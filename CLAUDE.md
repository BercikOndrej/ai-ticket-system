# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered ticket management system for an online course business. Customers send support emails, the system creates tickets, classifies them via Claude API, auto-responds using a knowledge base when possible, and escalates to human agents otherwise. Two roles: Admin and Agent.

## Architecture

Monorepo with two packages:

- **`client/`** — React 19 + Vite 8 + TypeScript frontend (React Router for navigation)
- **`server/`** — Express 5 + TypeScript backend, Prisma 7 ORM + PostgreSQL (planned: session-based auth, Claude API integration)

The server exposes a REST API under `/api/` (currently just `/api/health`). The client dev server runs on port 5173 and the server on port 3001.

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

## Key Domain Concepts

- **Ticket statuses:** `Open`, `Resolved`, `Closed`
- **Ticket classifications:** `General question`, `Technical question`, `Request`, `Refund`
- **Email ingestion:** Inbound via SendGrid/Mailgun webhooks, outbound replies via their APIs

## Environments Variables

- Always when you add new variables into `.env` file verify that all variables are included in `.env.example` too

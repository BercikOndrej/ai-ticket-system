# Implementation Plan — AI Ticket Management System

## Context

Build an AI-powered ticket management system for a course-selling business. Customers email support; the system creates tickets, classifies them, auto-responds using a knowledge base when possible, and escalates to human agents otherwise. Two roles: Admin (manages agents + system) and Agent (works tickets).

**Tech stack:** React + Vite (frontend), Express.js + TypeScript (backend), PostgreSQL + Prisma, session-based auth, Claude API, Docker.

---

## Phase 1 — Project Setup & Infrastructure

| #   | Task                | Details                                                                         |
| --- | ------------------- | ------------------------------------------------------------------------------- |
| 1.1 | Initialize monorepo | Create `client/` (Vite + React + TS) and `server/` (Express + TS) directories   |
| 1.2 | Docker setup        | `Dockerfile` for client, server, and `docker-compose.yml` with Postgres service |

---

## Phase 2 — Authentication & User Management

| #   | Task                 | Details                                                                     |
| --- | -------------------- | --------------------------------------------------------------------------- |
| 2.1 | Session-based auth   | Login/logout endpoints, session stored in DB via Prisma, session middleware |
| 2.2 | Role-based access    | Admin and Agent roles, middleware to protect routes by role                 |
| 2.3 | Admin: seed script   | Script to create initial admin user on first deploy                         |
| 2.4 | Admin: manage agents | CRUD endpoints + UI for admin to create/edit/delete agent accounts          |
| 2.5 | Login page (React)   | Login form, session cookie handling, redirect based on role                 |

---

## Phase 3 — Ticket Core (CRUD + UI)

| #   | Task                    | Details                                                                                                                                                  |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Ticket model & API      | CRUD endpoints for tickets with status (`Open`, `Resolved`, `Closed`) and classification (`General question`, `Technical question`, `Request`, `Refund`) |
| 3.2 | Ticket list / dashboard | React page with table/list of tickets, filtering by status and classification, sorting by date                                                           |
| 3.3 | Ticket detail view      | React page showing ticket info, customer message, conversation thread, status controls                                                                   |
| 3.4 | Agent reply flow        | Agent can write a reply from the ticket detail view, reply is saved as a `Message`                                                                       |

---

## Phase 4 — Email Integration

| #   | Task                       | Details                                                                 |
| --- | -------------------------- | ----------------------------------------------------------------------- |
| 4.1 | Inbound email webhook      | Express endpoint to receive parsed emails from SendGrid/Mailgun         |
| 4.2 | Ticket creation from email | Parse sender, subject, body → create `Ticket` + initial `Message`       |
| 4.3 | Outbound email             | Send replies back to customers via SendGrid/Mailgun API                 |
| 4.4 | Threading                  | Match incoming replies to existing tickets by subject/reference headers |

---

## Phase 5 — AI Features

| #   | Task                     | Details                                                                                                                |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Knowledge base CRUD      | Admin UI + API to manage Q&A entries (question pattern + answer)                                                       |
| 5.2 | AI ticket classification | On ticket creation, call Claude API to classify into one of 4 categories                                               |
| 5.3 | AI auto-response         | Match ticket against knowledge base entries; if match found, auto-generate and send response, set ticket to `Resolved` |
| 5.4 | AI suggested replies     | For non-auto-resolved tickets, show AI-suggested reply draft to agent in ticket detail view                            |
| 5.5 | AI ticket summary        | Generate a summary of the ticket conversation, displayed on ticket detail                                              |

---

## Phase 6 — Dashboard & Polish

| #   | Task                            | Details                                                                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------ |
| 6.1 | Dashboard overview              | Stats: open tickets count, resolved today, tickets by classification, auto-resolve rate          |
| 6.2 | Navigation & layout             | React Router setup: sidebar nav with Dashboard, Tickets, Knowledge Base, User Management (admin) |
| 6.3 | Responsive UI                   | Clean, usable layout for desktop                                                                 |
| 6.4 | Error handling & loading states | API error handling, loading spinners, toast notifications                                        |

---

## Phase 7 — Docker & Deployment

| #   | Task                      | Details                                                           |
| --- | ------------------------- | ----------------------------------------------------------------- |
| 7.1 | Production Dockerfiles    | Multi-stage builds for client and server                          |
| 7.2 | docker-compose production | Compose file with client, server, postgres, environment variables |
| 7.3 | Database migrations       | Prisma migrate in Docker entrypoint                               |
| 7.4 | Admin seed on first run   | Auto-create admin account if no users exist                       |

---

## Verification

- **Auth:** Login as admin, create an agent, login as agent
- **Tickets:** Create ticket manually, verify it appears on dashboard with correct status/classification
- **Email:** Send test email to webhook endpoint, verify ticket is created
- **AI classification:** Create ticket, verify Claude classifies it correctly
- **AI auto-response:** Add knowledge base entry, send matching email, verify auto-response sent and ticket resolved
- **AI suggestions:** Open non-auto-resolved ticket as agent, verify suggested reply appears
- **Docker:** `docker-compose up` starts all services, app is accessible

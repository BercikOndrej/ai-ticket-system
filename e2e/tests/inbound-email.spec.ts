/**
 * inbound-email.spec.ts
 *
 * API-level E2E tests for the inbound email webhook endpoint.
 * Endpoint: POST http://localhost:3001/api/webhooks/inbound-email
 *
 * Covers:
 *   - Happy path: valid payload + correct secret → 201, new ticket with status Open
 *   - Auth: missing X-Webhook-Secret header → 401
 *   - Auth: wrong X-Webhook-Secret value → 401
 *   - Validation: missing subject → 400
 *   - Validation: missing body → 400
 *   - Validation: invalid fromEmail → 400
 *   - Validation: missing fromName → 400
 *   - Deduplication: same fromEmail + subject → second call returns 200 with same ticket id
 *   - Deduplication: "Re: {subject}" normalizes to base subject → 200, same ticket
 *   - Deduplication: "Fwd: {subject}" normalizes to base subject → 200, same ticket
 *   - Deduplication: "Re: Re: {subject}" (multiple prefixes) → 200, same ticket
 *   - Deduplication: Closed ticket is ignored → new email creates fresh ticket (201)
 *   - Optional field: payload without bodyHtml is accepted → 201
 *
 * No browser or page fixture is used — all tests exercise the REST API directly
 * via the Playwright `request` fixture (APIRequestContext).
 *
 * Test isolation: each test uses a unique fromEmail (contains Date.now()) so
 * tickets created in one test never collide with another. After each test,
 * all tickets created during that test are deleted via Prisma so the DB stays
 * clean across runs.
 *
 * The "Closed ticket" deduplication test closes a ticket directly via SQL
 * to avoid importing the Prisma client (ESM + driver-adapter complexity).
 */

import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { TicketStatus } from "../../core/src/enums";
import { TEST_ENV } from "../test-env";

const SERVER_URL = TEST_ENV.BETTER_AUTH_URL ?? "http://localhost:3001";
const WEBHOOK_URL = `${SERVER_URL}/api/webhooks/inbound-email`;
const CORRECT_SECRET = TEST_ENV.WEBHOOK_SECRET ?? "test-webhook-secret";

// ---------------------------------------------------------------------------
// pg Pool for teardown helpers (avoids ESM + driver-adapter complexity of
// the Prisma 7 generated client, which cannot be require()'d directly).
// ---------------------------------------------------------------------------
const pool = new Pool({ connectionString: TEST_ENV.DATABASE_URL });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns headers with the correct webhook secret. */
function authHeaders(): Record<string, string> {
  return { "x-webhook-secret": CORRECT_SECRET };
}

/**
 * Closes an existing ticket directly via SQL so the deduplication-closed
 * test can exercise the "Closed ticket → new ticket" path without needing a
 * REST tickets PATCH endpoint (which does not exist yet).
 */
async function closeTicketViaDb(ticketId: number): Promise<void> {
  await pool.query("UPDATE ticket SET status = $1 WHERE id = $2", [TicketStatus.Closed, ticketId]);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("POST /api/webhooks/inbound-email", () => {
  // Emails used in each test — collected so afterEach can delete their tickets.
  const usedEmails: string[] = [];

  test.afterEach(async () => {
    if (usedEmails.length > 0) {
      await pool.query('DELETE FROM ticket WHERE "fromEmail" = ANY($1)', [usedEmails]);
      usedEmails.length = 0;
    }
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // -------------------------------------------------------------------------
  // 1. Happy path
  // -------------------------------------------------------------------------
  test.describe("Happy path", () => {
    test("should create a new ticket and return 201 with Open status", async ({ request }) => {
      const email = `happy-${Date.now()}@e2e.local`;
      usedEmails.push(email);

      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "My first question",
          body: "Hello, I need help with my order.",
          fromEmail: email,
          fromName: "Alice Customer",
        },
        headers: authHeaders(),
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(typeof body.id).toBe("number");
      expect(body.subject).toBe("My first question");
      expect(body.fromEmail).toBe(email);
      expect(body.fromName).toBe("Alice Customer");
      expect(body.status).toBe(TicketStatus.Open);
      expect(body.createdAt).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Authentication
  // -------------------------------------------------------------------------
  test.describe("Authentication", () => {
    test("should return 401 when X-Webhook-Secret header is missing", async ({ request }) => {
      const email = `no-secret-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "No secret",
          body: "body",
          fromEmail: email,
          fromName: "Sender",
        },
        // Intentionally omit auth headers
      });

      expect(response.status()).toBe(401);
    });

    test("should return 401 when X-Webhook-Secret has the wrong value", async ({ request }) => {
      const email = `wrong-secret-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "Wrong secret",
          body: "body",
          fromEmail: email,
          fromName: "Sender",
        },
        headers: { "x-webhook-secret": "definitely-not-the-secret" },
      });

      expect(response.status()).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Validation errors
  // -------------------------------------------------------------------------
  test.describe("Validation", () => {
    test("should return 400 when subject is missing", async ({ request }) => {
      const email = `val-no-subject-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const response = await request.post(WEBHOOK_URL, {
        data: {
          body: "Some body",
          fromEmail: email,
          fromName: "Sender",
        },
        headers: authHeaders(),
      });

      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(typeof json.error).toBe("string");
    });

    test("should return 400 when body is missing", async ({ request }) => {
      const email = `val-no-body-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "Some subject",
          fromEmail: email,
          fromName: "Sender",
        },
        headers: authHeaders(),
      });

      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(typeof json.error).toBe("string");
    });

    test("should return 400 when fromEmail is not a valid email address", async ({ request }) => {
      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "Some subject",
          body: "Some body",
          fromEmail: "not-an-email",
          fromName: "Sender",
        },
        headers: authHeaders(),
      });

      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(typeof json.error).toBe("string");
    });

    test("should return 400 when fromName is missing", async ({ request }) => {
      const email = `val-no-name-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "Some subject",
          body: "Some body",
          fromEmail: email,
        },
        headers: authHeaders(),
      });

      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(typeof json.error).toBe("string");
    });
  });

  // -------------------------------------------------------------------------
  // 4. Deduplication
  // -------------------------------------------------------------------------
  test.describe("Deduplication", () => {
    test("should return 200 with the existing ticket when the same fromEmail + subject is sent again", async ({
      request,
    }) => {
      const email = `dedup-exact-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const subject = "Help with invoice";

      // First email — creates the ticket
      const first = await request.post(WEBHOOK_URL, {
        data: { subject, body: "First message", fromEmail: email, fromName: "Bob" },
        headers: authHeaders(),
      });
      expect(first.status()).toBe(201);
      const firstBody = await first.json();

      // Second email — same sender + subject
      const second = await request.post(WEBHOOK_URL, {
        data: { subject, body: "Follow-up message", fromEmail: email, fromName: "Bob" },
        headers: authHeaders(),
      });
      expect(second.status()).toBe(200);
      const secondBody = await second.json();

      expect(secondBody.id).toBe(firstBody.id);
    });

    test('should match an existing ticket when the subject starts with "Re:"', async ({
      request,
    }) => {
      const email = `dedup-re-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const baseSubject = "Password reset not working";

      // Create original ticket
      const first = await request.post(WEBHOOK_URL, {
        data: {
          subject: baseSubject,
          body: "I cannot reset my password.",
          fromEmail: email,
          fromName: "Carol",
        },
        headers: authHeaders(),
      });
      expect(first.status()).toBe(201);
      const firstBody = await first.json();

      // Reply with "Re: " prefix
      const second = await request.post(WEBHOOK_URL, {
        data: {
          subject: `Re: ${baseSubject}`,
          body: "Still not working after 24h.",
          fromEmail: email,
          fromName: "Carol",
        },
        headers: authHeaders(),
      });
      expect(second.status()).toBe(200);
      const secondBody = await second.json();

      expect(secondBody.id).toBe(firstBody.id);
    });

    test('should match an existing ticket when the subject starts with "Fwd:"', async ({
      request,
    }) => {
      const email = `dedup-fwd-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const baseSubject = "Refund request for order 123";

      const first = await request.post(WEBHOOK_URL, {
        data: {
          subject: baseSubject,
          body: "I want a refund.",
          fromEmail: email,
          fromName: "Dave",
        },
        headers: authHeaders(),
      });
      expect(first.status()).toBe(201);
      const firstBody = await first.json();

      const second = await request.post(WEBHOOK_URL, {
        data: {
          subject: `Fwd: ${baseSubject}`,
          body: "Forwarding my refund request.",
          fromEmail: email,
          fromName: "Dave",
        },
        headers: authHeaders(),
      });
      expect(second.status()).toBe(200);
      const secondBody = await second.json();

      expect(secondBody.id).toBe(firstBody.id);
    });

    test('should match an existing ticket when the subject has multiple "Re:" prefixes', async ({
      request,
    }) => {
      const email = `dedup-multi-re-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const baseSubject = "Course access denied";

      const first = await request.post(WEBHOOK_URL, {
        data: {
          subject: baseSubject,
          body: "I cannot access the course.",
          fromEmail: email,
          fromName: "Eve",
        },
        headers: authHeaders(),
      });
      expect(first.status()).toBe(201);
      const firstBody = await first.json();

      const second = await request.post(WEBHOOK_URL, {
        data: {
          subject: `Re: Re: ${baseSubject}`,
          body: "Still waiting for a reply.",
          fromEmail: email,
          fromName: "Eve",
        },
        headers: authHeaders(),
      });
      expect(second.status()).toBe(200);
      const secondBody = await second.json();

      expect(secondBody.id).toBe(firstBody.id);
    });

    test("should create a new ticket when the existing ticket with the same fromEmail + subject is Closed", async ({
      request,
    }) => {
      const email = `dedup-closed-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const subject = "Subscription cancellation";

      // Step 1: create the original ticket via the webhook
      const first = await request.post(WEBHOOK_URL, {
        data: {
          subject,
          body: "Please cancel my subscription.",
          fromEmail: email,
          fromName: "Frank",
        },
        headers: authHeaders(),
      });
      expect(first.status()).toBe(201);
      const firstBody = await first.json();

      // Step 2: close the ticket directly via SQL
      await closeTicketViaDb(firstBody.id);

      // Step 3: send the same email again — the Closed ticket must be ignored,
      // so a brand-new ticket should be created (201) with a different id.
      const second = await request.post(WEBHOOK_URL, {
        data: {
          subject,
          body: "I reconsidered — can I cancel again?",
          fromEmail: email,
          fromName: "Frank",
        },
        headers: authHeaders(),
      });
      expect(second.status()).toBe(201);
      const secondBody = await second.json();

      expect(secondBody.id).not.toBe(firstBody.id);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Optional fields
  // -------------------------------------------------------------------------
  test.describe("Optional fields", () => {
    test("should accept a payload without the optional bodyHtml field and return 201", async ({
      request,
    }) => {
      const email = `no-html-${Date.now()}@e2e.local`;
      usedEmails.push(email);
      const response = await request.post(WEBHOOK_URL, {
        data: {
          subject: "No HTML body",
          body: "Plain text only.",
          fromEmail: email,
          fromName: "Grace",
          // bodyHtml intentionally omitted
        },
        headers: authHeaders(),
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(typeof body.id).toBe("number");
      expect(body.status).toBe(TicketStatus.Open);
    });
  });
});

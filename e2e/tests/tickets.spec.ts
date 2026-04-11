/**
 * tickets.spec.ts
 *
 * End-to-end tests for the ticket listing feature.
 *
 * Covers:
 *   - Admin can navigate to /tickets, the GET /api/tickets call returns 200,
 *     and the page heading is visible
 *   - Agent can navigate to /tickets in the same way (no role restriction on
 *     this read-only endpoint)
 *   - Unauthenticated users are redirected to /login when visiting /tickets
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsAgent } from "../fixtures/auth";

// ---------------------------------------------------------------------------
// 1. List tickets as Admin
// ---------------------------------------------------------------------------
test.describe("List tickets as Admin", () => {
  test("should load the Tickets page and receive a 200 from GET /api/tickets", async ({ page }) => {
    await loginAsAdmin(page);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/tickets") && res.request().method() === "GET",
      ),
      page.goto("/tickets"),
    ]);

    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. List tickets as Agent
// ---------------------------------------------------------------------------
test.describe("List tickets as Agent", () => {
  test("should load the Tickets page and receive a 200 from GET /api/tickets", async ({ page }) => {
    await loginAsAgent(page);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/tickets") && res.request().method() === "GET",
      ),
      page.goto("/tickets"),
    ]);

    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Access control — unauthenticated
// ---------------------------------------------------------------------------
test.describe("Route protection for unauthenticated users", () => {
  test("should redirect to /login when visiting /tickets without a session", async ({ page }) => {
    await page.goto("/tickets");
    await page.waitForURL("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

/**
 * Auth setup — runs before all test projects.
 *
 * Logs in as Admin and Agent via the UI and persists each session's
 * storage state (cookies + localStorage) to `e2e/.auth/`.  Test files
 * can then reference the appropriate file via `test.use({ storageState })`,
 * avoiding a full login on every test.
 *
 * Credentials are resolved from the same env vars as the seed script:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   SEED_AGENT_EMAIL / SEED_AGENT_PASSWORD
 *
 * If an env var is missing the setup will throw immediately with a clear
 * message so the developer knows what to fix.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load test env vars so the setup knows the seeded credentials.
const envTestPath = path.resolve(__dirname, "../../../server/.env.test");
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}

export const ADMIN_FILE = path.join(__dirname, "../../.auth/admin.json");
export const AGENT_FILE = path.join(__dirname, "../../.auth/agent.json");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var "${name}". ` +
        `Ensure server/.env.test is populated (see server/.env.test.example).`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Admin login
// ---------------------------------------------------------------------------
setup("authenticate as admin", async ({ page }) => {
  const email = requireEnv("SEED_ADMIN_EMAIL");
  const password = requireEnv("SEED_ADMIN_PASSWORD");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for navigation to the home route that only authenticated users see.
  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  await page.context().storageState({ path: ADMIN_FILE });
});

// ---------------------------------------------------------------------------
// Agent login
// ---------------------------------------------------------------------------
setup("authenticate as agent", async ({ page }) => {
  const email = requireEnv("SEED_AGENT_EMAIL");
  const password = requireEnv("SEED_AGENT_PASSWORD");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("/");
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

  await page.context().storageState({ path: AGENT_FILE });
});

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
 *
 * Sessions are preserved between runs: if the existing storage state file
 * contains a cookie that is still accepted by /api/me, login is skipped
 * entirely so the auth files stay stable.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { ADMIN_FILE, AGENT_FILE } from "./paths";

export { ADMIN_FILE, AGENT_FILE };

// Load test env vars so the setup knows the seeded credentials.
const envTestPath = path.resolve(__dirname, "../../../server/.env.test");
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}

const SERVER_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

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

/**
 * Returns true if the session cookie stored in the given storage state file
 * is still accepted by the server (GET /api/me returns 200).
 * Returns false if the file doesn't exist, has no session cookie, or the
 * server rejects the session.
 */
async function isSessionValid(storageStateFile: string): Promise<boolean> {
  if (!fs.existsSync(storageStateFile)) return false;

  try {
    const { cookies } = JSON.parse(fs.readFileSync(storageStateFile, "utf-8"));
    const sessionCookie = cookies?.find(
      (c: { name: string }) => c.name === "better-auth.session_token"
    );
    if (!sessionCookie) return false;

    const res = await fetch(`${SERVER_URL}/api/me`, {
      headers: { Cookie: `better-auth.session_token=${sessionCookie.value}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Admin login
// ---------------------------------------------------------------------------
setup("authenticate as admin", async ({ page }) => {
  if (await isSessionValid(ADMIN_FILE)) {
    console.log("[auth-setup] Admin session still valid — skipping login");
    return;
  }

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
  if (await isSessionValid(AGENT_FILE)) {
    console.log("[auth-setup] Agent session still valid — skipping login");
    return;
  }

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

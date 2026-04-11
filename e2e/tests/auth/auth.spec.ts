/**
 * auth.spec.ts
 *
 * End-to-end tests for the authentication feature of the ticket management system.
 *
 * Covers:
 *   - Login form client-side validation (empty fields, invalid email format)
 *   - Successful login for Admin and Agent roles
 *   - Server-side authentication errors (wrong password, wrong email)
 *   - Redirect to "/" for already-authenticated users visiting "/login"
 *   - Route protection: unauthenticated access to "/" and "/users" redirects to "/login"
 *   - Unknown routes redirect to "/" (and then on to "/login" when unauthenticated)
 *   - Role-based access: only Admin can reach "/users"; Agent is redirected to "/"
 *   - Navbar: Admin sees "Users" link; Agent does not
 *   - Logout: session cleared, redirected to "/login", subsequent navigation requires re-auth
 */

import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { ADMIN_FILE, AGENT_FILE } from "./paths";
import { login, loginAndWait, logout } from "./helpers";

// ---------------------------------------------------------------------------
// Load seeded credentials from the test env file so tests can drive the login
// form directly (in scenarios where we cannot rely on stored storage state).
// ---------------------------------------------------------------------------
const envTestPath = path.resolve(__dirname, "../../../server/.env.test");
if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "";
const AGENT_EMAIL = process.env.SEED_AGENT_EMAIL ?? "";
const AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD ?? "";

// ---------------------------------------------------------------------------
// 1. Login form validation — no session required
// ---------------------------------------------------------------------------
test.describe("Login form validation", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should show errors for both fields when the form is submitted empty", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should show an email validation error when the email format is invalid", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("somepassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).not.toBeVisible();
  });

  test("should show a password validation error when the password field is empty", async ({
    page,
  }) => {
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(
      page.getByText("Enter a valid email address")
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Login flow — credentials-driven (no pre-existing session)
// ---------------------------------------------------------------------------
test.describe("Login flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should redirect admin to '/' and show Logout button on valid credentials", async ({
    page,
  }) => {
    await loginAndWait(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("should redirect agent to '/' and show Logout button on valid credentials", async ({
    page,
  }) => {
    await loginAndWait(page, AGENT_EMAIL, AGENT_PASSWORD);

    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("should show 'Invalid email or password' and stay on '/login' with a wrong password", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, "definitely-wrong-password");

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("should show 'Invalid email or password' and stay on '/login' with a wrong email", async ({
    page,
  }) => {
    await login(page, "nonexistent@example.com", "somepassword");

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("should immediately redirect an already-authenticated user visiting '/login' to '/'", async ({
    page,
  }) => {
    await loginAndWait(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/login");
    await page.waitForURL("/");
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Route protection — unauthenticated access
// ---------------------------------------------------------------------------
test.describe("Route protection for unauthenticated users", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should redirect to '/login' when visiting '/' without a session", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should redirect to '/login' when visiting '/users' without a session", async ({
    page,
  }) => {
    await page.goto("/users");
    await page.waitForURL("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should redirect an unknown route to '/login' when unauthenticated", async ({
    page,
  }) => {
    // The catch-all route redirects to "/" which then redirects to "/login"
    // because the user is unauthenticated.
    await page.goto("/this-route-does-not-exist");
    await page.waitForURL("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Role-based access
// ---------------------------------------------------------------------------
test.describe("Role-based access — Admin", () => {
  test.use({ storageState: ADMIN_FILE });

  test("should allow admin to visit '/users' without being redirected", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("should show the 'Users' nav link for admin", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });
});

test.describe("Role-based access — Agent", () => {
  test.use({ storageState: AGENT_FILE });

  test("should redirect agent from '/users' back to '/'", async ({ page }) => {
    await page.goto("/users");
    await page.waitForURL("/");
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("should NOT show the 'Users' nav link for agent", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Logout
// ---------------------------------------------------------------------------
test.describe("Logout", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should redirect to '/login' and remove the Logout button after clicking Logout", async ({
    page,
  }) => {
    await loginAndWait(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await logout(page);

    await expect(
      page.getByRole("button", { name: "Logout" })
    ).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("Logout — re-authentication check", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should require re-authentication when visiting '/' after logout", async ({
    page,
  }) => {
    await loginAndWait(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await logout(page);

    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});

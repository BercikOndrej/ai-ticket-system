import { type Page } from "@playwright/test";

/**
 * Navigates to /login, fills in credentials, and submits the form.
 * Does NOT wait for a redirect — call `page.waitForURL` afterwards when needed.
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/**
 * Logs in and waits until the app lands on "/".
 * Use this when you need an authenticated session established before the test body runs.
 */
export async function loginAndWait(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await login(page, email, password);
  await page.waitForURL("/");
}

/**
 * Clicks the Logout button and waits until the app redirects to "/login".
 */
export async function logout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("/login");
}

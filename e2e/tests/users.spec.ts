/**
 * users.spec.ts
 *
 * End-to-end integration tests for the user management feature.
 *
 * Covers:
 *   - List users: Admin sees seeded admin email in the table
 *   - Create user: Admin fills the dialog, submits, new row appears in table, toast shown
 *   - Edit user: Admin clicks pencil icon, changes name, submits, updated name appears, toast shown
 *   - Delete user: Admin clicks trash icon, confirms AlertDialog, row disappears, toast shown
 *   - Admin role protection: delete button is never rendered for Admin-role rows
 *
 * All tests run as Admin (the only role that can reach /users).
 * Each test creates its own users via the UI to stay independent.
 * No API mocking — every assertion exercises the full BE+FE stack.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_USERS } from "../fixtures/auth";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Open the Create User dialog and fill every field, then click Create User. */
async function createUserViaUI(
  page: import("@playwright/test").Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: "Create User" })).toBeVisible();

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/users") && res.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Create User" }).click(),
  ]);

  expect(response.status()).toBe(201);
}

// ---------------------------------------------------------------------------
// 0. List users
// ---------------------------------------------------------------------------
test.describe("List users", () => {
  test("should display the seeded admin user's email in the table", async ({ page }) => {
    await loginAsAdmin(page);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/users") && res.request().method() === "GET",
      ),
      page.goto("/users"),
    ]);

    expect(response.status()).toBe(200);
    await expect(page.getByRole("cell", { name: TEST_USERS.admin.email })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 1. Create user
// ---------------------------------------------------------------------------
test.describe("Create user", () => {
  test("should add the new user to the table and show a success toast", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");

    const name = `testuser${Date.now()}`;
    const email = `testuser-${Date.now()}@e2e.local`;

    await createUserViaUI(page, name, email, "Password123");

    // Dialog closes after success
    await expect(page.getByRole("heading", { name: "Create User" })).not.toBeVisible();

    // Toast notification
    await expect(page.getByText("User created.")).toBeVisible();

    // New row appears in the table
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Edit user
// ---------------------------------------------------------------------------
test.describe("Edit user", () => {
  test("should update the user name in the table and show a success toast", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");

    // Create a user to edit so the test is self-contained
    const originalName = `editTarget${Date.now()}`;
    const email = `edit-target-${Date.now()}@e2e.local`;
    await createUserViaUI(page, originalName, email, "Password123");

    // Wait for the toast from creation to clear before proceeding
    await expect(page.getByText("User created.")).toBeVisible();

    // Click the edit (pencil) button for the row we just created
    await page.getByRole("button", { name: `Edit ${originalName}` }).click();

    await expect(page.getByRole("heading", { name: "Edit User" })).toBeVisible();

    const updatedName = `${originalName}Updated`;
    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill(updatedName);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/users/") && res.request().method() === "PATCH",
      ),
      page.getByRole("button", { name: "Save Changes" }).click(),
    ]);

    expect(response.status()).toBe(200);

    // Dialog closes
    await expect(page.getByRole("heading", { name: "Edit User" })).not.toBeVisible();

    // Toast notification
    await expect(page.getByText("User updated.")).toBeVisible();

    // Updated name is reflected in the table
    await expect(page.getByRole("cell", { name: updatedName, exact: true })).toBeVisible();

    // Original name is gone
    await expect(page.getByRole("cell", { name: originalName, exact: true })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Delete user
// ---------------------------------------------------------------------------
test.describe("Delete user", () => {
  test("should remove the user from the table and show a success toast", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");

    // Create a dedicated user so deletion does not affect other tests
    const name = `deleteTarget${Date.now()}`;
    const email = `delete-target-${Date.now()}@e2e.local`;
    await createUserViaUI(page, name, email, "Password123");

    await expect(page.getByText("User created.")).toBeVisible();

    // Click the delete (trash) icon for that user
    await page.getByRole("button", { name: `Delete ${name}` }).click();

    // AlertDialog confirmation
    await expect(page.getByRole("heading", { name: `Delete ${name}?` })).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/users/") && res.request().method() === "DELETE",
      ),
      page.getByRole("button", { name: "Delete" }).click(),
    ]);

    expect(response.status()).toBe(204);

    // Toast notification
    await expect(page.getByText("User deleted.")).toBeVisible();

    // Row is gone from the table
    await expect(page.getByRole("cell", { name })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Admin users cannot be deleted
// ---------------------------------------------------------------------------
test.describe("Admin role protection", () => {
  test("should not render a delete button for Admin-role users", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");

    // Collect all rows that have an Admin badge
    const adminRows = page.getByRole("row").filter({
      has: page.getByRole("cell").filter({ hasText: "Admin" }),
    });

    // There must be at least one admin row for this assertion to be meaningful
    await expect(adminRows.first()).toBeVisible();

    // For every admin row, confirm there is no Delete button
    const count = await adminRows.count();
    for (let i = 0; i < count; i++) {
      const row = adminRows.nth(i);
      const adminName = await row.getByRole("cell").first().textContent();
      if (adminName) {
        await expect(
          page.getByRole("button", { name: `Delete ${adminName.trim()}` }),
        ).not.toBeVisible();
      }
    }
  });
});

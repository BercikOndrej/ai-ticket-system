import { test, expect } from "@playwright/test";
import {
  TEST_USERS,
  login,
  loginAsAdmin,
  logout,
  expectLoginPage,
  expectHomePage,
} from "../fixtures/auth";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
    });

    test("should login successfully with valid admin credentials", async ({ page }) => {
      await login(page, TEST_USERS.admin);

      await expectHomePage(page);

      await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();
    });

    test("should redirect to home if already authenticated", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/login");

      await expectHomePage(page);
    });
  });

  test.describe("Session Persistence", () => {
    test("should maintain session after page reload", async ({ page }) => {
      await loginAsAdmin(page);

      await page.reload();

      await expectHomePage(page);
      await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();
    });

    test("should maintain session when navigating directly to protected route", async ({
      page,
    }) => {
      await loginAsAdmin(page);

      await page.goto("/users");

      await expect(page).toHaveURL("/users");
      await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    });

    test("should maintain session across multiple page navigations", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/users");
      await expect(page).toHaveURL("/users");

      await page.goto("/");
      await expectHomePage(page);

      await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();
    });
  });

  test.describe("Logout", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test("should logout successfully", async ({ page }) => {
      await logout(page);

      await expectLoginPage(page);
    });

    test("should not be able to access protected routes after logout", async ({ page }) => {
      await logout(page);

      await page.goto("/");

      await expectLoginPage(page);
    });

    test("should not be able to access admin routes after logout", async ({ page }) => {
      await logout(page);

      await page.goto("/users");

      await expectLoginPage(page);
    });

    test("should require login again after logout", async ({ page }) => {
      await logout(page);

      await page.goto("/");

      await expectLoginPage(page);

      await loginAsAdmin(page);

      await expectHomePage(page);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated user to login when accessing root", async ({ page }) => {
      await page.goto("/");
      await expectLoginPage(page);
    });

    test("should redirect unauthenticated user to login when accessing admin route", async ({
      page,
    }) => {
      await page.goto("/users");
      await expectLoginPage(page);
    });

    test("should redirect unauthenticated user from home to login", async ({ page }) => {
      await page.goto("/");

      await expectLoginPage(page);
    });

    test("should allow access to protected route after login", async ({ page }) => {
      await page.goto("/");
      await expectLoginPage(page);

      await loginAsAdmin(page);

      await expectHomePage(page);
    });
  });

  test.describe("Admin Route Protection", () => {
    test("should allow admin to access admin routes", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/users");

      await expect(page).toHaveURL("/users");
      await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    });

    test("should show 'Users' link in navigation for admin", async ({ page }) => {
      await loginAsAdmin(page);

      await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
    });

    test("should navigate to users page when clicking Users link", async ({ page }) => {
      await loginAsAdmin(page);

      await page.getByRole("link", { name: /users/i }).click();

      await expect(page).toHaveURL("/users");
      await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
    });

    test("should maintain access to home route while on admin route", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/users");
      await expect(page).toHaveURL("/users");

      await page.goto("/");

      await expectHomePage(page);
    });

    // Note: Agent role-based tests require agent user in seed.
    // Agent should not see Users link and should be redirected from /users.
  });

  test.describe("URL Handling", () => {
    test("should redirect unknown routes to home for authenticated user", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/unknown-route");

      await expectHomePage(page);
    });

    test("should redirect unknown routes to login for unauthenticated user", async ({ page }) => {
      await page.goto("/unknown-route");

      await expectLoginPage(page);
    });
  });

  test.describe("Navigation Bar", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test("should display correct user information", async ({ page }) => {
      await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();

      await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
    });

    test("should display SimpleTickets branding", async ({ page }) => {
      await expect(page.getByText("SimpleTickets").first()).toBeVisible();
    });

    test("should show navigation appropriate to user role", async ({ page }) => {
      await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
    });
  });
});

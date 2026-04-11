import { test, expect } from "@playwright/test";
import {
  TEST_USERS,
  login,
  loginAsAdmin,
  loginAsAgent,
  logout,
  expectLoginPage,
  expectHomePage,
} from "../fixtures/auth";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
    });

    test("should display login form with all elements", async ({ page }) => {
      await expect(page.getByText("Ticket System")).toBeVisible();
      await expect(page.getByText(/sign in to your account/i)).toBeVisible();

      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();

      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should login successfully with valid admin credentials", async ({ page }) => {
      await login(page, TEST_USERS.admin);

      await expectHomePage(page);

      await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();
    });

    test("should show error with invalid email format", async ({ page }) => {
      await page.getByLabel("Email").fill("invalid-email");
      await page.getByLabel("Password").fill("password123");
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText("Enter a valid email address")).toBeVisible();

      await expectLoginPage(page);
    });

    test("should show error with empty email", async ({ page }) => {
      await page.getByLabel("Password").fill("password123");
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText("Enter a valid email address")).toBeVisible();

      await expectLoginPage(page);
    });

    test("should show error with empty password", async ({ page }) => {
      await page.getByLabel("Email").fill(TEST_USERS.admin.email);
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText("Password is required")).toBeVisible();

      await expectLoginPage(page);
    });

    test("should show error with empty email and password", async ({ page }) => {
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText("Enter a valid email address")).toBeVisible();
      await expect(page.getByText("Password is required")).toBeVisible();

      await expectLoginPage(page);
    });

    test("should show error with invalid email (non-existent user)", async ({ page }) => {
      await login(page, {
        email: "nonexistent@example.com",
        password: "password123",
      });

      await expect(page.getByText(/invalid email or password/i)).toBeVisible();

      await expectLoginPage(page);
    });

    test("should show error with incorrect password", async ({ page }) => {
      await login(page, {
        email: TEST_USERS.admin.email,
        password: "wrongpassword",
      });

      await expect(page.getByText(/invalid email or password/i)).toBeVisible();

      await expectLoginPage(page);
    });

    test("should show loading state during login", async ({ page }) => {
      let resolveDelay!: () => void;
      const delay = new Promise<void>((resolve) => {
        resolveDelay = resolve;
      });

      await page.route("**/api/auth/sign-in/email", async (route) => {
        await delay;
        await route.continue();
      });

      await page.getByLabel("Email").fill(TEST_USERS.admin.email);
      await page.getByLabel("Password").fill(TEST_USERS.admin.password);
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText("Signing in...")).toBeVisible();

      resolveDelay();
      await page.unrouteAll({ behavior: "ignoreErrors" });
    });

    test("should redirect to home if already authenticated", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/login");

      await expectHomePage(page);
    });

    test("should clear server error on new submission", async ({ page }) => {
      await login(page, {
        email: TEST_USERS.admin.email,
        password: "wrongpassword",
      });

      await expect(page.getByText(/invalid email or password/i)).toBeVisible();

      await page.getByLabel("Email").clear();
      await page.getByLabel("Password").clear();
      await login(page, TEST_USERS.admin);

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

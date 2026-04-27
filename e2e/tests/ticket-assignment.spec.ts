import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsAgent, TEST_USERS } from "../fixtures/auth";

const ADMIN_STATUS_SUBJECT = "Cannot log in to my account";
const ADMIN_CATEGORY_SUBJECT = "Request: Add a dark mode to the platform";
const ADMIN_ASSIGN_SUBJECT = "Cannot add a new payment method";
const ADMIN_UNASSIGN_SUBJECT = "Sign-up email not received";
const AGENT_ASSIGN_SUBJECT = "How do I switch from monthly to annual billing?";
const UNASSIGNED_LABEL = "Unassigned";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAgentOptionName() {
  return new RegExp(
    `${escapeRegex(TEST_USERS.agent.name)}.*${escapeRegex(TEST_USERS.agent.email)}`,
    "i",
  );
}

function isTicketPatchResponse(url: string, method: string) {
  return /\/api\/tickets\/\d+$/.test(url) && method === "PATCH";
}

async function openTicketFromList(page: Page, subject: string) {
  await page.getByRole("link", { name: "Tickets", exact: true }).click();
  await expect(page).toHaveURL("/tickets");

  await page.getByLabel("Search by subject").fill(subject);

  const ticketLink = page.getByRole("link", { name: subject, exact: true });
  await expect(ticketLink).toBeVisible();
  await ticketLink.click();

  await page.waitForURL(/\/tickets\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: subject })).toBeVisible();
}

async function expectAssignmentValue(page: Page, value: string) {
  await expect(page.getByRole("combobox", { name: "Assign ticket" })).toContainText(value);
}

async function expectTicketFieldValue(page: Page, label: string, value: string) {
  await expect(page.getByRole("combobox", { name: label })).toContainText(value);
}

async function updateTicketSelect(
  page: Page,
  fieldLabel: string,
  optionName: string | RegExp,
  expectedValue: string,
  successMessage: string,
) {
  const select = page.getByRole("combobox", { name: fieldLabel });

  await select.click();
  await expect(page.getByRole("option", { name: optionName })).toBeVisible();

  const [response] = await Promise.all([
    page.waitForResponse((res) => isTicketPatchResponse(res.url(), res.request().method())),
    page.getByRole("option", { name: optionName }).click(),
  ]);

  expect(response.status()).toBe(200);
  await expectTicketFieldValue(page, fieldLabel, expectedValue);
  await expect(page.getByText(successMessage)).toBeVisible();

  return response.json();
}

async function assignTicketToSeededAgent(page: Page) {
  const assignmentSelect = page.getByRole("combobox", { name: "Assign ticket" });

  await assignmentSelect.click();
  await expect(page.getByRole("option", { name: getAgentOptionName() })).toBeVisible();

  const [response] = await Promise.all([
    page.waitForResponse((res) => isTicketPatchResponse(res.url(), res.request().method())),
    page.getByRole("option", { name: getAgentOptionName() }).click(),
  ]);

  expect(response.status()).toBe(200);
  await expectAssignmentValue(page, TEST_USERS.agent.name);
  await expect(assignmentSelect).not.toContainText(TEST_USERS.agent.email);
  await expect(page.getByText("Ticket assigned.")).toBeVisible();

  return response.json();
}

test.describe("Ticket assignment", () => {
  test("admin can change a ticket status and the selection persists after reload", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await openTicketFromList(page, ADMIN_STATUS_SUBJECT);

    await expectTicketFieldValue(page, "Ticket status", "Open");

    const updatedTicket = await updateTicketSelect(
      page,
      "Ticket status",
      "Resolved",
      "Resolved",
      "Ticket status updated.",
    );
    expect(updatedTicket.status).toBe("Resolved");

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: ADMIN_STATUS_SUBJECT })).toBeVisible();
    await expectTicketFieldValue(page, "Ticket status", "Resolved");
  });

  test("admin can change a ticket category and the selection persists after reload", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await openTicketFromList(page, ADMIN_CATEGORY_SUBJECT);

    await expectTicketFieldValue(page, "Ticket category", "Request");

    const updatedTicket = await updateTicketSelect(
      page,
      "Ticket category",
      "Refund",
      "Refund",
      "Ticket category updated.",
    );
    expect(updatedTicket.classification).toBe("Refund");

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: ADMIN_CATEGORY_SUBJECT })).toBeVisible();
    await expectTicketFieldValue(page, "Ticket category", "Refund");
  });

  test("admin can assign a ticket to an active agent and the selection persists after reload", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await openTicketFromList(page, ADMIN_ASSIGN_SUBJECT);

    await expectAssignmentValue(page, UNASSIGNED_LABEL);

    const updatedTicket = await assignTicketToSeededAgent(page);
    expect(updatedTicket.assignedToAgent).toMatchObject({
      name: TEST_USERS.agent.name,
      email: TEST_USERS.agent.email,
    });

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: ADMIN_ASSIGN_SUBJECT })).toBeVisible();
    await expectAssignmentValue(page, TEST_USERS.agent.name);
  });

  test("admin can unassign a ticket after assigning it", async ({ page }) => {
    await loginAsAdmin(page);
    await openTicketFromList(page, ADMIN_UNASSIGN_SUBJECT);

    await assignTicketToSeededAgent(page);

    const assignmentSelect = page.getByRole("combobox", { name: "Assign ticket" });
    await assignmentSelect.click();

    const [response] = await Promise.all([
      page.waitForResponse((res) => isTicketPatchResponse(res.url(), res.request().method())),
      page.getByRole("option", { name: UNASSIGNED_LABEL, exact: true }).click(),
    ]);

    expect(response.status()).toBe(200);
    const updatedTicket = await response.json();
    expect(updatedTicket.assignedToAgent).toBeNull();
    expect(updatedTicket.assignedToAgentId).toBeNull();

    await expect(page.getByText("Ticket unassigned.")).toBeVisible();
    await expectAssignmentValue(page, UNASSIGNED_LABEL);

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: ADMIN_UNASSIGN_SUBJECT })).toBeVisible();
    await expectAssignmentValue(page, UNASSIGNED_LABEL);
  });

  test("agent can assign a ticket from the detail page", async ({ page }) => {
    await loginAsAgent(page);
    await openTicketFromList(page, AGENT_ASSIGN_SUBJECT);

    await expectAssignmentValue(page, UNASSIGNED_LABEL);

    const updatedTicket = await assignTicketToSeededAgent(page);
    expect(updatedTicket.assignedToAgent).toMatchObject({
      name: TEST_USERS.agent.name,
      email: TEST_USERS.agent.email,
    });

    await page.reload();

    await expect(page.getByRole("heading", { level: 1, name: AGENT_ASSIGN_SUBJECT })).toBeVisible();
    await expectAssignmentValue(page, TEST_USERS.agent.name);
  });
});

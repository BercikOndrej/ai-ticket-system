/**
 * ticket-reply.spec.ts
 *
 * End-to-end tests for the ticket reply flow.
 *
 * Covers:
 *   - Agent submits a reply: POST /api/tickets/:id/replies returns 201,
 *     "Reply sent." toast appears, textarea clears, reply text and "Conversation"
 *     section become visible in the conversation.
 *   - Admin can do the same.
 *   - Send button is disabled when the textarea is empty.
 */

import { test, expect, type Page } from "@playwright/test";
import { loginAsAdmin, loginAsAgent } from "../fixtures/auth";

// Different tickets for each role test to avoid inter-test state collisions.
const AGENT_REPLY_SUBJECT = "Video player not loading on mobile";
const ADMIN_REPLY_SUBJECT = "Quiz results not saving";

function isReplyPostResponse(url: string, method: string): boolean {
  return /\/api\/tickets\/\d+\/replies$/.test(url) && method === "POST";
}

async function openTicketFromList(page: Page, subject: string): Promise<void> {
  await page.getByRole("link", { name: "Tickets", exact: true }).click();
  await expect(page).toHaveURL("/tickets");

  await page.getByLabel("Search by subject").fill(subject);

  const ticketLink = page.getByRole("link", { name: subject, exact: true });
  await expect(ticketLink).toBeVisible();
  await ticketLink.click();

  await page.waitForURL(/\/tickets\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name: subject })).toBeVisible();
}

test.describe("Ticket reply", () => {
  test("agent can send a reply and it appears in the conversation", async ({ page }) => {
    await loginAsAgent(page);
    await openTicketFromList(page, AGENT_REPLY_SUBJECT);

    const textarea = page.getByRole("textbox");
    const replyText =
      "Thank you for reaching out. We are investigating the mobile playback issue.";

    await textarea.fill(replyText);

    const [response] = await Promise.all([
      page.waitForResponse((res) => isReplyPostResponse(res.url(), res.request().method())),
      page.getByRole("button", { name: /send reply/i }).click(),
    ]);

    expect(response.status()).toBe(201);

    await expect(page.getByText("Reply sent.")).toBeVisible();
    await expect(textarea).toHaveValue("");
    await expect(page.getByText("Conversation")).toBeVisible();
    await expect(page.getByText(replyText)).toBeVisible();
  });

  test("admin can send a reply and it appears in the conversation", async ({ page }) => {
    await loginAsAdmin(page);
    await openTicketFromList(page, ADMIN_REPLY_SUBJECT);

    const textarea = page.getByRole("textbox");
    const replyText =
      "We have received your report about quiz results not saving. Our team is investigating.";

    await textarea.fill(replyText);

    const [response] = await Promise.all([
      page.waitForResponse((res) => isReplyPostResponse(res.url(), res.request().method())),
      page.getByRole("button", { name: /send reply/i }).click(),
    ]);

    expect(response.status()).toBe(201);

    await expect(page.getByText("Reply sent.")).toBeVisible();
    await expect(textarea).toHaveValue("");
    await expect(page.getByText("Conversation")).toBeVisible();
    await expect(page.getByText(replyText)).toBeVisible();
  });

  test("send button is disabled when textarea is empty", async ({ page }) => {
    await loginAsAdmin(page);
    await openTicketFromList(page, ADMIN_REPLY_SUBJECT);

    await expect(page.getByRole("button", { name: /send reply/i })).toBeDisabled();
  });
});

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TicketStatus, TicketClassification } from "core/enums";
import { type TicketDetail } from "@/types/ticket";
import { render } from "@/test/render";
import { classificationLabels } from "@/lib/ticket-helpers";
import TicketDetailPage from "./TicketDetailPage";

vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn().mockReturnValue({ data: { user: { name: "Test Agent" } } }),
}));

import apiClient from "@/lib/api-client";
import { toast } from "sonner";

const mockGet = vi.mocked(apiClient.get);
const mockPatch = vi.mocked(apiClient.patch);

// Full TicketDetail shape including new assignedToAgent field.
const BASE_TICKET = {
  id: 42,
  subject: "Cannot access my course",
  fromName: "Alice Smith",
  fromEmail: "alice@example.com",
  status: TicketStatus.Open,
  classification: TicketClassification.TechnicalQuestion,
  createdAt: "2026-01-10T08:00:00.000Z",
  updatedAt: "2026-01-11T09:00:00.000Z",
  body: "Hello, I cannot access my course after purchase.",
  bodyHtml: "<p>Hello, I cannot access my course after purchase.</p>",
  assignedToAgentId: null,
  assignedToAgent: null,
  replies: [],
};

const TEST_AGENT = {
  id: "agent-abc-123",
  name: "Bob Agent",
  email: "bob@example.com",
};

/**
 * mockGet implementation for dual-endpoint setup:
 * - /api/users/assignable-agents → agents list (or empty)
 * - everything else → ticket data
 */
function setupGetMocks(ticket: TicketDetail = BASE_TICKET, agents: typeof TEST_AGENT[] = []) {
  mockGet.mockImplementation((url: string) => {
    if (url.includes("assignable-agents")) {
      return Promise.resolve({ data: agents });
    }
    return Promise.resolve({ data: ticket });
  });
}

function renderPage(id = "42") {
  return render(
    <MemoryRouter initialEntries={[`/tickets/${id}`]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketDetailPage", () => {
  describe("Loading state", () => {
    it("renders skeleton elements while ticket query is pending", () => {
      // Neither promise ever resolves — keeps both queries in isPending state.
      mockGet.mockReturnValue(new Promise(() => {}));
      renderPage();
      const skeletons = document.querySelectorAll("[class*='animate-pulse']");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error state", () => {
    it("renders ErrorAlert with title 'Failed to load ticket' when ticket query rejects", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));
      renderPage();
      expect(await screen.findByText("Failed to load ticket")).toBeInTheDocument();
    });

    it("renders the error description when ticket query fails", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));
      renderPage();
      expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
    });
  });

  describe("Success state — ticket content", () => {
    beforeEach(() => {
      setupGetMocks();
    });

    it("renders the ticket subject in an h1", async () => {
      renderPage();
      expect(
        await screen.findByRole("heading", { level: 1, name: "Cannot access my course" }),
      ).toBeInTheDocument();
    });

    it("renders the sender name", async () => {
      renderPage();
      expect(await screen.findByText("Alice Smith")).toBeInTheDocument();
    });

    it("renders the sender email", async () => {
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
    });

    it("renders the received date via toLocaleString", async () => {
      renderPage();
      const expected = new Date("2026-01-10T08:00:00.000Z").toLocaleString();
      expect(await screen.findByText(expected)).toBeInTheDocument();
    });

    it("renders message body via dangerouslySetInnerHTML when bodyHtml is present", async () => {
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const proseDiv = document.querySelector(".prose");
      expect(proseDiv).toBeInTheDocument();
      expect(proseDiv?.innerHTML).toContain("Hello, I cannot access my course after purchase.");
    });

    it("does not render a pre element when bodyHtml is present", async () => {
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      expect(document.querySelector("pre")).not.toBeInTheDocument();
    });
  });

  describe("Success state — plain text body", () => {
    it("renders body text in a pre element when bodyHtml is null", async () => {
      setupGetMocks({ ...BASE_TICKET, bodyHtml: null });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const pre = document.querySelector("pre");
      expect(pre).toBeInTheDocument();
      expect(pre?.textContent).toContain("Hello, I cannot access my course after purchase.");
    });

    it("does not render the prose div when bodyHtml is null", async () => {
      setupGetMocks({ ...BASE_TICKET, bodyHtml: null });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      expect(document.querySelector(".prose")).not.toBeInTheDocument();
    });
  });

  describe("Success state — sidebar selects", () => {
    it("status select shows current status value", async () => {
      setupGetMocks({ ...BASE_TICKET, status: TicketStatus.Open });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const statusTrigger = screen.getByRole("combobox", { name: /ticket status/i });
      expect(statusTrigger).toHaveTextContent(TicketStatus.Open);
    });

    it("category select shows human-readable classification label", async () => {
      setupGetMocks({ ...BASE_TICKET, classification: TicketClassification.TechnicalQuestion });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const categoryTrigger = screen.getByRole("combobox", { name: /ticket category/i });
      expect(categoryTrigger).toHaveTextContent(
        classificationLabels[TicketClassification.TechnicalQuestion],
      );
    });

    it("assign ticket select shows 'Unassigned' when assignedToAgent is null", async () => {
      setupGetMocks({ ...BASE_TICKET, assignedToAgent: null, assignedToAgentId: null });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const assignTrigger = screen.getByRole("combobox", { name: /assign ticket/i });
      expect(assignTrigger).toHaveTextContent(/unassigned/i);
    });

    it("assign ticket select shows agent name when assignedToAgent is set", async () => {
      setupGetMocks(
        {
          ...BASE_TICKET,
          assignedToAgentId: TEST_AGENT.id,
          assignedToAgent: TEST_AGENT,
        },
        [TEST_AGENT],
      );
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const assignTrigger = screen.getByRole("combobox", { name: /assign ticket/i });
      expect(assignTrigger).toHaveTextContent(TEST_AGENT.name);
    });
  });

  describe("Back link", () => {
    it("renders a link back to /tickets", () => {
      // Back link is always rendered regardless of load state.
      mockGet.mockReturnValue(new Promise(() => {}));
      renderPage();
      const link = screen.getByRole("link", { name: /back to tickets/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/tickets");
    });
  });

  describe("API call", () => {
    it("fetches the ticket from the correct endpoint using the route id", async () => {
      setupGetMocks();
      renderPage("42");
      await screen.findByRole("heading", { level: 1 });
      expect(mockGet).toHaveBeenCalledWith("/api/tickets/42");
    });
  });

  describe("Mutation — status change", () => {
    it("calls apiClient.patch with the new status when select value changes", async () => {
      setupGetMocks({ ...BASE_TICKET, status: TicketStatus.Open });
      mockPatch.mockResolvedValue({ data: { ...BASE_TICKET, status: TicketStatus.Resolved } });

      const user = userEvent.setup();
      renderPage("42");
      await screen.findByRole("heading", { level: 1 });

      // Open the status combobox and pick "Resolved".
      const statusTrigger = screen.getByRole("combobox", { name: /ticket status/i });
      await user.click(statusTrigger);

      const resolvedOption = await screen.findByRole("option", { name: TicketStatus.Resolved });
      await user.click(resolvedOption);

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalledWith("/api/tickets/42", { status: TicketStatus.Resolved });
      });
    });

    it("calls toast.success after a successful status patch", async () => {
      setupGetMocks({ ...BASE_TICKET, status: TicketStatus.Open });
      mockPatch.mockResolvedValue({ data: { ...BASE_TICKET, status: TicketStatus.Resolved } });

      const user = userEvent.setup();
      renderPage("42");
      await screen.findByRole("heading", { level: 1 });

      const statusTrigger = screen.getByRole("combobox", { name: /ticket status/i });
      await user.click(statusTrigger);

      const resolvedOption = await screen.findByRole("option", { name: TicketStatus.Resolved });
      await user.click(resolvedOption);

      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Ticket status updated.");
      });
    });
  });
});

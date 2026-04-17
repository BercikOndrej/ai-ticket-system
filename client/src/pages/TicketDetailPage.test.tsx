import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TicketStatus, TicketClassification } from "core/enums";
import { render } from "@/test/render";
import TicketDetailPage from "./TicketDetailPage";

// Mock apiClient so tests never hit the network.
vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "@/lib/api-client";

const mockGet = vi.mocked(apiClient.get);

const BASE_TICKET = {
  id: 1,
  subject: "Cannot access my course",
  fromName: "Alice Smith",
  fromEmail: "alice@example.com",
  status: TicketStatus.Open,
  classification: TicketClassification.TechnicalQuestion,
  createdAt: "2026-01-10T08:00:00.000Z",
  updatedAt: "2026-01-11T09:00:00.000Z",
  body: "Hello, I cannot access my course after purchase.",
  bodyHtml: "<p>Hello, I cannot access my course after purchase.</p>",
  assignedToAgentId: "agent-abc-123",
};

function renderPage(id = "1") {
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
    it("renders skeleton elements while the query is pending", () => {
      // Never resolves — keeps isPending true.
      mockGet.mockReturnValue(new Promise(() => {}));
      renderPage();
      const skeletons = document.querySelectorAll("[class*='animate-pulse']");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error state", () => {
    it("renders ErrorAlert with title 'Failed to load ticket' when the query fails", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));
      renderPage();
      expect(await screen.findByText("Failed to load ticket")).toBeInTheDocument();
    });

    it("renders the error description message", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));
      renderPage();
      expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
    });
  });

  describe("Success state — full ticket with bodyHtml", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({ data: BASE_TICKET });
    });

    it("renders the ticket subject in an h1", async () => {
      renderPage();
      expect(
        await screen.findByRole("heading", { level: 1, name: "Cannot access my course" }),
      ).toBeInTheDocument();
    });

    it("renders the sender name and email", async () => {
      renderPage();
      expect(await screen.findByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
    });

    it("renders the status badge", async () => {
      renderPage();
      expect(await screen.findByText(TicketStatus.Open)).toBeInTheDocument();
    });

    it("renders the classification badge with human-readable label", async () => {
      renderPage();
      expect(await screen.findByText("Technical question")).toBeInTheDocument();
    });

    it("renders the assigned agent ID", async () => {
      renderPage();
      expect(await screen.findByText("agent-abc-123")).toBeInTheDocument();
    });

    it("renders the received date formatted via toLocaleString", async () => {
      renderPage();
      const expected = new Date("2026-01-10T08:00:00.000Z").toLocaleString();
      expect(await screen.findByText(expected)).toBeInTheDocument();
    });

    it("renders the message body via dangerouslySetInnerHTML when bodyHtml is present", async () => {
      renderPage();
      // Wait for data to load.
      await screen.findByRole("heading", { level: 1 });
      // The prose div container should be in the document.
      const proseDiv = document.querySelector(".prose");
      expect(proseDiv).toBeInTheDocument();
      expect(proseDiv?.innerHTML).toContain("Hello, I cannot access my course after purchase.");
    });

    it("does not render a <pre> element when bodyHtml is present", async () => {
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      expect(document.querySelector("pre")).not.toBeInTheDocument();
    });
  });

  describe("Success state — ticket with null bodyHtml", () => {
    it("renders body text in a <pre> element when bodyHtml is null", async () => {
      mockGet.mockResolvedValue({
        data: { ...BASE_TICKET, bodyHtml: null },
      });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      const pre = document.querySelector("pre");
      expect(pre).toBeInTheDocument();
      expect(pre?.textContent).toContain("Hello, I cannot access my course after purchase.");
    });

    it("does not render the prose div when bodyHtml is null", async () => {
      mockGet.mockResolvedValue({
        data: { ...BASE_TICKET, bodyHtml: null },
      });
      renderPage();
      await screen.findByRole("heading", { level: 1 });
      expect(document.querySelector(".prose")).not.toBeInTheDocument();
    });
  });

  describe("Success state — null classification", () => {
    it("shows '—' instead of a badge when classification is null", async () => {
      mockGet.mockResolvedValue({
        data: { ...BASE_TICKET, classification: null },
      });
      renderPage();
      expect(await screen.findByText("—")).toBeInTheDocument();
    });
  });

  describe("Success state — null assignedToAgentId", () => {
    it("shows 'Unassigned' when assignedToAgentId is null", async () => {
      mockGet.mockResolvedValue({
        data: { ...BASE_TICKET, assignedToAgentId: null },
      });
      renderPage();
      expect(await screen.findByText("Unassigned")).toBeInTheDocument();
    });
  });

  describe("Back link", () => {
    it("renders a link back to /tickets", async () => {
      mockGet.mockResolvedValue({ data: BASE_TICKET });
      renderPage();
      // The back link is always rendered — it doesn't depend on load state.
      const link = screen.getByRole("link", { name: /back to tickets/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/tickets");
    });
  });

  describe("API call", () => {
    it("fetches the ticket by id from the correct endpoint", async () => {
      mockGet.mockResolvedValue({ data: BASE_TICKET });
      renderPage("42");
      await screen.findByRole("heading", { level: 1 });
      expect(mockGet).toHaveBeenCalledWith("/api/tickets/42");
    });
  });
});

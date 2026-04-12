import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketStatus, TicketClassification } from "core/enums";
import { render } from "@/test/render";
import TicketsPage from "./TicketsPage";

// Mock apiClient so tests never hit the network.
vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "@/lib/api-client";

const mockGet = vi.mocked(apiClient.get);

const TICKETS = [
  {
    id: 1,
    subject: "Cannot access my course",
    fromName: "Alice Smith",
    fromEmail: "alice@example.com",
    status: TicketStatus.Open,
    classification: TicketClassification.TechnicalQuestion,
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: 2,
    subject: "Request a refund",
    fromName: "Bob Jones",
    fromEmail: "bob@example.com",
    status: TicketStatus.Resolved,
    classification: TicketClassification.Refund,
    createdAt: "2026-02-20T12:30:00.000Z",
  },
  {
    id: 3,
    subject: "General inquiry",
    fromName: "Carol White",
    fromEmail: "carol@example.com",
    status: TicketStatus.Closed,
    classification: null,
    createdAt: "2026-03-05T17:45:00.000Z",
  },
];

function renderPage() {
  return render(<TicketsPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsPage", () => {
  it("renders the page heading and description", async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
    expect(
      screen.getByText("All support tickets submitted by customers."),
    ).toBeInTheDocument();
  });

  it("renders all six table column headers", () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(screen.getByRole("columnheader", { name: /^#/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Subject/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^From/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Status/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Classification/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Received/ })).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    // Never resolves — keeps isPending true.
    mockGet.mockReturnValue(new Promise(() => {}));
    renderPage();
    // 5 skeleton rows × 6 cells = 30 skeleton elements.
    const skeletons = document.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders a row for each ticket with id, subject, name, and email", async () => {
    mockGet.mockResolvedValue({ data: TICKETS });
    renderPage();

    const aliceRow = await screen.findByRole("row", { name: /cannot access my course/i });
    expect(within(aliceRow).getByText("1")).toBeInTheDocument();
    expect(within(aliceRow).getByText("Alice Smith")).toBeInTheDocument();
    expect(within(aliceRow).getByText("alice@example.com")).toBeInTheDocument();

    const bobRow = screen.getByRole("row", { name: /request a refund/i });
    expect(within(bobRow).getByText("2")).toBeInTheDocument();
    expect(within(bobRow).getByText("Bob Jones")).toBeInTheDocument();
    expect(within(bobRow).getByText("bob@example.com")).toBeInTheDocument();
  });

  it("shows 'No tickets found.' when the list is empty", async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
  });

  it("shows error message when the request fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    renderPage();
    expect(await screen.findByText("Failed to load tickets.")).toBeInTheDocument();
  });

  it("renders the status badge with the correct label", async () => {
    mockGet.mockResolvedValue({ data: TICKETS });
    renderPage();

    // Each distinct status value should appear as a badge text.
    expect(await screen.findByText(TicketStatus.Open)).toBeInTheDocument();
    expect(screen.getByText(TicketStatus.Resolved)).toBeInTheDocument();
    expect(screen.getByText(TicketStatus.Closed)).toBeInTheDocument();
  });

  it("renders Open badge with default variant and Resolved badge with secondary variant", async () => {
    mockGet.mockResolvedValue({ data: TICKETS });
    renderPage();

    const openBadge = await screen.findByText(TicketStatus.Open);
    const resolvedBadge = screen.getByText(TicketStatus.Resolved);

    // shadcn Badge default variant has no "secondary" class; secondary does.
    expect(openBadge.className).not.toMatch(/secondary/);
    expect(resolvedBadge.className).toMatch(/secondary/);
  });

  it("renders the correct human-readable label for each classification", async () => {
    mockGet.mockResolvedValue({ data: TICKETS });
    renderPage();

    // TechnicalQuestion → "Technical question"
    expect(await screen.findByText("Technical question")).toBeInTheDocument();
    // Refund → "Refund"
    expect(screen.getByText("Refund")).toBeInTheDocument();
  });

  it("renders '—' when classification is null", async () => {
    mockGet.mockResolvedValue({ data: [TICKETS[2]] });
    renderPage();

    const carolRow = await screen.findByRole("row", { name: /general inquiry/i });
    expect(within(carolRow).getByText("—")).toBeInTheDocument();
  });

  it("formats the createdAt date using toLocaleDateString", async () => {
    mockGet.mockResolvedValue({ data: [TICKETS[0]] });
    renderPage();

    const expected = new Date("2026-01-10T08:00:00.000Z").toLocaleDateString();
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("fetches with default sort params (createdAt desc) on initial load", () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "createdAt", sortOrder: "desc" },
    });
  });

  it("renders search input and filter dropdowns", () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(screen.getByRole("textbox", { name: /search by subject/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /status filter/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /classification filter/i })).toBeInTheDocument();
  });

  it("re-fetches with search param when text is typed in the search input", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [] });
    renderPage();

    await user.type(screen.getByRole("textbox", { name: /search by subject/i }), "refund");

    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "createdAt", sortOrder: "desc", search: "refund" },
    });
  });

  it("omits search param when search input is empty", () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "createdAt", sortOrder: "desc" },
    });
  });

  it("re-fetches with status param when a status filter is selected", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [] });
    renderPage();

    await user.click(screen.getByRole("combobox", { name: /status filter/i }));
    await user.click(screen.getByRole("option", { name: TicketStatus.Open }));

    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "createdAt", sortOrder: "desc", status: TicketStatus.Open },
    });
  });

  it("re-fetches with classification param when a classification filter is selected", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [] });
    renderPage();

    await user.click(screen.getByRole("combobox", { name: /classification filter/i }));
    await user.click(await screen.findByRole("option", { name: /technical question/i }));

    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: {
        sortBy: "createdAt",
        sortOrder: "desc",
        classification: TicketClassification.TechnicalQuestion,
      },
    });
  });

  it("omits filter params from request when filters are reset to 'all'", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [] });
    renderPage();

    // Select a status then reset it back to "all".
    await user.click(screen.getByRole("combobox", { name: /status filter/i }));
    await user.click(await screen.findByRole("option", { name: TicketStatus.Resolved }));
    await user.click(screen.getByRole("combobox", { name: /status filter/i }));
    await user.click(await screen.findByRole("option", { name: /all statuses/i }));

    const lastCall = mockGet.mock.calls[mockGet.mock.calls.length - 1];
    expect(lastCall[1]).toEqual({ params: { sortBy: "createdAt", sortOrder: "desc" } });
  });

  it("re-fetches with sortBy=subject&sortOrder=asc when Subject header is clicked", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: TICKETS });
    renderPage();

    // Wait for initial data to load, then click the Subject column header.
    await screen.findByRole("row", { name: /cannot access my course/i });
    await user.click(screen.getByRole("columnheader", { name: /^Subject/ }));

    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "subject", sortOrder: "asc" },
    });
  });

  it("toggles to sortOrder=desc when the same sorted column header is clicked again", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: TICKETS });
    renderPage();

    await screen.findByRole("row", { name: /cannot access my course/i });

    // First click → asc.
    await user.click(screen.getByRole("columnheader", { name: /^Subject/ }));
    // Second click → desc.
    await user.click(screen.getByRole("columnheader", { name: /^Subject/ }));

    expect(mockGet).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "subject", sortOrder: "desc" },
    });
  });
});

import { screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "core/enums";
import { render } from "@/test/render";
import UsersPage from "./UsersPage";

// Mock apiClient so tests never hit the network.
vi.mock("@/lib/api-client", () => ({
  default: { get: vi.fn() },
}));

import apiClient from "@/lib/api-client";

const mockGet = vi.mocked(apiClient.get);

const USERS = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: UserRole.Admin,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: UserRole.Agent,
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];

function renderPage() {
  return render(<UsersPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage", () => {
  it("renders the page heading and description", async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText("Manage system users.")).toBeInTheDocument();
  });

  it("renders the table column headers", async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Role" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Joined" }),
    ).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    // Never resolves — keeps isPending true.
    mockGet.mockReturnValue(new Promise(() => {}));
    renderPage();
    // 5 skeleton rows × 4 cells = 20 skeleton elements.
    const skeletons = document.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders a row for each user with correct data", async () => {
    mockGet.mockResolvedValue({ data: USERS });
    renderPage();

    const aliceRow = await screen.findByRole("row", { name: /alice admin/i });
    expect(within(aliceRow).getByText("alice@example.com")).toBeInTheDocument();
    expect(within(aliceRow).getByText("Admin")).toBeInTheDocument();

    const bobRow = screen.getByRole("row", { name: /bob agent/i });
    expect(within(bobRow).getByText("bob@example.com")).toBeInTheDocument();
    expect(within(bobRow).getByText("Agent")).toBeInTheDocument();
  });

  it("shows 'No users found.' when the list is empty", async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows error message when the request fails", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    renderPage();
    expect(
      await screen.findByText("Failed to load users."),
    ).toBeInTheDocument();
  });

  it("renders Admin badge with default variant and Agent badge with secondary variant", async () => {
    mockGet.mockResolvedValue({ data: USERS });
    renderPage();

    const adminBadge = await screen.findByText("Admin");
    const agentBadge = screen.getByText("Agent");

    // shadcn Badge default variant has no extra class; secondary has bg-secondary.
    expect(adminBadge.className).not.toMatch(/secondary/);
    expect(agentBadge.className).toMatch(/secondary/);
  });

  it("formats the createdAt date using toLocaleDateString", async () => {
    mockGet.mockResolvedValue({ data: [USERS[0]] });
    renderPage();

    const expected = new Date("2026-01-01T00:00:00.000Z").toLocaleDateString();
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("should not render a delete button for Admin-role users", async () => {
    mockGet.mockResolvedValue({ data: USERS });
    renderPage();

    // Wait for data to load before asserting button presence.
    await screen.findByRole("row", { name: /alice admin/i });

    expect(
      screen.queryByRole("button", { name: "Delete Alice Admin" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Delete Bob Agent" }),
    ).toBeInTheDocument();
  });
});

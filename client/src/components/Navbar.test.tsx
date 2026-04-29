import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { UserRole } from "core/enums";
import { render } from "@/test/render";
import Navbar from "./Navbar";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

import { useSession, signOut } from "@/lib/auth-client";

const mockUseSession = vi.mocked(useSession);
const mockSignOut = vi.mocked(signOut);

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSignOut.mockResolvedValue(undefined as never);
});

describe("Navbar", () => {
  describe("Links", () => {
    it("always renders Tickets link", () => {
      mockUseSession.mockReturnValue({ data: null } as ReturnType<typeof useSession>);
      renderNavbar();
      expect(screen.getByRole("link", { name: "Tickets" })).toBeInTheDocument();
    });

    it("shows Users link for Admin role", () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Alice", email: "alice@example.com", role: UserRole.Admin } },
      } as ReturnType<typeof useSession>);
      renderNavbar();
      expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    });

    it("hides Users link for Agent role", () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "2", name: "Bob", email: "bob@example.com", role: UserRole.Agent } },
      } as ReturnType<typeof useSession>);
      renderNavbar();
      expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    });

    it("hides Users link when session is null", () => {
      mockUseSession.mockReturnValue({ data: null } as ReturnType<typeof useSession>);
      renderNavbar();
      expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    });

    it("renders SimpleTickets brand link to /", () => {
      mockUseSession.mockReturnValue({ data: null } as ReturnType<typeof useSession>);
      renderNavbar();
      const brandLink = screen.getByRole("link", { name: /simpletickets/i });
      expect(brandLink).toHaveAttribute("href", "/");
    });
  });

  describe("User info", () => {
    it("displays the logged-in user name", () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Alice Admin", email: "alice@example.com", role: UserRole.Admin } },
      } as ReturnType<typeof useSession>);
      renderNavbar();
      expect(screen.getByText("Alice Admin")).toBeInTheDocument();
    });
  });

  describe("Logout", () => {
    it("calls signOut and navigates to /login when Logout is clicked", async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Alice", email: "alice@example.com", role: UserRole.Admin } },
      } as ReturnType<typeof useSession>);
      const user = userEvent.setup();
      renderNavbar();

      await user.click(screen.getByRole("button", { name: "Logout" }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      });
    });
  });
});

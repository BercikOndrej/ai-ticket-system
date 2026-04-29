import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UserRole } from "core/enums";
import { render } from "@/test/render";
import AdminRoute from "./AdminRoute";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

import { useSession } from "@/lib/auth-client";

const mockUseSession = vi.mocked(useSession);

beforeEach(() => {
  vi.clearAllMocks();
});

function renderWithRoutes(initialPath = "/admin") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  it("renders loading indicator while session is pending", () => {
    mockUseSession.mockReturnValue({ data: undefined, isPending: true } as unknown as ReturnType<
      typeof useSession
    >);
    renderWithRoutes();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to / when session is null", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<
      typeof useSession
    >);
    renderWithRoutes();
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("redirects to / when session user has Agent role", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "2", name: "Bob", email: "bob@example.com", role: UserRole.Agent } },
      isPending: false,
    } as ReturnType<typeof useSession>);
    renderWithRoutes();
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("renders outlet when session user has Admin role", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", name: "Alice", email: "alice@example.com", role: UserRole.Admin } },
      isPending: false,
    } as ReturnType<typeof useSession>);
    renderWithRoutes();
    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
  });
});

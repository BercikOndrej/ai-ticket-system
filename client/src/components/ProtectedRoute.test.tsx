import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@/test/render";
import ProtectedRoute from "./ProtectedRoute";

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

import { useSession } from "@/lib/auth-client";

const mockUseSession = vi.mocked(useSession);

beforeEach(() => {
  vi.clearAllMocks();
});

function renderWithRoutes(initialPath = "/protected") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("renders loading indicator while session is pending", () => {
    mockUseSession.mockReturnValue({ data: undefined, isPending: true } as unknown as ReturnType<
      typeof useSession
    >);
    renderWithRoutes();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to /login when session is null", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<
      typeof useSession
    >);
    renderWithRoutes();
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders outlet when session is present", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "1", name: "Alice", email: "alice@example.com" } },
      isPending: false,
    } as ReturnType<typeof useSession>);
    renderWithRoutes();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});

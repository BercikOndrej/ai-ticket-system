import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@/test/render";
import LoginPage from "./LoginPage";

// --- Mocks ---

// vi.mock factories are hoisted to the top of the file by Vitest, so any
// variables they reference must also be hoisted with vi.hoisted() to avoid
// the temporal dead zone (ReferenceError: Cannot access before initialization).
const { mockNavigate, MockNavigate, mockSignInEmail } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  MockNavigate: vi.fn(() => null),
  mockSignInEmail: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  Navigate: MockNavigate,
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(() => ({ data: null, isPending: false })),
  signIn: { email: mockSignInEmail },
}));

// Import after mocks so vi.mocked picks up the hoisted mock.
import { useSession } from "@/lib/auth-client";

const mockUseSession = vi.mocked(useSession);

// --- Helpers ---

function renderPage() {
  return render(<LoginPage />);
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  return user;
}

// --- Tests ---

beforeEach(() => {
  mockUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>);
  mockSignInEmail.mockResolvedValue({ error: null });
  vi.mocked(MockNavigate).mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("should display login form with all elements", () => {
    renderPage();

    expect(screen.getByText("Ticket System")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("should show error with invalid email format", async () => {
    renderPage();

    await fillAndSubmit("invalid-email", "password123");

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should show error with empty email", async () => {
    renderPage();

    await fillAndSubmit("", "password123");

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should show error with empty password", async () => {
    renderPage();

    await fillAndSubmit("valid@example.com", "");

    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should show error with empty email and password", async () => {
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("should show loading state during login", async () => {
    // Promise that never resolves — keeps isSubmitting true.
    mockSignInEmail.mockReturnValue(new Promise(() => {}));
    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: "Signing in..." })).toBeInTheDocument();
  });

  it("should show error with non-existent user", async () => {
    mockSignInEmail.mockResolvedValue({ error: { message: "Invalid credentials" } });
    renderPage();

    await fillAndSubmit("nonexistent@example.com", "password123");

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("should show error with incorrect password", async () => {
    mockSignInEmail.mockResolvedValue({ error: { message: "Invalid credentials" } });
    renderPage();

    await fillAndSubmit("valid@example.com", "wrongpassword");

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("should clear server error on new submission", async () => {
    mockSignInEmail
      .mockResolvedValueOnce({ error: { message: "Invalid credentials" } })
      .mockResolvedValueOnce({ error: null });

    renderPage();

    const user = userEvent.setup();

    // First submission — trigger server error.
    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Password"), "badpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();

    // Clear fields and submit valid credentials.
    await user.clear(screen.getByLabelText("Email"));
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "correctpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Error should be gone and navigate should have been called.
    expect(screen.queryByText("Invalid email or password")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should redirect to home when session already exists", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1" } }, isPending: false } as ReturnType<typeof useSession>);
    renderPage();

    // React calls function components with (props) — no second argument.
    expect(MockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/", replace: true }),
      undefined,
    );
  });

  it("should render loading indicator while session is pending", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true } as ReturnType<typeof useSession>);
    renderPage();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

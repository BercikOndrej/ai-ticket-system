import { screen, waitFor, render as rtlRender } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@/test/render";
import UserDialog from "./UserDialog";

// Helper: render wrapped in a fresh QueryClientProvider (needed when rerender
// must also be wrapped — the RTL render from @/test/render wraps the initial
// mount but rerender bypasses the wrapper, so these tests use this helper).
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return rtlRender(ui, { wrapper: Wrapper });
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api-client", () => ({
  default: { post: vi.fn(), patch: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// Import after mock so vi.mocked works correctly
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: "user-1",
  name: "johndoe",
  email: "john@example.com",
  role: "Agent",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function buildAxiosError(status: number): axios.AxiosError {
  const err = new axios.AxiosError("Request failed");
  err.response = {
    status,
    data: {},
    headers: {},
    config: {} as never,
    statusText: String(status),
  };
  return err;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderCreate(onOpenChange = vi.fn()) {
  return {
    onOpenChange,
    ...render(<UserDialog open={true} onOpenChange={onOpenChange} />),
  };
}

function renderEdit(onOpenChange = vi.fn(), user = MOCK_USER) {
  return {
    onOpenChange,
    ...render(<UserDialog open={true} onOpenChange={onOpenChange} user={user} />),
  };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// CREATE MODE
// ===========================================================================

describe("UserDialog — create mode", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('should render "Create User" title', () => {
    renderCreate();
    expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
  });

  it("should render Name, Email and Password fields", () => {
    renderCreate();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it('should render "Create User" submit button and Cancel button', () => {
    renderCreate();
    expect(screen.getByRole("button", { name: "Create User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should show password placeholder for create mode", () => {
    renderCreate();
    expect(screen.getByPlaceholderText("Min. 8 characters, no spaces")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Validation — name
  // -------------------------------------------------------------------------

  it("should show name-too-short error and not POST when name has fewer than 3 chars", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText("Name"), "ab");
    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "validpass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
  });

  it("should show name-spaces error and not POST when name contains a space", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText("Name"), "john doe");
    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "validpass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Name must not contain spaces")).toBeInTheDocument();
    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation — email
  // -------------------------------------------------------------------------

  it("should show invalid email error and not POST when email is malformed", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "validpass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation — password
  // -------------------------------------------------------------------------

  it("should show password-too-short error and not POST when password has fewer than 8 chars", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "short1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
  });

  it("should show password-spaces error and not POST when password contains a space", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "pass word1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Password must not contain spaces")).toBeInTheDocument();
    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation — all empty
  // -------------------------------------------------------------------------

  it("should show multiple field errors and not POST when all fields are empty", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.click(screen.getByRole("button", { name: "Create User" }));

    // All three fields should show an error
    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it("should POST with correct payload, close dialog and fire success toast on valid submit", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
    const onOpenChange = vi.fn();

    render(<UserDialog open={true} onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    await waitFor(() => {
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith("/api/users", {
        name: "johndoe",
        email: "john@example.com",
        password: "securepass1",
      });
    });

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("User created.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show "Creating..." on the submit button while the mutation is pending', async () => {
    const user = userEvent.setup();
    // Never resolves — keeps isPending true
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}));

    render(<UserDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByRole("button", { name: "Creating..." })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // API error responses
  // -------------------------------------------------------------------------

  it("should show inline email error and not show generic banner on 409 response", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockRejectedValue(buildAxiosError(409));

    render(<UserDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("A user with this email already exists."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Something went wrong. Please try again."),
    ).not.toBeInTheDocument();
  });

  it("should show generic error banner and not show inline email error on 500 response", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockRejectedValue(buildAxiosError(500));

    render(<UserDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Name"), "johndoe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("A user with this email already exists."),
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Cancel / reset behaviour
  // -------------------------------------------------------------------------

  it("should call onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<UserDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should clear fields and errors when the dialog is closed and reopened", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = renderWithQueryClient(
      <UserDialog open={true} onOpenChange={onOpenChange} />,
    );

    // Type something invalid to trigger a validation error
    await user.type(screen.getByLabelText("Name"), "ab");
    await user.click(screen.getByRole("button", { name: "Create User" }));
    expect(await screen.findByText("Name must be at least 3 characters")).toBeInTheDocument();

    // Close (Cancel) — triggers form.reset() inside handleOpenChange
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Simulate parent reopening the dialog
    rerender(<UserDialog open={true} onOpenChange={onOpenChange} />);

    // Field should be empty and validation error gone
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
    expect(
      screen.queryByText("Name must be at least 3 characters"),
    ).not.toBeInTheDocument();
  });
});

// ===========================================================================
// EDIT MODE
// ===========================================================================

describe("UserDialog — edit mode", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('should render "Edit User" title', () => {
    renderEdit();
    expect(screen.getByRole("heading", { name: "Edit User" })).toBeInTheDocument();
  });

  it("should pre-fill name and email from the user prop, with password empty", () => {
    renderEdit();
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(MOCK_USER.name);
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(MOCK_USER.email);
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
  });

  it('should render "Save Changes" submit button', () => {
    renderEdit();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("should show the keep-current-password placeholder", () => {
    renderEdit();
    expect(
      screen.getByPlaceholderText("Leave blank to keep current password"),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Validation — name
  // -------------------------------------------------------------------------

  it("should show name-too-short error and not PATCH when name is too short", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "ab");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.patch)).not.toHaveBeenCalled();
  });

  it("should show name-spaces error and not PATCH when name contains a space", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "john doe");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Name must not contain spaces")).toBeInTheDocument();
    expect(vi.mocked(apiClient.patch)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation — email
  // -------------------------------------------------------------------------

  it("should show invalid email error and not PATCH when email is malformed", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(vi.mocked(apiClient.patch)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation — password
  // -------------------------------------------------------------------------

  it("should show password-too-short error and not PATCH when password is 1–7 chars", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.type(screen.getByLabelText("Password"), "short1");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(vi.mocked(apiClient.patch)).not.toHaveBeenCalled();
  });

  it("should show password-spaces error and not PATCH when password contains a space", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.type(screen.getByLabelText("Password"), "pass word1");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Password must not contain spaces")).toBeInTheDocument();
    expect(vi.mocked(apiClient.patch)).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Happy path — empty password (keep current)
  // -------------------------------------------------------------------------

  it("should PATCH with password: '' when password field is left blank", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
    const onOpenChange = vi.fn();

    render(<UserDialog open={true} onOpenChange={onOpenChange} user={MOCK_USER} />);

    // Leave password empty, just submit as-is
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        `/api/users/${MOCK_USER.id}`,
        {
          name: MOCK_USER.name,
          email: MOCK_USER.email,
          password: "",
        },
      );
    });

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("User updated.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // -------------------------------------------------------------------------
  // Happy path — with new password
  // -------------------------------------------------------------------------

  it("should PATCH with new password, close dialog and fire success toast on valid submit", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
    const onOpenChange = vi.fn();

    render(<UserDialog open={true} onOpenChange={onOpenChange} user={MOCK_USER} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "janedoe");
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(vi.mocked(apiClient.patch)).toHaveBeenCalledWith(
        `/api/users/${MOCK_USER.id}`,
        {
          name: "janedoe",
          email: "jane@example.com",
          password: "newpassword1",
        },
      );
    });

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("User updated.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should show "Saving..." on the submit button while the mutation is pending', async () => {
    const user = userEvent.setup();
    // Never resolves — keeps isPending true
    vi.mocked(apiClient.patch).mockReturnValue(new Promise(() => {}));

    render(<UserDialog open={true} onOpenChange={vi.fn()} user={MOCK_USER} />);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByRole("button", { name: "Saving..." })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // API error responses
  // -------------------------------------------------------------------------

  it("should show inline email error and not show generic banner on 409 response", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockRejectedValue(buildAxiosError(409));

    render(<UserDialog open={true} onOpenChange={vi.fn()} user={MOCK_USER} />);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("A user with this email already exists."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Something went wrong. Please try again."),
    ).not.toBeInTheDocument();
  });

  it("should show generic error banner and not show inline email error on 500 response", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.patch).mockRejectedValue(buildAxiosError(500));

    render(<UserDialog open={true} onOpenChange={vi.fn()} user={MOCK_USER} />);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("A user with this email already exists."),
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Cancel / reset behaviour
  // -------------------------------------------------------------------------

  it("should call onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<UserDialog open={true} onOpenChange={onOpenChange} user={MOCK_USER} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should reset fields to original user values and clear errors after Cancel then reopen", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = renderWithQueryClient(
      <UserDialog open={true} onOpenChange={onOpenChange} user={MOCK_USER} />,
    );

    // Overwrite name with an invalid value to trigger a validation error
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "ab");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText("Name must be at least 3 characters")).toBeInTheDocument();

    // Cancel — triggers form.reset() with defaultValues (original user data)
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Simulate parent reopening the dialog
    rerender(<UserDialog open={true} onOpenChange={onOpenChange} user={MOCK_USER} />);

    // Fields should have reverted to original user values, no error visible
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(MOCK_USER.name);
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(MOCK_USER.email);
    expect(
      screen.queryByText("Name must be at least 3 characters"),
    ).not.toBeInTheDocument();
  });
});

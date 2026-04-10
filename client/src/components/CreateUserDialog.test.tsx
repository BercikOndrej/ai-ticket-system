import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@/test/render";
import axios from "axios";
import apiClient from "@/lib/api-client";
import CreateUserDialog from "./CreateUserDialog";

vi.mock("@/lib/api-client", () => ({
  default: { post: vi.fn() },
}));

const mockPost = vi.mocked(apiClient.post);

// Helper: build a minimal AxiosError with a given HTTP status
function makeAxiosError(status: number) {
  const err = new axios.AxiosError("Request failed");
  err.response = { status, data: {}, headers: {}, config: {} as never, statusText: "" };
  return err;
}

const VALID = {
  name: "johndoe",
  email: "john@example.com",
  password: "securepass1",
};

function renderDialog(props: { open?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const onOpenChange = props.onOpenChange ?? vi.fn();
  const open = props.open ?? true;
  return {
    onOpenChange,
    ...render(<CreateUserDialog open={open} onOpenChange={onOpenChange} />),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("CreateUserDialog", () => {
  // ── Rendering ────────────────────────────────────────────────────────────────

  it("should render dialog title and all three fields when open", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  // ── Client-side validation ───────────────────────────────────────────────────

  it("should show 'Name must be at least 3 characters' when name is too short", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "ab");
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("should show 'Name must not contain spaces' when name has spaces", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), "john doe");
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Name must not contain spaces")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("should show 'Enter a valid email address' when email is invalid", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("should show 'Password must be at least 8 characters' when password is too short", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), "short1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("should show 'Password must not contain spaces' when password has spaces", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), "pass word1");
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Password must not contain spaces")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  // ── Successful submission ────────────────────────────────────────────────────

  it("should call apiClient.post with correct payload and close dialog on success", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({ data: { id: "1", ...VALID } });

    const onOpenChange = vi.fn();
    render(<CreateUserDialog open={true} onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/api/users", {
        name: VALID.name,
        email: VALID.email,
        password: VALID.password,
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────────

  it("should show inline email field error when server returns 409", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(makeAxiosError(409));

    renderDialog();

    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("A user with this email already exists."),
    ).toBeInTheDocument();

    // The error appears beneath the email input, not in the banner slot
    expect(
      screen.queryByText("Something went wrong. Please try again."),
    ).not.toBeInTheDocument();
  });

  it("should show generic banner error when server returns 500", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(makeAxiosError(500));

    renderDialog();

    await user.type(screen.getByLabelText("Name"), VALID.name);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("A user with this email already exists."),
    ).not.toBeInTheDocument();
  });

  // ── Cancel button ────────────────────────────────────────────────────────────

  it("should call onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<CreateUserDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // ── Form reset on close/reopen ────────────────────────────────────────────────

  it("should clear fields and errors after the dialog is closed and reopened", async () => {
    const user = userEvent.setup();

    // Use RTL's render directly with a wrapper so that rerender calls keep
    // the QueryClientProvider in the tree (RTL re-uses the wrapper on rerender).
    const { render: rtlRender } = await import("@testing-library/react");
    const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const onOpenChange = vi.fn();

    const { rerender } = rtlRender(
      <CreateUserDialog open={true} onOpenChange={onOpenChange} />,
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      },
    );

    // Type an invalid name and submit to trigger a validation error
    await user.type(screen.getByLabelText("Name"), "ab");
    await user.click(screen.getByRole("button", { name: "Create User" }));
    expect(
      await screen.findByText("Name must be at least 3 characters"),
    ).toBeInTheDocument();

    // Click Cancel — this calls handleOpenChange(false) which resets the form
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Simulate the parent re-opening the dialog (open prop flips back to true)
    rerender(<CreateUserDialog open={true} onOpenChange={onOpenChange} />);

    // Field should now be empty
    expect(screen.getByLabelText("Name")).toHaveValue("");

    // The validation error must be gone
    expect(
      screen.queryByText("Name must be at least 3 characters"),
    ).not.toBeInTheDocument();
  });
});

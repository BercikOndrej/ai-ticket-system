import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/render";
import TicketReplyForm from "./TicketReplyForm";

vi.mock("@/lib/api-client", () => ({
  default: { post: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

const mockPost = vi.mocked(apiClient.post);
const mockUseSession = vi.mocked(useSession);

function renderForm(ticketId = "42") {
  return render(<TicketReplyForm ticketId={ticketId} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReturnValue({ data: { user: { name: "Jane Smith" } } } as ReturnType<
    typeof useSession
  >);
});

describe("TicketReplyForm", () => {
  describe("Header", () => {
    it("shows 'Agent' fallback when session has no user", () => {
      mockUseSession.mockReturnValue({ data: null } as ReturnType<typeof useSession>);
      renderForm();
      expect(screen.getByText("Agent")).toBeInTheDocument();
    });

    it("shows session user name in header", () => {
      renderForm();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("shows correct initials in avatar for two-word name", () => {
      renderForm();
      expect(screen.getByText("JS")).toBeInTheDocument();
    });
  });

  describe("Textarea", () => {
    it("starts empty", () => {
      renderForm();
      expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("shows character count '0 / 10000' initially", () => {
      renderForm();
      expect(screen.getByText("0 / 10000")).toBeInTheDocument();
    });

    it("updates character count as user types", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello");
      expect(screen.getByText("5 / 10000")).toBeInTheDocument();
    });
  });

  describe("Send button", () => {
    it("is disabled when textarea is empty", () => {
      renderForm();
      expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    });

    it("is disabled when textarea contains only whitespace", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "   ");
      expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    });

    it("is enabled when textarea has non-whitespace content", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello");
      expect(screen.getByRole("button", { name: /send reply/i })).toBeEnabled();
    });
  });

  describe("Submission", () => {
    it("calls apiClient.post with correct URL and body on submit", async () => {
      mockPost.mockResolvedValue({ data: { id: 42, replies: [] } });
      const user = userEvent.setup();
      renderForm("42");
      await user.type(screen.getByRole("textbox"), "Hello customer");
      await user.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith("/api/tickets/42/replies", {
          body: "Hello customer",
        });
      });
    });

    it("clears textarea on successful submit", async () => {
      mockPost.mockResolvedValue({ data: { id: 42, replies: [] } });
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello customer");
      await user.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toHaveValue("");
      });
    });

    it("shows success toast on successful submit", async () => {
      mockPost.mockResolvedValue({ data: { id: 42, replies: [] } });
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello");
      await user.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Reply sent.");
      });
    });

    it("shows error toast on failed submit", async () => {
      mockPost.mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello");
      await user.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Failed to send reply.");
      });
    });
  });

  describe("Pending state", () => {
    it("disables textarea while mutation is pending", async () => {
      mockPost.mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello");
      await user.click(screen.getByRole("button", { name: /send reply/i }));
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("disables send button while mutation is pending", async () => {
      mockPost.mockReturnValue(new Promise(() => {}));
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole("textbox"), "Hello");
      await user.click(screen.getByRole("button", { name: /send reply/i }));
      expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    });
  });
});

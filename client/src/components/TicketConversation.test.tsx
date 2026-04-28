import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SenderType } from "core/enums";
import { render } from "@/test/render";
import { type TicketReply } from "@/types/ticket";
import TicketConversation from "./TicketConversation";

function makeReply(overrides: Partial<TicketReply> = {}): TicketReply {
  return {
    id: 1,
    body: "Hello there",
    authorId: null,
    author: null,
    senderType: SenderType.Customer,
    createdAt: "2026-01-10T08:00:00.000Z",
    ...overrides,
  };
}

describe("TicketConversation", () => {
  it("renders nothing when replies array is empty", () => {
    const { container } = render(<TicketConversation replies={[]} customerName="Alice" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 'Conversation' heading when replies exist", () => {
    render(<TicketConversation replies={[makeReply()]} customerName="Alice" />);
    expect(screen.getByText("Conversation")).toBeInTheDocument();
  });

  it("shows customerName for customer reply", () => {
    render(
      <TicketConversation
        replies={[makeReply({ senderType: SenderType.Customer })]}
        customerName="Alice Smith"
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows author.name for agent reply", () => {
    render(
      <TicketConversation
        replies={[
          makeReply({
            senderType: SenderType.Agent,
            authorId: "u1",
            author: { id: "u1", name: "Bob Agent", email: "bob@example.com" },
          }),
        ]}
        customerName="Alice Smith"
      />,
    );
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
  });

  it("falls back to 'Agent' when senderType is Agent but author is null", () => {
    render(
      <TicketConversation
        replies={[makeReply({ senderType: SenderType.Agent, authorId: null, author: null })]}
        customerName="Alice Smith"
      />,
    );
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("derives initials from two-word name", () => {
    render(
      <TicketConversation
        replies={[makeReply({ senderType: SenderType.Customer })]}
        customerName="Jane Smith"
      />,
    );
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("derives single initial from single-word name", () => {
    render(
      <TicketConversation
        replies={[makeReply({ senderType: SenderType.Customer })]}
        customerName="Alice"
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders reply body text", () => {
    render(
      <TicketConversation
        replies={[makeReply({ body: "Need help with login." })]}
        customerName="Alice"
      />,
    );
    expect(screen.getByText("Need help with login.")).toBeInTheDocument();
  });

  it("renders createdAt formatted via toLocaleString", () => {
    const iso = "2026-01-10T08:00:00.000Z";
    render(<TicketConversation replies={[makeReply({ createdAt: iso })]} customerName="Alice" />);
    expect(screen.getByText(new Date(iso).toLocaleString())).toBeInTheDocument();
  });

  it("renders all replies when multiple are passed", () => {
    const replies = [
      makeReply({ id: 1, body: "First message" }),
      makeReply({ id: 2, body: "Second message" }),
      makeReply({ id: 3, body: "Third message" }),
    ];
    render(<TicketConversation replies={replies} customerName="Alice" />);
    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.getByText("Third message")).toBeInTheDocument();
  });
});

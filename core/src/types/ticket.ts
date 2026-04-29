import { TicketStatus, TicketClassification, SenderType } from "../enums";
import type { AssignableAgent } from "./user";

export type TicketReplyAuthor = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

export type TicketReply = {
  readonly id: number;
  readonly body: string;
  readonly authorId: string | null;
  readonly author: TicketReplyAuthor | null;
  readonly senderType: SenderType;
  readonly createdAt: string;
};

export type Ticket = {
  id: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: TicketStatus;
  classification: TicketClassification;
  createdAt: string;
};

export type TicketDetail = Ticket & {
  readonly body: string;
  readonly bodyHtml: string | null;
  readonly assignedToAgentId: string | null;
  readonly assignedToAgent: AssignableAgent | null;
  readonly replies: readonly TicketReply[];
  readonly updatedAt: string;
};

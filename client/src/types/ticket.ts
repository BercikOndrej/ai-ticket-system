import { TicketStatus, TicketClassification, SenderType } from "core/enums";
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

export type TicketFiltersState = {
  search?: string;
  status?: TicketStatus;
  classification?: TicketClassification;
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
  body: string;
  bodyHtml: string | null;
  assignedToAgentId: string | null;
  assignedToAgent: AssignableAgent | null;
  replies: readonly TicketReply[];
  updatedAt: string;
};

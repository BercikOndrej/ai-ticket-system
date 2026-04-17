import { TicketStatus, TicketClassification } from "core/enums";

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
  classification: TicketClassification | null;
  createdAt: string;
};

export type TicketDetail = Ticket & {
  body: string;
  bodyHtml: string | null;
  assignedToAgentId: string | null;
  updatedAt: string;
};

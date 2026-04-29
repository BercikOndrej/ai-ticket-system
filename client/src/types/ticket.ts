import { TicketStatus, TicketClassification } from "core/enums";

export type { Ticket, TicketDetail, TicketReply, TicketReplyAuthor } from "core/types/ticket";

export type TicketFiltersState = {
  search?: string;
  status?: TicketStatus;
  classification?: TicketClassification;
};

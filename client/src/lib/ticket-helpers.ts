import { TicketClassification, TicketStatus } from "core/enums";

export const classificationLabels: Record<TicketClassification, string> = {
  [TicketClassification.GeneralQuestion]: "General question",
  [TicketClassification.TechnicalQuestion]: "Technical question",
  [TicketClassification.Request]: "Request",
  [TicketClassification.Refund]: "Refund",
};

export const statusVariant: Record<TicketStatus, "default" | "secondary" | "outline"> = {
  [TicketStatus.Open]: "default",
  [TicketStatus.Resolved]: "secondary",
  [TicketStatus.Closed]: "outline",
};

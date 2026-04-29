export const SenderType = {
  Agent: "Agent",
  Customer: "Customer",
} as const;
export type SenderType = (typeof SenderType)[keyof typeof SenderType];

export const UserRole = {
  Admin: "Admin",
  Agent: "Agent",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TicketStatus = {
  Open: "Open",
  Resolved: "Resolved",
  Closed: "Closed",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketClassification = {
  GeneralQuestion: "GeneralQuestion",
  TechnicalQuestion: "TechnicalQuestion",
  Request: "Request",
  Refund: "Refund",
} as const;
export type TicketClassification = (typeof TicketClassification)[keyof typeof TicketClassification];

export const SortOrder = {
  Asc: "asc",
  Desc: "desc",
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const TicketSortBy = {
  Id: "id",
  Subject: "subject",
  FromName: "fromName",
  Status: "status",
  Classification: "classification",
  CreatedAt: "createdAt",
} as const;
export type TicketSortBy = (typeof TicketSortBy)[keyof typeof TicketSortBy];

export type TicketSortingState = {
  sortBy: TicketSortBy;
  sortOrder: SortOrder;
};

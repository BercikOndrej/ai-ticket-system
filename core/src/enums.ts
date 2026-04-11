export enum UserRole {
  Admin = "Admin",
  Agent = "Agent",
}

export enum TicketStatus {
  Open = "Open",
  Resolved = "Resolved",
  Closed = "Closed",
}

export enum TicketClassification {
  GeneralQuestion = "GeneralQuestion",
  TechnicalQuestion = "TechnicalQuestion",
  Request = "Request",
  Refund = "Refund",
}

export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

export enum TicketSortBy {
  Id = "id",
  Subject = "subject",
  FromName = "fromName",
  Status = "status",
  Classification = "classification",
  CreatedAt = "createdAt",
}

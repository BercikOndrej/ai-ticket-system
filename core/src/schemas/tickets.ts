import { z } from "zod";
import { TicketClassification, TicketStatus } from "../enums";

export const inboundEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(998),
  body: z.string().min(1, "Body is required").max(100_000),
  bodyHtml: z.string().max(200_000).optional(),
  fromEmail: z.string().email("Invalid sender email").max(254),
  fromName: z.string().min(1, "Sender name is required").max(100),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;

export const ticketUpdateSchema = z
  .object({
    status: z.enum(TicketStatus).optional(),
    classification: z.enum(TicketClassification).optional(),
    assignedToAgentId: z.string().trim().min(1, "Assigned agent ID is required").max(128).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one ticket field is required",
  });

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

export const ticketReplyCreateSchema = z.object({
  body: z.string().min(1, "Reply is required").max(10000).trim(),
});

export type TicketReplyCreateInput = z.infer<typeof ticketReplyCreateSchema>;

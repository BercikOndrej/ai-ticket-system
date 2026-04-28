import { TicketClassification, TicketStatus } from "core/enums";
import { z } from "zod";

export const inboundEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  bodyHtml: z.string().optional(),
  fromEmail: z.string().email("Invalid sender email"),
  fromName: z.string().min(1, "Sender name is required"),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;

export const ticketUpdateSchema = z
  .object({
    status: z.nativeEnum(TicketStatus).optional(),
    classification: z.nativeEnum(TicketClassification).optional(),
    assignedToAgentId: z.string().trim().min(1, "Assigned agent ID is required").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one ticket field is required",
  });

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

export const ticketReplyCreateSchema = z.object({
  body: z.string().min(1, "Reply is required").max(10000).trim(),
});

export type TicketReplyCreateInput = z.infer<typeof ticketReplyCreateSchema>;

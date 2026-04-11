import { z } from "zod";

export const inboundEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  bodyHtml: z.string().optional(),
  fromEmail: z.string().email("Invalid sender email"),
  fromName: z.string().min(1, "Sender name is required"),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;

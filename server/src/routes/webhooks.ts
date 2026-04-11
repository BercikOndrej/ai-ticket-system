import { Router } from "express";
import { inboundEmailSchema } from "core/schemas/tickets";
import { requireWebhookSecret } from "../middleware/webhook";
import { prisma } from "../db";
import { parseBody } from "../lib/validation";

const router = Router();

function normalizeSubject(subject: string): string {
  return subject.replace(/^(\s*(re|fwd|fw)\s*:\s*)+/gi, "").trim();
}

router.post("/inbound-email", requireWebhookSecret, async (req, res) => {
  const data = parseBody(inboundEmailSchema, req.body, res);
  if (!data) return;

  const { body, bodyHtml, fromEmail, fromName } = data;
  const subject = normalizeSubject(data.subject);

  const select = { id: true, subject: true, fromEmail: true, fromName: true, status: true, createdAt: true };

  const existing = await prisma.ticket.findFirst({
    where: { fromEmail, subject, status: { not: "Closed" } },
    select,
  });

  if (existing) {
    res.status(200).json(existing);
    return;
  }

  const ticket = await prisma.ticket.create({
    data: { subject, body, bodyHtml, fromEmail, fromName },
    select,
  });

  res.status(201).json(ticket);
});

export default router;

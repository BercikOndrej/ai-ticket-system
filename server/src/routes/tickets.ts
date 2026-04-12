import { Router } from "express";
import { z } from "zod";
import { SortOrder, TicketSortBy, TicketStatus, TicketClassification } from "core/enums";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

const querySchema = z.object({
  sortBy: z.nativeEnum(TicketSortBy).optional().default(TicketSortBy.CreatedAt),
  sortOrder: z.nativeEnum(SortOrder).optional().default(SortOrder.Desc),
  status: z.nativeEnum(TicketStatus).optional(),
  classification: z.nativeEnum(TicketClassification).optional(),
  search: z.string().optional(),
});

router.get("/", requireAuth, async (req, res) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const { sortBy, sortOrder, status, classification, search } = result.data;

  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      fromName: true,
      fromEmail: true,
      status: true,
      classification: true,
      createdAt: true,
    },
    where: {
      ...(status !== undefined && { status }),
      ...(classification !== undefined && { classification }),
      ...(search && { subject: { contains: search, mode: "insensitive" } }),
    },
    orderBy: { [sortBy]: sortOrder },
  });
  res.json(tickets);
});

export default router;

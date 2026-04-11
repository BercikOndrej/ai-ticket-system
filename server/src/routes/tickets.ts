import { Router } from "express";
import { z } from "zod";
import { SortOrder, TicketSortBy } from "core/enums";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

const querySchema = z.object({
  sortBy: z.nativeEnum(TicketSortBy).optional().default(TicketSortBy.CreatedAt),
  sortOrder: z.nativeEnum(SortOrder).optional().default(SortOrder.Desc),
});

router.get("/", requireAuth, async (req, res) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const { sortBy, sortOrder } = result.data;

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
    orderBy: { [sortBy]: sortOrder },
  });
  res.json(tickets);
});

export default router;

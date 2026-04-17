import { Router } from "express";
import { z } from "zod";
import { SortOrder, TicketSortBy, TicketStatus, TicketClassification } from "core/enums";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../db";
import { Prisma } from "../generated/prisma/client";

const router = Router();

const querySchema = z.object({
  sortBy: z.nativeEnum(TicketSortBy).optional().default(TicketSortBy.CreatedAt),
  sortOrder: z.nativeEnum(SortOrder).optional().default(SortOrder.Desc),
  status: z.nativeEnum(TicketStatus).optional(),
  classification: z.nativeEnum(TicketClassification).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

router.get("/", requireAuth, async (req, res) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const { sortBy, sortOrder, status, classification, search, page, limit } = result.data;

  const where = {
    ...(status !== undefined && { status }),
    ...(classification !== undefined && { classification }),
    ...(search && { subject: { contains: search, mode: Prisma.QueryMode.insensitive } }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      select: {
        id: true,
        subject: true,
        fromName: true,
        fromEmail: true,
        status: true,
        classification: true,
        createdAt: true,
      },
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ data: tickets, total });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      body: true,
      bodyHtml: true,
      fromName: true,
      fromEmail: true,
      status: true,
      classification: true,
      assignedToAgentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

export default router;

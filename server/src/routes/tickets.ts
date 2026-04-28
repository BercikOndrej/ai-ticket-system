import { Router, type Response } from "express";
import { z } from "zod";
import { SortOrder, TicketSortBy, TicketStatus, TicketClassification, UserRole, SenderType } from "core/enums";
import { ticketUpdateSchema, ticketReplyCreateSchema } from "core/schemas/tickets";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../db";
import { Prisma } from "../generated/prisma/client";
import { parseBody } from "../lib/validation";

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

const ticketDetailSelect = {
  id: true,
  subject: true,
  body: true,
  bodyHtml: true,
  fromName: true,
  fromEmail: true,
  status: true,
  classification: true,
  assignedToAgentId: true,
  assignedToAgent: {
    select: {
      id: true,
      name: true,
      email: true,
      deletedAt: true,
    },
  },
  replies: {
    select: {
      id: true,
      body: true,
      authorId: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      senderType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TicketSelect;

type TicketDetailRecord = Prisma.TicketGetPayload<{ select: typeof ticketDetailSelect }>;

function parseTicketId(idParam: string | string[] | undefined, res: Response) {
  const normalizedIdParam = Array.isArray(idParam) ? idParam[0] : idParam;
  const id = parseInt(normalizedIdParam ?? "", 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return null;
  }

  return id;
}

function serializeTicketDetail(ticket: TicketDetailRecord) {
  const assignedToAgent =
    ticket.assignedToAgent && ticket.assignedToAgent.deletedAt === null
      ? {
          id: ticket.assignedToAgent.id,
          name: ticket.assignedToAgent.name,
          email: ticket.assignedToAgent.email,
        }
      : null;

  const replies = ticket.replies.map((reply) => ({
    id: reply.id,
    body: reply.body,
    authorId: reply.authorId,
    author: reply.author
      ? { id: reply.author.id, name: reply.author.name, email: reply.author.email }
      : null,
    senderType: reply.senderType,
    createdAt: reply.createdAt,
  }));

  return {
    id: ticket.id,
    subject: ticket.subject,
    body: ticket.body,
    bodyHtml: ticket.bodyHtml,
    fromName: ticket.fromName,
    fromEmail: ticket.fromEmail,
    status: ticket.status,
    classification: ticket.classification ?? TicketClassification.GeneralQuestion,
    assignedToAgentId: assignedToAgent?.id ?? null,
    assignedToAgent,
    replies,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

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
  const id = parseTicketId(req.params.id, res);
  if (id === null) {
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: ticketDetailSelect,
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(serializeTicketDetail(ticket));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseTicketId(req.params.id, res);
  if (id === null) {
    return;
  }

  const data = parseBody(ticketUpdateSchema, req.body, res);
  if (!data) {
    return;
  }

  const existingTicket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingTicket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const hasAssignedToAgentId = "assignedToAgentId" in data;
  const hasStatus = "status" in data;
  const hasClassification = "classification" in data;

  if (hasAssignedToAgentId && data.assignedToAgentId !== null) {
    const assignedAgent = await prisma.user.findFirst({
      where: {
        id: data.assignedToAgentId,
        role: UserRole.Agent,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!assignedAgent) {
      res.status(400).json({ error: "Assigned agent must be an active agent" });
      return;
    }
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(hasAssignedToAgentId ? { assignedToAgentId: data.assignedToAgentId } : {}),
      ...(hasStatus ? { status: data.status } : {}),
      ...(hasClassification ? { classification: data.classification } : {}),
    },
    select: ticketDetailSelect,
  });

  res.json(serializeTicketDetail(updatedTicket));
});

router.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseTicketId(req.params.id, res);
  if (id === null) {
    return;
  }

  const data = parseBody(ticketReplyCreateSchema, req.body, res);
  if (!data) {
    return;
  }

  const existingTicket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingTicket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  await prisma.ticketReply.create({
    data: {
      body: data.body,
      ticketId: id,
      authorId: req.authSession!.user.id,
      senderType: SenderType.Agent,
    },
  });

  const updatedTicket = await prisma.ticket.findUnique({
    where: { id },
    select: ticketDetailSelect,
  });

  res.json(serializeTicketDetail(updatedTicket!));
});

export default router;

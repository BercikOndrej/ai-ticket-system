import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../db";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
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
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
});

export default router;

import { Router } from "express";
import { createUserSchema } from "core/schemas/users";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { prisma } from "../db";
import { createUser } from "../lib/users";

const router = Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }
  const { name, email, password } = result.data;

  try {
    const user = await createUser(name, email, password);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

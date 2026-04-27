import { Router, Request, Response } from "express";
import { createUserSchema, editUserSchema } from "core/schemas/users";
import { UserRole } from "core/enums";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { prisma } from "../db";
import { auth } from "../auth";
import { createUser } from "../lib/users";
import { parseBody } from "../lib/validation";

const router = Router();

function handleMutationError(err: any, res: Response) {
  if (err?.code === "P2002") {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
}

router.get("/assignable-agents", requireAuth, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: UserRole.Agent,
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  res.json(users);
});

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const data = parseBody(createUserSchema, req.body, res);
  if (!data) return;

  try {
    const user = await createUser(data.name, data.email, data.password);
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    handleMutationError(err, res);
  }
});

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const data = parseBody(editUserSchema, req.body, res);
    if (!data) return;

    const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      const now = new Date();

      await prisma.user.update({
        where: { id },
        data: { name: data.name, email: data.email, updatedAt: now },
      });

      if (data.password !== "") {
        const ctx = await auth.$context;
        const hashedPassword = await ctx.password.hash(data.password);
        await prisma.account.updateMany({
          where: { userId: id, providerId: "credential" },
          data: { password: hashedPassword, updatedAt: now },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      res.json(user);
    } catch (err) {
      handleMutationError(err, res);
    }
  },
);

router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (existing.role === UserRole.Admin) {
    res.status(403).json({ error: "Admin users cannot be deleted" });
    return;
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);

  res.status(204).send();
});

export default router;

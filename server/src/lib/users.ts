import { auth } from "../auth";
import { prisma } from "../db";
import { UserRole } from "../enums";

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = UserRole.Agent
) {
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, emailVerified: false, role, createdAt: now, updatedAt: now },
    });
    await tx.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    });
    return user;
  });
}

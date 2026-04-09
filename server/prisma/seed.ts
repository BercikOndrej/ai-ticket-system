import "dotenv/config";
import { auth } from "../src/auth";
import { prisma } from "../src/db";
import { UserRole } from "../src/enums";

const adminEmail = process.env.SEED_ADMIN_EMAIL!;
const adminPassword = process.env.SEED_ADMIN_PASSWORD!;
const agentEmail = process.env.SEED_AGENT_EMAIL!;
const agentPassword = process.env.SEED_AGENT_PASSWORD!;

if (!adminEmail || !adminPassword || !agentEmail || !agentPassword) {
  console.error(
    "SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_AGENT_EMAIL, and SEED_AGENT_PASSWORD must be set"
  );
  process.exit(1);
}

async function seedUser(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`${role} user ${email} already exists — skipping`);
    return;
  }

  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);
  const now = new Date();

  const user = await prisma.user.create({
    data: { name, email, emailVerified: false, role, createdAt: now, updatedAt: now },
  });

  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`${role} user created: ${email}`);
}

async function seed() {
  await seedUser("Admin", adminEmail, adminPassword, UserRole.Admin);
  await seedUser("Agent", agentEmail, agentPassword, UserRole.Agent);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { auth } from "../src/auth";
import { prisma } from "../src/db";
import { UserRole } from "../src/enums";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

const adminEmail = required("SEED_ADMIN_EMAIL");
const adminPassword = required("SEED_ADMIN_PASSWORD");
const agentEmail = required("SEED_AGENT_EMAIL");
const agentPassword = required("SEED_AGENT_PASSWORD");

async function upsertUser(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`${role} ${email} already exists — skipping`);
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

  console.log(`Created ${role}: ${email}`);
}

async function seed() {
  await upsertUser("Admin", adminEmail, adminPassword, UserRole.Admin);
  await upsertUser("Agent", agentEmail, agentPassword, UserRole.Agent);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

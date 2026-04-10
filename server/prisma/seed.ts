import { prisma } from "../src/db";
import { UserRole } from "../src/enums";
import { createUser } from "../src/lib/users";

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

  await createUser(name, email, password, role);
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

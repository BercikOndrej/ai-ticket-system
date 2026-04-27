import { execSync } from "child_process";
import path from "path";
import { Client } from "pg";
import { TEST_ENV, TEST_ENV_PATHS } from "./test-env";

const quoteIdentifier = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const getRequiredDatabaseUrl = (): string => {
  const databaseUrl = TEST_ENV.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      `Missing DATABASE_URL for E2E tests. Checked ${TEST_ENV_PATHS.testEnvPath} and ${TEST_ENV_PATHS.defaultEnvPath}.`,
    );
  }

  return databaseUrl;
};

async function ensureTestDatabaseExists(databaseUrl: string) {
  const targetUrl = new URL(databaseUrl);
  const targetDatabase = targetUrl.pathname.replace(/^\//, "");

  if (!targetDatabase) {
    throw new Error(`Invalid DATABASE_URL for E2E tests: ${databaseUrl}`);
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  const client = new Client({ connectionString: adminUrl.toString() });

  await client.connect();

  try {
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      targetDatabase,
    ]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdentifier(targetDatabase)}`);
    }
  } finally {
    await client.end();
  }
}

export default async function globalSetup() {
  const databaseUrl = getRequiredDatabaseUrl();

  console.log("Resetting test database...");
  await ensureTestDatabaseExists(databaseUrl);

  const serverDir = path.resolve(__dirname, "../server");
  const execEnv = {
    ...process.env,
    ...TEST_ENV,
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "Yes",
  };

  execSync("npx prisma migrate reset --force", {
    cwd: serverDir,
    stdio: "inherit",
    env: execEnv,
  });

  console.log("Running seed...");

  execSync("npm run seed", {
    cwd: serverDir,
    stdio: "inherit",
    env: execEnv,
  });

  console.log("Test database ready.");
}

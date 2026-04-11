import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const serverDir = path.resolve(__dirname, "../server");
const envTestPath = path.join(serverDir, ".env.test");

async function globalSetup() {
  if (!fs.existsSync(envTestPath)) {
    throw new Error(
      `Test env file not found: ${envTestPath}\n` +
        `Copy server/.env.test.example to server/.env.test and fill in values.`
    );
  }

  const testEnv = dotenv.parse(fs.readFileSync(envTestPath));
  const env = { ...process.env, ...testEnv };

  const databaseUrl = testEnv.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in server/.env.test");
  }

  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1);
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  // Use pg from the server's node_modules (already a dependency there).
  const { Client } = require(path.join(serverDir, "node_modules/pg"));

  // Create the database only if it doesn't already exist.
  // Preserving the DB between runs keeps user sessions alive so
  // auth.setup.ts can skip re-logging in when the session is still valid.
  const adminClient = new Client({ connectionString: adminUrl.toString() });
  await adminClient.connect();
  const { rowCount } = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );
  if (rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[global-setup] Created database "${dbName}"`);
  }
  await adminClient.end();

  console.log("[global-setup] Running migrations on test database...");
  execSync("npx prisma migrate deploy", { cwd: serverDir, env, stdio: "inherit" });

  // Truncate test-data tables (not auth tables) so each run starts clean
  // without dropping the whole DB (which would invalidate sessions).
  const testClient = new Client({ connectionString: databaseUrl });
  await testClient.connect();
  await testClient.query(`TRUNCATE TABLE ticket RESTART IDENTITY CASCADE`);
  await testClient.end();

  console.log("[global-setup] Seeding test users...");
  execSync("npm run seed", { cwd: serverDir, env, stdio: "inherit" });
}

export default globalSetup;

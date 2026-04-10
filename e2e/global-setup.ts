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

  // Ensure the test database exists before running migrations.
  const url = new URL(databaseUrl);
  const dbName = url.pathname.slice(1); // strip leading "/"
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";

  // Use pg from the server's node_modules (already a dependency there).
  // Always drop and recreate for a clean migration history on every run.
  const { Client } = require(path.join(serverDir, "node_modules/pg"));
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  // Terminate any open connections so the database can be dropped.
  await client.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
    [dbName]
  );
  await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  await client.query(`CREATE DATABASE "${dbName}"`);
  await client.end();

  console.log("[global-setup] Running migrations on test database...");
  execSync("npx prisma migrate deploy", { cwd: serverDir, env, stdio: "inherit" });

  console.log("[global-setup] Seeding test users...");
  execSync("npm run seed", { cwd: serverDir, env, stdio: "inherit" });
}

export default globalSetup;

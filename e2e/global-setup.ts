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

  console.log("[global-setup] Running migrations on test database...");
  execSync("npx prisma migrate deploy", { cwd: serverDir, env, stdio: "inherit" });

  console.log("[global-setup] Seeding test users...");
  execSync("npm run seed", { cwd: serverDir, env, stdio: "inherit" });
}

export default globalSetup;

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const DEFAULT_TEST_DATABASE_URL = "postgresql://user:password@localhost:5432/ticket_system_test";
const TEST_DATABASE_NAME = "ticket_system_test";

const testEnvPath = path.resolve(__dirname, "../server/.env.test");
const defaultEnvPath = path.resolve(__dirname, "../server/.env");

type EnvMap = Record<string, string>;

const readEnvFile = (filePath: string): EnvMap =>
  fs.existsSync(filePath) ? dotenv.parse(fs.readFileSync(filePath)) : {};

const deriveTestDatabaseUrl = (databaseUrl?: string): string | undefined => {
  if (!databaseUrl) {
    return undefined;
  }

  const url = new URL(databaseUrl);
  url.pathname = `/${TEST_DATABASE_NAME}`;

  return url.toString();
};

const resolveDatabaseUrl = (testEnv: EnvMap, defaultEnv: EnvMap): string | undefined => {
  const testDatabaseUrl = testEnv.DATABASE_URL;

  if (testDatabaseUrl && testDatabaseUrl !== DEFAULT_TEST_DATABASE_URL) {
    return testDatabaseUrl;
  }

  return deriveTestDatabaseUrl(defaultEnv.DATABASE_URL) ?? testDatabaseUrl;
};

export const TEST_ENV_PATHS = {
  testEnvPath,
  defaultEnvPath,
} as const;

export const loadTestEnv = (): EnvMap => {
  const testEnv = readEnvFile(testEnvPath);
  const defaultEnv = readEnvFile(defaultEnvPath);
  const databaseUrl = resolveDatabaseUrl(testEnv, defaultEnv);

  return {
    ...defaultEnv,
    ...testEnv,
    ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
  };
};

export const TEST_ENV = loadTestEnv();

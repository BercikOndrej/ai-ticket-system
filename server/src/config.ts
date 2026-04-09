export function validateEnv() {
  const required = ["DATABASE_URL", "CLIENT_URL", "BETTER_AUTH_SECRET"];

  for (const key of required) {
    if (!process.env[key]) throw new Error(`${key} is required`);
  }
}

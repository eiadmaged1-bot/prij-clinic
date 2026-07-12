import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadRootEnv() {
  const root = findRepoRoot();

  loadEnvFile(resolve(root, ".env"));
  loadEnvFile(resolve(root, "apps/api/.env"));
}

export function validateRuntimeEnv() {
  const appEnv =
    process.env.APP_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "local");
  const isProduction = appEnv === "production";
  const isStaging = appEnv === "staging";
  const errors: string[] = [];

  for (const name of ["DATABASE_URL", "JWT_SECRET"]) {
    if (!process.env[name]) {
      errors.push(`${name} is required.`);
    }
  }

  if ((isProduction || isStaging) && !process.env.APP_URL) {
    errors.push("APP_URL is required in staging and production so CORS can be restricted to the web app origin.");
  }

  if ((isProduction || isStaging) && process.env.APP_URL?.startsWith("http://")) {
    errors.push("APP_URL must use HTTPS in staging and production.");
  }

  if (process.env.AI_FEATURES_ENABLED === "true") {
    errors.push("AI_FEATURES_ENABLED must stay false for this release candidate.");
  }

  const disabledAiProviders = new Set(["disabled", "disabled_mock"]);
  if (process.env.AI_PROVIDER && !disabledAiProviders.has(process.env.AI_PROVIDER)) {
    errors.push("AI_PROVIDER must be disabled or disabled_mock for this release candidate.");
  }

  if (process.env.EXTERNAL_AI_ENABLED === "true") {
    errors.push("EXTERNAL_AI_ENABLED must stay false for this release candidate.");
  }

  const jwtSecret = process.env.JWT_SECRET ?? "";
  const insecureJwtSecrets = new Set([
    "secret",
    "changeme",
    "change-me",
    "replace-with-local-development-secret",
    "your-local-dev-secret",
    "local-dev-secret",
    "dev-secret"
  ]);

  if ((isProduction || isStaging) && jwtSecret.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters for staging or production.");
  }

  if (isProduction && insecureJwtSecrets.has(jwtSecret.toLowerCase())) {
    errors.push("JWT_SECRET uses an insecure example value and is forbidden in production.");
  }

  if ((isProduction || isStaging) && process.env.DEMO_MODE === "true") {
    errors.push("DEMO_MODE is forbidden in staging and production.");
  }

  if ((isProduction || isStaging) && process.env.PATIENT_FILE_STORAGE_MODE === "local_demo_file") {
    errors.push("PATIENT_FILE_STORAGE_MODE=local_demo_file is forbidden in staging and production.");
  }
  if (isProduction && (!process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY || !process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY_ID)) {
    errors.push("Patient document encryption key and key identifier are required in production.");
  }
  if (process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY) {
    try {
      if (Buffer.from(process.env.PATIENT_DOCUMENT_ENCRYPTION_KEY, "base64").length !== 32) errors.push("PATIENT_DOCUMENT_ENCRYPTION_KEY must decode to exactly 32 bytes.");
    } catch { errors.push("PATIENT_DOCUMENT_ENCRYPTION_KEY must be valid base64."); }
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "1h";
  if (isProduction && !/^\d+[smh]$/.test(jwtExpiresIn)) {
    errors.push("JWT_EXPIRES_IN must be a short seconds/minutes/hours value in production.");
  }

  const demoPasswords = [
    process.env.DEMO_OWNER_PASSWORD,
    process.env.DEMO_ADMIN_PASSWORD,
    process.env.DEMO_TEST_PASSWORD
  ].filter(Boolean);

  if (isProduction) {
    if (process.env.SEED_DEMO_OWNER === "true" || process.env.SEED_DEMO_DATA === "true") {
      errors.push("Demo seed flags are forbidden in production.");
    }

    for (const password of demoPasswords) {
      if (password === "eyad" || password === "LocalDev123!") {
        errors.push("Demo passwords are forbidden in production.");
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join("\n- ")}`);
  }
}

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function findRepoRoot() {
  for (const start of [process.cwd(), __dirname]) {
    let current = resolve(start);
    const root = parse(current).root;

    while (current !== root) {
      if (existsSync(join(current, "package.json")) && existsSync(join(current, "apps"))) {
        return current;
      }

      current = dirname(current);
    }
  }

  return process.cwd();
}

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

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function validateRuntimeEnv() {
  const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}.`);
  }

  if (process.env.AI_FEATURES_ENABLED === "true") {
    throw new Error("AI_FEATURES_ENABLED must remain false for V0.1.");
  }

  if (process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "disabled") {
    throw new Error("AI_PROVIDER must remain disabled for V0.1.");
  }

  if (appEnv === "production") {
    const secret = process.env.JWT_SECRET ?? "";
    const unsafeSecrets = new Set([
      "replace-with-local-development-secret",
      "ci-placeholder-secret",
      "change-me",
      "placeholder"
    ]);

    if (unsafeSecrets.has(secret) || secret.length < 32) {
      throw new Error("JWT_SECRET is not production-safe.");
    }

    if (!process.env.APP_URL?.startsWith("https://")) {
      throw new Error("APP_URL must use HTTPS when APP_ENV=production.");
    }
  }
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

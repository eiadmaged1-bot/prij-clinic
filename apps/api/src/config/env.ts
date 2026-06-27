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

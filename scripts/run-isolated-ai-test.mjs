import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadRootEnv } = require("../apps/api/prisma/env.js");

const mode = process.argv[2];
if (!new Set(["safety", "regression"]).has(mode) || process.argv.length !== 3) {
  console.error("Usage: node scripts/run-isolated-ai-test.mjs safety|regression");
  process.exit(2);
}

loadRootEnv();
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to derive an isolated local test database.");

const baseUrl = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname)) {
  throw new Error("AI safety tests refuse to create a disposable database on a non-local host.");
}

const databaseName = `prij_clinic_test_ai_${mode}_${process.pid}`;
if (!databaseName.startsWith("prij_clinic_test_ai_")) throw new Error("Unsafe disposable database name.");
const databaseUrl = new URL(baseUrl);
databaseUrl.pathname = `/${databaseName}`;
const port = 3300 + (process.pid % 200);
const password = crypto.randomBytes(24).toString("base64url");
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl.toString(),
  API_HOST: "127.0.0.1",
  API_PORT: String(port),
  API_URL: `http://127.0.0.1:${port}`,
  DEMO_TEST_PASSWORD: password,
  DEMO_ADMIN_LOGIN: "runtime.owner@prij.local",
  PRIJ_TEST_DATABASE_NAME: databaseName,
  AI_FEATURES_ENABLED: "false",
  AI_PROVIDER: "disabled",
  NODE_ENV: "test"
};
Object.assign(process.env, env);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? env,
    stdio: "inherit",
    windowsHide: true
  });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status ?? "unknown"}.`);
}

function docker(args, stdio = "inherit") {
  return spawnSync("docker", args, { stdio, windowsHide: true });
}

async function waitForApi() {
  const deadline = Date.now() + 90_000;
  let lastError;
  while (Date.now() < deadline) {
    if (api?.exitCode !== null) throw new Error(`Isolated API exited before readiness with code ${api?.exitCode}.`);
    try {
      const response = await fetch(`${env.API_URL}/health/live`);
      if (response.ok) return;
      lastError = new Error(`Health check returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw lastError ?? new Error("Isolated API did not become ready.");
}

const exists = docker([
  "exec", "prij-clinic-postgres", "psql", "-U", "prij_clinic_dev", "-d", "postgres",
  "-X", "-tAc", `SELECT 1 FROM pg_database WHERE datname='${databaseName}'`
], "pipe");
if (exists.status !== 0) throw new Error("Could not verify the disposable AI test database name.");
if (exists.stdout.toString().trim()) throw new Error("Disposable AI test database already exists; refusing to overwrite it.");

let api;
try {
  run("docker", ["exec", "prij-clinic-postgres", "createdb", "-U", "prij_clinic_dev", databaseName]);
  run(process.execPath, ["scripts/prisma.cjs", "migrate", "deploy"], { cwd: "apps/api" });
  run(process.execPath, ["scripts/prisma.cjs", "db", "seed"], { cwd: "apps/api" });
  if (!process.env.npm_execpath) throw new Error("Run this test through npm so the API build can be invoked safely.");
  run(process.execPath, [process.env.npm_execpath, "run", "build:api"]);

  api = spawn(process.execPath, ["apps/api/dist/main.js"], {
    env,
    stdio: "inherit",
    windowsHide: true
  });
  await waitForApi();

  if (mode === "safety") {
    const { demoUsers, disconnectTestPrisma, login } = await import("./security-route-manifest.mjs");
    try {
      await login(demoUsers.owner);
      await login(demoUsers.nurse);
    } finally {
      await disconnectTestPrisma();
    }
    run("powershell", ["-ExecutionPolicy", "Bypass", "-File", "scripts/ai-safety-test.ps1"]);
  } else {
    run(process.execPath, ["scripts/ai-safety-regression-test.mjs"]);
  }
} finally {
  if (api && api.exitCode === null) {
    api.kill();
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    if (api.exitCode === null && process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(api.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    }
  }
  const dropped = docker(["exec", "prij-clinic-postgres", "dropdb", "-U", "prij_clinic_dev", "--if-exists", databaseName]);
  if (dropped.status !== 0) console.error("Failed to remove the disposable AI test database.");
}

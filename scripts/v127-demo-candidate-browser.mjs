import { spawn, spawnSync } from "node:child_process";

const env = { ...process.env, APP_ENV: process.env.APP_ENV || "local" };
let startedApp = false;

try {
  if (!(await isReachable("http://localhost:3001/health")) || !(await isReachable("http://localhost:3000/login"))) {
    startedApp = true;
    spawn(commandShell(), commandArgs("npm run dev"), {
      env,
      stdio: "ignore",
      windowsHide: true
    });
    await waitFor("http://localhost:3001/health", 90_000);
    await waitFor("http://localhost:3000/login", 90_000);
  }

  const test = spawnSync(commandShell(), commandArgs("npx playwright test --config=playwright.config.ts tests/v127 --reporter=list"), {
    env,
    stdio: "inherit"
  });

  cleanupAndExit(test.status ?? 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  cleanupAndExit(1);
}

function cleanupAndExit(status) {
  const cleanup = spawnSync(
    process.platform === "win32" ? "node.exe" : "node",
    ["scripts/v121-clean-operational-data.mjs", "--apply"],
    { env, stdio: "inherit" }
  );

  if (startedApp) {
    spawnSync(commandShell(), commandArgs("npm run dev:stop"), {
      env,
      stdio: "inherit"
    });
  }

  if (cleanup.status !== 0) {
    console.error("V127 browser cleanup failed. Run npm run db:v121:clean:dry-run before any manual cleanup.");
    process.exit(cleanup.status ?? 1);
  }

  process.exit(status);
}

async function waitFor(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isReachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function isReachable(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function commandShell() {
  return process.platform === "win32" ? "cmd.exe" : "sh";
}

function commandArgs(command) {
  return process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-c", command];
}

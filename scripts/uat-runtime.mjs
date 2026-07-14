import { spawn, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const environment = {
  ...process.env,
  NODE_ENV: "production",
  APP_ENV: process.env.APP_ENV || "uat",
  API_HOST: "127.0.0.1",
  API_PORT: "3001",
  PRIJ_API_INTERNAL_ORIGIN: process.env.PRIJ_API_INTERNAL_ORIGIN || "http://127.0.0.1:3001"
};
const scripts = ["start:api", "start:lan -w apps/web"];
let stopping = false;

console.log("[uat] Starting production-built web on 0.0.0.0:3000.");
console.log("[uat] Starting API on loopback 127.0.0.1:3001; do not tunnel or expose this port.");
console.log("[uat] Browser API traffic uses same-origin /api/backend/ through web port 3000.");

function start(script) {
  if (isWindows) {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npm run ${script}`], { env: environment, stdio: "inherit", windowsHide: true });
  }
  return spawn("npm", ["run", ...script.split(" ")], { env: environment, stdio: "inherit" });
}

const children = scripts.map(start);

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.killed) continue;
    if (isWindows && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));
process.on("SIGBREAK", () => stop(131));
for (const child of children) {
  child.on("error", () => stop(1));
  child.on("exit", (code) => {
    if (!stopping && code) stop(code);
  });
}

import { networkInterfaces } from "node:os";
import { spawn, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const isLanMode = process.argv.includes("--lan");
const isTailscaleMode = process.argv.includes("--tailscale");
if (isLanMode || isTailscaleMode) {
  process.env.API_HOST = process.env.API_HOST || "0.0.0.0";
  process.env.WEB_HOST = process.env.WEB_HOST || "0.0.0.0";
  process.env.HOST = process.env.HOST || "0.0.0.0";
  process.env.CORS_ALLOW_TAILSCALE_DEV = process.env.CORS_ALLOW_TAILSCALE_DEV || "true";
  process.env.CORS_PRIVATE_CIDRS = process.env.CORS_PRIVATE_CIDRS || "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16";
  process.env.CORS_PRIVATE_PORTS = process.env.CORS_PRIVATE_PORTS || "3000";
  printLanProfile();
}
const commands = ["dev:api", isLanMode || isTailscaleMode ? "dev:web:lan" : "dev:web"];
let stopping = false;

function spawnDev(script) {
  if (isWindows) {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npm run ${script}`], {
      stdio: "inherit",
      windowsHide: false
    });
  }

  return spawn("npm", ["run", script], {
    stdio: "inherit"
  });
}

const children = commands.map(spawnDev);

const stop = () => {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) {
      if (isWindows && child.pid) {
        spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
          stdio: "ignore",
          windowsHide: true
        });
      } else {
        child.kill("SIGTERM");
      }
    }
  }
};

process.on("SIGINT", () => {
  stop();
  process.exit(130);
});

process.on("SIGTERM", () => {
  stop();
  process.exit(143);
});

process.on("SIGBREAK", () => {
  stop();
  process.exit(131);
});

process.on("exit", () => {
  stop();
});

for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    stop();
    process.exit(1);
  });

  child.on("exit", (code) => {
    if (stopping) return;

    if (code && code !== 0) {
      stop();
      process.exit(code);
    }
  });
}

function printLanProfile() {
  const addresses = Object.values(networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
  const tailscale = addresses.find((address) => /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(address));
  const lan = addresses.find((address) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address));

  console.log("[dev:lan] Web listens on 0.0.0.0:3000 and API listens on 0.0.0.0:3001.");
  console.log("[dev:lan] Local same-PC: http://localhost:3000");
  if (tailscale) console.log(`[dev:lan] Tailscale device URL: http://${tailscale}:3000`);
  if (lan) console.log(`[dev:lan] LAN device URL: http://${lan}:3000`);
  if (!tailscale) console.log("[dev:lan] Tailscale IPv4 not detected. Start Tailscale, then rerun this command if phone QA needs it.");
}

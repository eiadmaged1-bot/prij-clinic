import { spawn, spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const isLanMode = process.argv.includes("--lan");
const commands = ["dev:api", isLanMode ? "dev:web:lan" : "dev:web"];
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

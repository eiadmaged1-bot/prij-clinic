const { spawnSync } = require("node:child_process");
const { loadRootEnv } = require("../prisma/env");

loadRootEnv();

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env
});

process.exit(result.status ?? 1);

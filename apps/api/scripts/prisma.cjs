const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { loadRootEnv } = require("../prisma/env");

loadRootEnv();

const prismaCli = path.resolve(__dirname, "../../../node_modules/prisma/build/index.js");
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env
});

process.exit(result.status ?? 1);

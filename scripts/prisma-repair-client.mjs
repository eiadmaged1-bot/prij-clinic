import { existsSync } from "node:fs";
import { cp, readdir, rm, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const isWindows = process.platform === "win32";
const clientDir = join(repoRoot, "node_modules", ".prisma", "client");
const packagePrismaDir = join(repoRoot, "node_modules", "@prisma", "client", ".prisma");
const generatedPrismaDir = join(repoRoot, "node_modules", ".prisma");
const tempImportTest = join(repoRoot, `.prisma-import-test.${process.pid}.cjs`);

function run(command, args) {
  const executable = isWindows && command === "npm" ? "cmd.exe" : command;
  const commandArgs = isWindows && command === "npm" ? ["/d", "/s", "/c", "npm", ...args] : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

async function assertPrismaClient() {
  const files = await readdir(clientDir);
  const hasDefault = files.includes("default.js");
  const hasEngine = files.some((file) => /query_engine|libquery_engine/i.test(file));

  if (!hasDefault) {
    throw new Error(`Required Prisma Client file is missing: ${join(clientDir, "default.js")}`);
  }
  if (!hasEngine) {
    throw new Error(`Required Prisma query engine is missing in: ${clientDir}`);
  }
}

if (isWindows) {
  run("npm", ["run", "dev:stop"]);
}

if (existsSync(clientDir)) {
  await rm(clientDir, { recursive: true, force: true });
}

run("npm", ["run", "prisma:generate"]);

if (existsSync(generatedPrismaDir)) {
  await rm(packagePrismaDir, { recursive: true, force: true });
  await cp(join(generatedPrismaDir, "client"), packagePrismaDir, { recursive: true });
}

await assertPrismaClient();

const importTest = `
const { PrismaClient } = require("@prisma/client");
require("@prisma/client/default.js");

if (typeof PrismaClient !== "function") {
  throw new Error("PrismaClient export is not a constructor.");
}

const prisma = new PrismaClient();
Promise.resolve()
  .then(() => prisma.$disconnect())
  .then(() => {
    console.log("Prisma import ok");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
`;

try {
  await writeFile(tempImportTest, importTest, "ascii");
  run("node", [tempImportTest]);
} finally {
  await unlink(tempImportTest).catch(() => {});
}

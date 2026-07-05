import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

function run(command, args) {
  const executable = process.platform === "win32" && command === "npm" ? process.env.ComSpec ?? "cmd.exe" : command;
  const finalArgs = process.platform === "win32" && command === "npm" ? ["/d", "/s", "/c", "npm", ...args] : args;
  const result = spawnSync(executable, finalArgs, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed${result.error ? `: ${result.error.message}` : ""}`);
}

function trackedFiles() {
  const result = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error("git ls-files failed");
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

const packageJson = JSON.parse(read("package.json"));
for (const script of ["prisma:generate", "prisma:migrate:deploy", "build", "dev", "test:v144:clinic-walkthrough", "test:v150:mvp-business-walkthrough", "test:v160:security-real-data-readiness"]) {
  assert(Boolean(packageJson.scripts?.[script]), `package script exists: ${script}`);
}

assert(exists(".env.example"), "required .env.example exists");
assert(exists(".env.production.example"), "required .env.production.example exists");
assert(read("docker-compose.yml").includes("postgres:") && read("docker-compose.yml").includes("5432:5432"), "Docker compose postgres service exists");

const scriptAndPackageFiles = trackedFiles().filter((file) => file === "package.json" || file.startsWith("scripts/"));
const activeDestructivePatterns = [
  /docker\s+compose\s+down\s+-v/i,
  /prisma\s+migrate\s+reset/i,
  /DROP\s+DATABASE/i,
  /db\s+push\s+--force-reset/i
];
for (const file of scriptAndPackageFiles) {
  const lines = read(file).split(/\r?\n/);
  for (const pattern of activeDestructivePatterns) {
    const activeLine = lines.find((line) => pattern.test(line) && !/\b(does not|never|forbidden|blocked|do not)\b/i.test(line));
    assert(!activeLine, `no active destructive command in ${file}`);
  }
}

const committedFiles = trackedFiles();
for (const forbidden of [".env", ".env.local", ".env.staging", ".env.production", "apps/api/.env", "apps/web/.env.local"]) {
  assert(!committedFiles.includes(forbidden), `${forbidden} is not committed`);
}

const committedSecrets = committedFiles.filter((file) => !file.endsWith(".example") && !file.includes("package-lock.json")).flatMap((file) => {
  const source = read(file);
  const findings = [];
  if (/\bsk-(?:proj|live|test)?-[A-Za-z0-9_-]{20,}/.test(source)) findings.push(`${file}: OpenAI/API-key-like token`);
  if (/\b(?:ghp|github_pat|glpat)-[A-Za-z0-9_]{20,}/.test(source)) findings.push(`${file}: source-hosting token`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/.test(source)) findings.push(`${file}: private key`);
  return findings;
});
assert(committedSecrets.length === 0, `no secret-like values are committed${committedSecrets.length ? `: ${committedSecrets.join(", ")}` : ""}`);

const envDocs = `${read("docs/ENVIRONMENT_VARIABLES.md")}\n${read("docs/DEPLOYMENT_PREP_CHECKLIST.md")}`;
assert(envDocs.includes("must never be printed"), "docs state env values must not be printed");

run("npm", ["run", "prisma:generate"]);
checks.push("Prisma client can generate");
run("npm", ["run", "prisma:migrate:deploy"]);
checks.push("migrations can deploy");
run("npm", ["run", "build"]);
checks.push("app builds");

console.log(`v0.16.1 startup readiness checks passed (${checks.length})`);

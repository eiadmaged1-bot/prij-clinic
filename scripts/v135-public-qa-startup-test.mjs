import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = readFileSync("package.json", "utf8");
const dev = readFileSync("scripts/dev.mjs", "utf8");
const wait = readFileSync("scripts/wait-for-local-app.mjs", "utf8");
const publicQa = readFileSync("docs/PUBLIC_MOBILE_QA.md", "utf8");

assert(packageJson.includes('"dev": "node scripts/dev.mjs"'), "npm run dev must start the local dev orchestrator");
assert(dev.includes("dev:api") && dev.includes("dev:web"), "dev orchestrator must start API and web");
assert(dev.includes("API running on http://localhost:3001"), "dev output must show API on 3001");
assert(dev.includes("Web running on http://localhost:3000"), "dev output must show web on 3000");
assert(dev.includes("Browser API base is same-origin /api/backend"), "dev output must show same-origin browser API base");
assert(wait.includes("http://localhost:3000") && wait.includes("/api/backend/health"), "wait script must verify web and same-origin proxy health");
assert(publicQa.includes("ngrok http 3000"), "public QA docs must use one ngrok tunnel to web port 3000");
assert(!publicQa.includes("ngrok http 3001"), "public QA docs must not require tunneling API port 3001");

console.log("V135 public QA startup PASS");

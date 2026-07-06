import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
import ts from "typescript";

const source = readFileSync("apps/web/lib/api-base-url.ts", "utf8");
const login = readFileSync("apps/web/app/login/page.tsx", "utf8");
const dev = readFileSync("scripts/dev.mjs", "utf8");
const docs = [
  readFileSync("docs/PUBLIC_MOBILE_QA.md", "utf8"),
  readFileSync("docs/LOCAL_TAILSCALE_QA.md", "utf8")
].join("\n");

const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function loadApiBaseUrl(env = {}, location) {
  const module = { exports: {} };
  const context = createContext({
    module,
    exports: module.exports,
    process: { env: { ...env } },
    URL,
    Number,
    console,
    window: { location }
  });
  new Script(compiled).runInContext(context);
  return module.exports;
}

for (const location of [
  { hostname: "localhost", protocol: "http:" },
  { hostname: "192.168.1.50", protocol: "http:" },
  { hostname: "100.127.4.46", protocol: "http:" },
  { hostname: "prij-clinic.tailnet-name.ts.net", protocol: "http:" },
  { hostname: "clinic-public.ngrok-free.app", protocol: "https:" },
  { hostname: "temporary.trycloudflare.com", protocol: "https:" }
]) {
  const { getApiBaseUrl } = loadApiBaseUrl({ NODE_ENV: "development" }, location);
  assert.equal(getApiBaseUrl(), "/api/backend", `${location.hostname} should use same-origin proxy`);
}

{
  const { getApiBaseUrl } = loadApiBaseUrl(
    { NODE_ENV: "development", NEXT_PUBLIC_LAN_API_ORIGIN: "http://100.127.4.46:3001" },
    { hostname: "100.127.4.46", protocol: "http:" }
  );
  assert.equal(getApiBaseUrl(), "http://100.127.4.46:3001", "explicit safe LAN/Tailscale override remains supported");
}

assert(!source.includes("throw new Error(\"LAN API fallback"), "public host must not throw API-base runtime errors");
assert(!source.includes("Cannot reach Prij API from this device"), "public host must not show old technical API message");
assert(login.includes("premium-login-card") && login.includes("login-language-row"), "login page keeps compact premium layout and stable language row");
assert(dev.includes("dev:public") || docs.includes("npm run dev:public"), "public QA workflow must be documented or scripted");
assert(docs.includes("only one public tunnel") || docs.includes("one public tunnel"), "public QA docs must state one tunnel is enough");
assert(docs.includes("port 3000") && docs.includes("port 3001"), "public QA docs must distinguish public web and internal API ports");

console.log("V134 public mobile access PASS");

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const args = parseArgs(process.argv.slice(2));
const token = await login();
const sources = await apiJson("GET", "/guidelines/sources", token);
const selected = args.source
  ? sources.sources.filter((item) => item.organization.toLowerCase() === args.source.toLowerCase())
  : sources.sources;

for (const source of selected) {
  if (["LOGIN_REQUIRED", "LINK_ONLY", "DO_NOT_IMPORT"].includes(source.sourceType)) {
    console.log(`Skipped ${source.organization}: ${source.sourceType}`);
    continue;
  }
  const check = await apiJson("POST", `/guidelines/sources/${source.id}/check-updates`, token, {});
  console.log(`Checked ${source.organization}: ${check.status}`);
}

async function login() {
  const identifier = process.env.GUIDELINE_IMPORT_LOGIN?.trim();
  const password = process.env.GUIDELINE_IMPORT_PASSWORD;
  if (!identifier || !password) throw new Error("GUIDELINE_IMPORT_LOGIN and GUIDELINE_IMPORT_PASSWORD are required.");
  const body = await apiJson("POST", "/auth/login", null, {
    identifier,
    password
  });
  return body.token;
}

async function apiJson(method, path, token, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { accept: "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(parsed)}`);
  return parsed;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) parsed[values[index].replace(/^--/, "")] = values[index + 1];
  return parsed;
}

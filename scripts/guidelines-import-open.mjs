const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");

const args = parseArgs(process.argv.slice(2));

if (!args.url || !args.title || !args.source || !args.specialty || !args.topic) {
  fail('Usage: npm run guidelines:import-open -- --url "https://example.org/guideline.pdf" --title "Example" --source "WHO" --specialty "obstetrics" --topic "antenatal care"');
}

if (/(login|signin|subscribe|paywall|account|session)/i.test(args.url)) {
  fail("Refusing login, subscription, account, or paywall URL.");
}

const token = await login();
const sources = await apiJson("GET", "/guidelines/sources", token);
const source = sources.sources?.find((item) => item.organization.toLowerCase() === args.source.toLowerCase());
if (!source) fail(`Source not found: ${args.source}. Run npm run prisma:seed first.`);
if (["LOGIN_REQUIRED", "LINK_ONLY", "DO_NOT_IMPORT"].includes(source.sourceType)) {
  fail(`Refusing import for ${source.organization}; source type is ${source.sourceType}.`);
}

const result = await apiJson("POST", "/guidelines/import-url", token, {
  sourceId: source.id,
  url: args.url,
  title: args.title,
  specialty: args.specialty,
  topic: args.topic,
  versionLabel: args.version,
  userApprovedPublicRestricted: args.approveRestricted === "true"
});

console.log(`Imported for review: ${result.document.title}`);
console.log(`Import job: ${result.importJobId}`);

async function login() {
  const body = await apiJson("POST", "/auth/login", null, {
    identifier: process.env.GUIDELINE_IMPORT_LOGIN || "eyad",
    password: process.env.GUIDELINE_IMPORT_PASSWORD || "eyad"
  });
  return body.token;
}

async function apiJson(method, path, token, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) fail(`${method} ${path} failed: ${JSON.stringify(parsed)}`);
  return parsed;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) {
    parsed[values[index].replace(/^--/, "")] = values[index + 1];
  }
  return parsed;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

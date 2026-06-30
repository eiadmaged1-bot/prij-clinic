const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const documentId = parseArgs(process.argv.slice(2)).documentId;
const token = await login();
const documents = documentId ? { documents: [{ id: documentId }] } : await apiJson("GET", "/guidelines/documents", token);

let count = 0;
for (const document of documents.documents ?? []) {
  await apiJson("POST", `/guidelines/documents/${document.id}/reindex`, token);
  count += 1;
  console.log(`Reindexed ${document.id}`);
}
console.log(`Reindex complete. Documents: ${count}`);

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

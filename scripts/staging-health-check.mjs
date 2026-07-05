const apiUrl = (process.env.STAGING_API_URL || process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const webUrl = (process.env.STAGING_BASE_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { label: "web login", url: `${webUrl}/login`, accept: (response) => response.ok },
  { label: "API health", url: `${apiUrl}/health`, accept: async (response) => response.ok && (await response.text()).includes("ok") },
  { label: "API DB health", url: `${apiUrl}/health/db`, accept: async (response) => response.ok && (await response.text()).includes("connected") }
];

for (const check of checks) {
  const response = await fetch(check.url, { headers: { Accept: "application/json,text/html" } });
  if (!(await check.accept(response))) {
    throw new Error(`${check.label} failed with status ${response.status}`);
  }
  console.log(`PASS ${check.label}`);
}

console.log("PASS staging health check");

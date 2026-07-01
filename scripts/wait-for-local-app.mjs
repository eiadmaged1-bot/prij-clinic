const WEB_URL = (process.env.WEB_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const timeoutMs = Number(process.env.LOCAL_APP_WAIT_TIMEOUT_MS || 120_000);
const intervalMs = Number(process.env.LOCAL_APP_WAIT_INTERVAL_MS || 2_000);

const checks = [
  {
    label: "web root",
    url: WEB_URL,
    required: true,
    accept: (response) => response.status < 500
  },
  {
    label: "API health",
    url: `${API_URL}/health`,
    required: true,
    accept: (response, body) => response.ok && /"ok"|ok/i.test(body)
  },
  {
    label: "API database health",
    url: `${API_URL}/health/db`,
    required: false,
    accept: (response, body) => response.ok && /"ok"|ok/i.test(body)
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(check) {
  const response = await fetch(check.url, {
    headers: { Accept: "application/json,text/html;q=0.9,*/*;q=0.8" }
  });
  const body = await response.text();
  if (response.status === 404 && !check.required) {
    return { ready: true, skipped: true, detail: "endpoint not available" };
  }
  if (check.accept(response, body)) {
    return { ready: true, skipped: false, detail: `status ${response.status}` };
  }
  return { ready: false, skipped: false, detail: `status ${response.status}` };
}

async function waitFor(check) {
  const deadline = Date.now() + timeoutMs;
  let lastDetail = "not checked";

  while (Date.now() < deadline) {
    try {
      const result = await probe(check);
      lastDetail = result.detail;
      if (result.ready) {
        const action = result.skipped ? "SKIP" : "PASS";
        console.log(`WAIT-LOCAL-APP ${action} ${check.label} - ${result.detail}`);
        return;
      }
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : String(error);
    }

    console.log(`WAIT-LOCAL-APP WAIT ${check.label} - ${lastDetail}`);
    await sleep(intervalMs);
  }

  throw new Error(`${check.label} was not ready before timeout: ${lastDetail}`);
}

for (const check of checks) {
  await waitFor(check);
}

console.log("WAIT-LOCAL-APP PASS local web, API, and DB health checks completed");

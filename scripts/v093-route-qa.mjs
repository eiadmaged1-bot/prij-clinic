const WEB_URL = (process.env.WEB_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const routes = [
  "/",
  "/login",
  "/dashboard",
  "/patients",
  "/patients/new",
  "/calendar",
  "/appointments",
  "/queue",
  "/doctor",
  "/doctor/visit",
  "/billing",
  "/finance",
  "/admin",
  "/owner-control",
  "/orders",
  "/medications",
  "/medications/search",
  "/medications/families",
  "/medications/herbals",
  "/medications/safety",
  "/drug-market",
  "/drug-market/search",
  "/admin/drug-market",
  "/admin/drug-market/coverage",
  "/admin/drug-market/automation",
  "/admin/drug-market/review-queue",
  "/consents",
  "/investigations",
  "/reports",
  "/pregnancy",
  "/ob-ultrasounds",
  "/guidelines",
  "/protocol-atlas",
  "/calculators",
  "/ai-drafts"
];

const results = [];

function record(status, route, detail) {
  results.push({ status, route, detail });
  const suffix = detail ? ` - ${detail}` : "";
  const writer = status === "FAIL" ? console.error : status === "WARN" ? console.warn : console.log;
  writer(`V093-ROUTE ${status} ${route}${suffix}`);
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertNoCrashText(route, html) {
  const text = visibleText(html);
  const checks = [
    [/Unhandled Runtime Error/i, "Unhandled Runtime Error"],
    [/Next\.js.*error/i, "Next.js error overlay text"],
    [/Error: .+ at .+\(.+:\d+:\d+\)/i, "stack trace"],
    [/^\s*[{[][\s\S]*[}\]]\s*$/i, "raw JSON response"],
    [/<<<<<<<|=======|>>>>>>>/, "conflict marker"],
    [/PrismaClientKnownRequestError/i, "Prisma crash text"],
    [/TypeError:|ReferenceError:|SyntaxError:/i, "raw technical exception"]
  ];
  for (const [pattern, label] of checks) {
    if (pattern.test(text) || pattern.test(html)) throw new Error(`${route} contains ${label}`);
  }
}

async function checkRoute(route) {
  const response = await fetch(`${WEB_URL}${route}`, {
    redirect: "manual",
    headers: { Accept: "text/html,application/xhtml+xml" }
  });
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (response.status >= 500) {
    throw new Error(`returned ${response.status}`);
  }
  if (response.status === 404) {
    throw new Error("missing page returned 404");
  }
  if ([301, 302, 303, 307, 308, 401, 403].includes(response.status)) {
    assertNoCrashText(route, body);
    record("WARN", route, `clean auth/redirect response ${response.status}`);
    return;
  }
  if (!response.ok) {
    throw new Error(`unexpected status ${response.status}`);
  }
  if (contentType.includes("application/json") || /^\s*[{[]/.test(body)) {
    throw new Error("returned raw JSON instead of visible HTML");
  }
  if (!/<html|<main|__next|app-shell|login-shell/i.test(body)) {
    throw new Error("did not look like an app page");
  }
  assertNoCrashText(route, body);
  record("PASS", route, "HTML rendered cleanly");
}

async function main() {
  for (const route of routes) {
    try {
      await checkRoute(route);
    } catch (error) {
      record("FAIL", route, error instanceof Error ? error.message : String(error));
    }
  }

  const pass = results.filter((item) => item.status === "PASS").length;
  const warn = results.filter((item) => item.status === "WARN").length;
  const fail = results.filter((item) => item.status === "FAIL").length;
  console.log(`V093-ROUTE SUMMARY PASS ${pass} WARN ${warn} FAIL ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

await main().catch((error) => {
  console.error(`V093-ROUTE FAIL setup - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

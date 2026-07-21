import {
  apiJson,
  apiStatus,
  assertStatus,
  bodyFor,
  createRouteFixtures,
  demoUsers,
  login,
  makeRecorder,
  routeManifest as baseRouteManifest,
  substitutePath,
  waitForApi
} from "./security-route-manifest.mjs";

const record = makeRecorder("ROUTES");
const rows = [];

const routeManifest = [
  ...baseRouteManifest.filter((route) => !(
    route.method === "POST" &&
    route.path === "/guidelines/documents/:guidelineDocumentId/archive"
  )),
  protectedRoute({
    method: "GET",
    path: "/guidelines/user-library/state",
    category: "guidelines",
    requiredPermission: "guidelines.read",
    allowedAs: "doctor",
    denyAs: "reception",
    notes: "Persistent Favorites and Recently Opened are clinical-user scoped."
  }),
  protectedRoute({
    method: "GET",
    path: "/guidelines/knowledge-search?q=doctor%20review",
    category: "guidelines",
    requiredPermission: "guidelines.search",
    allowedAs: "doctor",
    denyAs: "reception",
    notes: "Unified local guideline and reviewed-protocol search."
  }),
  protectedRoute({
    method: "POST",
    path: "/guidelines/evidence-assistant/ask",
    category: "guidelines",
    requiredPermission: "guidelines.search",
    allowedAs: "doctor",
    denyAs: "reception",
    fixtureBody: "guidelineAsk",
    notes: "Deterministic approved-library retrieval only; no autonomous clinical plan."
  }),
  protectedRoute({
    method: "POST",
    path: "/guidelines/user-library/documents/:guidelineDocumentId/archive",
    category: "guidelines-review",
    requiredPermission: "guidelines.delete_or_archive",
    allowedAs: "owner",
    denyAs: "reception",
    fixtureBody: "guidelineProtectedArchive",
    notes: "Protected archive requires a reason and exact-title confirmation."
  }),
  protectedRoute({
    method: "POST",
    path: "/guidelines/user-library/documents/:guidelineDocumentId/restore",
    category: "guidelines-review",
    requiredPermission: "guidelines.delete_or_archive",
    allowedAs: "owner",
    denyAs: "reception",
    notes: "Restore returns the document to Needs Review."
  })
];

async function main() {
  await waitForApi();
  const ownerToken = await login(demoUsers.owner);
  const roleTokens = {
    doctor: await login(demoUsers.doctor),
    reception: await login(demoUsers.reception),
    accountant: await login(demoUsers.accountant),
    nurse: await login(demoUsers.nurse)
  };
  const ids = await createRouteFixtures(ownerToken);
  const guidelineDocument = await apiJson(
    "GET",
    `/guidelines/documents/${ids.guidelineDocumentId}`,
    ownerToken
  );
  ids.guidelineDocumentTitle = guidelineDocument.title;

  for (const route of routeManifest) {
    const path = substitutePath(route.path, ids);
    const label = `${route.method} ${path}`;
    const body = route.fixtureBody ? routeBody(route.fixtureBody, ids) : undefined;
    const row = {
      route: route.name,
      permission: route.requiredPermission,
      anonymous: "not-run",
      owner: "not-run",
      denied: route.deniedLoginRole ?? "warn"
    };
    rows.push(row);

    try {
      const anonymous = await apiStatus(route.method, path, null, body);
      assertStatus(anonymous, route.expectedStatusWithoutToken, `${label} anonymous`);
      row.anonymous = String(anonymous);
      record.pass(`${label} rejects anonymous`);
    } catch (error) {
      row.anonymous = "FAIL";
      record.fail(`${label} anonymous`, error);
    }

    try {
      const ownerSession = route.method === "POST" && route.path === "/auth/logout"
        ? await login(demoUsers.owner)
        : ownerToken;
      const owner = await apiStatus(route.method, path, ownerSession, body);
      assertStatus(owner, route.expectedStatusWithOwner, `${label} owner`);
      row.owner = String(owner);
      record.pass(`${label} owner allowed`);
    } catch (error) {
      row.owner = "FAIL";
      record.fail(`${label} owner`, error);
    }

    if (!route.deniedLoginRole) {
      record.warn(`${label} has no denied-role assertion because route is broadly available to authenticated staff or category-specific denial is covered elsewhere.`);
      continue;
    }

    try {
      const denied = await apiStatus(route.method, path, roleTokens[route.deniedLoginRole], body);
      assertStatus(denied, route.expectedStatusWithDeniedUser, `${label} denied ${route.deniedLoginRole}`);
      row.denied = `${route.deniedLoginRole}:${denied}`;
      record.pass(`${label} denied for ${route.deniedLoginRole}`);
    } catch (error) {
      row.denied = "FAIL";
      record.fail(`${label} denied ${route.deniedLoginRole}`, error);
    }
  }
}

await main().catch((error) => record.fail("route authorization setup", error));
console.table(rows.map((row) => ({
  Route: row.route,
  Permission: row.permission,
  Anonymous: row.anonymous,
  Owner: row.owner,
  Denied: row.denied
})));
record.summary();

function routeBody(kind, ids) {
  if (kind === "guidelineProtectedArchive") {
    return {
      reason: "Protected guideline archive route authorization test.",
      confirmation: ids.guidelineDocumentTitle
    };
  }
  return bodyFor(kind, ids);
}

function protectedRoute(route) {
  return {
    name: `${route.method} ${route.path}`,
    requiresAuth: true,
    allowedLoginRole: route.allowedAs,
    allowedDemoUser: demoUsers[route.allowedAs],
    deniedLoginRole: route.denyAs,
    deniedDemoUser: route.denyAs ? demoUsers[route.denyAs] : null,
    expectedStatusWithOwner: [200, 201],
    expectedStatusWithoutToken: route.method === "GET" ? [401] : [401, 403],
    expectedStatusWithDeniedUser: route.denyAs ? [403, 404] : null,
    scopeExpectation: route.category === "guidelines-review"
      ? "Doctor/owner clinical governance route; non-clinical roles denied."
      : "Owner/admin/doctor local evidence route; receptionist/accountant denied.",
    auditExpectation: route.method === "GET"
      ? "Sensitive clinical-knowledge read audit expected where implemented."
      : "Mutation or evidence-assistant action audit expected.",
    currentLimitation: null,
    ...route
  };
}

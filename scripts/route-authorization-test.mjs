import {
  apiStatus,
  assertStatus,
  bodyFor,
  createRouteFixtures,
  demoUsers,
  login,
  makeRecorder,
  routeManifest,
  substitutePath,
  waitForApi
} from "./security-route-manifest.mjs";

const record = makeRecorder("ROUTES");
const rows = [];

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

  for (const route of routeManifest) {
    const path = substitutePath(route.path, ids);
    const label = `${route.method} ${path}`;
    const body = route.fixtureBody ? bodyFor(route.fixtureBody, ids) : undefined;
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

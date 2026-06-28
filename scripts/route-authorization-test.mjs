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

    try {
      const anonymous = await apiStatus(route.method, path, null, body);
      assertStatus(anonymous, 401, `${label} anonymous`);
      record.pass(`${label} rejects anonymous`);
    } catch (error) {
      record.fail(`${label} anonymous`, error);
    }

    try {
      const owner = await apiStatus(route.method, path, ownerToken, body);
      assertStatus(owner, [200, 201], `${label} owner`);
      record.pass(`${label} owner allowed`);
    } catch (error) {
      record.fail(`${label} owner`, error);
    }

    if (!route.denyAs) {
      record.warn(`${label} has no denied-role assertion because route is broadly available to authenticated staff or category-specific denial is covered elsewhere.`);
      continue;
    }

    try {
      const denied = await apiStatus(route.method, path, roleTokens[route.denyAs], body);
      assertStatus(denied, [403, 404], `${label} denied ${route.denyAs}`);
      record.pass(`${label} denied for ${route.denyAs}`);
    } catch (error) {
      record.fail(`${label} denied ${route.denyAs}`, error);
    }
  }
}

await main().catch((error) => record.fail("route authorization setup", error));
record.summary();

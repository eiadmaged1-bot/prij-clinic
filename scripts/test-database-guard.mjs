export function verifyTestDatabaseIsolation(env = process.env) {
  const main = env.DATABASE_URL?.trim();
  const test = env.TEST_DATABASE_URL?.trim();
  if (!test) throw new Error("TEST_DATABASE_URL is required for database-writing tests.");
  if (!main) throw new Error("DATABASE_URL is required for isolation comparison.");
  if (canonical(main) === canonical(test)) throw new Error("Refusing test execution because TEST_DATABASE_URL equals DATABASE_URL.");
  const name = decodeURIComponent(new URL(test).pathname.slice(1));
  if (!/(^|[_-])test([_-]|$)/i.test(name)) throw new Error("TEST_DATABASE_URL must name a clearly isolated test database.");
  return { configured: true, separate: true, testDatabaseName: name, deterministicMetadataRequired: true };
}

function canonical(value) {
  const url = new URL(value);
  url.password = "";
  url.username = "";
  url.searchParams.sort();
  return url.toString();
}

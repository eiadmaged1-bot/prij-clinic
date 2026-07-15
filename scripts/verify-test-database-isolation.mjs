import { verifyTestDatabaseIsolation } from "./test-database-guard.mjs";

try {
  const result = verifyTestDatabaseIsolation();
  console.log(`Test database isolation: configured=${result.configured}; separate=${result.separate}; database=${result.testDatabaseName}; deterministic-metadata=${result.deterministicMetadataRequired}`);
} catch (error) {
  console.error(`Test database isolation: NOT CONFIGURED (${error instanceof Error ? error.message : "unknown error"})`);
  process.exitCode = 2;
}

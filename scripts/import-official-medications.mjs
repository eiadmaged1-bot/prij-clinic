import {
  countrySourceDefaults,
  executeOfficialImport,
  parseArgs,
  prisma
} from "./official-medication-utils.mjs";

const args = parseArgs();
const countryCode = String(args.country ?? "").toUpperCase();
const sourceCode = args.source ?? countrySourceDefaults[countryCode];

try {
  const result = await executeOfficialImport({
    countryCode,
    sourceCode,
    mode: args.mode ?? "live",
    file: args.file,
    maxPages: args["max-pages"]
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    source: sourceCode,
    status: "failed",
    rowsImported: 0,
    reason: error instanceof Error ? error.message : "Official import failed."
  }, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

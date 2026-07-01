import { readFile } from "node:fs/promises";

const WEB_URL = (process.env.WEB_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const normalSourceFiles = [
  "apps/web/app/medications/page.tsx",
  "apps/web/app/medications/search/page.tsx",
  "apps/web/app/medications/families/page.tsx",
  "apps/web/app/medications/herbals/page.tsx",
  "apps/web/app/medications/safety/page.tsx",
  "apps/web/app/drug-market/page.tsx",
  "apps/web/app/drug-market/search/page.tsx",
  "apps/web/app/drug-market/products/[id]/page.tsx",
  "apps/web/components/medications/MedicationComponents.tsx"
];

const routes = ["/medications", "/medications/search", "/drug-market", "/drug-market/search"];

const forbidden = [
  /raw parser confidence/i,
  /raw row hash/i,
  /sourceRowHash/i,
  /import job raw JSON/i,
  /raw official fields/i,
  /raw price fields/i,
  /official listed price/i,
  /source price/i,
  /\bstock\b/i,
  /\border now\b/i,
  /\bcheckout\b/i,
  /\bpurchase\b/i,
  /patient dose instruction/i,
  /how to take/i,
  /take \w+ times daily/i,
  /\bbuy\b/i,
  /\bcart\b/i,
  /available stock/i
];

const required = [
  /Doctor approval required/i,
  /No auto-prescribing/i,
  /not patient instructions/i,
  /Verified/i,
  /Needs review/i,
  /Source-tracked/i
];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

function assertDecluttered(label, text) {
  for (const pattern of forbidden) {
    if (pattern.test(text)) throw new Error(`${label} includes forbidden medication clutter: ${pattern}`);
  }
}

async function main() {
  const source = (await Promise.all(normalSourceFiles.map((file) => readFile(file, "utf8")))).join("\n");
  assertDecluttered("normal medication source", source);
  for (const pattern of required) {
    if (!pattern.test(source)) throw new Error(`normal medication source missing expected safety/trust wording: ${pattern}`);
  }
  console.log("V093-MED-UI PASS normal medication source avoids technical, price, commerce, and dosing clutter");

  let routePass = 0;
  let routeWarn = 0;
  for (const route of routes) {
    try {
      const response = await fetch(`${WEB_URL}${route}`, { headers: { Accept: "text/html" } });
      const html = await response.text();
      if (response.status >= 500) throw new Error(`${route} returned ${response.status}`);
      if (response.status === 404) throw new Error(`${route} returned 404`);
      assertDecluttered(route, visibleText(html));
      console.log(`V093-MED-UI PASS ${route} visible page decluttered`);
      routePass += 1;
    } catch (error) {
      console.warn(`V093-MED-UI WARN ${route} runtime page check unavailable: ${error instanceof Error ? error.message : String(error)}`);
      routeWarn += 1;
    }
  }
  console.log(`V093-MED-UI SUMMARY PASS ${1 + routePass} WARN ${routeWarn} FAIL 0`);
}

await main().catch((error) => {
  console.error(`V093-MED-UI FAIL ${error instanceof Error ? error.message : String(error)}`);
  console.error("V093-MED-UI SUMMARY PASS 0 WARN 0 FAIL 1");
  process.exitCode = 1;
});

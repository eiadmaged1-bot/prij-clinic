import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const checks = [];

async function main() {
  const schema = await read("apps/api/prisma/schema.prisma");
  const service = await read("apps/api/src/guidelines/guidelines.service.ts");
  const controller = await read("apps/api/src/guidelines/guidelines.controller.ts");
  const center = await read("apps/web/app/guidelines/GuidelineCenter.tsx");
  const client = await read("apps/web/components/guidelines/GuidelineCenterClient.tsx");
  const searchPage = await read("apps/web/app/guidelines/search/page.tsx");
  const askPage = await read("apps/web/app/guidelines/ask/page.tsx");
  const sourcesPage = await read("apps/web/app/guidelines/sources/page.tsx");
  const uploadPage = await read("apps/web/app/guidelines/upload/page.tsx");
  const pkg = await read("package.json");
  const gitignore = await read(".gitignore");
  const searchService = await read("apps/api/src/search/search.service.ts");

  assertIncludes(schema, ["model GuidelineSource", "model GuidelineDocument", "model GuidelineChunk", "model GuidelineImportJob", "GuidelineAnswerMode"], "guideline models exist");
  assertIncludes(controller, ["@Controller(\"guidelines\")", "guidelines.read", "guidelines.search", "guidelines.review", "guidelines.manage_sources", "search", "ask"], "guideline routes and RBAC permissions exist");
  assertIncludes(service, ["No matching source found in your local guideline library.", "citations", "doctorReviewRequired", "externalAiEnabled: false", "answerMode"], "ask evidence library is citation-only and external AI disabled");
  assertIncludes(service, ["ACOG", "RCOG", "NICE", "WHO", "FIGO", "ESHRE", "ASRM", "SMFM", "CDC"], "supported source registry includes requested organizations");
  assertIncludes(service, ["Demo guideline sample", "not clinical use"], "demo content is clearly marked not clinical use");
  assertIncludes(center + client + searchPage + askPage + sourcesPage + uploadPage, ["Guideline Library", "Live Guideline Search", "Browse Guidelines", "Search All Guidelines", "Ask Evidence Library", "Owner/Admin", "Doctor review required"], "guideline UI routes render required modes and safety wording");
  assertIncludes(searchService, ["Guidelines", "guidelineDocument", "chunks"], "global smart search includes guideline titles and chunks");
  assertIncludes(pkg, ["test:v110:guideline-library"], "package exposes guideline test script");
  assertIncludes(gitignore, ["uploads", "storage", "*.pdf"], "ignored storage and PDF safety patterns exist");
  assertNotIncludes(`${service}${center}${client}`, ["openai.chat", "responses.create", "diagnose", "prescribe the dose"], "no external AI or autonomous clinical action enabled");
  await assertNoCommittedGuidelineFiles();

  console.log(`V110-GUIDELINES SUMMARY PASS ${checks.length} WARN 0 FAIL 0`);
}

async function read(filePath) {
  return readFile(filePath, "utf8");
}

function assertIncludes(source, needles, label) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) throw new Error(`${label}: missing ${missing.join(", ")}`);
  checks.push(label);
  console.log(`V110-GUIDELINES PASS ${label}`);
}

function assertNotIncludes(source, needles, label) {
  const found = needles.filter((needle) => source.toLowerCase().includes(needle.toLowerCase()));
  if (found.length) throw new Error(`${label}: found ${found.join(", ")}`);
  checks.push(label);
  console.log(`V110-GUIDELINES PASS ${label}`);
}

async function assertNoCommittedGuidelineFiles() {
  const forbidden = [];
  await walk(".", forbidden);
  if (forbidden.length) throw new Error(`real guideline/PDF-like files must not be committed: ${forbidden.join(", ")}`);
  checks.push("no real guideline PDFs or raw imports committed");
  console.log("V110-GUIDELINES PASS no real guideline PDFs or raw imports committed");
}

async function walk(dir, forbidden) {
  if ([".git", "node_modules", ".next", "dist", "storage", "uploads", "playwright-report", "test-results"].includes(path.basename(dir))) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, forbidden);
      continue;
    }
    const lower = full.toLowerCase();
    if (lower.endsWith(".pdf") || lower.endsWith(".xlsx") || lower.includes("raw-import")) {
      const info = await stat(full);
      if (info.size > 0) forbidden.push(full);
    }
  }
}

await main().catch((error) => {
  console.error(`V110-GUIDELINES FAIL ${error.message}`);
  process.exitCode = 1;
});

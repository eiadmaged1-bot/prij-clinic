import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import {
  SUPPORTED_EXTENSIONS,
  displayName,
  reportSafePath,
  shouldSkipDirName,
  summarizeFile
} from "./v098-medication-source-utils.mjs";

const reportDir = resolve("storage/medication-source-recovery");
const jsonReportPath = join(reportDir, "v098-wide-source-sweep-report.json");
const mdReportPath = join(reportDir, "v098-wide-source-sweep-report.md");

const roots = uniqueExistingRoots([
  "C:\\Newfolder",
  "C:\\Newfolder\\prij-clinic",
  "C:\\Newfolder\\prij-clinic-finance",
  "C:\\Newfolder\\prij-clinic-gyn",
  "C:\\Newfolder\\prij-clinic-guidelines",
  "C:\\Users\\SuperUser\\Desktop",
  "C:\\Users\\SuperUser\\Downloads",
  "C:\\Users\\SuperUser\\Documents",
  "C:\\Users\\SuperUser\\OneDrive",
  "C:\\Users\\eiadm\\Desktop",
  "C:\\Users\\eiadm\\Downloads",
  "C:\\Users\\eiadm\\Documents"
]);

const candidates = [];
const skippedDirectories = [];
const errors = [];
const visitedDirectories = new Set();
const visitedFiles = new Set();

for (const root of roots) scanDir(root);

candidates.sort((a, b) => {
  const rank = { high: 3, medium: 2, low: 1 };
  return (rank[b.confidence] - rank[a.confidence]) || b.modifiedTime.localeCompare(a.modifiedTime);
});

const report = {
  generatedAt: new Date().toISOString(),
  mode: "metadata-only",
  rootsScanned: roots,
  skippedDirectoryNames: ["node_modules", ".git", ".next", "dist", "build", "playwright-report", "test-results"],
  skippedDirectoryCount: skippedDirectories.length,
  candidateCount: candidates.length,
  confidenceCounts: countBy(candidates, "confidence"),
  artifactKindCounts: countBy(candidates, "artifactKind"),
  candidates,
  errors
};

mkdirSync(reportDir, { recursive: true });
writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdReportPath, renderMarkdown(report));

printConsole(report);

function scanDir(dir) {
  const dirKey = resolve(dir).toLowerCase();
  if (visitedDirectories.has(dirKey)) return;
  visitedDirectories.add(dirKey);

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    errors.push({ path: reportSafePath(dir), error: error.message });
    return;
  }

  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDirName(entry.name)) {
        skippedDirectories.push(path);
        continue;
      }
      scanDir(path);
      continue;
    }
    if (!entry.isFile()) continue;

    const fileKey = path.toLowerCase();
    if (visitedFiles.has(fileKey)) continue;
    visitedFiles.add(fileKey);

    const extension = extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) continue;
    try {
      const summary = summarizeFile(path, extension);
      if (isPotentialCandidate(summary)) candidates.push(summary);
    } catch (error) {
      errors.push({ path: reportSafePath(path), error: error.message });
    }
  }
}

function isPotentialCandidate(summary) {
  if (summary.path.toLowerCase().includes("\\storage\\medication-source-recovery\\")) return false;
  if (summary.artifactKind !== "unknown") return true;
  if (summary.detectedColumns.length) return true;
  if ([".csv", ".xlsx", ".xls", ".zip"].includes(summary.extension) && summary.keywordMatches.length) return true;
  return false;
}

function uniqueExistingRoots(paths) {
  const seen = new Set();
  const existing = [];
  for (const item of paths.map((path) => resolve(path))) {
    const key = item.toLowerCase();
    if (seen.has(key) || !existsSync(item)) continue;
    seen.add(key);
    existing.push(item);
  }
  return existing;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function printConsole(data) {
  console.log("V098 WIDE MEDICATION SOURCE SWEEP");
  console.log(`mode=${data.mode}`);
  console.log(`roots=${data.rootsScanned.length}`);
  for (const root of data.rootsScanned) console.log(`checked=${root}`);
  console.log(`candidates=${data.candidateCount}`);
  console.log(`confidence=${JSON.stringify(data.confidenceCounts)}`);
  console.log(`reports=${jsonReportPath} ${mdReportPath}`);

  for (const candidate of data.candidates.slice(0, 50)) {
    console.log(JSON.stringify({
      path: candidate.path,
      extension: candidate.extension,
      sizeBytes: candidate.sizeBytes,
      modifiedTime: candidate.modifiedTime,
      keywordMatch: candidate.keywordMatches,
      likelyCountrySource: candidate.likelyCountrySource,
      confidence: candidate.confidence,
      mayContainVerificationStatus: candidate.mayContainVerificationStatus,
      artifactKind: candidate.artifactKind,
      sampleHeaders: candidate.sampleHeaders,
      detectedColumns: candidate.detectedColumns
    }));
  }

  if (data.candidateCount > 50) console.log(`additionalCandidates=${data.candidateCount - 50} see report`);
  if (data.errors.length) console.log(`WARN scanErrors=${data.errors.length} see report`);
}

function renderMarkdown(data) {
  const lines = [
    "# v0.9.8 Wide Medication Source Sweep Report",
    "",
    `Generated: ${data.generatedAt}`,
    "",
    "This report is metadata-only. It does not include secret values, file contents, or medication rows.",
    "",
    "## Summary",
    "",
    `- Roots checked: ${data.rootsScanned.length}`,
    `- Candidates found: ${data.candidateCount}`,
    `- Confidence counts: ${JSON.stringify(data.confidenceCounts)}`,
    `- Artifact kind counts: ${JSON.stringify(data.artifactKindCounts)}`,
    `- Skipped directories: ${data.skippedDirectoryCount}`,
    `- Scan errors: ${data.errors.length}`,
    "",
    "## Roots Checked",
    "",
    ...data.rootsScanned.map((root) => `- ${root}`),
    "",
    "## Candidates",
    ""
  ];

  if (!data.candidates.length) {
    lines.push("No local approved official medication source/export candidates were found.");
  } else {
    for (const candidate of data.candidates) {
      lines.push(
        `### ${displayName(candidate.path)}`,
        "",
        `- Path: ${candidate.path}`,
        `- Extension: ${candidate.extension}`,
        `- Size bytes: ${candidate.sizeBytes}`,
        `- Modified time: ${candidate.modifiedTime}`,
        `- Keyword match: ${candidate.keywordMatches.join(", ") || "none"}`,
        `- Likely country/source: ${candidate.likelyCountrySource}`,
        `- Confidence: ${candidate.confidence}`,
        `- May contain verification status: ${candidate.mayContainVerificationStatus ? "yes" : "no"}`,
        `- Artifact kind: ${candidate.artifactKind}`,
        `- Headers sampled: ${candidate.sampleHeaders.join(", ") || "none"}`,
        `- Expected columns detected: ${candidate.detectedColumns.join(", ") || "none"}`,
        ""
      );
    }
  }

  if (data.errors.length) {
    lines.push("## Scan Errors", "");
    for (const error of data.errors) lines.push(`- ${error.path}: ${error.error}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

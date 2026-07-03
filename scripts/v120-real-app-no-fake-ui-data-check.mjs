import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoot = join(root, "apps", "web");
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const forbidden = [
  /\bJohn Doe\b/i,
  /\bJane Doe\b/i,
  /\bDemo Patient\b/i,
  /\bSample Patient\b/i,
  /\bTest Patient\b/i,
  /\b0123456789\b/,
  /\bfake@example\b/i,
  /\bdemo@example\b/i,
  /\bLorem ipsum\b/i,
  /\bLocal demo consent placeholder\b/i,
  /\bfake identifiers\b/i,
  /\bfake demo\b/i,
  /\bdefaultValue:\s*["']CBC["']/i
];

const ignoredPathParts = new Set(["node_modules", ".next", "coverage"]);
const findings = [];

walk(scanRoot);

if (findings.length > 0) {
  console.error("Fake/demo-looking UI data found in production web files:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}: ${finding.text}`);
  }
  process.exit(1);
}

console.log("PASS: no fake patient/clinical placeholder data found in apps/web production UI files.");

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path);
    if (rel.split(/[\\/]/).some((part) => ignoredPathParts.has(part))) continue;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (!allowedExtensions.has(extension(path))) continue;
    scanFile(path);
  }
}

function scanFile(path) {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of forbidden) {
      if (pattern.test(line)) {
        findings.push({ file: relative(root, path), line: index + 1, text: line.trim().slice(0, 180) });
      }
    }
  });
}

function extension(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

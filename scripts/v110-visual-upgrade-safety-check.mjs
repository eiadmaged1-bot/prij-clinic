import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = process.cwd();
const scanRoots = [
  resolve(root, "ui-export")
];
const extraFiles = [
  resolve(root, "docs", "design", "prij-ui-theme-lab.html"),
  resolve(root, "docs", "design", "prij-mobile-ui-lab.html")
];

const textExts = new Set([".html", ".css", ".js"]);
const forbidden = [
  { id: ".env", pattern: /\.env(?!\.example)/i },
  { id: "DATABASE_URL", pattern: /DATABASE_URL/i },
  { id: "JWT_SECRET", pattern: /JWT_SECRET/i },
  { id: "schema.prisma", pattern: /schema\.prisma/i },
  { id: "localhost:3001", pattern: /localhost:3001/i },
  { id: "/api/", pattern: /\/api\//i },
  { id: "checkout", pattern: /\bcheckout\b/i },
  { id: "cart", pattern: /\bcart\b/i },
  { id: "buy now", pattern: /\bbuy\s+now\b/i },
  { id: "available stock", pattern: /\bavailable\s+stock\b/i },
  { id: "dose automatically", pattern: /\bdose\s+automatically\b/i }
];

const allowedSafetyLines = [
  /No AI diagnosis/i,
  /No AI prescribing/i,
  /No dosing automation/i,
  /No stock, checkout, or patient directions/i,
  /No secrets/i,
  /No real authentication/i
];

function walk(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else if (textExts.has(extname(path).toLowerCase())) files.push(path);
  }
  return files;
}

function lineAllowed(line) {
  return allowedSafetyLines.some((pattern) => pattern.test(line));
}

function findLineIssues(file, text) {
  const issues = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of forbidden) {
      if (rule.pattern.test(line) && !lineAllowed(line)) {
        issues.push({ file, line: index + 1, id: rule.id, text: line.trim() });
      }
    }

    if (/\bAI diagnosis\b/i.test(line) && !/\bNo\b|doctor|draft|review|cannot replace/i.test(line)) {
      issues.push({ file, line: index + 1, id: "AI diagnosis without safety context", text: line.trim() });
    }

    if (/\bAI prescribing\b/i.test(line) && !/\bNo\b|doctor|draft|review|cannot replace/i.test(line)) {
      issues.push({ file, line: index + 1, id: "AI prescribing without safety context", text: line.trim() });
    }

    const emails = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    for (const email of emails) {
      if (!email.toLowerCase().endsWith(".invalid")) {
        issues.push({ file, line: index + 1, id: "real-looking email", text: email });
      }
    }

    const phones = line.match(/(?:\+?\d[\s().-]?){10,}/g) || [];
    for (const phone of phones) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length >= 10 && !/^0+$/.test(digits)) {
        issues.push({ file, line: index + 1, id: "real-looking phone number", text: phone.trim() });
      }
    }

    if (/overflow-x\s*:\s*(scroll|auto)/i.test(line) && !/table-wrap|tabs|sidebar/i.test(lines.slice(Math.max(0, index - 2), index + 3).join(" "))) {
      issues.push({ file, line: index + 1, id: "horizontal overflow marker", text: line.trim() });
    }

    if (/<script\b[^>]*\bsrc\s*=\s*["'](?!\.\/assets\/app\.js["'])/i.test(line)) {
      issues.push({ file, line: index + 1, id: "external script", text: line.trim() });
    }
  });
  return issues;
}

const files = [
  ...scanRoots.flatMap(walk),
  ...extraFiles.filter((file) => existsSync(file))
];
const issues = files.flatMap((file) => findLineIssues(file, readFileSync(file, "utf8")));

const requiredGeneratedChecks = [
  {
    file: resolve(root, "ui-export", "index.html"),
    id: "mobile menu first",
    pattern: /<header class="mobile-topbar">\s*<button class="button secondary mobile-menu-button"/i
  },
  {
    file: resolve(root, "ui-export", "index.html"),
    id: "mobile header spacer",
    pattern: /<span class="mobile-topbar-spacer" aria-hidden="true"><\/span>/i
  },
  {
    file: resolve(root, "ui-export", "assets", "styles.css"),
    id: "body horizontal overflow guard",
    pattern: /html,\s*body\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*hidden;/is
  },
  {
    file: resolve(root, "ui-export", "assets", "styles.css"),
    id: "tab strip horizontal scroll only",
    pattern: /\.tabs\s*\{[^}]*width:\s*100%;[^}]*overflow-x:\s*auto;[^}]*white-space:\s*nowrap;/is
  },
  {
    file: resolve(root, "ui-export", "assets", "app.js"),
    id: "active tab visibility",
    pattern: /scrollIntoView\(\{\s*behavior:\s*"smooth",\s*block:\s*"nearest",\s*inline:\s*"center"\s*\}\)/i
  }
];

for (const check of requiredGeneratedChecks) {
  if (!existsSync(check.file) || !check.pattern.test(readFileSync(check.file, "utf8"))) {
    issues.push({ file: check.file, line: 1, id: check.id, text: "Required v0.11.3 mobile polish marker missing." });
  }
}

if (issues.length) {
  console.error("v0.11 visual safety check failed:");
  for (const issue of issues) {
    console.error(`- ${issue.id}: ${issue.file}:${issue.line} ${issue.text}`);
  }
  process.exit(1);
}

console.log(`v0.11 visual safety check passed (${files.length} files scanned).`);

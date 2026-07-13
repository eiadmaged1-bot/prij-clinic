import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = ["apps/web/app", "apps/web/components"];
const buttonPattern = /<button\b((?:=>|[^>])*)>/g;
const ariaPattern = /aria-label=/;
const typePattern = /\btype=/;
const iconOnlyHintPattern = /title=|aria-describedby=|data-tooltip|<span[^>]+className=["'][^"']*sr-only/;
const findings = [];

for (const target of targets) {
  walk(path.join(root, target));
}

const report = {
  generatedAt: new Date().toISOString(),
  findings,
  summary: {
    buttonsChecked: findings.filter((finding) => finding.kind === "button").length,
    failures: findings.filter((finding) => finding.status === "FAIL").length
  }
};

fs.mkdirSync(path.join(root, "storage/production-launch-reports"), { recursive: true });
const outputPath = path.join(root, "storage/production-launch-reports/application-interaction-inventory.json");
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`APPLICATION-INTERACTION-INVENTORY wrote ${outputPath}`);
if (report.summary.failures) process.exitCode = 1;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) inspectFile(full);
  }
}

function inspectFile(file) {
  const source = fs.readFileSync(file, "utf8");
  let match;
  while ((match = buttonPattern.exec(source))) {
    const attrs = match[1] || "";
    const before = source.slice(0, match.index);
    const line = before.split(/\r?\n/).length;
    const failures = [];
    if (!typePattern.test(attrs)) failures.push("INT-001 missing explicit button type");
    if (/icon|Icon|svg/i.test(attrs) && !ariaPattern.test(attrs)) failures.push("INT-002 possible icon-only button missing aria-label");
    if (/icon|Icon|svg/i.test(attrs) && !iconOnlyHintPattern.test(attrs)) failures.push("INT-003 possible icon-only button missing tooltip/help text");
    findings.push({
      kind: "button",
      file: path.relative(root, file),
      line,
      status: failures.length ? "FAIL" : "PASS",
      failures
    });
  }
}

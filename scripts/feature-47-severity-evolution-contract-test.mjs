import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [visit, css] = await Promise.all([
  readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8"),
  readFile("apps/web/app/globals.css", "utf8")
]);

for (const required of [
  "type ComplaintSeverity = \"MILD\" | \"MODERATE\" | \"SEVERE\"",
  "type ComplaintSeveritySnapshot",
  "complaintSeveritySnapshot?: ComplaintSeveritySnapshot",
  "provenance: \"clinician_documented\"",
  "ComplaintSeverityEditor",
  "Complaint severity",
  "Mild",
  "Moderate",
  "Severe",
  "Last three signed complaint severity points",
  "Clinician-documented severity only. No automatic interpretation."
]) assert.match(visit, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

assert.match(visit, /String\(row\.status \?\? ""\)\.toLowerCase\(\) === "signed"/);
assert.match(visit, /\.slice\(0, 3\)/);
assert.match(visit, /recordedAt: new Date\(\)\.toISOString\(\)/);
assert.match(visit, /recordedByUserId: clinicianId \|\| undefined/);
assert.doesNotMatch(visit, /inferSeverityTrend|automaticSeverity|treatmentRecommendationFromSeverity/);

for (const selector of [
  ".complaint-severity-editor",
  ".complaint-severity-history",
  ".complaint-severity-point"
]) assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

console.log("Feature 47 complaint severity evolution contract PASS");

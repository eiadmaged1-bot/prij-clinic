import { readFile } from "node:fs/promises";

const visit = await readFile("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8");
const css = await readFile("apps/web/app/globals.css", "utf8");

const requiredVisitTokens = [
  "StructuredPrescriptionField",
  "الجرعة",
  "عدد المرات",
  "المدة",
  "التعليمات",
  "مرة يوميًا",
  "كل 12 ساعة",
  "بعد الأكل",
  "Custom Dose",
  "structured-rx-preview",
  "dose: value",
  "frequency: value",
  "duration: value",
  "instructions: value"
];

for (const token of requiredVisitTokens) {
  if (!visit.includes(token)) throw new Error(`Structured Arabic prescription missing: ${token}`);
}

const requiredCssTokens = [
  "RX-AR-001 structured Arabic prescription controls",
  ".structured-rx-grid",
  ".rx-option.active",
  "@media print",
  "@media (max-width: 760px)"
];

for (const token of requiredCssTokens) {
  if (!css.includes(token)) throw new Error(`Structured Arabic prescription CSS missing: ${token}`);
}

const forbidden = [
  "prisma migrate",
  "prisma db seed",
  "deleteMany(",
  "truncate",
  "DROP TABLE"
];
for (const token of forbidden) {
  if (visit.includes(token)) throw new Error(`Unsafe token introduced in visit workspace: ${token}`);
}

console.log("RX-AR-001 PASS structured bilingual dose, frequency, duration, instructions, custom entry, responsive layout, and print behavior");

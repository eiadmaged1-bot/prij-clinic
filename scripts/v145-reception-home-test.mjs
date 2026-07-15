import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, copy] = await Promise.all([
  readFile(new URL("../apps/web/app/reception/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/reception/reception-copy.ts", import.meta.url), "utf8")
]);

for (const href of ["/reception/check-in", "/patients/new", "/queue"]) assert.match(page, new RegExp(`href=\\"${href}\\"`));
for (const forbidden of ["/calendar", "Returning Patient / QR", "Book appointment", "Search patient", "Ã‚Â·"]) assert.ok(!page.includes(forbidden));
for (const label of ["Reception Home", "Check in patient", "New patient", "Open queue", "Queue preview"]) assert.ok(copy.includes(label));
for (const label of ["الاستقبال", "تسجيل حضور مريضة", "مريضة جديدة", "فتح قائمة الانتظار"]) assert.ok(copy.includes(label));
assert.match(page, /waiting\.length} · \{copy\.urgent/);
assert.match(page, /clinic-queue:changed/);

console.log("v1.4.7 simplified Reception Home PASS (19 assertions)");

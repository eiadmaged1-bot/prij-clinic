import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, copy, css] = await Promise.all([
  readFile(new URL("../apps/web/app/reception/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/reception/reception-copy.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8")
]);

for (const href of ["/patients/new", "/reception/qr-scan", "/reception/check-in", "/calendar", "/calendar?mode=new", "/queue"]) {
  assert.match(page, new RegExp(`href=\\"${href.replace("?", "\\?")}\\"`));
}
for (const label of ["Reception Home", "Search patient", "New Patient", "Returning Patient / QR", "Today’s appointments", "Book appointment", "Queue preview"]) assert.ok(copy.includes(label));
for (const label of ["الرئيسية — الاستقبال", "البحث عن مريضة", "مواعيد اليوم", "حجز موعد", "قائمة الانتظار"]) assert.ok(copy.includes(label));
assert.doesNotMatch(copy, /Ã|Â|Ø|Ù/);
assert.match(page, /waiting\.length} · \{copy\.urgent/);
assert.match(page, /queue-indicator-row-clean/);
assert.match(css, /word-break: normal/);
assert.match(css, /@media \(max-width: 430px\)[\s\S]*grid-template-columns: repeat\(2/);

console.log("v1.4.5 compact Reception Home and encoding: 23 assertions passed");

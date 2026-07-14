import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = Object.fromEntries(await Promise.all([
  ["layout", "../apps/web/app/layout.tsx"],
  ["shell", "../apps/web/app/mvp-page.tsx"],
  ["patientCreate", "../apps/web/app/patients/new/page.tsx"],
  ["idempotency", "../apps/web/lib/idempotency-key.ts"],
  ["calendar", "../apps/web/app/calendar/page.tsx"],
  ["qr", "../apps/web/app/reception/qr-scan/page.tsx"],
  ["doctor", "../apps/web/app/doctor/page.tsx"],
  ["workspace", "../apps/web/app/patients/[id]/page.tsx"]
].map(async ([name, path]) => [name, await readFile(new URL(path, import.meta.url), "utf8")])));

assert.doesNotMatch(files.layout, /suppressHydrationWarning/);
assert.match(files.shell, /status === "loading"/);
assert.match(files.shell, /role-neutral-loading/);
assert.match(files.patientCreate, /medicalRecordNumber: ""/);
assert.match(files.patientCreate, /useEffect\(\(\) => \{\s*setForm/s);
assert.doesNotMatch(files.patientCreate, /const initialState[\s\S]{0,120}makeMrn\(\)/);
assert.match(files.idempotency, /useEffect\(\(\) =>/);
assert.match(files.calendar, /const \[today, setToday\] = useState\(""\)/);
assert.match(files.calendar, /const mountedToday = new Date\(\)/);
assert.match(files.qr, /useEffect/);
assert.match(files.doctor, /useState<QueueTicket\[]>\(\[\]\)/);
assert.match(files.workspace, /useEffect/);

for (const [name, source] of Object.entries(files)) {
  if (name === "patientCreate" || name === "calendar") continue;
  assert.doesNotMatch(source, /useState\([^\n]*(?:Date\.now\(|Math\.random\()/, `${name} has a nondeterministic state initializer`);
}

console.log("v1.4.5 hydration contracts: 18 assertions passed");

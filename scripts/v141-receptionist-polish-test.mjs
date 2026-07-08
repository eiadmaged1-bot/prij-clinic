import { readFileSync } from "node:fs";

const checks = [];

function file(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function check(name, path, patterns) {
  const text = file(path);
  for (const pattern of patterns) {
    const ok = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
    checks.push({ name: `${name}: ${String(pattern)}`, ok });
  }
}

function forbid(name, path, patterns) {
  const text = file(path);
  for (const pattern of patterns) {
    const found = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
    checks.push({ name: `${name} forbids ${String(pattern)}`, ok: !found });
  }
}

check("topbar controls", "apps/web/app/mvp-page.tsx", [
  "OFFICIAL_CLINIC_NAME",
  "LanguageSwitcher",
  "topbar-logout-button",
  "receptionist-menu-button"
]);

check("arabic reception home", "apps/web/app/reception/page.tsx", [
  "واجهة الاستقبال",
  "بحث عن مريضة",
  "مريضة جديدة",
  "مريضة مسجلة / QR",
  "المواعيد / المدفوعات",
  "!activeTicket ? <VisitTypeSelector"
]);

forbid("reception cleanup", "apps/web/app/reception/page.tsx", [
  "Reception updated",
  "Role-aware",
  "black-placeholder-bar",
  "broken-placeholder"
]);

check("new patient", "apps/web/app/patients/new/page.tsx", [
  "Year of birth",
  "سنة الميلاد",
  "placeholder=\"YYYY\"",
  "Recommended for follow-up and duplicate check.",
  "يفضل إدخال رقم الهاتف للمتابعة ومنع التكرار.",
  "Add notes",
  "إضافة ملاحظات",
  "Save and add to queue",
  "Save file only"
]);

forbid("new patient no dob", "apps/web/app/patients/new/page.tsx", [
  "Date of birth",
  "dateOfBirth",
  "type=\"date\""
]);

check("visit type labels", "apps/web/lib/visit-types.ts", [
  "{ value: \"kashf\", label: \"كشف\" }",
  "{ value: \"recheck\", label: \"إعادة\" }",
  "{ value: \"consultation\", label: \"استشارة\" }",
  "{ value: \"urgent_kashf\", label: \"مستعجل\", urgent: true }"
]);

check("visit type layout", "apps/web/app/globals.css", [
  "grid-template-columns: repeat(3, minmax(0, 1fr))",
  "grid-column: 1 / -1",
  "width: clamp(7.5rem, 42%, 11rem)"
]);

check("qr workflow", "apps/web/app/reception/qr-scan/page.tsx", [
  "navigator.mediaDevices.getUserMedia",
  "facingMode: \"environment\"",
  "BarcodeDetector",
  "setCameraActive(true)",
  "cameraActive ? <video",
  "Find patient",
  "البحث عن المريضة",
  "Camera permission denied",
  "Camera unavailable. Use manual lookup."
]);

forbid("qr no dead scan box", "apps/web/app/reception/qr-scan/page.tsx", [
  "<video className=\"qr-video\" ref={videoRef}"
]);

check("calendar", "apps/web/app/calendar/page.tsx", [
  "Appointments & Queue",
  "المواعيد والانتظار",
  "activeQueue",
  "cancelledQueue",
  "visitTypeLabel(ticket.visitType)",
  "Open reception profile",
  "Call",
  "Mark urgent",
  "Remove with reason"
]);

forbid("calendar receptionist unsafe actions", "apps/web/app/calendar/page.tsx", [
  "Doctor View",
  "New Encounter",
  "Prescription",
  "Request Investigation"
]);

check("queue", "apps/web/app/clinic-operations-page.tsx", [
  "قائمة الانتظار",
  "لم يتم استدعاء المريضة التالية بعد",
  "visitTypeLabelLocal(ticket.visitType)",
  "Remove with reason"
]);

check("reception profile", "apps/web/app/patients/[id]/page.tsx", [
  "ReceptionPatientProfile",
  "roleContextReady",
  "Needs consent",
  "No contact saved",
  "Follow-up due",
  "Payment pending",
  "Doctor-reviewed alert",
  "visitTypeLabel(String(activeQueue.visitType"
]);

forbid("normal ui issue marker source", "apps/web/app/reception/page.tsx", [
  "issue-marker",
  "nextjs-portal",
  "__nextjs",
  "data-nextjs-toast",
  "data-nextjs-dialog",
  "black-placeholder-bar"
]);

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  console.error("v1.4.1 receptionist polish contract failed:");
  for (const item of failed) console.error(`- ${item.name}`);
  process.exit(1);
}

console.log(`v1.4.1 receptionist polish contract passed (${checks.length} checks).`);

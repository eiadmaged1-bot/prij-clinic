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

check("one receptionist home", "apps/web/app/mvp-page.tsx", [
  '"/reception"',
  '"/reception/qr-scan"',
  "receptionistNav"
]);

forbid("old receptionist nav", "apps/web/app/mvp-page.tsx", [
  '"/reception/check-in"'
]);

check("topbar controls", "apps/web/app/mvp-page.tsx", [
  "Dr Maged Clinics",
  "LanguageSwitcher",
  "topbar-logout-button",
  "receptionist-menu-button"
]);

check("arabic globals", "apps/web/i18n/ar.ts", [
  "الاستقبال",
  "قائمة الانتظار",
  "مريضة مسجلة / QR",
  "خروج"
]);

check("language switcher", "apps/web/i18n/useI18n.tsx", [
  "عربي",
  "EN"
]);

check("reception home compact", "apps/web/app/reception/page.tsx", [
  "واجهة الاستقبال",
  "بحث عن مريضة",
  "بحث بالاسم أو الهاتف أو رقم الملف أو QR",
  "مريضة جديدة",
  "مريضة مسجلة / QR",
  "قائمة الانتظار",
  "المواعيد",
  "في الانتظار الآن",
  "المريضة التالية",
  "لا توجد مريضات في الانتظار",
  "compact-action-grid",
  "queue-compact-line",
  "activeTicket ? <Link"
]);

forbid("reception no finance or completed", "apps/web/app/reception/page.tsx", [
  "Appointments / Payments",
  "Open invoices",
  "Collected today",
  "Payments collected",
  "payment",
  "finance",
  "completed.length",
  "copy.completed",
  "Role-aware",
  "Ready",
  "black-placeholder-bar",
  "broken-placeholder"
]);

check("queue compact", "apps/web/app/clinic-operations-page.tsx", [
  "!isReceptionistOnly && mode !== \"queue\"",
  "! [\"cancelled\", \"completed\"].includes(ticket.status)".replace("! ", "!"),
  "queue-compact-line",
  "visitTypeLabelLocal(ticket.visitType)",
  "Remove with reason",
  "الملغيات اليوم"
]);

forbid("queue no visible completed card", "apps/web/app/clinic-operations-page.tsx", [
  "label={copy.completed}",
  "Reception Queue",
  "black-placeholder-bar",
  "broken-placeholder"
]);

check("calendar receptionist no completed metric", "apps/web/app/calendar/page.tsx", [
  "isReceptionistOnly ? 0",
  "!isReceptionistOnly ? <div><dt>{copy.completed}</dt><dd>{completed}</dd></div> : null",
  "Open reception profile",
  "Remove with reason"
]);

check("new patient final", "apps/web/app/patients/new/page.tsx", [
  "Year of birth",
  "placeholder=\"YYYY\"",
  "readonly-file-number",
  "Add notes",
  "Save and add to queue",
  "Save file only"
]);

forbid("new patient no dob or empty readonly input", "apps/web/app/patients/new/page.tsx", [
  "Date of birth",
  "dateOfBirth",
  "type=\"date\"",
  "readOnly"
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
  "navigator.mediaDevices?.getUserMedia",
  "facingMode: \"environment\"",
  "BarcodeDetector",
  "decoderUnsupported",
  "Manual lookup",
  "Find patient",
  "تم رفض إذن الكاميرا",
  "الكاميرا غير متاحة. استخدم البحث اليدوي."
]);

forbid("qr no unsupported before click or dead box", "apps/web/app/reception/qr-scan/page.tsx", [
  "useState(\"Browser camera scanning unsupported",
  "<video className=\"qr-video\" ref={videoRef}",
  "black-placeholder-bar"
]);

forbid("normal ui issue marker source", "apps/web/app/reception/page.tsx", [
  "issue-marker",
  "nextjs-portal",
  "__nextjs",
  "data-nextjs-toast",
  "data-nextjs-dialog"
]);

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  console.error("v1.4.1 receptionist polish contract failed:");
  for (const item of failed) console.error(`- ${item.name}`);
  process.exit(1);
}

console.log(`v1.4.1 receptionist polish contract passed (${checks.length} checks).`);

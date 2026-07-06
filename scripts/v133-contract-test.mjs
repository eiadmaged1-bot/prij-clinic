import { readFileSync } from "node:fs";

const mode = process.argv[2];

const checks = {
  "guideline-official-import"() {
    const importer = read("scripts/guidelines-import-open.mjs");
    const sources = read("scripts/guidelines-official-sources.mjs");
    const service = read("apps/api/src/guidelines/guidelines.service.ts");
    assert(importer.includes("officialGuidelineSources"), "built-in official source pack is not wired");
    assert(importer.includes("imported PDFs:") && importer.includes("indexed chunks:"), "clear import summary is missing");
    assert(importer.includes("skipped existing") && service.includes("skippedExisting"), "idempotent skip handling is missing");
    assert(service.includes("storeOpenImportFile") && service.includes('buffer.subarray(0, 4).toString("utf8") === "%PDF"'), "PDF vault storage or magic-byte detection missing");
    for (const term of ["antenatal", "caesarean", "preterm", "placenta", "endometriosis", "contraception"]) {
      assert(sources.includes(term), `official source search term missing: ${term}`);
    }
  },
  "mobile-navigation-compressed"() {
    const shell = read("apps/web/app/mvp-page.tsx");
    const registry = read("apps/web/app/navigation-registry.ts");
    assert(shell.includes("buildShellNavGroups"), "compressed shell nav builder missing");
    assert(shell.includes('title: "Clinical Work"') && shell.includes('title: "Knowledge"'), "owner/admin grouped nav missing");
    assert(shell.includes('title: "Today / Waiting"') && shell.includes('title: "More"'), "doctor compressed nav missing");
    assert(shell.includes("openNavGroup") && shell.includes("setOpenNavGroup"), "single open group state missing");
    assert(shell.includes("sidebar-close-button") && shell.includes("document.body.style.overflow = \"hidden\""), "drawer close or scroll lock missing");
    assert(shell.includes("isReceptionistOnly") && shell.includes("no-sidebar receptionist-shell"), "receptionist no-drawer branch missing");
    assert(registry.includes("Pharmacology / Medication Reference"), "knowledge medication label missing");
  },
  "global-ui-overlays"() {
    const css = read("apps/web/app/globals.css");
    const docs = read("docs/LOCAL_TAILSCALE_QA.md");
    assert(css.includes("content: none;"), "decorative card overlay pseudo-element was not disabled");
    assert(css.includes(".topbar") && css.includes("z-index: 20"), "topbar stacking fix missing");
    assert(docs.includes("production-like visual QA") && docs.includes("npm run start:web"), "production visual QA note missing");
  },
  "reception-loop-cleanup"() {
    const newPatient = read("apps/web/app/patients/new/page.tsx");
    assert(newPatient.includes("Save and add to waiting line"), "new patient primary queue action missing");
    assert(newPatient.includes("Back to Reception"), "back to reception action missing");
    assert(newPatient.includes('router.push("/reception")'), "new patient flow does not return to reception");
    assert(newPatient.includes("Added to queue") && newPatient.includes("Position"), "queue success message missing");
    assert(!newPatient.includes("Save and open patient file") && !newPatient.includes("Back to patients"), "patient files loop wording still present");
  },
  "queue-board-cleanup"() {
    const clinic = read("apps/web/app/clinic-operations-page.tsx");
    assert(clinic.includes("function QueueBoard"), "single compact queue board missing");
    assert(clinic.includes("Queue list") && clinic.includes("Reception") && clinic.includes("Doctor"), "queue board tabs/list missing");
    assert(clinic.includes("Waiting") && clinic.includes("Urgent") && clinic.includes("Completed"), "queue summary counts missing");
    assert(!clinic.includes("Daily operations loop") && !clinic.includes("Compact pipeline") && !clinic.includes("Queue status"), "duplicated queue wording still present");
  },
  "patient-file-redesign"() {
    const patient = read("apps/web/app/patients/[id]/page.tsx");
    assert(patient.includes("patientWorkspaceTabs"), "curated patient tabs missing");
    for (const label of ["Overview", "Timeline", "Visits", "Prescriptions", "Investigations", "Ultrasound", "Documents", "Invoices", "Consents"]) {
      assert(patient.includes(label), `patient tab missing: ${label}`);
    }
    for (const action of ["New Encounter", "Prescription", "Request Investigation", "Book Follow-up", "More"]) {
      assert(patient.includes(action), `patient primary action missing: ${action}`);
    }
    assert(!patient.includes("<PatientQuickActions") && !patient.includes("<PatientActionPanel"), "duplicated patient action panels still render");
    assert(!patient.includes("Upload document placeholder") && !patient.includes("Add consent placeholder") && !patient.includes("No note saved yet"), "patient placeholder wording remains");
  },
  "todays-desk-compact"() {
    const today = read("apps/web/app/reception/today/page.tsx");
    assert(today.includes("Today&apos;s Desk") && today.includes("compact-tabs"), "today desk compact tab board missing");
    for (const label of ["Waiting", "With doctor", "Completed", "Appointments", "Pending results"]) {
      assert(today.includes(label), `today desk tab/metric missing: ${label}`);
    }
    assert(today.includes("compact-desk-row"), "today desk compact rows missing");
    assert(!today.includes("Patient cards") && !today.includes("Show training records"), "old today desk card/training UI remains");
  },
  "no-demo-ui-pass"() {
    const files = [
      "apps/web/app/patients/page.tsx",
      "apps/web/app/patients/new/page.tsx",
      "apps/web/app/reception/page.tsx",
      "apps/web/app/reception/check-in/page.tsx",
      "apps/web/app/reception/today/page.tsx",
      "apps/web/app/queue/page.tsx",
      "apps/web/app/doctor/page.tsx",
      "apps/web/app/guidelines/GuidelineCenter.tsx",
      "apps/web/app/patients/[id]/page.tsx"
    ];
    const forbidden = [/Show training records/i, /Training records hidden/i, /Upload document placeholder/i, /Add consent placeholder/i, /No note saved yet/i, /Daily operations loop/i, /Compact pipeline/i];
    for (const file of files) {
      const text = read(file);
      for (const pattern of forbidden) assert(!pattern.test(text), `${pattern} remains in ${file}`);
    }
  },
  "workflow-wording-status"() {
    const shell = read("apps/web/app/mvp-page.tsx");
    const clinic = read("apps/web/app/clinic-operations-page.tsx");
    const patient = read("apps/web/app/patients/[id]/page.tsx");
    assert(shell.includes("Save visit") && shell.includes("Save scan") && shell.includes("Save request"), "contextual save labels missing");
    assert(clinic.includes('if (value === "called") return "with doctor"'), "called status is not normalized in UI");
    assert(patient.includes("Request investigations"), "clinical request wording not updated");
  }
};

if (!checks[mode]) throw new Error(`Unknown v1.3.3 contract test: ${mode}`);
checks[mode]();
console.log(`V133 ${mode} PASS`);

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

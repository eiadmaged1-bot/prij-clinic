import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const mode = process.argv[2] ?? "";
const read = (path) => readFileSync(path, "utf8");

const checks = {
  "tailscale-runtime"() {
    const api = read("apps/web/lib/api-base-url.ts");
    const dev = read("scripts/dev.mjs");
    assert(api.includes("isTailscaleOrCgnatIpv4") && api.includes('sameOriginApiProxyPath = "/api/backend"'), "same-origin Tailscale API proxy support missing");
    assert(!api.includes("isAllowedLanFallback"), "manual LAN fallback gate should not be required");
    assert(dev.includes("[dev:lan] Tailscale device URL"), "dev:lan should print Tailscale URL when available");
  },
  "logout-visibility"() {
    const shell = read("apps/web/app/mvp-page.tsx");
    assert(shell.includes("AccountMenu") && shell.includes("account-logout-button"), "top-right account logout missing");
    assert(shell.includes("sidebar-logout-button"), "sticky drawer logout missing");
    assert(shell.includes("isReceptionistOnly"), "receptionist shell branch missing");
  },
  "navigation-final"() {
    const shell = read("apps/web/app/mvp-page.tsx");
    const nav = read("apps/web/app/navigation-registry.ts");
    assert(shell.includes("activeNavHref") && shell.includes("activeNavHref === href"), "single active nav selection missing");
    assert(nav.includes("Today / Waiting") && nav.includes("Medication Reference"), "doctor navigation essentials missing");
  },
  "reception-workflow-cleanup"() {
    const page = read("apps/web/app/reception/page.tsx");
    assert(!page.includes("<span>With doctor</span>"), "main receptionist status must not show With doctor card");
    assert(page.includes("Already in queue · Position"), "duplicate queue messaging missing");
    assert(page.includes("Search to find a returning patient"), "returning patient should not list all patients by default");
    assert(!page.includes("Show position"), "per-row show position buttons should be removed");
  },
  "receptionist-signature"() {
    const schema = read("apps/api/prisma/schema.prisma");
    const queue = read("apps/api/src/queue/queue.service.ts");
    assert(schema.includes("receptionistDisplayNameSnapshot") && schema.includes("checkInMethod"), "queue signature fields missing");
    assert(queue.includes("receptionistUserId: user.id") && queue.includes("queue.checked_in"), "queue check-in signature audit missing");
  },
  "clinical-module-cleanup"() {
    for (const path of ["apps/web/app/encounters/page.tsx", "apps/web/app/ob-ultrasounds/page.tsx"]) {
      const source = read(path);
      assert(!/Patient ID|Pregnancy ID|Appointment ID|Encounter ID|Demo /.test(source), `${path} still exposes raw IDs or demo text`);
      assert(source.includes("Select a patient or open from patient file"), `${path} missing patient-context prompt`);
    }
  },
  "ai-reports-cleanup"() {
    const ai = read("apps/web/components/ai-assistant/SafeAiAssistantPanel.tsx");
    const reports = read("apps/web/app/clinic-operations-page.tsx");
    assert(ai.includes("Draft only · Doctor approval required · Local/private"), "compact AI safety bar missing");
    assert(!reports.includes("Show training records") && !reports.includes("Training records hidden"), "reports training toggles still visible");
  },
  "guideline-import-foundation"() {
    const guidelines = read("apps/web/app/guidelines/GuidelineCenter.tsx");
    const pkg = read("package.json");
    assert(guidelines.includes("Search guidelines..."), "guidelines home is not search-first");
    assert(!guidelines.includes("Show training documents") && !guidelines.includes("Training documents hidden"), "guideline training toggle still visible");
    assert(pkg.includes("guidelines:import:official"), "official guideline import script missing");
  },
  "pharmacology-safety"() {
    const meds = read("apps/web/app/medications/page.tsx");
    const safety = read("apps/api/src/medications/medication-safety.service.ts");
    assert(meds.includes("Pharmacology / Medication Reference") && meds.includes("Libya future/imported only"), "pharmacology workspace missing");
    assert(safety.includes("No verified interaction records loaded for this pair. Doctor review required."), "source-aware unknown interaction wording missing");
    assert(!/price|stock|sales|cart|checkout/i.test(meds), "pharmacy business wording present in medication page");
  },
  "no-demo-normal-ui"() {
    const patients = read("apps/api/src/patients/patients.service.ts");
    const queue = read("apps/api/src/queue/queue.service.ts");
    const pkg = read("package.json");
    assert(patients.includes("demoPatientWhere()") && queue.includes("demoPatientWhere()"), "demo/test patient filters missing from normal APIs");
    assert(pkg.includes("db:cleanup:demo"), "demo cleanup script missing");
  }
};

if (!checks[mode]) throw new Error(`Unknown v1.3.2 contract test: ${mode}`);
checks[mode]();
console.log(`V132 ${mode} PASS`);

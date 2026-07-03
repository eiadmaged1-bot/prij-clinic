import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const exportDir = resolve(root, "ui-export");
const designDir = resolve(root, "docs", "design");
const storageExportDir = resolve(root, "storage", "ui-export");
const zipPath = resolve(storageExportDir, "prij-clinic-html-theme-lab-v0.10.4-mobile-stable.zip");
const shouldPackage = process.argv.includes("--package");

const themes = [
  { id: "clinic-premium", label: "Clinic Premium" },
  { id: "prij-heritage", label: "Prij Heritage" },
  { id: "medicolize-portal", label: "Medicolize Portal" },
  { id: "incision-portal", label: "Incision Portal" },
  { id: "minimal-clean", label: "Minimal Clean" },
  { id: "compact-operations", label: "Compact Operations" },
  { id: "dark-navy", label: "Dark Navy" }
];

const navItems = [
  ["dashboard", "Dashboard"],
  ["login-preview", "Login Preview"],
  ["patients", "Patients"],
  ["patient-file", "Patient File"],
  ["doctor-workspace", "Doctor Workspace"],
  ["calendar", "Calendar"],
  ["queue", "Queue"],
  ["prescriptions", "Prescriptions"],
  ["investigations", "Investigations"],
  ["billing", "Billing"],
  ["admin", "Admin"],
  ["drug-market", "Drug Market"],
  ["guidelines", "Guidelines"],
  ["protocol-atlas", "Protocol Atlas"],
  ["theme-gallery", "Theme Gallery"]
];

function badge(text, tone = "") {
  return `<span class="badge ${tone}">${text}</span>`;
}

function sectionHeader(kicker, title, description, action = "") {
  return `
    <header class="section-header">
      <div>
        <p class="eyebrow">${kicker}</p>
        <h1>${title}</h1>
        <p class="muted">${description}</p>
      </div>
      ${action}
    </header>`;
}

const safetyBanner = `
  <section class="notice warning">
    <div>
      <strong>Static UI lab only.</strong>
      <p>No API calls, login session, uploads, secrets, real patient data, or medication data are included.</p>
    </div>
    ${badge("Doctor review required", "danger")}
  </section>`;

const sections = [
  {
    id: "dashboard",
    label: "Dashboard",
    html: `
      ${sectionHeader("Owner overview", "Dashboard", "Mobile-stable static clinic operations preview.")}
      ${safetyBanner}
      <section class="metric-grid">
        <article class="metric"><span>Appointments</span><strong>0</strong><p>Placeholder schedule state.</p></article>
        <article class="metric"><span>Queue</span><strong>0</strong><p>No live waiting room data.</p></article>
        <article class="metric"><span>Patient files</span><strong>0</strong><p>No real patient records.</p></article>
        <article class="metric"><span>Draft reviews</span><strong>0</strong><p>Doctor approval remains mandatory.</p></article>
      </section>
      <section class="card-grid">
        <article class="card"><h2>Today</h2><p>Clinic day preview with neutral counts and no live data.</p>${badge("Static", "accent")}</article>
        <article class="card"><h2>Safety</h2><p>Clinical content is draft-only until reviewed by a doctor.</p>${badge("Assistive only", "danger")}</article>
        <article class="card"><h2>Handoff</h2><p>Use the local server for phone review on the same Wi-Fi network.</p>${badge("Designer ready", "accent")}</article>
      </section>`
  },
  {
    id: "login-preview",
    label: "Login Preview",
    html: `
      <section class="login-preview-panel">
        <div class="login-brand">
          <p class="eyebrow">Visual preview</p>
          <h1>Prij Clinic</h1>
          <p>Standalone design lab for OB/GYN and women's health clinic workflows.</p>
          <div class="chip-row">${badge("No real auth")}${badge("No session")}${badge("No API")}</div>
        </div>
        <form class="login-card" aria-label="Visual login preview">
          <div><p class="eyebrow">Login preview</p><h2>Staff sign in</h2><p class="muted">Fields are visual only and do not store anything.</p></div>
          <label>Email placeholder<input value="staff@example.invalid" autocomplete="off" /></label>
          <label>Password placeholder<input type="password" placeholder="Not stored" autocomplete="off" /></label>
          <button class="button primary" type="button" data-section-target="dashboard">Enter UI Lab</button>
        </form>
      </section>`
  },
  {
    id: "patients",
    label: "Patients",
    html: `
      ${sectionHeader("Registration", "Patients", "Search, empty state, desktop table, and mobile cards.", '<button class="button primary" type="button" data-section-target="patient-file">Open Patient File</button>')}
      <section class="panel">
        <label>Search patient file<input placeholder="Name, phone, or MRN placeholder" /></label>
        <div class="table-wrap">
          <table>
            <thead><tr><th>File</th><th>Status</th><th>Last activity</th><th>Action</th></tr></thead>
            <tbody><tr><td>Patient file placeholder</td><td>${badge("No real data")}</td><td>None</td><td><button class="button secondary" type="button" data-section-target="patient-file">Open</button></td></tr></tbody>
          </table>
        </div>
        <div class="mobile-list">
          <article class="list-card"><strong>Patient file placeholder</strong><p>No real patient data in this static lab.</p><button class="button secondary" type="button" data-section-target="patient-file">Open</button></article>
        </div>
      </section>`
  },
  {
    id: "patient-file",
    label: "Patient File",
    html: `
      <section class="patient-hero">
        <div class="avatar" aria-hidden="true">PF</div>
        <div><p class="eyebrow">Patient file</p><h1>Patient Profile</h1><p>Neutral placeholder file for layout review only.</p></div>
        <button class="button secondary" type="button" data-section-target="doctor-workspace">Doctor Workspace</button>
      </section>
      <section class="tabs" aria-label="Patient file tabs">
        ${["Summary", "Encounters", "Prescriptions", "Investigations", "Reports", "Billing", "Consents", "Timeline"].map((tab, index) => `<button class="tab ${index === 0 ? "active" : ""}" type="button" data-tab="${tab.toLowerCase()}">${tab}</button>`).join("")}
      </section>
      <section class="panel tab-panel" data-tab-panel="summary">
        <h2>Summary</h2>
        <div class="profile-grid">
          <div><span>MRN</span><strong>Pending</strong></div>
          <div><span>Consent</span><strong>Not captured in lab</strong></div>
          <div><span>Allergies</span><strong>Not recorded here</strong></div>
          <div><span>Audit</span><strong>Required for real changes</strong></div>
        </div>
      </section>`
  },
  {
    id: "doctor-workspace",
    label: "Doctor Workspace",
    html: `
      ${sectionHeader("Encounter", "Doctor Workspace", "Draft encounter workspace with approval reminders.")}
      <section class="notice danger"><div><strong>Doctor approval required.</strong><p>Clinical output here is visual draft content only.</p></div>${badge("Draft-only", "danger")}</section>
      <section class="card-grid two">
        <article class="card"><h2>Complaint</h2><textarea placeholder="Draft note placeholder"></textarea></article>
        <article class="card"><h2>Exam</h2><textarea placeholder="Draft note placeholder"></textarea></article>
        <article class="card"><h2>Assessment</h2><textarea placeholder="Draft note placeholder"></textarea></article>
        <article class="card"><h2>Plan</h2><textarea placeholder="Doctor-authored plan placeholder"></textarea></article>
      </section>`
  },
  {
    id: "calendar",
    label: "Calendar",
    html: `
      ${sectionHeader("Schedule", "Calendar", "Responsive doctor calendar cards.")}
      <section class="schedule-grid">
        ${["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => `<article class="list-card"><strong>${day}</strong><p>Clinic block ${index + 1}</p>${badge(index % 2 ? "Pending" : "Confirmed", index % 2 ? "warning" : "success")}<button class="button secondary" type="button">Open Day</button></article>`).join("")}
      </section>`
  },
  {
    id: "queue",
    label: "Queue",
    html: `
      ${sectionHeader("Reception", "Queue", "Touch-friendly queue actions.")}
      <section class="card-grid">
        ${["Waiting", "In room", "Complete"].map((status) => `<article class="card"><div class="row"><strong>Patient file</strong>${badge(status, status === "Waiting" ? "warning" : "success")}</div><p>Placeholder queue state.</p><div class="button-row"><button class="button primary" type="button">Call</button><button class="button secondary" type="button">Move</button></div></article>`).join("")}
      </section>`
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    html: `
      ${sectionHeader("Medication safety", "Prescriptions", "Blocked reference state with doctor-controlled patient directions.")}
      <section class="notice danger"><div><strong>Medication reference blocked.</strong><p>No medication rows are included. Doctors write patient directions manually in the real workflow.</p></div>${badge("Blocked", "danger")}</section>
      <section class="panel"><h2>Prescription Draft</h2><p>No preset patient medication instructions or medication records are shown in this static export.</p></section>`
  },
  {
    id: "investigations",
    label: "Investigations",
    html: `
      ${sectionHeader("Orders", "Investigations", "Catalog and result-review layout without file uploads.")}
      <section class="panel"><label>Catalog search<input placeholder="Search investigation name" /></label><div class="chip-row">${["CBC", "AMH", "Pap Smear", "Pelvic Ultrasound", "Beta-hCG"].map((name) => badge(name)).join("")}</div></section>
      <section class="card-grid two"><article class="card"><h2>Draft order</h2><p>Doctor approval required before real orders.</p></article><article class="card"><h2>Results</h2><p>No upload control is included in this static lab.</p></article></section>`
  },
  {
    id: "billing",
    label: "Billing",
    html: `
      ${sectionHeader("Finance", "Billing", "Invoice and payment layout using neutral placeholders.")}
      <section class="card-grid">
        <article class="card"><h2>Invoice</h2><p>Neutral invoice placeholder.</p></article>
        <article class="card"><h2>Payment</h2><p>No real payment data or gateway.</p></article>
        <article class="card"><h2>Daily close</h2><p>Owner review placeholder.</p></article>
      </section>`
  },
  {
    id: "admin",
    label: "Admin",
    html: `
      ${sectionHeader("Controls", "Admin", "Role and permission visual review without real account creation.")}
      <section class="notice warning"><div><strong>Visual only.</strong><p>No real accounts, passwords, or sessions are created here.</p></div>${badge("Protected workflow")}</section>
      <section class="card-grid">${["Doctor", "Reception", "Nurse", "Accountant", "Owner"].map((role) => `<article class="card"><h2>${role}</h2><p>Role card placeholder.</p>${badge("Scoped")}</article>`).join("")}</section>`
  },
  {
    id: "drug-market",
    label: "Drug Market",
    html: `
      ${sectionHeader("Reference status", "Drug Market", "Medication reference placeholder with no commerce workflow.")}
      <section class="notice danger"><div><strong>Reference only.</strong><p>This section is for visual review of medication reference status only.</p></div>${badge("Reference only", "danger")}</section>
      <section class="metric-grid">
        <article class="metric"><span>Official rows</span><strong>0</strong><p>No medication data in export.</p></article>
        <article class="metric"><span>Verified rows</span><strong>0</strong><p>Blocked until official data exists.</p></article>
      </section>`
  },
  {
    id: "guidelines",
    label: "Guidelines",
    html: `
      ${sectionHeader("Library", "Guidelines", "Citation-required reference library layout.")}
      <section class="notice warning"><div><strong>Citations required.</strong><p>Guidelines support clinical review; they do not replace the doctor.</p></div>${badge("Review required", "danger")}</section>
      <section class="card-grid">${["WHO", "NICE", "RCOG", "ACOG"].map((source) => `<article class="card"><h2>${source}</h2><p>Source card placeholder.</p>${badge("Citation required", "warning")}</article>`).join("")}</section>`
  },
  {
    id: "protocol-atlas",
    label: "Protocol Atlas",
    html: `
      ${sectionHeader("Protocols", "Protocol Atlas", "Protocol group cards for visual review.")}
      <section class="card-grid">${["General GYN", "Fertility", "Antenatal", "High-risk OB", "Menopause", "Pelvic Floor"].map((group) => `<article class="card"><h2>${group}</h2><p>Protocol placeholder. Doctor review required.</p>${badge("Draft support", "warning")}</article>`).join("")}</section>`
  },
  {
    id: "theme-gallery",
    label: "Theme Gallery",
    html: `
      ${sectionHeader("Appearance", "Theme Gallery", "Mobile-safe theme previews and controls.")}
      <section class="panel"><h2>Theme Switcher</h2><div class="chip-row">${themes.map((theme) => `<button class="chip-button" type="button" data-theme-target="${theme.id}">${theme.label}</button>`).join("")}</div></section>
      <section class="card-grid">${themes.map((theme) => `<article class="card theme-card"><h2>${theme.label}</h2><p>Cards, forms, badges, drawer, and topbar remain stable.</p><button class="button secondary" type="button" data-theme-target="${theme.id}">Apply</button></article>`).join("")}</section>`
  }
];

const css = String.raw`
:root {
  color-scheme: light;
  --bg: #eef5f4;
  --bg-soft: #f8fbfa;
  --surface: #ffffff;
  --surface-alt: #f3f8f7;
  --border: #d7e4e1;
  --text: #122522;
  --muted: #5d706d;
  --strong: #23413c;
  --brand: #0f766e;
  --brand-strong: #0b5e59;
  --brand-soft: #dbf5f1;
  --nav-bg: #0e2a28;
  --nav-text: #effaf8;
  --warning: #8a5a13;
  --warning-soft: #fff4d8;
  --danger: #9f3338;
  --danger-soft: #fde8e8;
  --success: #176b53;
  --success-soft: #e0f5ed;
  --shadow: 0 12px 30px rgb(18 37 34 / 10%);
  --radius: 8px;
  --sidebar-width: 280px;
  --topbar-height: 64px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body[data-theme="prij-heritage"] {
  --bg: #f4efe7; --bg-soft: #fbf8f1; --surface-alt: #f5efe3; --border: #e1d5c4;
  --text: #17231f; --muted: #68746e; --brand: #2f7a68; --brand-strong: #235b50;
  --brand-soft: #e4f2ed; --nav-bg: #102c28;
}
body[data-theme="medicolize-portal"] {
  --bg: #eef6fb; --bg-soft: #f8fcff; --surface-alt: #eef7fb; --border: #d4e7f0;
  --text: #122337; --muted: #587084; --brand: #1683a5; --brand-strong: #0d6682;
  --brand-soft: #dff4fb; --nav-bg: #0f3345;
}
body[data-theme="incision-portal"] {
  --bg: #f5f7f9; --bg-soft: #ffffff; --surface-alt: #f0f3f6; --border: #dce3ea;
  --text: #182533; --muted: #5f6d7b; --brand: #3d6f92; --brand-strong: #2b5572;
  --brand-soft: #e5f0f6; --nav-bg: #1b2b38;
}
body[data-theme="minimal-clean"] {
  --bg: #f8fafc; --bg-soft: #ffffff; --surface-alt: #f8fafc; --border: #e2e8f0;
  --text: #111827; --muted: #64748b; --brand: #0f766e; --brand-strong: #115e59;
  --brand-soft: #ccfbf1; --nav-bg: #ffffff; --nav-text: #111827;
}
body[data-theme="compact-operations"] {
  --bg: #eef3f5; --bg-soft: #f8fbfc; --surface-alt: #f4f7f8; --border: #d5e0e4;
  --text: #132332; --muted: #536879; --brand: #0b7f7d; --brand-strong: #095f61;
  --brand-soft: #dff7f6; --radius: 6px; --sidebar-width: 252px; --topbar-height: 58px;
}
body[data-theme="dark-navy"] {
  color-scheme: dark; --bg: #07111d; --bg-soft: #0b1724; --surface: #101f2d; --surface-alt: #142738;
  --border: #263e51; --text: #eef8fb; --muted: #a8bac6; --strong: #d9eef4;
  --brand: #2dd4bf; --brand-strong: #6ee7d8; --brand-soft: #12333e; --nav-bg: #050c15; --nav-text: #eef8fb;
  --warning-soft: #382a10; --danger-soft: #3b1d23; --success-soft: #10352d; --shadow: 0 12px 30px rgb(0 0 0 / 30%);
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100vh; min-height: 100dvh; max-width: 100%; overflow-x: hidden; }
body {
  background: linear-gradient(135deg, var(--bg-soft), var(--bg));
  color: var(--text);
  font-size: 16px;
  line-height: 1.5;
}
body.drawer-open { overflow: hidden; }
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
h1, h2, h3, p { margin: 0; overflow-wrap: anywhere; }
h1 { font-size: clamp(1.75rem, 5vw, 2.7rem); line-height: 1.08; letter-spacing: 0; }
h2 { font-size: 1.05rem; letter-spacing: 0; }
input, select, textarea {
  width: 100%; min-height: 44px; border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--surface); color: var(--text); padding: 0.75rem 0.85rem; font-size: 16px;
}
textarea { min-height: 128px; resize: vertical; }
label { display: grid; gap: 0.4rem; font-weight: 760; color: var(--strong); }
.app-shell { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: 100vh; min-height: 100dvh; }
.sidebar {
  position: sticky; top: 0; align-self: start; height: 100vh; height: 100dvh; overflow-y: auto;
  display: grid; align-content: start; gap: 1rem; padding: 1rem; background: var(--nav-bg); color: var(--nav-text);
}
.brand { display: flex; gap: 0.75rem; align-items: center; min-width: 0; padding: 0.25rem; }
.brand-mark { display: grid; width: 44px; height: 44px; flex: 0 0 auto; place-items: center; border-radius: var(--radius); background: var(--brand); color: #fff; font-weight: 900; }
.brand-text { display: grid; min-width: 0; }
.brand-text span { color: color-mix(in srgb, var(--nav-text) 72%, transparent); font-size: 0.82rem; }
.nav-group { display: grid; gap: 0.35rem; }
.nav-title, .eyebrow { color: var(--brand-strong); font-size: 0.76rem; font-weight: 850; letter-spacing: 0; text-transform: uppercase; }
.sidebar .nav-title { color: color-mix(in srgb, var(--nav-text) 72%, transparent); }
.nav-item {
  display: flex; min-height: 44px; width: 100%; align-items: center; justify-content: space-between; gap: 0.5rem;
  border: 1px solid transparent; border-radius: var(--radius); background: transparent; color: inherit;
  padding: 0.7rem 0.75rem; text-align: left; font-weight: 780;
}
.nav-item.active, .nav-item:hover { border-color: rgb(255 255 255 / 16%); background: rgb(255 255 255 / 10%); }
.main { min-width: 0; display: grid; align-content: start; gap: 1rem; padding: 1rem; }
.mobile-topbar {
  display: none; min-height: var(--topbar-height); align-items: center; justify-content: space-between; gap: 0.75rem;
  position: sticky; top: 0; z-index: 30; margin: -1rem -1rem 0; padding: calc(0.65rem + env(safe-area-inset-top)) 1rem 0.65rem;
  border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--surface) 94%, transparent); backdrop-filter: blur(12px);
}
.drawer-overlay {
  display: none; position: fixed; inset: 0; z-index: 50; border: 0; background: rgb(7 17 29 / 56%);
}
.drawer-overlay.open { display: block; }
.top-tools, .section-header, .row, .button-row, .chip-row { display: flex; flex-wrap: wrap; gap: 0.65rem; align-items: center; justify-content: space-between; min-width: 0; }
.top-tools {
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); padding: 0.75rem;
}
.section { display: none; gap: 1rem; max-width: 1280px; width: 100%; margin: 0 auto; }
.section.active { display: grid; }
.section-header { align-items: flex-end; }
.muted, .card p, .metric p, .list-card p { color: var(--muted); }
.button, .chip-button {
  display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: 0.45rem;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text);
  padding: 0.68rem 0.9rem; font-weight: 820; text-align: center;
}
.button.primary { border-color: var(--brand); background: var(--brand); color: #fff; }
.button.secondary, .chip-button { border-color: var(--border); background: var(--surface); color: var(--text); }
.badge {
  display: inline-flex; width: fit-content; max-width: 100%; align-items: center; border: 1px solid var(--border); border-radius: 999px;
  background: var(--surface); color: var(--strong); padding: 0.3rem 0.58rem; font-size: 0.78rem; font-weight: 850; overflow-wrap: anywhere;
}
.badge.accent { border-color: color-mix(in srgb, var(--brand) 35%, var(--border)); background: var(--brand-soft); color: var(--brand-strong); }
.badge.warning { background: var(--warning-soft); color: var(--warning); }
.badge.danger { background: var(--danger-soft); color: var(--danger); }
.badge.success { background: var(--success-soft); color: var(--success); }
.notice, .panel, .card, .metric, .list-card {
  display: grid; gap: 0.8rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);
  box-shadow: var(--shadow); padding: 1rem; max-width: 100%; min-width: 0;
}
.notice { grid-template-columns: minmax(0, 1fr) auto; align-items: start; }
.notice.warning { background: color-mix(in srgb, var(--warning-soft) 54%, var(--surface)); }
.notice.danger { background: color-mix(in srgb, var(--danger-soft) 54%, var(--surface)); }
.metric-grid, .card-grid, .profile-grid, .schedule-grid { display: grid; gap: 0.9rem; min-width: 0; }
.metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.card-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.schedule-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.metric strong { font-size: 2rem; line-height: 1; }
.login-preview-panel {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr); overflow: hidden;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow);
}
.login-brand { display: grid; align-content: center; gap: 1rem; min-height: 420px; padding: clamp(1.2rem, 5vw, 3rem); background: linear-gradient(135deg, var(--nav-bg), var(--brand-strong)); color: #fff; }
.login-brand .eyebrow, .login-brand p { color: #eef8fb; }
.login-card { display: grid; align-content: center; gap: 1rem; padding: clamp(1rem, 4vw, 2rem); }
.patient-hero {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1rem; align-items: center;
  border-radius: var(--radius); background: linear-gradient(135deg, var(--nav-bg), var(--brand-strong)); color: #fff; padding: 1rem;
}
.patient-hero p, .patient-hero .eyebrow { color: #eef8fb; }
.avatar { display: grid; width: 52px; height: 52px; place-items: center; border-radius: var(--radius); background: rgb(255 255 255 / 14%); font-weight: 900; }
.tabs { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem; max-width: 100%; }
.tab { flex: 0 0 auto; min-height: 44px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text); padding: 0.65rem 0.85rem; font-weight: 800; }
.tab.active { border-color: var(--brand); background: var(--brand-soft); color: var(--brand-strong); }
.profile-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.profile-grid div { display: grid; gap: 0.25rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-alt); padding: 0.75rem; }
.profile-grid span { color: var(--muted); font-size: 0.78rem; font-weight: 850; text-transform: uppercase; }
.table-wrap { width: 100%; max-width: 100%; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
th, td { padding: 0.75rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
th { background: var(--surface-alt); color: var(--strong); font-size: 0.78rem; text-transform: uppercase; }
.mobile-list { display: none; }
@media (max-width: 1024px) {
  .app-shell { grid-template-columns: 1fr; }
  .mobile-topbar { display: flex; }
  .sidebar {
    position: fixed; inset: 0 auto 0 0; z-index: 60; width: min(86vw, 320px); max-width: calc(100vw - 28px);
    transform: translateX(-104%); transition: transform 180ms ease; box-shadow: 24px 0 60px rgb(0 0 0 / 24%);
  }
  .sidebar.open { transform: translateX(0); }
  .metric-grid, .profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card-grid, .card-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .schedule-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .main { padding: 0.75rem; }
  .mobile-topbar { margin: -0.75rem -0.75rem 0; }
  .top-tools, .section-header, .notice, .patient-hero, .login-preview-panel { grid-template-columns: 1fr; }
  .top-tools, .section-header, .row, .button-row, .chip-row { align-items: stretch; flex-direction: column; }
  .metric-grid, .card-grid, .card-grid.two, .profile-grid, .schedule-grid { grid-template-columns: 1fr; }
  .button, .chip-button { width: 100%; }
  .login-brand { min-height: 240px; }
  .table-wrap { display: none; }
  .mobile-list { display: grid; gap: 0.8rem; }
}
@media (max-width: 480px) {
  h1 { font-size: 1.75rem; }
  .notice, .panel, .card, .metric, .list-card { padding: 0.85rem; }
  .brand-text strong { font-size: 0.95rem; }
}
`;

const js = String.raw`
(() => {
  const defaultSection = "dashboard";
  const drawer = document.querySelector("[data-drawer]");
  const overlay = document.querySelector("[data-drawer-overlay]");
  const menuButton = document.querySelector("[data-menu-button]");
  const sections = [...document.querySelectorAll("[data-section]")];
  const navButtons = [...document.querySelectorAll("[data-section-target]")];
  const themeButtons = [...document.querySelectorAll("[data-theme-target]")];
  const tabButtons = [...document.querySelectorAll("[data-tab]")];

  function closeDrawer() {
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
    document.body.classList.remove("drawer-open");
    menuButton?.setAttribute("aria-expanded", "false");
  }

  function openDrawer() {
    drawer?.classList.add("open");
    overlay?.classList.add("open");
    document.body.classList.add("drawer-open");
    menuButton?.setAttribute("aria-expanded", "true");
  }

  function showSection(id, updateHash = true) {
    const target = document.querySelector('[data-section="' + id + '"]') ? id : defaultSection;
    sections.forEach((section) => section.classList.toggle("active", section.dataset.section === target));
    navButtons.forEach((button) => button.classList.toggle("active", button.dataset.sectionTarget === target && button.classList.contains("nav-item")));
    closeDrawer();
    if (updateHash) history.replaceState(null, "", "#" + target);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem("prij-v104-static-theme", theme);
  }

  menuButton?.addEventListener("click", openDrawer);
  overlay?.addEventListener("click", closeDrawer);
  navButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.sectionTarget)));
  themeButtons.forEach((button) => button.addEventListener("click", () => setTheme(button.dataset.themeTarget)));
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      const panel = document.querySelector("[data-tab-panel]");
      if (panel) {
        panel.dataset.tabPanel = button.dataset.tab;
        panel.querySelector("h2").textContent = button.textContent.trim();
      }
    });
  });
  window.addEventListener("hashchange", () => showSection(location.hash.slice(1), false));

  const savedTheme = localStorage.getItem("prij-v104-static-theme");
  setTheme(savedTheme || "clinic-premium");
  showSection(location.hash.slice(1) || defaultSection, false);
})();
`;

function htmlDocument(title) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${title}</title>
  <link rel="stylesheet" href="./assets/styles.css" />
</head>
<body data-theme="clinic-premium">
  <div class="app-shell">
    <button class="drawer-overlay" type="button" aria-label="Close navigation" data-drawer-overlay></button>
    <aside class="sidebar" data-drawer>
      <div class="brand">
        <span class="brand-mark">P</span>
        <span class="brand-text"><strong>Prij Clinic</strong><span>Static HTML Lab</span></span>
      </div>
      <nav class="nav-group" aria-label="Main sections">
        <span class="nav-title">Sections</span>
        ${navItems.map(([id, label]) => `<button class="nav-item" type="button" data-section-target="${id}">${label}<span aria-hidden="true">&gt;</span></button>`).join("")}
      </nav>
    </aside>
    <main class="main">
      <header class="mobile-topbar">
        <div class="brand">
          <span class="brand-mark">P</span>
          <span class="brand-text"><strong>Prij Clinic</strong><span>UI Lab</span></span>
        </div>
        <button class="button secondary" type="button" aria-expanded="false" data-menu-button>Menu</button>
      </header>
      <section class="top-tools" aria-label="Lab controls">
        <div>
          <p class="eyebrow">v0.10.4 Mobile-Stable Static HTML Lab</p>
          <p class="muted">One static shell. No API calls, Docker, login, uploads, secrets, or real patient data.</p>
        </div>
        <div class="chip-row" aria-label="Theme switcher">
          ${themes.map((theme) => `<button class="chip-button" type="button" data-theme-target="${theme.id}">${theme.label}</button>`).join("")}
        </div>
      </section>
      ${sections.map((section) => `<section class="section" id="${section.id}" data-section="${section.id}" aria-label="${section.label}">${section.html}</section>`).join("")}
    </main>
  </div>
  <script src="./assets/app.js"></script>
</body>
</html>
`;
}

function writeDocs() {
  const handoff = `# Prij Clinic Static HTML Theme Lab v0.10.4

This folder is a static design handoff only. Open \`index.html\` directly for a quick desktop check, or use \`npm run design:serve-html\` from the repo root for phone testing.

Safety constraints:
- No real patient data, passwords, secrets, API calls, backend storage access, uploads, or external AI.
- Clinical content is draft-only and must be reviewed by a doctor.
- Medication rows are not included, and the lab does not contain dosing automation.

Default section: Dashboard.
`;

  const mobileGuide = `# Mobile Testing Guide

Preferred command:

\`\`\`powershell
npm run design:serve-html
\`\`\`

Open the printed localhost URL on the computer. For a phone, connect to the same Wi-Fi and open the printed LAN URL.

Why use the server instead of file://:
- Phone browsers cannot open the developer machine file path directly.
- LocalStorage, relative assets, and browser security behavior are closer to a normal deployed static site.
- The server exposes only the \`ui-export\` folder.

Manual checks:
- Dashboard opens first.
- Menu opens the drawer at phone widths.
- Nav item taps switch sections and close the drawer.
- Overlay closes the drawer.
- Theme changes apply immediately and persist after refresh.
- No horizontal scrolling at 360, 375, 390, 414, 430, and 768 pixel widths.
`;

  const tokens = `# Theme Tokens

Themes included:
- Clinic Premium
- Prij Heritage
- Medicolize Portal
- Incision Portal
- Minimal Clean
- Compact Operations
- Dark Navy

Core CSS variables:
- \`--bg\`, \`--bg-soft\`, \`--surface\`, \`--surface-alt\`
- \`--border\`, \`--text\`, \`--muted\`, \`--strong\`
- \`--brand\`, \`--brand-strong\`, \`--brand-soft\`
- \`--nav-bg\`, \`--nav-text\`
- \`--warning\`, \`--danger\`, \`--success\`
`;

  const checklist = `# UI Review Checklist

- Dashboard is the default view.
- Login Preview is visual-only and Enter UI Lab returns to Dashboard.
- Every nav section is reachable without reload.
- Mobile drawer opens, closes, and closes after nav tap.
- No horizontal scroll on phone widths.
- Buttons and inputs are at least 44px tall.
- Tables collapse to mobile cards.
- Patient File tabs are touch-friendly.
- Prescriptions avoid dosing automation language.
- Drug Market avoids commerce workflow language.
- Normal UI avoids raw developer wording and endpoint/code text.
`;

  writeFileSync(resolve(exportDir, "DESIGN_HANDOFF.md"), handoff, "utf8");
  writeFileSync(resolve(exportDir, "MOBILE_TESTING_GUIDE.md"), mobileGuide, "utf8");
  writeFileSync(resolve(exportDir, "THEME_TOKENS.md"), tokens, "utf8");
  writeFileSync(resolve(exportDir, "UI_REVIEW_CHECKLIST.md"), checklist, "utf8");
}

function lanUrls(port = 4174) {
  const urls = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) urls.push(`http://${entry.address}:${port}`);
    }
  }
  return urls;
}

function cleanText(text) {
  return text.replace(/[ \t]+$/gm, "");
}

function packageExport() {
  mkdirSync(storageExportDir, { recursive: true });
  rmSync(zipPath, { force: true });
  const stagingDir = resolve(storageExportDir, "prij-clinic-html-theme-lab-v0.10.4-mobile-stable");
  rmSync(stagingDir, { recursive: true, force: true });
  cpSync(exportDir, stagingDir, { recursive: true });
  const result = spawnSync("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `Compress-Archive -Path '${stagingDir.replaceAll("'", "''")}\\*' -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force`
  ], { stdio: "inherit" });
  rmSync(stagingDir, { recursive: true, force: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Package generated: ${zipPath}`);
}

rmSync(exportDir, { recursive: true, force: true });
mkdirSync(resolve(exportDir, "assets"), { recursive: true });
mkdirSync(designDir, { recursive: true });
mkdirSync(dirname(zipPath), { recursive: true });

writeFileSync(resolve(exportDir, "index.html"), cleanText(htmlDocument("Prij Clinic Static HTML Theme Lab")), "utf8");
writeFileSync(resolve(exportDir, "assets", "styles.css"), cleanText(css), "utf8");
writeFileSync(resolve(exportDir, "assets", "app.js"), cleanText(js), "utf8");
writeDocs();

writeFileSync(resolve(designDir, "prij-ui-theme-lab.html"), cleanText(htmlDocument("Prij Clinic Static HTML Theme Lab")), "utf8");
writeFileSync(resolve(designDir, "prij-mobile-ui-lab.html"), cleanText(htmlDocument("Prij Clinic Static HTML Theme Lab")), "utf8");

console.log("Generated static HTML theme lab:");
console.log(`- ${resolve(exportDir, "index.html")}`);
console.log(`- ${resolve(designDir, "prij-ui-theme-lab.html")}`);
console.log(`- ${resolve(designDir, "prij-mobile-ui-lab.html")}`);
console.log("Serve for phone testing with: npm run design:serve-html");
for (const url of lanUrls()) console.log(`LAN candidate: ${url}`);

if (shouldPackage) packageExport();

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const designDir = resolve(root, "docs", "design");
const desktopPath = resolve(designDir, "prij-ui-theme-lab.html");
const mobilePath = resolve(designDir, "prij-mobile-ui-lab.html");

mkdirSync(designDir, { recursive: true });

const themes = [
  ["prij-heritage", "Prij Heritage"],
  ["clinic-premium", "Clinic Premium"],
  ["minimal-clean", "Minimal Clean"],
  ["compact-operations", "Compact Operations"],
  ["dark-navy", "Dark Navy"],
  ["mobile-focus", "Mobile Focus"]
];

const navItems = [
  ["login", "Login"],
  ["dashboard", "Dashboard"],
  ["patients", "Patients"],
  ["new-patient", "New Patient"],
  ["workspace", "Patient Workspace"],
  ["calendar", "Calendar"],
  ["queue", "Queue"],
  ["doctor-visit", "Doctor Visit"],
  ["orders", "Orders / Investigations"],
  ["prescriptions", "Prescriptions"],
  ["billing", "Billing"],
  ["guidelines", "Guidelines"],
  ["protocol-atlas", "Protocol Atlas"],
  ["admin-accounts", "Admin Accounts"],
  ["medication-import", "Official Medication Import"],
  ["settings-themes", "Settings / Themes"]
];

const patientTabs = [
  "Summary",
  "Medical",
  "Clinical",
  "Appointments",
  "Encounters",
  "Prescriptions",
  "Investigations",
  "Reports",
  "Pregnancy",
  "Ultrasound",
  "Billing",
  "Consents",
  "AI Drafts",
  "Timeline"
];

const defaultSectionId = "dashboard";

const css = String.raw`
:root {
  color-scheme: light;
  --background: #f6f2eb;
  --background-soft: #fbf8f3;
  --surface: #ffffff;
  --surface-muted: #f5f0e7;
  --surface-strong: #e9f4ef;
  --border: #e2d8c8;
  --border-strong: #cbbba5;
  --foreground: #17231f;
  --muted: #66756f;
  --muted-strong: #2f554d;
  --navy: #102c28;
  --navy-soft: #183c36;
  --accent: #2f7a68;
  --accent-dark: #235b50;
  --accent-soft: #e3f3ee;
  --warning: #aa6d17;
  --warning-soft: #fff4dd;
  --danger: #a83f44;
  --danger-soft: #fde8e7;
  --success: #18745b;
  --success-soft: #e1f5ee;
  --shadow-sm: 0 1px 2px rgb(16 44 40 / 6%), 0 8px 24px rgb(16 44 40 / 5%);
  --shadow-md: 0 18px 48px rgb(16 44 40 / 12%);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --space: 1rem;
  --sidebar-width: 18rem;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body[data-theme="clinic-premium"] {
  --background: #edf4f7; --background-soft: #f7fbfc; --surface-muted: #f1f7f8; --surface-strong: #e1f6f5;
  --border: #d5e5e9; --border-strong: #adcbd3; --foreground: #102231; --muted: #5b7180;
  --muted-strong: #314b5a; --navy: #071a28; --navy-soft: #102d3f; --accent: #0e8e8c;
  --accent-dark: #0a6d70; --accent-soft: #dcf7f5; --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px;
}
body[data-theme="minimal-clean"] {
  --background: #f8fafc; --background-soft: #ffffff; --surface-muted: #f8fafc; --surface-strong: #eef2f7;
  --border: #e2e8f0; --border-strong: #cbd5e1; --foreground: #172033; --muted: #64748b;
  --muted-strong: #334155; --navy: #ffffff; --navy-soft: #f8fafc; --accent: #0f766e;
  --accent-dark: #115e59; --accent-soft: #ccfbf1; --shadow-sm: 0 6px 18px rgb(15 23 42 / 6%);
}
body[data-theme="compact-operations"] {
  --background: #eef3f5; --background-soft: #f8fbfc; --surface-muted: #f4f7f8; --surface-strong: #e2f2ef;
  --border: #d5e0e4; --foreground: #132332; --muted: #536879; --accent: #0b7f7d;
  --accent-dark: #095f61; --accent-soft: #dff7f6; --radius-sm: 5px; --radius-md: 7px; --radius-lg: 10px;
  --space: .74rem; --sidebar-width: 16.5rem;
}
body[data-theme="dark-navy"] {
  color-scheme: dark; --background: #07111d; --background-soft: #0b1724; --surface: #101f2d;
  --surface-muted: #142738; --surface-strong: #12333e; --border: #22384a; --border-strong: #315166;
  --foreground: #eef8fb; --muted: #a8bac6; --muted-strong: #d5e3ea; --navy: #050c15;
  --navy-soft: #0b1724; --accent: #2dd4bf; --accent-dark: #5eead4; --accent-soft: #12333e;
  --warning-soft: #372911; --danger-soft: #391b22; --success-soft: #0f302a;
  --shadow-sm: 0 8px 24px rgb(0 0 0 / 22%); --shadow-md: 0 18px 55px rgb(0 0 0 / 32%);
}
body[data-theme="mobile-focus"] {
  --background: #f7fafb; --background-soft: #ffffff; --surface-muted: #f2f7f7; --surface-strong: #e4f7f5;
  --border: #d7e5e4; --foreground: #102033; --muted: #4e6570; --navy: #102033; --navy-soft: #173546;
  --accent: #0f8f8c; --accent-dark: #0b6f71; --accent-soft: #e3faf8; --radius-sm: 10px; --radius-md: 12px; --radius-lg: 16px;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; max-width: 100%; overflow-x: hidden; }
body {
  background: linear-gradient(135deg, var(--background-soft), var(--background));
  color: var(--foreground);
  font-size: 16px;
  line-height: 1.5;
}
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, p, dl { margin: 0; }
h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.08; letter-spacing: 0; }
h2 { font-size: 1.08rem; letter-spacing: 0; }
h3 { font-size: 1rem; letter-spacing: 0; }
.lab-toolbar {
  position: sticky; top: 0; z-index: 80; display: flex; flex-wrap: wrap; gap: .65rem; align-items: center;
  border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--surface) 93%, transparent);
  backdrop-filter: blur(12px); padding: .75rem 1rem;
}
.control-group { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; }
.control-group span { color: var(--muted); font-size: .78rem; font-weight: 800; text-transform: uppercase; }
.preview-shell { width: 100%; margin: 0 auto; transition: width 160ms ease; }
.preview-shell.mobile { width: min(390px, 100%); border-inline: 1px solid var(--border); }
.preview-shell.tablet { width: min(768px, 100%); border-inline: 1px solid var(--border); }
.app-shell { display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); min-height: calc(100vh - 3.9rem); }
.sidebar {
  position: sticky; top: 3.9rem; height: calc(100vh - 3.9rem); overflow: auto; display: grid; align-content: start; gap: 1rem;
  background: linear-gradient(180deg, var(--navy), var(--navy-soft)); color: #e6f2f3; padding: 1.1rem;
}
.brand { display: grid; gap: .25rem; color: #fff; font-weight: 900; }
.brand-mark { display: grid; width: 2.5rem; height: 2.5rem; place-items: center; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--accent), #0ea5b7); }
.nav-group { display: grid; gap: .35rem; }
.nav-title, .eyebrow { color: var(--accent-dark); font-size: .74rem; font-weight: 850; text-transform: uppercase; }
.sidebar .nav-title { color: #9ab8c1; }
.nav-item {
  display: flex; min-height: 2.75rem; align-items: center; justify-content: space-between; border: 1px solid transparent;
  border-radius: var(--radius-sm); color: inherit; padding: .62rem .72rem; font-weight: 760; text-align: left; background: transparent;
}
.nav-item.active, .nav-item:hover { border-color: rgb(255 255 255 / 14%); background: rgb(255 255 255 / 10%); }
.app-main { min-width: 0; padding: calc(var(--space) * 1.35); }
.mobile-topbar { display: none; position: sticky; top: 3.9rem; z-index: 30; border-bottom: 1px solid var(--border); background: var(--surface); padding: .75rem; }
.drawer-backdrop { display: none; position: fixed; inset: 0; z-index: 35; border: 0; background: rgb(7 24 38 / 48%); }
.drawer-backdrop.open { display: block; }
.section { display: none; gap: 1rem; animation: fadeIn 120ms ease; }
.section.active { display: grid; }
@keyframes fadeIn { from { opacity: .72; transform: translateY(2px); } to { opacity: 1; transform: none; } }
.topbar, .header-row, .section-heading, .actions, .workflow-band, .patient-actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; justify-content: space-between; }
.lab-banner {
  display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; justify-content: space-between; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--accent-soft); color: var(--accent-dark); padding: .55rem .75rem; font-weight: 820;
}
.quick-actions { display: flex; flex-wrap: wrap; gap: .45rem; justify-content: flex-end; }
.page-header { display: grid; gap: .55rem; }
.muted { color: var(--muted); }
.button, .chip-button {
  display: inline-flex; min-height: 2.8rem; align-items: center; justify-content: center; gap: .45rem; border: 1px solid var(--accent);
  border-radius: var(--radius-sm); background: var(--accent); color: #fff; font-weight: 820; padding: .65rem .9rem;
}
.button.secondary, .chip-button { border-color: var(--border); background: var(--surface); color: var(--foreground); }
.button.warning { border-color: var(--warning); background: var(--warning-soft); color: var(--warning); }
.button.danger { border-color: var(--danger); background: var(--danger-soft); color: var(--danger); }
.button:disabled { opacity: .65; cursor: not-allowed; }
.badge {
  display: inline-flex; width: fit-content; align-items: center; border: 1px solid var(--border); border-radius: 999px;
  background: var(--surface); color: var(--muted-strong); font-size: .78rem; font-weight: 850; padding: .32rem .6rem;
}
.badge.accent { border-color: color-mix(in srgb, var(--accent) 28%, var(--border)); background: var(--accent-soft); color: var(--accent-dark); }
.badge.warning { border-color: rgb(170 109 23 / 28%); background: var(--warning-soft); color: var(--warning); }
.badge.danger { border-color: rgb(168 63 68 / 25%); background: var(--danger-soft); color: var(--danger); }
.badge.success { border-color: rgb(24 116 91 / 25%); background: var(--success-soft); color: var(--success); }
.alert, .empty-state {
  display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; border: 1px solid var(--border);
  border-radius: var(--radius-md); background: var(--surface); padding: .9rem 1rem;
}
.alert.warning { border-color: rgb(170 109 23 / 28%); background: var(--warning-soft); }
.alert.danger { border-color: rgb(168 63 68 / 25%); background: var(--danger-soft); }
.panel, .card, .login-panel {
  display: grid; gap: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface);
  box-shadow: var(--shadow-sm); padding: calc(var(--space) * 1.15);
}
.login-screen { display: grid; min-height: calc(100vh - 3.9rem); place-items: center; padding: 1rem; }
.login-shell {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, .72fr); width: min(100%, 72rem); overflow: hidden;
  border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-md);
}
.login-brand { display: grid; align-content: center; gap: 1rem; background: linear-gradient(135deg, var(--navy), var(--accent-dark)); color: #fff; padding: clamp(1.5rem, 5vw, 4rem); }
.login-brand .eyebrow, .login-brand .muted { color: #e6f2f3; }
.login-panel { border: 0; border-radius: 0; box-shadow: none; align-content: center; }
.grid, .dashboard-grid, .content-grid, .summary-grid, .form-grid, .card-grid, .mobile-card-list, .profile-grid, .schedule-grid { display: grid; gap: .9rem; }
.dashboard-grid { grid-template-columns: minmax(0, 1.25fr) minmax(18rem, .75fr); }
.content-grid { grid-template-columns: minmax(17rem, .8fr) minmax(0, 1.2fr); }
.summary-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.schedule-grid { grid-template-columns: repeat(5, minmax(9rem, 1fr)); overflow-x: auto; padding-bottom: .25rem; }
.wide { grid-column: 1 / -1; }
.metric-card, .data-row, .account-row, .protocol-card, .timeline-row {
  display: grid; gap: .5rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); padding: .95rem;
}
.metric-card strong { font-size: 1.85rem; line-height: 1; }
.data-row-header { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; justify-content: space-between; }
.profile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.profile-grid div { border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface-muted); padding: .75rem; }
dt { color: var(--muted); font-size: .78rem; font-weight: 850; text-transform: uppercase; }
dd { margin: .15rem 0 0; font-weight: 800; }
label { display: grid; gap: .4rem; color: var(--muted-strong); font-size: .9rem; font-weight: 760; }
input, select, textarea {
  width: 100%; min-height: 2.85rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--foreground); padding: .75rem .85rem;
}
textarea { min-height: 6rem; resize: vertical; }
.patient-hero {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1rem; align-items: center; border: 1px solid var(--border);
  border-radius: var(--radius-lg); background: linear-gradient(120deg, var(--navy), var(--accent-dark)); color: #edf3f0; padding: 1.2rem;
}
.patient-hero h1, .patient-hero .eyebrow, .patient-hero .muted { color: #edf3f0; }
.avatar { display: grid; width: 3.3rem; height: 3.3rem; place-items: center; border-radius: var(--radius-md); background: rgb(255 255 255 / 12%); font-weight: 900; }
.tabs { display: flex; gap: .55rem; overflow-x: auto; padding-bottom: .35rem; scroll-snap-type: x proximity; }
.tab { flex: 0 0 auto; min-height: 3rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--foreground); font-weight: 820; padding: .6rem .85rem; scroll-snap-align: start; }
.tab.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-dark); }
.desktop-table { width: 100%; border-collapse: collapse; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); }
.desktop-table th, .desktop-table td { border-bottom: 1px solid var(--border); padding: .75rem; text-align: left; vertical-align: top; }
.desktop-table th { background: var(--surface-muted); color: var(--muted-strong); font-size: .78rem; text-transform: uppercase; }
.mobile-card-list { display: none; }
.safety-list, .chip-list { display: flex; flex-wrap: wrap; gap: .5rem; }
.code-block {
  max-width: 100%; overflow-wrap: anywhere; white-space: pre-wrap; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-muted); padding: .8rem; font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; font-size: .88rem;
}
.phone-frame { width: min(390px, 100%); margin: 0 auto; border-inline: 1px solid var(--border); background: var(--background); }
@media (max-width: 980px) {
  .app-shell, .login-shell, .dashboard-grid, .content-grid { grid-template-columns: 1fr; }
  .mobile-topbar { display: flex; justify-content: space-between; align-items: center; }
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 40; width: min(20rem, calc(100vw - 2rem)); max-width: calc(100vw - 2rem); height: 100dvh; top: 0; transform: translateX(-105%); transition: transform 180ms ease; }
  .sidebar.open { transform: translateX(0); }
  .topbar { align-items: stretch; flex-direction: column; }
  .quick-actions { justify-content: flex-start; }
  .summary-grid, .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .lab-toolbar, .app-main { padding: .75rem; }
  h1 { font-size: 1.9rem; }
  .summary-grid, .card-grid, .form-grid, .profile-grid { grid-template-columns: 1fr; }
  .button, .patient-actions .button { width: 100%; }
  .header-row, .section-heading, .alert, .workflow-band, .actions, .patient-actions { align-items: stretch; flex-direction: column; }
  .patient-hero { grid-template-columns: 1fr; }
  .desktop-table { display: none; }
  .mobile-card-list { display: grid; }
  .schedule-grid { grid-template-columns: 1fr; overflow: visible; }
}
`;

function badge(label, tone = "") {
  return `<span class="badge${tone ? ` ${tone}` : ""}">${label}</span>`;
}

function shellHeader(kicker, title, description, action = "") {
  return String.raw`
<header class="page-header">
  <div class="header-row">
    <div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p class="muted">${description}</p></div>
    ${action}
  </div>
</header>`;
}

const safetyNote = String.raw`
<section class="alert warning">
  <div>
    <strong>Local HTML lab only - no real PHI.</strong>
    <p class="muted">Offline static UI mockup. No API calls, no database writes, no medication rows, and no clinical automation.</p>
  </div>
  ${badge("Doctor approval required", "danger")}
</section>`;

const sections = [
  {
    id: "login",
    title: "Login",
    html: String.raw`
<section class="login-screen" aria-label="Login screen">
  <div class="login-shell">
    <div class="login-brand">
      <p class="eyebrow">Clinic workspace</p>
      <h1>Prij Clinic</h1>
      <p>Standalone local design lab for a women&apos;s health clinic management system.</p>
      <div class="workflow-band">${badge("No API calls")}${badge("No real patient data")}${badge("AI draft-only")}</div>
    </div>
    <form class="login-panel">
      <div><p class="eyebrow">Demo-style login</p><h2>Staff sign in</h2><p class="muted">Static offline form state only.</p></div>
      <label>Staff ID or email<input value="local-demo@example.invalid" aria-label="Demo staff ID" /></label>
      <label>Password<input type="password" placeholder="Not stored" aria-label="Demo password" /></label>
      <button class="button" type="button" data-go="dashboard">Enter UI Lab</button>
      <p class="empty-state">Static UI Lab — no real login required. This is a visual preview only; real app login/RBAC still applies in the production app.</p>
    </form>
  </div>
</section>`
  },
  {
    id: "dashboard",
    title: "Dashboard",
    html: String.raw`
${shellHeader("Owner overview", "Dashboard", "Daily operating snapshot using neutral placeholder counts.")}
${safetyNote}
<section class="summary-grid">
  <article class="metric-card"><span>Appointments today</span><strong>0</strong><p class="muted">No live schedule loaded</p></article>
  <article class="metric-card"><span>Queue status</span><strong>0</strong><p class="muted">Waiting room placeholder</p></article>
  <article class="metric-card"><span>Patients</span><strong>0</strong><p class="muted">No real patient data</p></article>
  <article class="metric-card"><span>Finance summary</span><strong>0</strong><p class="muted">Static local currency-free mock</p></article>
</section>
<section class="card-grid">
  <article class="card"><h2>Medication blocked</h2><p>Official medication rows: 0</p><p class="muted">Medication selection blocked until official rows exist.</p>${badge("Blocked", "danger")}</article>
  <article class="card"><h2>Guideline ready</h2><p class="muted">Guideline library ready with citation-required status.</p>${badge("Citation required", "warning")}</article>
  <article class="card"><h2>Clinic safety</h2><p class="muted">AI clinical output remains draft-only until doctor review and approval.</p>${badge("Draft support only", "danger")}</article>
</section>`
  },
  {
    id: "patients",
    title: "Patients",
    html: String.raw`
${shellHeader("Registration", "Patients", "Search, empty state, desktop table, and mobile card list.", '<button class="button" type="button" data-go="new-patient">Create patient</button>')}
<section class="panel">
  <div class="section-heading"><h2>Patient files</h2>${badge("No real patient data", "warning")}</div>
  <label>Search bar<input placeholder="Search patient file, MRN pending, or phone placeholder" /></label>
  <div class="empty-state"><span>No patient records are loaded in this static prototype.</span><button class="button secondary" type="button" data-go="new-patient">Create patient</button></div>
  <table class="desktop-table" aria-label="Patient desktop list">
    <thead><tr><th>File</th><th>MRN</th><th>Status</th><th>Action</th></tr></thead>
    <tbody><tr><td>Patient file</td><td>MRN pending</td><td>${badge("Placeholder")}</td><td><button class="button secondary" type="button" data-go="workspace">Open workspace</button></td></tr></tbody>
  </table>
  <div class="mobile-card-list">
    <article class="data-row"><div class="data-row-header"><strong>Patient file</strong>${badge("MRN pending")}</div><p class="muted">Neutral mobile card list state.</p><button class="button secondary" type="button" data-go="workspace">Open workspace</button></article>
  </div>
</section>`
  },
  {
    id: "new-patient",
    title: "New Patient",
    html: String.raw`
${shellHeader("Create file", "New Patient", "Full patient creation layout with placeholders only.")}
<section class="panel">
  <div class="section-heading"><h2>Patient creation form</h2>${badge("No real patient data", "warning")}</div>
  <form class="form-grid">
    <label>First name<input placeholder="First name placeholder" /></label>
    <label>Last name<input placeholder="Last name placeholder" /></label>
    <label>Phone<input placeholder="Phone placeholder" /></label>
    <label>DOB<input type="date" /></label>
    <label>Sex<select><option>Female</option><option>Not specified</option></select></label>
    <label class="wide">Notes<textarea placeholder="Administrative notes placeholder only"></textarea></label>
    <div class="actions wide"><button class="button" type="button">Create visual state</button><button class="button secondary" type="button" data-go="patients">Back to patients</button></div>
  </form>
</section>`
  },
  {
    id: "workspace",
    title: "Patient Workspace",
    html: String.raw`
<section class="patient-hero">
  <div class="avatar">PF</div>
  <div><p class="eyebrow">Patient workspace</p><h1>Patient file</h1><p class="muted">MRN pending</p><div class="workflow-band"><span>Neutral placeholders only</span><span>Doctor approval required</span></div></div>
  <div class="patient-actions"><button class="button" type="button" data-go="doctor-visit">Doctor visit</button><button class="button secondary" type="button" data-go="orders">New order</button></div>
</section>
<section class="tabs" aria-label="Scrollable patient workspace tabs">${patientTabs.map((label, index) => `<button class="tab${index === 0 ? " active" : ""}" type="button">${label}</button>`).join("")}</section>
<section class="content-grid">
  <article class="panel"><h2>Timeline</h2><div class="timeline-row"><strong>Timeline placeholder</strong><p class="muted">No clinical events loaded.</p></div></article>
  <article class="panel"><h2>Orders</h2><div class="empty-state"><span>Order draft area</span>${badge("Doctor review required", "warning")}</div></article>
  <article class="panel"><h2>Notes</h2><textarea placeholder="Draft note placeholder"></textarea></article>
  <article class="panel"><h2>Billing</h2><p class="muted">Balance and invoice cards use neutral values only.</p>${badge("No payment data")}</article>
  <article class="panel wide"><h2>Safety status</h2><div class="safety-list">${badge("No real PHI", "warning")}${badge("AI drafts require doctor approval", "danger")}${badge("Audit log required for real changes")}</div></article>
</section>`
  },
  {
    id: "calendar",
    title: "Calendar",
    html: String.raw`
${shellHeader("Doctor calendar", "Calendar", "Compact weekly and day schedule mock with mobile stacked cards.")}
<section class="schedule-grid" aria-label="Weekly schedule mock">
  ${["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => `<article class="data-row"><strong>${day}</strong><p class="muted">Clinic block ${index + 1}</p>${badge(index % 2 === 0 ? "Confirmed" : "Pending", index % 2 === 0 ? "success" : "warning")}<button class="button secondary" type="button">Open day</button></article>`).join("")}
</section>
<section class="mobile-card-list">
  <article class="data-row"><div class="data-row-header"><strong>Today</strong>${badge("Checked in", "success")}</div><p class="muted">Mobile appointment card placeholder.</p></article>
</section>`
  },
  {
    id: "queue",
    title: "Queue",
    html: String.raw`
${shellHeader("Reception flow", "Queue", "Waiting queue cards with call, complete, and cancel button styles.")}
<section class="card-grid">
  ${["Waiting", "In room", "Completed"].map((state) => `<article class="card"><div class="data-row-header"><strong>Patient file</strong>${badge(state, state === "Waiting" ? "warning" : "success")}</div><p class="muted">Queue placeholder, no patient data.</p><div class="actions"><button class="button" type="button">Call</button><button class="button secondary" type="button">Complete</button><button class="button danger" type="button">Cancel</button></div></article>`).join("")}
</section>`
  },
  {
    id: "doctor-visit",
    title: "Doctor Visit",
    html: String.raw`
${shellHeader("Encounter draft", "Doctor Visit", "Visit note layout with doctor approval required.")}
<section class="alert danger"><div><strong>Doctor approval required.</strong><p class="muted">Clinical notes in this prototype are draft placeholders only.</p></div>${badge("Draft-only", "danger")}</section>
<section class="card-grid">
  ${["Complaint", "History", "Exam", "Impression", "Plan"].map((label) => `<article class="card"><h2>${label}</h2><textarea placeholder="${label} draft placeholder"></textarea></article>`).join("")}
</section>`
  },
  {
    id: "orders",
    title: "Orders / Investigations",
    html: String.raw`
${shellHeader("Investigations", "Orders / Investigations", "Catalog search, neutral investigation chips, draft order, and upload placeholder.")}
<section class="panel">
  <label>Catalog search field<input placeholder="Search investigation catalog" /></label>
  <div class="chip-list">${["CBC", "Serum Beta-hCG", "AMH", "Pap Smear", "Pelvic Ultrasound", "Transvaginal Ultrasound", "Anomaly Scan"].map((name) => badge(name)).join("")}</div>
</section>
<section class="content-grid">
  <article class="panel"><h2>Order draft</h2><p class="muted">Selected investigation chips appear here before doctor approval.</p>${badge("Draft", "warning")}</article>
  <article class="panel"><h2>Result upload placeholder</h2><p class="empty-state">Offline visual state only. No files are uploaded.</p></article>
</section>`
  },
  {
    id: "prescriptions",
    title: "Prescriptions",
    html: String.raw`
${shellHeader("Medication safety", "Prescriptions", "Prescription draft layout with blocked medication reference state.")}
<section class="alert danger"><div><strong>Medication reference blocked state</strong><p class="muted">Official medication rows: 0. Medication selection blocked until official rows exist.</p></div>${badge("Blocked", "danger")}</section>
<section class="content-grid">
  <article class="panel"><h2>Prescription draft</h2><p class="empty-state">No medication rows and no dose examples are included.</p></article>
  <article class="panel"><h2>Manual directions note</h2><p class="muted">Doctor writes patient directions manually.</p>${badge("Doctor controlled", "warning")}</article>
</section>`
  },
  {
    id: "billing",
    title: "Billing",
    html: String.raw`
${shellHeader("Finance", "Billing", "Invoice, payment, permissions, and daily closing summary mock.")}
<section class="card-grid">
  <article class="card"><h2>Invoice card</h2><p class="muted">Neutral invoice placeholder.</p>${badge("Draft")}</article>
  <article class="card"><h2>Payment card</h2><p class="muted">No payment data stored.</p>${badge("Offline")}</article>
  <article class="card"><h2>Daily closing summary</h2><p class="muted">Owner review placeholder.</p>${badge("Owner review", "warning")}</article>
</section>
<section class="panel"><h2>Permission badges</h2><div class="safety-list">${badge("Discount permission required", "warning")}${badge("Refund permission required", "warning")}${badge("Audit log required")}</div></section>`
  },
  {
    id: "guidelines",
    title: "Guidelines",
    html: String.raw`
${shellHeader("Reference library", "Guidelines", "Guideline library card with source cards and citation-required banner.")}
<section class="alert warning"><div><strong>Citation required.</strong><p class="muted">Clinical references require source citation and doctor review before use.</p></div>${badge("Review required", "danger")}</section>
<section class="panel"><label>Search field<input placeholder="Search guideline library" /></label></section>
<section class="card-grid">${["WHO", "NICE", "RCOG", "ACOG", "ESHRE"].map((source) => `<article class="card"><h2>${source}</h2><p class="muted">Source card placeholder.</p>${badge("Citation required", "warning")}</article>`).join("")}</section>`
  },
  {
    id: "protocol-atlas",
    title: "Protocol Atlas",
    html: String.raw`
${shellHeader("Clinical protocols", "Protocol Atlas", "Protocol groups with verified/catalog-only status badges.")}
<section class="alert warning"><div><strong>Doctor review required.</strong><p class="muted">Protocols are reference support only, never autonomous medical decisions.</p></div>${badge("Doctor review required", "danger")}</section>
<section class="card-grid">${["General gynecology", "Fertility", "Antenatal care", "High-risk obstetrics", "Fetal medicine", "Menopause", "Pelvic floor"].map((group) => `<article class="protocol-card"><h2>${group}</h2><p class="muted">Protocol group placeholder.</p><div class="safety-list">${badge("Verified", "success")}${badge("Catalog-only")}</div></article>`).join("")}</section>`
  },
  {
    id: "admin-accounts",
    title: "Admin Accounts",
    html: String.raw`
${shellHeader("RBAC", "Admin Accounts", "Staff roles, create account mock, role summary, and denied-state banner.")}
<section class="alert danger"><div><strong>Receptionist denied admin tools.</strong><p class="muted">Protected owner/admin workflow placeholder.</p></div>${badge("Access denied", "danger")}</section>
<section class="card-grid">${["Doctor", "Receptionist", "Nurse", "Accountant"].map((role) => `<article class="account-row"><h2>${role}</h2><p class="muted">Role card placeholder.</p>${badge("Permission scoped")}</article>`).join("")}</section>
<section class="content-grid">
  <article class="panel"><h2>Create account form mock</h2><form class="form-grid"><label>Name<input placeholder="Staff placeholder" /></label><label>Role<select><option>Doctor</option><option>Receptionist</option><option>Nurse</option><option>Accountant</option></select></label><label class="wide">Email<input placeholder="staff@example.invalid" /></label><button class="button wide" type="button">Create visual state</button></form></article>
  <article class="panel"><h2>Role permission summary</h2><div class="safety-list">${badge("Patients")}${badge("Calendar")}${badge("Billing")}${badge("Admin protected", "warning")}</div></article>
</section>`
  },
  {
    id: "medication-import",
    title: "Official Medication Import",
    html: String.raw`
${shellHeader("Official medication source control", "Official Medication Import", "Blocked import status with operator command cards and no fake rows.")}
<section class="summary-grid">
  <article class="metric-card"><span>official rows</span><strong>0</strong></article>
  <article class="metric-card"><span>verified rows</span><strong>0</strong></article>
  <article class="metric-card"><span>needs_review rows</span><strong>0</strong></article>
  <article class="metric-card"><span>Status</span><strong>Blocked</strong></article>
</section>
<section class="alert danger"><div><strong>Warning: no fake rows.</strong><p class="muted">Medication selection remains blocked until official rows exist.</p></div>${badge("Blocked", "danger")}</section>
<section class="content-grid">
  <article class="panel"><h2>Inbox path</h2><pre class="code-block">storage/official-medication-sources/</pre><p class="muted">Accepted file types: CSV, XLSX, JSON, PDF source documents.</p></article>
  <article class="panel"><h2>Operator command cards</h2><pre class="code-block">npm run medication:v101:import-status
npm run medication:import:official</pre></article>
</section>`
  },
  {
    id: "settings-themes",
    title: "Settings / Themes",
    html: String.raw`
${shellHeader("Appearance", "Settings / Themes", "Theme selector, preview cards, density toggle mock, and mobile mode preview.")}
<section class="panel">
  <h2>Theme selector</h2>
  <div class="chip-list">${themes.map(([value, label]) => `<button class="chip-button" type="button" data-theme="${value}">${label}</button>`).join("")}</div>
</section>
<section class="card-grid">${themes.map(([, label]) => `<article class="card"><h2>${label}</h2><p class="muted">Theme preview card.</p><div class="safety-list">${badge("Cards")}${badge("Forms")}${badge("Badges")}</div></article>`).join("")}</section>
<section class="content-grid">
  <article class="panel"><h2>Density toggle mock</h2><div class="actions"><button class="button secondary" type="button">Comfortable</button><button class="button secondary" type="button">Compact</button></div></article>
  <article class="panel"><h2>Mobile mode preview</h2><p class="muted">Use Mobile 390px in the toolbar to constrain the wrapper.</p><button class="button" type="button" data-viewport="mobile">Mobile 390px</button></article>
</section>`
  }
];

function labToolbar(title) {
  return String.raw`
<div class="lab-toolbar">
  <strong>${title}</strong>
  <div class="control-group" aria-label="Theme switcher">
    <span>Theme</span>
    ${themes.map(([value, label]) => `<button class="chip-button" data-theme="${value}" type="button">${label}</button>`).join("")}
  </div>
  <div class="control-group" aria-label="Viewport preview">
    <span>Preview</span>
    <button class="chip-button" data-viewport="mobile" type="button">Mobile 390px</button>
    <button class="chip-button" data-viewport="tablet" type="button">Tablet 768px</button>
    <button class="chip-button" data-viewport="desktop" type="button">Desktop full</button>
  </div>
</div>`;
}

function navMarkup() {
  const groups = [
    ["Access", navItems.slice(0, 2)],
    ["Clinic", navItems.slice(2, 11)],
    ["Knowledge", navItems.slice(11, 13)],
    ["Admin", navItems.slice(13)]
  ];
  return String.raw`
<aside class="sidebar" id="drawer">
  <div class="brand"><span class="brand-mark">P</span><strong>Prij Clinic OS</strong><span class="muted">Women&apos;s health</span></div>
  ${groups.map(([label, items]) => `<nav class="nav-group" aria-label="${label}"><span class="nav-title">${label}</span>${items.map(([id, title]) => `<button class="nav-item${id === defaultSectionId ? " active" : ""}" type="button" data-go="${id}">${title}<span aria-hidden="true">></span></button>`).join("")}</nav>`).join("")}
</aside>`;
}

function appShell() {
  return String.raw`
<button class="drawer-backdrop" id="drawerBackdrop" type="button" aria-label="Close navigation"></button>
<main class="app-shell">
  ${navMarkup()}
  <div class="app-main">
    <header class="mobile-topbar"><strong>Prij Clinic</strong><button class="button secondary" id="menuButton" type="button">Menu</button></header>
    <div class="lab-banner"><span>Static UI Lab — no real login required</span><span>This is a static design prototype. Real app login/RBAC still applies in the production app.</span></div>
    <header class="topbar">
      <div><p class="eyebrow">Static clickable app mockup</p><p class="muted">Full local HTML shell with no API calls, no external CDNs, and no real patient data.</p></div>
      <div class="quick-actions" aria-label="Quick actions">
        <button class="button secondary" type="button" data-go="dashboard">Dashboard</button>
        <button class="button secondary" type="button" data-go="workspace">Patient Workspace</button>
        <button class="button secondary" type="button" data-viewport="mobile">Mobile Preview</button>
        <button class="button secondary" type="button" data-go="settings-themes">Themes</button>
      </div>
    </header>
    ${sections.map((section) => `<section class="section${section.id === defaultSectionId ? " active" : ""}" id="${section.id}" aria-label="${section.title}">${section.html}</section>`).join("")}
  </div>
</main>`;
}

const js = String.raw`
const preview = document.querySelector(".preview-shell");
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("drawerBackdrop");
const menuButton = document.getElementById("menuButton");
const sections = [...document.querySelectorAll(".section")];
const navButtons = [...document.querySelectorAll("[data-go]")];

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem("prij-theme-lab-theme", theme);
}

function setViewport(viewport) {
  preview.classList.remove("mobile", "tablet");
  if (viewport !== "desktop") preview.classList.add(viewport);
}

function closeDrawer() {
  drawer?.classList.remove("open");
  backdrop?.classList.remove("open");
}

function showSection(id) {
  sections.forEach((section) => section.classList.toggle("active", section.id === id));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.go === id && button.classList.contains("nav-item")));
  closeDrawer();
  window.location.hash = id;
  document.querySelector(".app-main")?.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.theme));
});

document.querySelectorAll("[data-viewport]").forEach((button) => {
  button.addEventListener("click", () => setViewport(button.dataset.viewport));
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => showSection(button.dataset.go));
});

menuButton?.addEventListener("click", () => {
  drawer?.classList.add("open");
  backdrop?.classList.add("open");
});
backdrop?.addEventListener("click", closeDrawer);

const savedTheme = localStorage.getItem("prij-theme-lab-theme");
if (savedTheme) document.body.dataset.theme = savedTheme;
if (window.location.hash) {
  const id = window.location.hash.slice(1);
  if (document.getElementById(id)) showSection(id);
}
`;

function documentHtml({ title, defaultPreview = "", bodyClass = "" }) {
  return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${css}</style>
</head>
<body class="${bodyClass}" data-theme="prij-heritage">
  ${labToolbar(title)}
  <div class="preview-shell ${defaultPreview}">
    ${bodyClass === "phone-first" ? `<div class="phone-frame">${appShell()}</div>` : appShell()}
  </div>
  <script>${js}</script>
</body>
</html>
`;
}

writeFileSync(desktopPath, documentHtml({ title: "Prij UI Theme Lab" }), "utf8");
writeFileSync(mobilePath, documentHtml({ title: "Prij Mobile UI Lab", defaultPreview: "mobile", bodyClass: "phone-first" }), "utf8");

console.log("Generated standalone Prij Clinic HTML design labs:");
console.log(`- ${desktopPath}`);
console.log(`- ${mobilePath}`);

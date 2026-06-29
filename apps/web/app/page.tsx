const modules = [
  ["/dashboard", "Dashboard", "Operational summary and workflow shortcuts"],
  ["/patients", "Patients", "Demo-safe registration and registry"],
  ["/appointments", "Appointments", "Scheduling and calendar foundations"],
  ["/queue", "Queue", "Check-in and front desk flow"],
  ["/encounters", "Encounters", "Doctor-authored clinical drafts"],
  ["/reports", "Reports", "Report records and review status"],
  ["/pregnancies", "Pregnancy", "Pregnancy episode records"],
  ["/ultrasound", "OB ultrasound", "Measurements for doctor review"],
  ["/billing", "Billing", "Invoices and payment records without gateway data"],
  ["/consents", "Consents", "Consent foundation for demo privacy workflows"],
  ["/ai-drafts", "AI drafts", "Disabled draft review placeholders"]
];

export default function Home() {
  return (
    <main className="page hero-page">
      <section className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Premium V0.1 clinic demo</p>
          <h1>Prij Clinic</h1>
          <p className="muted">
            A controlled local/private pilot for the full clinic workflow: registration, scheduling, queue, encounter,
            prescriptions, investigations, OB ultrasound, reports, billing, audit checks, consent, and AI draft review.
          </p>
          <div className="actions">
            <a className="button" href="/login">
              Staff login
            </a>
            <a className="button ghost" href="/dashboard">
              Open dashboard
            </a>
          </div>
          <div className="workflow-band">
            {["No real patient data", "AI disabled", "Not production-ready", "Doctor approval required"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        <div className="hero-panel">
          <span className="badge warning">Demo/local only</span>
          <h2 style={{ color: "#ffffff" }}>Workflow modules</h2>
          <div className="module-grid">
            {modules.map(([href, label, description]) => (
              <a className="module-card" href={href} key={href}>
                <strong>{label}</strong>
                <span className="muted">{description}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

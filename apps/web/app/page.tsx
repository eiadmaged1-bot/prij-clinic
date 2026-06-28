export default function Home() {
  const modules = [
    ["/patients", "Patients"],
    ["/consents", "Consents"],
    ["/appointments", "Appointments"],
    ["/calendar", "Calendar"],
    ["/queue", "Queue"],
    ["/encounters", "Encounters"],
    ["/prescriptions", "Prescriptions"],
    ["/investigations", "Investigations"],
    ["/reports", "Reports"],
    ["/pregnancies", "Pregnancy"],
    ["/ultrasound", "OB ultrasound"],
    ["/billing", "Billing"],
    ["/ai-drafts", "AI drafts"]
  ];

  return (
    <main className="page">
      <section className="shell wide-shell">
        <p className="eyebrow">V0.1 staging demo foundation</p>
        <h1>Prij Clinic</h1>
        <p className="muted">
          Controlled local/private demo only. Do not enter real patient data, report files, payment details, or secrets.
          AI is disabled/mock-only and cannot diagnose, prescribe, sign, or update final records.
        </p>
        <div className="actions">
          <a className="button" href="/login">
            Login
          </a>
          <a className="button secondary" href="/dashboard">
            Dashboard
          </a>
        </div>
        <section className="safety-grid" aria-label="Safety boundaries">
          <span>No real patients</span>
          <span>No real PHI files</span>
          <span>No real payments</span>
          <span>No external AI</span>
        </section>
        <section className="workflow-band" aria-label="Demo workflow">
          {[
            ["/patients/new", "Register"],
            ["/consents", "Consent"],
            ["/appointments", "Appointment"],
            ["/queue", "Queue"],
            ["/encounters", "Encounter"],
            ["/prescriptions", "Rx"],
            ["/investigations", "Orders"],
            ["/reports", "Reports"],
            ["/billing", "Billing"],
            ["/ai-drafts", "AI draft"]
          ].map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </section>
        <nav className="module-grid" aria-label="Demo modules">
          {modules.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
      </section>
    </main>
  );
}

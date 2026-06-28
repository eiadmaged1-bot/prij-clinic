export default function Home() {
  const modules = [
    ["/patients", "Patients"],
    ["/appointments", "Appointments"],
    ["/queue", "Queue"],
    ["/encounters", "Encounters"],
    ["/reports", "Reports"],
    ["/pregnancies", "Pregnancy"],
    ["/ultrasound", "OB ultrasound"],
    ["/billing", "Billing"],
    ["/ai-drafts", "AI drafts"]
  ];

  return (
    <main className="page">
      <section className="shell">
        <p className="eyebrow">MVP demo foundation</p>
        <h1>Prij Clinic MVP</h1>
        <p className="muted">
          Local demo only. Do not enter real patient data, report files, payment details, or secrets.
        </p>
        <div className="actions">
          <a className="button" href="/login">
            Login
          </a>
          <a className="button secondary" href="/dashboard">
            Dashboard
          </a>
        </div>
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

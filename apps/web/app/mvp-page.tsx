type MvpPageProps = {
  title: string;
  eyebrow: string;
  items: string[];
};

const links = [
  ["/dashboard", "Dashboard"],
  ["/patients", "Patients"],
  ["/patients/new", "New Patient"],
  ["/appointments", "Appointments"],
  ["/calendar", "Calendar"],
  ["/queue", "Queue"],
  ["/encounters", "Encounters"],
  ["/prescriptions", "Prescriptions"],
  ["/investigations", "Investigations"],
  ["/reports", "Reports"],
  ["/pregnancies", "Pregnancy"],
  ["/ultrasound", "OB Ultrasounds"],
  ["/billing", "Billing"],
  ["/ai-drafts", "AI Drafts"]
];

export function MvpPage({ title, eyebrow, items }: MvpPageProps) {
  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <nav className="nav-links" aria-label="MVP navigation">
          {links.map(([href, label]) => (
            <a key={href} className="button secondary" href={href}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="notice">
        MVP demo foundation only. Use local demo data only; do not enter real patient, payment, report, or secret data.
      </section>

      <section className="panel">
        <ul className="feature-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="empty-state">
        Detailed production workflows, exports, uploads, and final clinical approvals are intentionally out of scope for this demo foundation.
      </section>
    </main>
  );
}

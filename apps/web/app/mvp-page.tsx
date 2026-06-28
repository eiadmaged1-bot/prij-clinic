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

      <section className="panel">
        <ul className="feature-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

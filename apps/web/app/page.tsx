import { OFFICIAL_CLINIC_NAME } from "@/lib/brand";

export default function Home() {
  return (
    <main className="page premium-root-page">
      <section className="premium-root-card">
        <p className="eyebrow">{OFFICIAL_CLINIC_NAME}</p>
        <h1>{OFFICIAL_CLINIC_NAME}</h1>
        <p className="muted">A calm workspace for women&apos;s health clinic teams.</p>
        <div className="actions">
          <a className="button" href="/login">Staff login</a>
        </div>
      </section>
    </main>
  );
}

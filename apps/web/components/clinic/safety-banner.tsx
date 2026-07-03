export function SafetyBanner() {
  return (
    <section className="alert">
      <div>
        <strong>Doctor review required.</strong>
        <p className="muted">Clinical AI output is assistive draft support only. Doctors remain responsible for review, approval, and signed records.</p>
      </div>
      <span className="badge danger">Draft only</span>
    </section>
  );
}

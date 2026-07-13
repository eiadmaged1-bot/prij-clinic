"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => {
    console.error("Clinic workspace error", error.digest ?? "no-digest");
  }, [error]);

  return (
    <main className="page centered" role="alert">
      <section className="panel compact-panel friendly-error-boundary">
        <p className="eyebrow">Clinic workspace</p>
        <h1>We could not open this workspace</h1>
        <p className="muted">Your clinical records were not changed. Try again or return to the dashboard.</p>
        <div className="form-actions">
          <button className="button" type="button" onClick={reset}>Try again</button>
          <a className="button secondary" href="/dashboard">Return to dashboard</a>
        </div>
      </section>
    </main>
  );
}

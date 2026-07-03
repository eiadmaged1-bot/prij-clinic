import type { ReactNode } from "react";

export function ClinicTabs({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section className="patient-tabs simple" aria-label={label}>
      {children}
    </section>
  );
}

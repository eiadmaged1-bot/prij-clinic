import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
  actions
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="page-header">
      <div className="header-row">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 data-testid="page-heading">{title}</h1>
        </div>
        {actions ? <div className="topbar-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`page-shell ${className}`.trim()}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-header desktop-page-header"><div className="header-row"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h1 data-testid="page-heading">{title}</h1>{description ? <p className="muted">{description}</p> : null}</div>{actions ? <div className="action-toolbar">{actions}</div> : null}</div></header>;
}

export function CompactKpiCard({ label, value, detail, tone = "default" }: { label: string; value: ReactNode; detail?: string; tone?: "default" | "accent" | "owner" }) {
  return <article className={`compact-kpi-card tone-${tone}`}><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</article>;
}

export function SectionCard({ title, meta, children, className = "" }: { title?: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`section-card ${className}`.trim()}>{title || meta ? <div className="section-heading"><h2>{title}</h2>{meta}</div> : null}{children}</section>;
}

export type TabOption = { id: string; label: string; disabled?: boolean };

export function Tabs({ options, value, onChange, label = "Workspace sections" }: { options: TabOption[]; value: string; onChange(id: string): void; label?: string }) {
  return <div className="desktop-tabs" role="tablist" aria-label={label}>{options.map((option) => <button aria-selected={value === option.id} className={value === option.id ? "active" : ""} disabled={option.disabled} key={option.id} onClick={() => onChange(option.id)} role="tab" type="button">{option.label}</button>)}</div>;
}

export function SegmentedControl({ options, value, onChange, label }: { options: TabOption[]; value: string; onChange(id: string): void; label: string }) {
  return <div className="segmented-control" role="group" aria-label={label}>{options.map((option) => <button aria-pressed={value === option.id} className={value === option.id ? "active" : ""} disabled={option.disabled} key={option.id} onClick={() => onChange(option.id)} type="button">{option.label}</button>)}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state structured-empty-state"><strong>{title}</strong>{description ? <span>{description}</span> : null}{action}</div>;
}

export function PatientIdentityBar({ name, mrn, age, phone, badges, actions }: { name: string; mrn: string; age?: string; phone?: string; badges?: ReactNode; actions?: ReactNode }) {
  return <section className="patient-identity-bar"><div><p className="eyebrow">Patient</p><h1>{name}</h1><p className="muted">{[age, `MRN ${mrn}`, phone].filter(Boolean).join(" · ")}</p><div className="identity-badges">{badges}</div></div>{actions ? <ActionToolbar>{actions}</ActionToolbar> : null}</section>;
}

export function ClinicalTagCard({ label, category, selected, status, onClick, actions }: { label: string; category: string; selected?: boolean; status?: string; onClick?(): void; actions?: ReactNode }) {
  const Tag = onClick ? "button" : "article";
  return <Tag className={`clinical-tag-card ${selected ? "selected" : ""}`} {...(onClick ? { type: "button", onClick } : {})}><span>{category}</span><strong>{label}</strong>{status ? <small>{status}</small> : null}{actions}</Tag>;
}

export function FilterDrawer({ summary = "More Filters", children }: { summary?: string; children: ReactNode }) {
  return <details className="filter-drawer"><summary>{summary}</summary><div className="filter-drawer-content">{children}</div></details>;
}

export function ActionToolbar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`action-toolbar ${className}`.trim()}>{children}</div>;
}

export function SplitPane({ primary, secondary, secondaryLabel = "Supporting panel" }: { primary: ReactNode; secondary: ReactNode; secondaryLabel?: string }) {
  return <div className="split-pane"><div className="split-pane-primary">{primary}</div><aside aria-label={secondaryLabel} className="split-pane-secondary">{secondary}</aside></div>;
}

export function Stepper({ steps, activeId, completedIds = [], onChange }: { steps: TabOption[]; activeId: string; completedIds?: string[]; onChange(id: string): void }) {
  return <ol className="clinical-stepper">{steps.map((step, index) => <li className={`${activeId === step.id ? "active" : ""} ${completedIds.includes(step.id) ? "completed" : ""}`.trim()} key={step.id}><button disabled={step.disabled} onClick={() => onChange(step.id)} type="button"><span>{index + 1}</span>{step.label}</button></li>)}</ol>;
}

export type DataTableColumn<Row> = { id: string; header: string; cell(row: Row): ReactNode };

export function DataTable<Row>({ rows, columns, rowKey, empty }: { rows: Row[]; columns: DataTableColumn<Row>[]; rowKey(row: Row): string; empty?: ReactNode }) {
  if (!rows.length) return <>{empty ?? <EmptyState title="No records in this view" />}</>;
  return <div className="data-table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.id} scope="col">{column.header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.id}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div>;
}

export function ToolbarButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`button compact ${props.className ?? ""}`.trim()} type={props.type ?? "button"} />;
}

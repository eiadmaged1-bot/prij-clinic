"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "../../mvp-page";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { CaseLibraryCase, listCaseLibrary } from "@/lib/case-library";
import { patientTypeLabel } from "@/lib/patient-labels";

export default function DoctorCaseLibraryPage() {
  const [cases, setCases] = useState<CaseLibraryCase[]>([]);
  const [scope, setScope] = useState("mine");
  const [status, setStatus] = useState("Loading");
  const [filters, setFilters] = useState({ search: "", dateRange: "month", visitType: "", doctorId: "", patientType: "", status: "" });
  const [canViewAll, setCanViewAll] = useState(false);

  useEffect(() => {
    void loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function loadCases() {
    setStatus("Loading");
    try {
      const result = await listCaseLibrary({ scope, ...filters });
      setCases(
        result.cases
          .filter((item) => !isDemoLikeCase(item))
          .filter((item) => !filters.patientType || item.patientType === filters.patientType)
          .filter((item) => !filters.status || item.status === filters.status)
          .sort((left, right) => String(right.visitDateTime).localeCompare(String(left.visitDateTime)))
      );
      setCanViewAll(result.canViewAll);
      setStatus("Ready");
    } catch {
      setCases([]);
      setStatus("Access restricted or service unavailable");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCases();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Doctor Case Library</p>
            <h1>Clinical cases reviewed by doctors</h1>
            <p className="muted">Browse own visits and trusted colleague cases. Clinical decisions remain in the visit note.</p>
          </div>
          <ThreeDMedicalIcon name="timeline" size="md" tone="navy" />
        </div>
      </section>

      <section className="panel compact-panel">
        <form className="case-library-filter-grid" onSubmit={submit}>
          <div className="segmented-control" aria-label="Case scope">
            <button type="button" className={scope === "mine" ? "active" : ""} onClick={() => setScope("mine")}>My cases</button>
            <button type="button" className={scope === "all" ? "active" : ""} onClick={() => setScope("all")} disabled={!canViewAll}>All clinic cases</button>
          </div>
          <label>Search<input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Patient name, phone, MRN" /></label>
          <label>Date<select value={filters.dateRange} onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value }))}><option value="today">Today</option><option value="week">Week</option><option value="month">Month</option><option value="">All cases</option></select></label>
          <label>Patient type<select value={filters.patientType} onChange={(event) => setFilters((current) => ({ ...current, patientType: event.target.value }))}><option value="">All patient types</option><option value="OB">Obstetric / Pregnancy</option><option value="GYN">Gynecology</option><option value="INFERTILITY">Infertility</option><option value="WOMEN_HEALTH">Women&apos;s Health / General</option><option value="OTHER">Other / Unclassified</option></select></label>
          <label>Visit type<select value={filters.visitType} onChange={(event) => setFilters((current) => ({ ...current, visitType: event.target.value }))}><option value="">All visit types</option><option value="kashf">Kashf</option><option value="recheck">Recheck</option><option value="consultation">Consultation</option><option value="urgent">Urgent</option></select></label>
          <label>Status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="draft">Draft</option><option value="signed">Signed</option><option value="closed">Closed</option></select></label>
          <button className="button compact" type="submit">Apply filters</button>
        </form>
        <p className="muted">Status: {status}</p>
      </section>

      <section className="case-library-grid">
        {cases.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" /><span>No cases match the current filters.</span></p> : null}
        {groupCases(cases).map(([group, rows]) => (
          <section className="case-library-group" key={group}>
            <h2>{group}</h2>
            {rows.map((clinicCase) => (
              <article className="data-row case-library-card" key={clinicCase.id} style={{ borderLeftColor: clinicCase.doctorSignature.doctorColor }}>
                <div className="data-row-header">
                  <strong>{clinicCase.patientName}</strong>
                  <span className="doctor-signature-badge"><span style={{ background: clinicCase.doctorSignature.doctorColor }} />Doctor: {clinicCase.doctorSignature.doctorName}</span>
                </div>
                <p className="muted">{patientTypeLabel(clinicCase.patientType)} - {clinicCase.visitType} - {new Date(clinicCase.visitDateTime).toLocaleString()} - {clinicCase.summaryPreview}</p>
                <div className="tag-row">{clinicCase.tags.filter((tag) => !/^https?:\/\//i.test(tag)).map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div>
                <div className="form-actions">
                  <Link className="button compact" href={clinicCase.links.patient}>Open patient</Link>
                  <Link className="button secondary compact" href={clinicCase.links.visit}>Open visit</Link>
                </div>
              </article>
            ))}
          </section>
        ))}
      </section>
    </AppShell>
  );
}

function groupCases(cases: CaseLibraryCase[]) {
  const order = ["OB", "GYN", "INFERTILITY", "WOMEN_HEALTH", "OTHER", "UNCLASSIFIED"];
  const labels: Record<string, string> = {
    OB: "Obstetric / Pregnancy",
    GYN: "Gynecology",
    INFERTILITY: "Infertility",
    WOMEN_HEALTH: "Women's Health / General",
    OTHER: "Other / Unclassified",
    UNCLASSIFIED: "Unclassified - needs patient type review"
  };
  return order.map((key) => [labels[key], cases.filter((item) => (item.patientType || "UNCLASSIFIED") === key)] as const).filter(([, rows]) => rows.length > 0);
}

function isDemoLikeCase(clinicCase: CaseLibraryCase) {
  return /\b(demo|test|qa|runtime|fixture|ux-|ngrok|regretful-unwomanly-silliness)\b/i.test(`${clinicCase.patientName} ${clinicCase.medicalRecordNumber} ${clinicCase.summaryPreview} ${clinicCase.tags.join(" ")}`);
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "../../mvp-page";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { CaseLibraryCase, CaseLibraryRequestError, getCaseLibraryFilters, listCaseLibrary, type CaseLibraryResponse } from "@/lib/case-library";
import { patientTypeLabel } from "@/lib/patient-labels";

export default function DoctorCaseLibraryPage() {
  const [cases, setCases] = useState<CaseLibraryCase[]>([]);
  const [scope, setScope] = useState("mine");
  const [status, setStatus] = useState("Loading");
  const [filters, setFilters] = useState({ search: "", dateRange: "", visitType: "", doctorId: "", branchId: "", patientType: "", status: "" });
  const [canViewAll, setCanViewAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [summary, setSummary] = useState<CaseLibraryResponse["summary"]>({ caseCount: 0, patientCount: 0, draftCount: 0, completedCount: 0, needsSignatureCount: 0 });
  const [scopeLabel, setScopeLabel] = useState("");
  const [doctors, setDoctors] = useState<Array<{ id: string; displayName: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    void loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, page]);

  useEffect(() => {
    void getCaseLibraryFilters().then((result) => { setDoctors(result.doctors); setBranches(result.branches); }).catch(() => undefined);
  }, []);

  async function loadCases() {
    setStatus("Loading");
    try {
      const result = await listCaseLibrary({ scope, page: String(page), limit: "20", ...filters });
      setCases(result.cases);
      setCanViewAll(result.canViewAll);
      setPageInfo(result.pageInfo);
      setSummary(result.summary);
      setScopeLabel(result.scopeLabel);
      setStatus("Loaded");
    } catch (error) {
      setCases([]);
      if (error instanceof CaseLibraryRequestError) setStatus(`${error.status === 403 ? "Access denied" : error.status >= 500 ? "Database or API unavailable" : "Case request failed"}: ${error.message}${error.requestId ? ` (Request ${error.requestId})` : ""}`);
      else setStatus("Network unavailable: the Case Library request did not complete.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (page !== 1) setPage(1); else void loadCases();
  }

  function changeScope(nextScope: string) {
    setScope(nextScope);
    setPage(1);
    setFilters((current) => ({ ...current, doctorId: nextScope === "mine" ? "" : current.doctorId }));
  }

  function resetFilters() {
    setFilters({ search: "", dateRange: "", visitType: "", doctorId: "", branchId: "", patientType: "", status: "" });
    setPage(1);
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
            <button type="button" className={scope === "mine" ? "active" : ""} onClick={() => changeScope("mine")}>My cases</button>
            <button type="button" className={scope === "all" ? "active" : ""} onClick={() => changeScope("all")} disabled={!canViewAll}>All clinic cases</button>
          </div>
          <label>Search<input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Patient name, phone, MRN" /></label>
          <label>Date<select value={filters.dateRange} onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value }))}><option value="today">Today</option><option value="week">Week</option><option value="month">Month</option><option value="">All cases</option></select></label>
          <label>Patient type<select value={filters.patientType} onChange={(event) => setFilters((current) => ({ ...current, patientType: event.target.value }))}><option value="">All patient types</option><option value="OB">Obstetric / Pregnancy</option><option value="GYN">Gynecology</option><option value="INFERTILITY">Infertility</option><option value="WOMEN_HEALTH">Women&apos;s Health / General</option><option value="OTHER">Other / Unclassified</option></select></label>
          <label>Branch<select value={filters.branchId} onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))}><option value="">All permitted branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
          {scope === "all" ? <label>Doctor<select value={filters.doctorId} onChange={(event) => setFilters((current) => ({ ...current, doctorId: event.target.value }))}><option value="">All doctors</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.displayName}</option>)}</select></label> : null}
          <label>Visit type<select value={filters.visitType} onChange={(event) => setFilters((current) => ({ ...current, visitType: event.target.value }))}><option value="">All visit types</option><option value="kashf">Kashf</option><option value="recheck">Recheck</option><option value="consultation">Consultation</option><option value="urgent">Urgent</option></select></label>
          <label>Status<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All historical statuses</option><option value="draft">Draft / open</option><option value="signed">Completed / signed</option><option value="voided">Voided historical</option></select></label>
          <button className="button compact" type="submit">Apply filters</button>
          <button className="button secondary compact" type="button" onClick={resetFilters}>Reset filters</button>
        </form>
        <p className="muted">{status === "Loaded" ? scopeLabel : status}</p>
        {status === "Loaded" ? <><div className="metric-strip" aria-label="Case Library counts"><span><strong>{summary.caseCount}</strong> cases</span><span><strong>{summary.patientCount}</strong> patients</span><span><strong>{summary.draftCount}</strong> drafts</span><span><strong>{summary.completedCount}</strong> completed</span><span><strong>{summary.needsSignatureCount}</strong> need signature</span></div><p className="muted">Showing {pageInfo.total ? (pageInfo.page - 1) * pageInfo.limit + 1 : 0}–{Math.min(pageInfo.page * pageInfo.limit, pageInfo.total)} of {pageInfo.total}</p></> : null}
      </section>

      <section className="case-library-grid">
        {cases.length === 0 && status === "Loaded" ? <p className="empty-state"><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" /><span>{Object.values(filters).some(Boolean) ? "Filters returned zero permitted cases." : "No cases exist in this scope."}</span></p> : null}
        {cases.length === 0 && !["Loaded", "Loading"].includes(status) ? <p className="form-error" role="alert">{status}</p> : null}
        {groupCases(cases).map(([group, rows]) => (
          <section className="case-library-group" key={group}>
            <h2>{group}</h2>
            {rows.map((clinicCase) => (
              <article className="data-row case-library-card" key={clinicCase.id} style={{ borderLeftColor: clinicCase.doctorSignature.doctorColor }}>
                <div className="data-row-header">
                  <strong>{clinicCase.patientName}</strong>
                  <span className="doctor-signature-badge"><span style={{ background: clinicCase.doctorSignature.doctorColor }} />Visit doctor: {clinicCase.doctorSignature.doctorName}</span>
                </div>
                <p className="muted">{patientTypeLabel(clinicCase.patientType)} - {clinicCase.visitType} - {new Date(clinicCase.visitDateTime).toLocaleString()} - {clinicCase.summaryPreview}</p>
                <div className="tag-row">{clinicCase.tags.filter((tag) => !/^https?:\/\//i.test(tag)).map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div>
                <div className="form-actions">
                  <Link className="button compact" href={clinicCase.links.patient}>Open patient profile</Link>
                  <Link className="button secondary compact" href={clinicCase.links.visit}>Open visit</Link>
                </div>
              </article>
            ))}
          </section>
        ))}
      </section>
      {status === "Loaded" && pageInfo.total > pageInfo.limit ? <nav className="form-actions" aria-label="Case Library pagination"><button className="button secondary compact" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span>Page {pageInfo.page} of {Math.max(1, Math.ceil(pageInfo.total / pageInfo.limit))}</span><button className="button secondary compact" type="button" disabled={!pageInfo.hasMore} onClick={() => setPage((value) => value + 1)}>Next</button></nav> : null}
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

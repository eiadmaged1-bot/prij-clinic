import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { createSecureIdempotencyKey } from "@/lib/idempotency-key";
import { Patient, GynecologyVisit, PregnancyRecord, InfertilityWorkspace, ClinicalPhase, ReferenceResult, RelatedPanel, Metric, formPayload, requestPatientWorkspaceRefresh, gynecologyTemplateFields, gynecologyTemplateOptions, templateLabel, templateSummary, formatDate, DoctorTemplateCards, ReferencePicker, values, numericPayload } from "./patient-components";
import { gpalSummary, gpalLooksInconsistent, CreatePregnancyEpisodeCard, PreviousPregnancyHistoryCard, FetusStarterCard, AntenatalVisitCard, UltrasoundReportBuilder } from "./pregnancy-components";

export function MedicalPanel({ patient, related }: { patient: Patient; related: Record<string, Record<string, unknown>[]> }) {
    const medicationCount = related.medications?.length ?? 0;
    const allergyCount = related.allergies?.length ?? 0;
    const pregnancyCount = related.pregnancy?.length ?? 0;
    const reportCount = related.files?.length ?? 0;
    return (
    <section className="doctor-friendly-grid">
      <article className="panel">
        <div className="section-heading">
          <div>
            <h2>Medical summary</h2>
            <p className="muted">A clean overview for the doctor before opening detailed tabs.</p>
          </div>
          <ThreeDMedicalIcon name="doctor" size="sm" />
        </div>
        <dl className="profile-grid">
          <div><dt>Patient type</dt><dd>{patient.patientType ?? "General"}</dd></div>
          <div><dt>Pregnancy records</dt><dd>{pregnancyCount}</dd></div>
          <div><dt>Medication entries</dt><dd>{medicationCount}</dd></div>
          <div><dt>Allergy entries</dt><dd>{allergyCount}</dd></div>
          <div><dt>Reports</dt><dd>{reportCount}</dd></div>
          <div className="wide"><dt>Doctor note</dt><dd>{patient.notes || "No medical note saved yet."}</dd></div>
        </dl>
      </article>
      <article className="panel next-step-card">
        <ThreeDMedicalIcon name="prescription" size="lg" />
        <h2>Medication context</h2>
        <p className="muted">Medication and allergy information is reviewed from its own tab. Market strength and form stay reference metadata only.</p>
        <button className="button secondary" type="button" onClick={() => document.querySelector<HTMLButtonElement>('[data-tab-key="medications"]')?.click()}>
          Open medications
        </button>
      </article>
    </section>
    );
}

export function ClinicalPanel({ patient, visits }: { patient: Patient; visits: GynecologyVisit[] }) {
    const cards: Array<[string, string, string, IconName]> = [
                    [`/patients/${patient.id}`, "Start Visit", "Open the guided visit workflow from the Doctor Visit tab.", "encounter"],
                    ["/protocol-atlas", "Protocol Atlas", "Search verified local protocol summaries when clinically appropriate.", "ai"],
                    ["/calculators", "Calculators", "Use deterministic calculator tools with doctor review.", "investigations"],
                    ["/guidelines", "Guideline Center", "Search local evidence-library content with citations.", "reports"]
                  ];
    return (
    <>
      <section className="module-grid">
        {cards.map(([href, title, text, icon]) => (
          <Link className="module-card" href={href} key={title}>
            <ThreeDMedicalIcon name={icon} size="md" />
            <strong>{title}</strong>
            <p className="muted">{text}</p>
          </Link>
        ))}
        <article className="module-card">
          <ThreeDMedicalIcon name="doctor" size="md" tone="slate" />
          <strong>Doctor-led workflow</strong>
          <p className="muted">Clinical tools assist review only. They do not diagnose, prescribe, sign, or update final records.</p>
        </article>
      </section>
      <GynecologyWorkspace patient={patient} visits={visits} />
    </>
    );
}

export function InvestigationsPanel({ related }: { related: Record<string, Record<string, unknown>[]> }) {
    return (
    <section className="dashboard-grid">
      <RelatedPanel config={{ key: "investigations", label: "Investigation Orders", icon: "investigations", empty: "No investigation order yet." }} rows={related.investigations ?? []} />
      <RelatedPanel config={{ key: "results", label: "Investigation Results", icon: "reports", empty: "No result metadata yet. Doctor review required." }} rows={related.results ?? []} />
    </section>
    );
}

export function DocumentsPanel({ related }: { related: Record<string, Record<string, unknown>[]> }) {
    return (
    <section className="dashboard-grid">
      <RelatedPanel config={{ key: "documents", label: "Documents", icon: "files", empty: "No document metadata yet." }} rows={related.documents ?? []} />
      <RelatedPanel config={{ key: "files", label: "Reports", icon: "reports", empty: "No report record yet. Add report metadata only after doctor review." }} rows={related.files ?? []} />
      <RelatedPanel config={{ key: "consents", label: "Consents", icon: "consent", empty: "No consent record yet." }} rows={related.consents ?? []} />
    </section>
    );
}

export function ProtocolAtlasPanel() {
    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Protocol Atlas</h2>
          <p className="muted">Open verified local protocol summaries for doctor review.</p>
        </div>
        <ThreeDMedicalIcon name="ai" size="sm" />
      </div>
      <div className="module-grid compact-grid">
        <Link className="module-card" href="/protocol-atlas">
          <ThreeDMedicalIcon name="ai" size="md" />
          <strong>Browse protocols</strong>
          <p className="muted">Search by condition, group, or verified status.</p>
        </Link>
        <Link className="module-card" href="/guidelines">
          <ThreeDMedicalIcon name="reports" size="md" />
          <strong>Open evidence library</strong>
          <p className="muted">Review local cited source content where available.</p>
        </Link>
      </div>
    </section>
    );
}

export function CalculatorsPanel({ patient }: { patient: Patient }) {
    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Calculators</h2>
          <p className="muted">Use deterministic tools only. Results require doctor review.</p>
        </div>
        <ThreeDMedicalIcon name="investigations" size="sm" />
      </div>
      <div className="module-grid compact-grid">
        <Link className="module-card" href="/calculators">
          <ThreeDMedicalIcon name="investigations" size="md" />
          <strong>Calculator hub</strong>
          <p className="muted">Open verified calculator tools and history.</p>
        </Link>
        <div className="module-card">
          <ThreeDMedicalIcon name="pregnancy" size="md" />
          <strong>OB dating</strong>
          <p className="muted">{patient.patientType === "OB" ? "Use the Pregnancy tab to review dating candidates." : "Available when an OB pregnancy record is present."}</p>
        </div>
      </div>
    </section>
    );
}

export function UltrasoundWorkspace({ patient, pregnancies, reports, orders }: { patient: Patient; pregnancies: PregnancyRecord[]; reports: Record<string, unknown>[]; orders: Record<string, unknown>[] }) {
    const activePregnancy = pregnancies.find((item) => item.status === "active") ?? pregnancies[0];
    return (
    <section className="obgyn-workspace">
      <article className="obgyn-dashboard printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ultrasound</p>
            <h2>Ultrasound workspace</h2>
            <p className="muted">Recording-only ultrasound workflow for {patient.firstName} {patient.lastName}. The doctor completes interpretation.</p>
          </div>
          <ThreeDMedicalIcon name="ultrasound" size="lg" tone="teal" />
        </div>
        <dl className="obgyn-metric-grid">
          <Metric label="Pregnancy context" value={activePregnancy ? "Linked pregnancy available" : "No pregnancy linked yet"} />
          <Metric label="Reports" value={`${reports.length} report record(s)`} />
          <Metric label="Orders" value={`${orders.length} investigation order(s)`} />
        </dl>
      </article>
      <section className="obgyn-section-grid">
        <UltrasoundReportBuilder patient={patient} pregnancy={activePregnancy} fetuses={[]} />
      </section>
    </section>
    );
}

export function GynecologyWorkspace({ patient, visits }: { patient: Patient; visits: GynecologyVisit[] }) {
    const [templateType, setTemplateType] = useState("general");
    const [status, setStatus] = useState("");

    async function saveGynecologyVisit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const token = sessionStorage.getItem("prijClinicToken");
        const payload = {
                              templateType,
                              visitDate: new Date().toISOString(),
                              ...formPayload(event.currentTarget)
                            };
        const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/gynecology-visits`, {
                              method: "POST",
                              credentials: "include",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {})
                              },
                              body: JSON.stringify(payload)
                            }).catch(() => null);
        if (!response || !response.ok) {
          setStatus("Could not save the gynecology visit. Check your clinical role and try again.");
          return;
        }

        setStatus("Gynecology visit saved as recording-only and added to the timeline.");
        requestPatientWorkspaceRefresh();
    }

    const latest = visits[0];
    const templateFields = gynecologyTemplateFields[templateType] ?? gynecologyTemplateFields.general!;
    return (
    <section className="obgyn-workspace gynecology-workspace">
      <div className="obgyn-print-toolbar no-print">
        <button className="button compact" type="button" onClick={() => setTemplateType("general")}>
          <ThreeDMedicalIcon name="doctor" size="sm" />
          Start Gynecology Visit
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
          Print gynecology summary
        </button>
      </div>

      <article className="obgyn-dashboard printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gynecology</p>
            <h2>{latest ? "Latest gynecology record" : "Start the first gynecology visit"}</h2>
            <p className="muted">Recording-only gynecology workspace for {patient.firstName} {patient.lastName}. The doctor writes the impression and plan.</p>
          </div>
          <ThreeDMedicalIcon name="doctor" size="lg" tone="teal" />
        </div>
        {!latest ? (
          <p className="empty-state">
            <ThreeDMedicalIcon name="doctor" size="sm" tone="slate" />
            <span>Use Start Gynecology Visit, choose a starter template, record the history and findings, then the doctor completes the impression and plan.</span>
          </p>
        ) : null}
        <div className="obgyn-metric-grid">
          <Metric label="Visit type" value={templateLabel(latest?.templateType)} />
          <Metric label="Reason" value={latest?.reasonForVisit ?? "Not recorded"} />
          <Metric label="Doctor impression" value={latest?.doctorImpression ?? "Not recorded"} />
          <Metric label="Follow-up" value={formatDate(latest?.followUpDate)} />
        </div>
        <p className="notice safety-note">These templates record clinician-entered information only. They do not diagnose, recommend treatment, choose contraception, or prescribe.</p>
      </article>

      <section className="obgyn-section-grid">
        <article className="panel printable-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Visit Template</p>
              <h2>Recording form</h2>
              <p className="muted">Choose the visit type, then fill only what the doctor wants to record.</p>
            </div>
            <ThreeDMedicalIcon name="files" size="sm" tone="navy" />
          </div>
          <form className="obgyn-form-grid grouped" onSubmit={saveGynecologyVisit}>
            <fieldset className="obgyn-fieldset wide">
              <legend>Visit type</legend>
              <label>
                Template
                <select value={templateType} onChange={(event) => setTemplateType(event.target.value)}>
                  {gynecologyTemplateOptions.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            {templateFields.map(([name, label, type]) => (
              <fieldset className={type === "textarea" ? "obgyn-fieldset wide" : "obgyn-fieldset"} key={`${templateType}-${name}`}>
                <legend>{label}</legend>
                <label>
                  {label}
                  {type === "textarea" ? <textarea name={name} placeholder="Doctor-entered note" /> : <input name={name} type={type} />}
                </label>
              </fieldset>
            ))}
            {status ? <p className="notice wide">{status}</p> : null}
            <div className="form-actions no-print">
              <button className="button secondary" type="button" onClick={() => window.print()}>
                <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
                Print summary
              </button>
              <button className="button" type="submit">
                <ThreeDMedicalIcon name="doctor" size="sm" />
                Save gynecology visit
              </button>
            </div>
          </form>
        </article>

        <article className="panel printable-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Starter Templates</p>
              <h2>Problem-focused recording aids</h2>
            </div>
            <span className="badge">{gynecologyTemplateOptions.length} templates</span>
          </div>
          <div className="obgyn-template-grid">
            {gynecologyTemplateOptions.slice(1).map(([value, label]) => (
              <button className={`obgyn-template-card ${templateType === value ? "active" : ""}`} key={value} onClick={() => setTemplateType(value)} type="button">
                <ThreeDMedicalIcon name={value === "contraception" ? "consent" : value === "pelvic_pain" ? "encounter" : "doctor"} size="sm" />
                <strong>{label}</strong>
                <p className="muted">{templateSummary(value)}</p>
              </button>
            ))}
          </div>
        </article>
      </section>

      <article className="panel printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gynecology Timeline</p>
            <h2>Recorded visits</h2>
          </div>
          <span className="badge">{visits.length} visit(s)</span>
        </div>
        {visits.length === 0 ? (
          <p className="empty-state">
            <ThreeDMedicalIcon name="timeline" size="sm" tone="slate" />
            <span>No gynecology event is recorded yet. Saved templates will appear here and in the patient timeline.</span>
          </p>
        ) : null}
        <div className="data-list">
          {visits.slice(0, 6).map((visit, index) => (
            <article className="data-row printable-summary" key={String(visit.id ?? index)}>
              <div className="data-row-header">
                <strong>{templateLabel(visit.templateType)}</strong>
                <span className="badge">{formatDate(visit.visitDate)}</span>
              </div>
              <p className="muted">{visit.reasonForVisit || visit.doctorImpression || "Recording-only gynecology visit."}</p>
              <p className="muted">Plan: {visit.doctorPlan || "Doctor plan not recorded yet."}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
    );
}

export function ObgynWorkspace({
          patient,
          pregnancies,
          reports,
          orders
        }: {
          patient: Patient;
          pregnancies: PregnancyRecord[];
          reports: Record<string, unknown>[];
          orders: Record<string, unknown>[];
        }) {
    const activePregnancy = pregnancies.find((item) => item.status === "active") ?? pregnancies[0];
    const fetuses = activePregnancy?.fetuses ?? [];
    return (
    <section className="obgyn-workspace">
      <div className="obgyn-print-toolbar no-print">
        <Link className="button compact" href={`/doctor/visit?patientId=${patient.id}`}>
          <ThreeDMedicalIcon name="encounter" size="sm" />
          Start antenatal workflow
        </Link>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
          Print patient summary
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />
          Print antenatal summary
        </button>
        <button className="button secondary compact" type="button" onClick={() => window.print()}>
          <ThreeDMedicalIcon name="ultrasound" size="sm" tone="slate" />
          Print ultrasound report
        </button>
      </div>

      <article className="obgyn-dashboard printable-summary">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pregnancy Overview</p>
            <h2>{activePregnancy ? "Active pregnancy record" : "No active pregnancy recorded"}</h2>
            <p className="muted">Recording-only pregnancy summary for {patient.firstName} {patient.lastName}. The doctor completes interpretation.</p>
          </div>
          <ThreeDMedicalIcon name="pregnancy" size="lg" tone="rose" />
        </div>
        {!activePregnancy ? (
          <p className="empty-state">
            <ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />
            <span>Create a pregnancy episode below, then continue with antenatal visits and ultrasound recording.</span>
          </p>
        ) : null}
        <div className="obgyn-metric-grid">
          <Metric label="LMP" value={formatDate(activePregnancy?.lmpDate ?? activePregnancy?.lmp)} />
          <Metric label="EDD" value={formatDate(activePregnancy?.estimatedDueDate ?? activePregnancy?.edd)} />
          <Metric label="Dating method" value={String(activePregnancy?.datingMethod ?? "Not recorded")} />
          <Metric label="G/P/A/L" value={gpalSummary(activePregnancy)} />
          <Metric label="Current status" value={String(activePregnancy?.status ?? "Not recorded")} />
          <Metric label="Fetus records" value={fetuses.length ? `${fetuses.length}` : "Not recorded"} />
          <Metric label="Antenatal visits" value={activePregnancy?.antenatalVisits?.length ? `${activePregnancy.antenatalVisits.length}` : "No visit yet"} />
          <Metric label="Ultrasound summary" value={activePregnancy?.obUltrasounds?.length ? `${activePregnancy.obUltrasounds.length} scan record(s)` : "No ultrasound report yet"} />
        </div>
        <div className="notice">
          <strong>Important notes</strong>
          <p className="muted">{activePregnancy?.notes || "Use this area for clinician-authored pregnancy notes only. The workspace records observations and does not complete clinical interpretation for the doctor."}</p>
        </div>
      </article>

      <section className="obgyn-section-grid">
        <article className="panel printable-summary">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Obstetric History</p>
              <h2>History snapshot</h2>
            </div>
            <ThreeDMedicalIcon name="timeline" size="sm" tone="navy" />
          </div>
          <dl className="profile-grid">
            <div><dt>Gravida</dt><dd>{activePregnancy?.gravida ?? "Not recorded"}</dd></div>
            <div><dt>Para</dt><dd>{activePregnancy?.para ?? "Not recorded"}</dd></div>
            <div><dt>Living</dt><dd>{activePregnancy?.living ?? "Not recorded"}</dd></div>
            <div><dt>Abortions</dt><dd>{activePregnancy?.abortions ?? "Not recorded"}</dd></div>
            <div><dt>G/P/A/L summary</dt><dd>{gpalSummary(activePregnancy)}</dd></div>
          </dl>
          {gpalLooksInconsistent(activePregnancy) ? <p className="notice safety-note">Review G/P/A/L consistency.</p> : null}
          <div className="obgyn-mini-flow">
            <span><ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" /> Episode</span>
            <span><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" /> Previous pregnancy</span>
            <span><ThreeDMedicalIcon name="ultrasound" size="sm" tone="slate" /> Fetus record</span>
          </div>
          <p className="empty-state">
            <ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />
            <span>Record previous pregnancy details as clinician-entered history only. Do not enter real patient data in this local review environment.</span>
          </p>
        </article>

        <CreatePregnancyEpisodeCard patient={patient} />
        <PreviousPregnancyHistoryCard patient={patient} pregnancy={activePregnancy} previousPregnancies={(activePregnancy?.previousPregnancies ?? []) as Record<string, unknown>[]} />
      </section>

      <section className="obgyn-section-grid">
        <FetusStarterCard pregnancy={activePregnancy} fetuses={fetuses} />
        <AntenatalVisitCard patient={patient} pregnancy={activePregnancy} />
      </section>

      <section className="obgyn-section-grid">
        <UltrasoundReportBuilder patient={patient} pregnancy={activePregnancy} fetuses={fetuses} />
        <DoctorTemplateCards />
      </section>

      <section className="obgyn-section-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Investigations</p>
              <h2>Orders linked to this patient</h2>
            </div>
            <span className="badge">{orders.length} order(s)</span>
          </div>
          {orders.length === 0 ? (
            <p className="empty-state">
              <ThreeDMedicalIcon name="investigations" size="sm" tone="slate" />
              <span>No investigation order is linked yet. Use Order Tests from patient actions when clinically needed.</span>
            </p>
          ) : (
            <div className="data-list">
              {orders.slice(0, 3).map((order, index) => (
                <article className="data-row" key={String(order.id ?? index)}>
                  <div className="data-row-header">
                    <strong>{String(order.testName ?? order.title ?? "Investigation order")}</strong>
                    <span className="badge">{String(order.status ?? "Requested")}</span>
                  </div>
                  <p className="muted">{String(order.instructions ?? "Clinician review required.")}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Reports</p>
              <h2>Clinical report drafts</h2>
            </div>
            <span className="badge">{reports.length} report(s)</span>
          </div>
          {reports.length === 0 ? (
            <p className="empty-state">
              <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
              <span>No report is linked yet. Report drafts stay clinician-authored and can be printed from the browser.</span>
            </p>
          ) : (
            <div className="data-list">
              {reports.slice(0, 3).map((report, index) => (
                <article className="data-row printable-summary" key={String(report.id ?? index)}>
                  <div className="data-row-header">
                    <strong>{String(report.title ?? "Report draft")}</strong>
                    <span className="badge">{String(report.reviewStatus ?? report.status ?? "Draft")}</span>
                  </div>
                  <p className="muted">{String(report.resultSummary ?? "Doctor review required.")}</p>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Follow-up</p>
            <h2>Next clinical step</h2>
          </div>
          <ThreeDMedicalIcon name="calendar" size="sm" tone="teal" />
        </div>
        <p className="empty-state">
          <ThreeDMedicalIcon name="calendar" size="sm" tone="slate" />
          <span>Set the next follow-up from the appointment action when the doctor completes the visit. This page does not create automatic care plans.</span>
        </p>
      </article>
    </section>
    );
}

export function HistorySheetWorkspace({
          related,
          onSubmit,
          status
        }: {
          related: Record<string, Record<string, unknown>[]>;
          onSubmit: (endpoint: string, payload: Record<string, unknown>, idempotencyKey?: string) => Promise<void>;
          status: string;
        }) {
    const sheets = related["history-sheet"] ?? [];
    const latestSheet = sheets[0];
    const sheetId = latestSheet?.id ? String(latestSheet.id) : "";
    const [operation, setOperation] = useState<ReferenceResult | null>(null);
    const [medication, setMedication] = useState<ReferenceResult | null>(null);
    const [investigation, setInvestigation] = useState<ReferenceResult | null>(null);
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
    const [saveError, setSaveError] = useState("");
    const retryKeys = useRef<Record<string, string>>({});

    function handleSheetSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = {
                              title: "OB/GYN history sheet",
                              status: "draft",
                              chiefComplaint: String(new FormData(form).get("chiefComplaint") ?? "").trim(),
                              historyOfPresentIllness: String(new FormData(form).get("historyOfPresentIllness") ?? "").trim(),
                              menstrualHistory: values(form, ["lmp", "cycleRegularity", "cycleInterval", "duration", "bleedingAmount", "dysmenorrhea", "intermenstrualBleeding", "postcoitalBleeding"]),
                              obstetricHistory: values(form, ["gravida", "para", "abortions", "livingChildren", "edd", "previousCsCount", "previousVaginalDeliveryCount", "previousEctopicPregnancy", "previousMiscarriage", "previousStillbirth", "previousPretermBirth"]),
                              gynecologicalHistory: values(form, ["vaginalDischarge", "pelvicPain", "dyspareunia", "menopauseStatus"]),
                              contraceptionHistory: values(form, ["contraceptionHistory"]),
                              infertilityHistory: values(form, ["infertilityHistory"]),
                              pastMedicalHistory: values(form, ["pastMedicalHistory"]),
                              allergyHistory: values(form, ["allergyHistory"]),
                              familyHistory: values(form, ["familyHistory"]),
                              socialHistory: values(form, ["socialHistory"]),
                              notes: String(new FormData(form).get("notes") ?? "").trim()
                            };
        setSaveState("saving");
        setSaveError("");
        void onSubmit("history-sheets", payload).then(() => setSaveState("saved")).catch((error: unknown) => {
          setSaveState("failed");
          setSaveError(error instanceof Error ? error.message : "History could not be saved. Your entries remain available.");
        });
    }

    async function submitHistoryItem(endpoint: string, payload: Record<string, unknown>) {
        setSaveState("saving");
        setSaveError("");
        try {
          retryKeys.current[endpoint] ||= createSecureIdempotencyKey();
          await onSubmit(endpoint, { historySheetId: sheetId || undefined, ...payload }, retryKeys.current[endpoint]);
          delete retryKeys.current[endpoint];
          if (endpoint === "operation-history") setOperation(null);
          if (endpoint === "medication-history") setMedication(null);
          if (endpoint === "investigation-history") setInvestigation(null);
          setSaveState("saved");
        } catch (error) {
          setSaveState("failed");
          setSaveError(error instanceof Error ? error.message : "The item could not be saved. It remains selected for retry.");
        }
    }

    return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>OB/GYN history sheet</h2>
          <p className="muted">Structured documentation for doctor review. Catalogs are lookup references only.</p>
        </div>
        {status ? <span className="badge">{status}</span> : <span className="badge">{sheets.length} sheet(s)</span>}
      </div>

      <form className="form-grid" onSubmit={handleSheetSubmit}>
        <fieldset className="obgyn-fieldset wide">
          <legend>Presenting history</legend>
          <label>Chief complaint<input name="chiefComplaint" defaultValue={String(latestSheet?.chiefComplaint ?? "")} /></label>
          <label>History of present illness<textarea name="historyOfPresentIllness" defaultValue={String(latestSheet?.historyOfPresentIllness ?? "")} /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Obstetric history</legend>
          <label>Gravida<input name="gravida" type="number" min="0" /></label>
          <label>Para<input name="para" type="number" min="0" /></label>
          <label>Abortions<input name="abortions" type="number" min="0" /></label>
          <label>Living children<input name="livingChildren" type="number" min="0" /></label>
          <label>LMP<input name="lmp" type="date" /></label>
          <label>EDD<input name="edd" type="date" /></label>
          <label>Previous CS count<input name="previousCsCount" type="number" min="0" /></label>
          <label>Previous vaginal delivery count<input name="previousVaginalDeliveryCount" type="number" min="0" /></label>
          <label>Previous ectopic pregnancy<input name="previousEctopicPregnancy" /></label>
          <label>Previous miscarriage<input name="previousMiscarriage" /></label>
          <label>Previous stillbirth<input name="previousStillbirth" /></label>
          <label>Previous preterm birth<input name="previousPretermBirth" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Gynecology history</legend>
          <label>Cycle regularity<input name="cycleRegularity" /></label>
          <label>Cycle interval<input name="cycleInterval" /></label>
          <label>Duration<input name="duration" /></label>
          <label>Amount of bleeding<input name="bleedingAmount" /></label>
          <label>Dysmenorrhea<input name="dysmenorrhea" /></label>
          <label>Intermenstrual bleeding<input name="intermenstrualBleeding" /></label>
          <label>Postcoital bleeding<input name="postcoitalBleeding" /></label>
          <label>Vaginal discharge<input name="vaginalDischarge" /></label>
          <label>Pelvic pain<input name="pelvicPain" /></label>
          <label>Dyspareunia<input name="dyspareunia" /></label>
          <label>Menopause status<input name="menopauseStatus" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Background history</legend>
          <label>Contraception history<textarea name="contraceptionHistory" /></label>
          <label>Infertility history<textarea name="infertilityHistory" /></label>
          <label>Past medical history<textarea name="pastMedicalHistory" /></label>
          <label>Allergy history<textarea name="allergyHistory" /></label>
          <label>Family history<textarea name="familyHistory" /></label>
          <label>Social history<textarea name="socialHistory" /></label>
          <label>Notes/free text<textarea name="notes" defaultValue={String(latestSheet?.notes ?? "")} /></label>
        </fieldset>
        <button className="button" type="submit">Save history sheet</button>
      </form>

      <div className="doctor-friendly-grid">
        <ReferencePicker title="Past operation" endpoint="/reference/operations/search" placeholder="Search operation/procedure" selected={operation} onSelect={setOperation} />
        <ReferencePicker title="Medication history" endpoint="/reference/medications/search" placeholder="Search generic name or class" selected={medication} onSelect={setMedication} />
        <ReferencePicker title="Previous investigation" endpoint="/reference/investigations/search" placeholder="Search investigation" selected={investigation} onSelect={setInvestigation} />
      </div>
      <div className="form-actions no-print">
        <button className="button secondary" type="button" disabled={!operation || saveState === "saving"} onClick={() => operation && void submitHistoryItem("operation-history", { operationCatalogItemId: operation.id, operationNameSnapshot: operation.label })}>Add operation</button>
        <button className="button secondary" type="button" disabled={!medication || saveState === "saving"} onClick={() => medication && void submitHistoryItem("medication-history", { medicationGenericId: medication.type === "generic_medication" ? medication.id : undefined, genericNameSnapshot: medication.genericName ?? medication.label, familyNameSnapshot: medication.familyName ?? undefined, currentOrPast: "past" })}>Add medication</button>
        <button className="button secondary" type="button" disabled={!investigation || saveState === "saving"} onClick={() => investigation && void submitHistoryItem("investigation-history", { investigationCatalogItemId: investigation.id, investigationNameSnapshot: investigation.label, context: "previous" })}>Add investigation</button>
      </div>
      <p className={saveState === "failed" ? "warning-text" : "muted"} role={saveState === "failed" ? "alert" : "status"}>{saveState === "saving" ? "Saving selected clinical history…" : saveState === "saved" ? "Saved. The record will remain after refresh." : saveError}</p>
      <RelatedPanel config={{ key: "history-sheet", label: "Saved history sheets", icon: "doctor", empty: "No structured history sheet yet." }} rows={sheets} />
    </section>
    );
}

export function InfertilityWorkspacePanel({ patient, workspace, phases }: { patient: Patient; workspace: InfertilityWorkspace; phases: ClinicalPhase[] }) {
    const episodes = workspace.episodes ?? [];
    const cycles = workspace.cycles ?? [];
    const monitoringVisits = workspace.monitoringVisits ?? [];
    const estradiolResults = workspace.estradiolResults ?? [];
    const latestEpisodeId = String(episodes[0]?.id ?? "");
    const latestCycleId = String(cycles[0]?.id ?? "");

    async function post(endpoint: string, payload: Record<string, unknown>) {
        const token = sessionStorage.getItem("prijClinicToken");
        const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/${endpoint}`, {
                              method: "POST",
                              credentials: "include",
                              headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
                              body: JSON.stringify(payload)
                            });
        if (response.ok) requestPatientWorkspaceRefresh();
    }

    async function patch(endpoint: string, payload: Record<string, unknown>) {
        const token = sessionStorage.getItem("prijClinicToken");
        const response = await fetch(`${getApiBaseUrl()}/patients/${patient.id}/${endpoint}`, {
                              method: "PATCH",
                              credentials: "include",
                              headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
                              body: JSON.stringify(payload)
                            });
        if (response.ok) requestPatientWorkspaceRefresh();
    }

    return (
    <section className="content-grid infertility-workspace">
      <article className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Infertility</p>
            <h2>Induction of Ovulation</h2>
            <p className="muted">Doctor-reviewed workspace. Medication and plan are written manually; no automatic prescribing, dosing, diagnosis, or treatment suggestion.</p>
          </div>
          <span className="badge">{phases.filter((phase) => phase.phaseType === "infertility").length || "No"} phase</span>
        </div>
        <dl className="profile-grid">
          <div><dt>Episodes</dt><dd>{episodes.length}</dd></div>
          <div><dt>Induction cycles</dt><dd>{cycles.length}</dd></div>
          <div><dt>Follicular monitoring</dt><dd>{monitoringVisits.length}</dd></div>
          <div><dt>E2 serial results</dt><dd>{estradiolResults.length}</dd></div>
        </dl>
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={() => void post("phases", { phaseType: "infertility", title: "Infertility phase", startDate: new Date().toISOString().slice(0, 10) })}>Start infertility phase</button>
          <button className="button" type="button" onClick={() => void post("infertility/episodes", { phaseId: phases.find((phase) => phase.phaseType === "infertility" && phase.status === "active")?.id, infertilityType: "unknown", knownFactor: "unknown" })}>New infertility episode</button>
          <button className="button" type="button" disabled={!latestEpisodeId} onClick={() => void post("infertility/cycles", { infertilityEpisodeId: latestEpisodeId, cycleNumber: cycles.length + 1, inductionMethod: "other", outcome: "ongoing" })}>New induction cycle</button>
        </div>
      </article>

      <article className="panel">
        <div className="section-heading"><h2>AMH</h2><span className="badge">Manual result</span></div>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          const data = values(event.currentTarget, ["requestedStatus", "requestDate", "resultValue", "unit", "resultDate", "notes"]);
          void patch(`infertility/cycles/${latestCycleId}/amh`, { ...data, resultValue: data.resultValue ? Number(data.resultValue) : undefined });
        }}>
          <label>Status<select name="requestedStatus" defaultValue="unknown"><option value="requested">Requested</option><option value="not_requested">Not requested</option><option value="not_yet">Not yet</option><option value="unknown">Unknown</option></select></label>
          <label>Request date<input name="requestDate" type="date" /></label>
          <label>Result value<input name="resultValue" type="number" min="0" step="0.01" /></label>
          <label>Unit<input name="unit" placeholder="ng/mL or pmol/L" /></label>
          <label>Result date<input name="resultDate" type="date" /></label>
          <label className="wide">Notes<input name="notes" /></label>
          <button className="button" type="submit" disabled={!latestCycleId}>Save AMH</button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading"><h2>Follicular monitoring</h2><span className="badge">Follicles</span></div>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          const raw = values(event.currentTarget, ["cycleId", "monitoringDate", "cycleDay", "endometrialThicknessMm", "rightOvaryFollicleCount", "rightOvaryMeanSizeMm", "rightOvaryLargestSizeMm", "rightOvaryNotes", "leftOvaryFollicleCount", "leftOvaryMeanSizeMm", "leftOvaryLargestSizeMm", "leftOvaryNotes", "plan", "nextVisitDate"]);
          void post("infertility/monitoring-visits", numericPayload(raw, ["cycleDay", "endometrialThicknessMm", "rightOvaryFollicleCount", "rightOvaryMeanSizeMm", "rightOvaryLargestSizeMm", "leftOvaryFollicleCount", "leftOvaryMeanSizeMm", "leftOvaryLargestSizeMm"]));
        }}>
          <input name="cycleId" type="hidden" value={latestCycleId} readOnly />
          <label>Date<input name="monitoringDate" type="date" required /></label>
          <label>Cycle day<input name="cycleDay" type="number" min="1" /></label>
          <label>Endometrium mm<input name="endometrialThicknessMm" type="number" min="0" step="0.1" /></label>
          <label>Right follicles count<input name="rightOvaryFollicleCount" type="number" min="0" /></label>
          <label>Right largest follicle mm<input name="rightOvaryLargestSizeMm" type="number" min="0" step="0.1" /></label>
          <label>Left follicles count<input name="leftOvaryFollicleCount" type="number" min="0" /></label>
          <label>Left largest follicle mm<input name="leftOvaryLargestSizeMm" type="number" min="0" step="0.1" /></label>
          <label className="wide">Plan<input name="plan" placeholder="Doctor-written plan" /></label>
          <label>Next visit<input name="nextVisitDate" type="date" /></label>
          <button className="button" type="submit" disabled={!latestCycleId}>Add monitoring visit</button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading"><h2>E2 / Estradiol serial results</h2><span className="badge">{estradiolResults.length}</span></div>
        <form className="form-grid" onSubmit={(event) => {
          event.preventDefault();
          const raw = values(event.currentTarget, ["cycleId", "requiredStatus", "value", "unit", "resultDate", "cycleDay", "notes"]);
          void post("infertility/e2-results", numericPayload(raw, ["value", "cycleDay"]));
        }}>
          <input name="cycleId" type="hidden" value={latestCycleId} readOnly />
          <label>Status<select name="requiredStatus" defaultValue="unknown"><option value="required">Required</option><option value="not_required">Not required</option><option value="not_yet">Not yet</option><option value="unknown">Unknown</option></select></label>
          <label>Value<input name="value" required type="number" min="0" step="0.01" /></label>
          <label>Unit<input name="unit" defaultValue="pg/mL" /></label>
          <label>Result date<input name="resultDate" required type="date" /></label>
          <label>Cycle day<input name="cycleDay" type="number" min="1" /></label>
          <label className="wide">Notes<input name="notes" /></label>
          <button className="button" type="submit" disabled={!latestCycleId}>Add E2 result</button>
        </form>
      </article>
    </section>
    );
}

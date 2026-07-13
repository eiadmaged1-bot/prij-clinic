import Link from "next/link";
import { FormEvent, useState } from "react";
import { ThreeDMedicalIcon } from "../../../components/ThreeDMedicalIcon";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { Patient, PregnancyRecord, FetusRecord, formPayload, requestPatientWorkspaceRefresh, previousPregnancyOutcomeOptions } from "./patient-components";

export function MotherBabyWorkspace({ pregnancies, reports, orders }: { pregnancies: PregnancyRecord[]; reports: Record<string, unknown>[]; orders: Record<string, unknown>[] }) {
    const active = pregnancies.find((row) => String(row.status ?? "").toLowerCase() === "active") ?? pregnancies[0];
    const fetusCount = Math.max(1, active?.fetuses?.length ?? 2);
    const babyLabels = fetusCount > 1 ? ["Baby A", "Baby B", ...(fetusCount > 2 ? ["Baby C"] : [])] : ["Baby"];
    return (
    <section className="panel mother-baby-workspace" aria-label="Mother-Baby Pregnancy Workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Mother-Baby Pregnancy Workspace</p>
          <h2>{fetusCount > 1 ? "Mother, Baby A, Baby B" : "Mother and Baby"}</h2>
          <p className="muted">Mother data stays mother-specific. Baby A/B data stays baby-specific. Doctor writes final interpretation.</p>
        </div>
        <span className="badge">Doctor interpretation</span>
      </div>
      <div className="case-board-grid">
        <article className="data-row mother-card">
          <div className="data-row-header"><strong>Mother</strong><span className="badge">Mother-specific</span></div>
          <dl className="profile-grid">
            {["BP", "Weight", "Symptoms", "Labs", "Risk notes", "Plan"].map((item) => <div key={item}><dt>{item}</dt><dd>Doctor-entered field</dd></div>)}
          </dl>
        </article>
        {babyLabels.map((label, index) => (
          <article className="data-row baby-card" key={label}>
            <div className="data-row-header"><strong>{label}</strong><span className="badge">Baby-specific</span></div>
            <dl className="profile-grid">
              {["Gestational age", "Presentation", "Placenta", "Fluid", "Biometry", "Doppler notes", "Ultrasound notes"].map((item) => (
                <div key={item}><dt>{item}</dt><dd>{index === 0 ? `${reports.length} reports / ${orders.length} orders linked when supported` : "Separate notes"}</dd></div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <p className="notice">The app records separated mother and baby details only. Growth concern labels, anomaly interpretation, ranked treatment choices, and fetal diagnosis wording must be written by the doctor.</p>
    </section>
    );
}

export function GpalStepper({ code, label, name, value, onChange }: { code: string; label: string; name: string; value: number; onChange: (value: number) => void }) {
    const next = (delta: number) => onChange(Math.max(0, value + delta));
    return (
    <div className="gpal-stepper">
      <span><b>{code}</b> {label}</span>
      <div>
        <button className="button secondary compact" type="button" aria-label={`Decrease ${label}`} onClick={() => next(-1)}>-</button>
        <input aria-label={label} name={name} type="number" min="0" max="20" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} />
        <button className="button secondary compact" type="button" aria-label={`Increase ${label}`} onClick={() => next(1)}>+</button>
      </div>
    </div>
    );
}

export function gpalSummary(pregnancy?: PregnancyRecord) {
    return `G${pregnancy?.gravida ?? "-"} P${pregnancy?.para ?? "-"} A${pregnancy?.abortions ?? "-"} L${pregnancy?.living ?? "-"}`;
}

export function gpalLooksInconsistent(pregnancy?: PregnancyRecord) {
    const gravida = Number(pregnancy?.gravida);
    const para = Number(pregnancy?.para);
    const abortions = Number(pregnancy?.abortions);
    if ([gravida, para, abortions].some((value) => Number.isNaN(value))) return false;
    return gravida < para + abortions;
}

export function CreatePregnancyEpisodeCard({ patient }: { patient: Patient }) {
    const [status, setStatus] = useState("");
    const [gpal, setGpal] = useState({ gravida: 1, para: 0, abortions: 0, living: 0 });

    async function savePregnancy(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const token = sessionStorage.getItem("prijClinicToken");
        const payload = {
                              patientId: patient.id,
                              status: "active",
                              ...formPayload(event.currentTarget, {
                                gravida: "number",
                                para: "number",
                                living: "number",
                                abortions: "number"
                              })
                            };
        const response = await fetch(`${getApiBaseUrl()}/pregnancies`, {
                              method: "POST",
                              credentials: "include",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {})
                              },
                              body: JSON.stringify(payload)
                            }).catch(() => null);
        if (!response || !response.ok) {
          setStatus("Could not save the pregnancy episode. Check your role and try again.");
          return;
        }

        setStatus("Pregnancy episode saved. Doctor interpretation remains required.");
        requestPatientWorkspaceRefresh();
    }

    return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Pregnancy episode</p>
          <h2>Create pregnancy record</h2>
          <p className="muted">Records dating inputs and obstetric summary only. The app does not assign risk diagnoses.</p>
        </div>
        <ThreeDMedicalIcon name="pregnancy" size="sm" tone="rose" />
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={savePregnancy}>
        <fieldset className="obgyn-fieldset">
          <legend>Dating</legend>
          <label>LMP<input name="lmpDate" type="date" /></label>
          <label>EDD<input name="estimatedDueDate" type="date" /></label>
          <label>Dating method<input name="datingMethod" placeholder="LMP, scan, IVF, or clinician note" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Obstetric summary</legend>
          <GpalStepper code="G" label="Gravida" name="gravida" value={gpal.gravida} onChange={(value) => setGpal((current) => ({ ...current, gravida: value }))} />
          <GpalStepper code="P" label="Para" name="para" value={gpal.para} onChange={(value) => setGpal((current) => ({ ...current, para: value }))} />
          <GpalStepper code="A" label="Abortion" name="abortions" value={gpal.abortions} onChange={(value) => setGpal((current) => ({ ...current, abortions: value }))} />
          <GpalStepper code="L" label="Living" name="living" value={gpal.living} onChange={(value) => setGpal((current) => ({ ...current, living: value }))} />
          <p className="gpal-live-summary">G{gpal.gravida} P{gpal.para} A{gpal.abortions} L{gpal.living}</p>
          {gpal.gravida < gpal.para + gpal.abortions ? <p className="notice safety-note">Review G/P/A/L consistency.</p> : null}
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Doctor notes</legend>
          <label>Notes<textarea name="notes" placeholder="Doctor-authored pregnancy context" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <button className="button" type="submit"><ThreeDMedicalIcon name="pregnancy" size="sm" />Save pregnancy episode</button>
      </form>
    </article>
    );
}

export function PreviousPregnancyHistoryCard({ patient, pregnancy, previousPregnancies }: { patient: Patient; pregnancy?: PregnancyRecord; previousPregnancies: Record<string, unknown>[] }) {
    const [status, setStatus] = useState("");
    const summary = previousDeliverySummary(previousPregnancies);

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const token = sessionStorage.getItem("prijClinicToken");
        const rawPayload = formPayload(event.currentTarget, { year: "number", previousCesareanCount: "number", birthWeightGrams: "number" });
        const payload = {
                              patientId: patient.id,
                              ...(pregnancy?.id ? { pregnancyEpisodeId: pregnancy.id } : {}),
                              ...rawPayload,
                              ...(rawPayload.livingChild === "true" ? { livingChild: true } : rawPayload.livingChild === "false" ? { livingChild: false } : {})
                            };
        const response = await fetch(`${getApiBaseUrl()}/previous-pregnancies`, {
                              method: "POST",
                              credentials: "include",
                              headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
                              body: JSON.stringify(payload)
                            }).catch(() => null);
        if (!response?.ok) {
          setStatus("Could not save previous pregnancy history.");
          return;
        }

        setStatus("Previous pregnancy history saved for doctor review.");
        requestPatientWorkspaceRefresh();
    }

    return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Previous pregnancy and delivery</p>
          <h2>Delivery mode history</h2>
          <p className="muted">{summary || "No previous delivery summary recorded."}</p>
        </div>
        <span className="badge">{previousPregnancies.length}</span>
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={save}>
        <label>Year<input name="year" type="number" min="1900" max="2100" /></label>
        <label>Outcome date<input name="outcomeDate" type="date" /></label>
        <label>Gestational age at outcome<input name="gestationalAgeAtOutcome" placeholder="e.g. 38w, 34+2, 10w" /></label>
        <label>Outcome type<select name="outcome" defaultValue="Normal vaginal delivery">{previousPregnancyOutcomeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Mode of delivery<select name="modeOfDelivery" defaultValue="Normal vaginal delivery">{previousPregnancyOutcomeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label>Baby outcome<input name="babyOutcome" placeholder="Well, NICU, IUFD, not applicable" /></label>
        <label>Living child<select name="livingChild" defaultValue=""><option value="">Not applicable</option><option value="true">Yes</option><option value="false">No</option></select></label>
        <label>Previous CS count<input name="previousCesareanCount" type="number" min="0" max="20" /></label>
        <label>CS indication<input name="cesareanIndication" /></label>
        <label>Complications<input name="complications" /></label>
        <label className="wide">Notes<textarea name="notes" /></label>
        {status ? <p className="notice wide">{status}</p> : null}
        <button className="button" type="submit">Save previous pregnancy</button>
      </form>
    </article>
    );
}

export function previousDeliverySummary(rows: Record<string, unknown>[]) {
    const count = (pattern: RegExp) => rows.filter((row) => pattern.test(`${row.outcome ?? ""} ${row.outcomeType ?? ""} ${row.modeOfDelivery ?? ""}`.toLowerCase())).length;
    const parts = [
                    ["NVD", count(/normal vaginal|nvd|vaginal delivery/)],
                    ["CS", count(/cesarean|caesarean|\bcs\b|c-section/)],
                    ["Miscarriage", count(/miscarriage|abortion/)]
                  ].filter(([, value]) => Number(value) > 0);
    return parts.map(([label, value]) => `${label} x ${value}`).join(" · ");
}

export function FetusStarterCard({ pregnancy, fetuses }: { pregnancy?: PregnancyRecord; fetuses: FetusRecord[] }) {
    const [status, setStatus] = useState("");

    async function saveFetus(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!pregnancy?.id) {
          setStatus("Create a pregnancy episode before adding fetus records.");
          return;
        }

        const token = sessionStorage.getItem("prijClinicToken");
        const response = await fetch(`${getApiBaseUrl()}/pregnancies/${pregnancy.id}/fetuses`, {
                              method: "POST",
                              credentials: "include",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {})
                              },
                              body: JSON.stringify(formPayload(event.currentTarget))
                            }).catch(() => null);
        if (!response || !response.ok) {
          setStatus("Could not save the fetus record. Check your role and try again.");
          return;
        }

        setStatus("Fetus record saved for multiple pregnancy tracking.");
        requestPatientWorkspaceRefresh();
    }

    return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fetus and multiple pregnancy</p>
          <h2>Fetus starter</h2>
          <p className="muted">Use labels such as A, B, or C. This records context only and does not diagnose growth or twin risk.</p>
        </div>
        <span className="badge">{fetuses.length} fetus record(s)</span>
      </div>
      <div className="data-list">
        {fetuses.map((fetus) => (
          <article className="data-row" key={fetus.id ?? fetus.label ?? "fetus"}>
            <div className="data-row-header">
              <strong>Fetus {fetus.label ?? "record"}</strong>
              <span className="badge">{fetus.status ?? "active"}</span>
            </div>
            <p className="muted">{[fetus.chorionicity, fetus.amnionicity, fetus.notes].filter(Boolean).join(" | ") || "No fetus-specific note yet."}</p>
          </article>
        ))}
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={saveFetus}>
        <fieldset className="obgyn-fieldset">
          <legend>Fetus details</legend>
          <label>Label<input name="label" required placeholder="A, B, or C" /></label>
          <label>Chorionicity<input name="chorionicity" placeholder="If known" /></label>
          <label>Amnionicity<input name="amnionicity" placeholder="If known" /></label>
          <label>Status<input name="status" placeholder="active, completed, or note" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Notes</legend>
          <label>Fetus-specific notes<textarea name="notes" placeholder="Clinician-entered notes" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <button className="button secondary" type="submit"><ThreeDMedicalIcon name="pregnancy" size="sm" tone="slate" />Add fetus record</button>
      </form>
    </article>
    );
}

export function AntenatalVisitCard({ patient, pregnancy }: { patient: Patient; pregnancy?: PregnancyRecord }) {
    const [status, setStatus] = useState("");

    async function saveVisit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!pregnancy?.id) {
          setStatus("Create a pregnancy episode before saving an antenatal visit.");
          return;
        }

        const token = sessionStorage.getItem("prijClinicToken");
        const payload = formPayload(event.currentTarget, {
                              weightKg: "number",
                              pulseBpm: "number"
                            });
        const response = await fetch(`${getApiBaseUrl()}/pregnancies/${pregnancy.id}/antenatal-visits`, {
                              method: "POST",
                              credentials: "include",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {})
                              },
                              body: JSON.stringify(payload)
                            }).catch(() => null);
        if (!response || !response.ok) {
          setStatus("Could not save the antenatal visit. Check your role and try again.");
          return;
        }

        setStatus("Antenatal visit saved to the patient timeline.");
        requestPatientWorkspaceRefresh();
    }

    return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Antenatal Visits</p>
          <h2>Visit note workflow</h2>
          <p className="muted">Doctor-friendly recording form grouped in the order used during an antenatal follow-up.</p>
        </div>
        <ThreeDMedicalIcon name="doctor" size="sm" tone="teal" />
      </div>
      <form className="obgyn-form-grid grouped" onSubmit={saveVisit}>
        <fieldset className="obgyn-fieldset">
          <legend>Visit details</legend>
          <label>Visit date<input name="visitDate" type="date" /></label>
          <label>Gestational age<input name="gestationalAgeDisplay" placeholder="Weeks + days" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Maternal observations</legend>
          <label>BP<input name="bloodPressure" placeholder="Example format: 120/80" /></label>
          <label>Weight<input name="weightKg" type="number" min="0" step="0.1" placeholder="kg" /></label>
          <label>Pulse<input name="pulseBpm" type="number" min="0" step="1" placeholder="bpm" /></label>
          <label>Urine protein<input name="urineProtein" placeholder="If checked" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Symptoms</legend>
          <label>Symptoms<textarea name="symptomsText" placeholder="Clinician-recorded symptoms" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Examination</legend>
          <label>Examination<textarea name="examinationText" placeholder="Doctor examination notes" /></label>
          <label>Edema<input name="edema" placeholder="If recorded" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Fetal observations</legend>
          <label>Fetal heart<input name="fetalHeartText" placeholder="Recording only" /></label>
          <label>Fundal height<input name="fundalHeightText" placeholder="cm, if recorded" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Plan</legend>
          <label>Plan<textarea name="planText" placeholder="Doctor-authored plan" /></label>
          <label>Medication note<textarea name="medicationsNote" placeholder="Medication note, if any" /></label>
          <label>Investigations<textarea name="investigationsNote" placeholder="Orders or follow-up tests" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Next follow-up</legend>
          <label>Next follow-up date<input name="nextFollowUpDate" type="date" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <div className="form-actions no-print">
          <button className="button secondary" type="submit">
            <ThreeDMedicalIcon name="files" size="sm" tone="slate" />
            Save Draft
          </button>
          <button className="button" type="submit">
            <ThreeDMedicalIcon name="calendar" size="sm" />
            Save Visit
          </button>
          <Link className="button secondary" href={`/patients/${patient.id}`}>Return to patient file</Link>
        </div>
      </form>
    </article>
    );
}

export function UltrasoundReportBuilder({ patient, pregnancy, fetuses }: { patient: Patient; pregnancy?: PregnancyRecord; fetuses: FetusRecord[] }) {
    const [status, setStatus] = useState("");

    async function saveUltrasound(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const token = sessionStorage.getItem("prijClinicToken");
        const payload = {
                              patientId: patient.id,
                              ...(pregnancy?.id ? { pregnancyId: pregnancy.id } : {}),
                              ...formPayload(event.currentTarget, {
                                gestationalAgeWeeks: "number",
                                gestationalAgeDays: "number",
                                fetalHeartRateBpm: "number",
                                bpdMm: "number",
                                hcMm: "number",
                                acMm: "number",
                                flMm: "number",
                                efwGrams: "number"
                              })
                            };
        const response = await fetch(`${getApiBaseUrl()}/ob-ultrasounds`, {
                              method: "POST",
                              credentials: "include",
                              headers: {
                                "content-type": "application/json",
                                ...(token ? { authorization: `Bearer ${token}` } : {})
                              },
                              body: JSON.stringify(payload)
                            }).catch(() => null);
        if (!response || !response.ok) {
          setStatus("Could not save the ultrasound report. Check your role and try again.");
          return;
        }

        setStatus("Ultrasound report saved as recording-only and added to the timeline.");
        requestPatientWorkspaceRefresh();
    }

    return (
    <article className="panel printable-summary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ultrasound</p>
          <h2>OB ultrasound report builder</h2>
          <p className="muted">Measurements are recorded for clinician review. Interpretation must be completed by the doctor.</p>
        </div>
        <ThreeDMedicalIcon name="ultrasound" size="sm" tone="violet" />
      </div>
      <p className="notice safety-note">
        Measurements are recorded for clinician review. Interpretation must be completed by the doctor.
      </p>
      <form className="obgyn-form-grid grouped" onSubmit={saveUltrasound}>
        <fieldset className="obgyn-fieldset">
          <legend>Scan details</legend>
          <label>Scan date and time<input name="performedAt" type="datetime-local" /></label>
          <label>Scan type<input name="scanType" placeholder="Dating, anatomy, growth, follow-up" /></label>
          <label>Indication<input name="indication" placeholder="Doctor-entered indication" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Pregnancy and fetus context</legend>
          <label>Gestational age<input name="gestationalAgeDisplay" placeholder="Weeks + days" /></label>
          <label>Weeks<input name="gestationalAgeWeeks" type="number" min="0" max="45" /></label>
          <label>Days<input name="gestationalAgeDays" type="number" min="0" max="6" /></label>
          <label>
            Fetus selector
            <select name="fetusId" defaultValue="">
              <option value="">Singleton or not selected</option>
              {fetuses.map((fetus) => (
                <option value={fetus.id} key={fetus.id}>{fetus.label || "Fetus"}</option>
              ))}
            </select>
          </label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Fetal presentation</legend>
          <label>Presentation<input name="presentation" placeholder="Recording only" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Placenta</legend>
          <label>Placenta<input name="placenta" placeholder="Location and notes" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Amniotic fluid</legend>
          <label>Amniotic fluid note<input name="amnioticFluid" placeholder="Recording only" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset">
          <legend>Fetal heart</legend>
          <label>Fetal heart note<input name="fetalHeartText" placeholder="Observed or note" /></label>
          <label>Fetal heart bpm<input name="fetalHeartRateBpm" type="number" min="40" max="240" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Biometry recording</legend>
          <div className="obgyn-biometry">
            <label>BPD<input name="bpdMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>HC<input name="hcMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>AC<input name="acMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>FL<input name="flMm" type="number" min="0" step="0.1" placeholder="mm" /></label>
            <label>EFW<input name="efwGrams" type="number" min="0" step="1" placeholder="grams" /></label>
          </div>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Doppler note</legend>
          <label>Doppler note<textarea name="dopplerNote" placeholder="Optional clinician note" /></label>
        </fieldset>
        <fieldset className="obgyn-fieldset wide">
          <legend>Impression</legend>
          <label>Doctor-written impression<textarea name="impressionText" placeholder="Doctor-written impression only" /></label>
        </fieldset>
        {status ? <p className="notice wide">{status}</p> : null}
        <div className="form-actions no-print">
          <button className="button secondary" type="button" onClick={() => window.print()}>
            <ThreeDMedicalIcon name="reports" size="sm" tone="slate" />
            Print view
          </button>
          <button className="button" type="submit">
            <ThreeDMedicalIcon name="ultrasound" size="sm" />
            Save ultrasound report
          </button>
        </div>
      </form>
    </article>
    );
}

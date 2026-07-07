"use client";

import { FormEvent, useEffect, useState } from "react";
import { calculateObDating, changeLockedObDating, getPatientObDating, lockObDating, PregnancyDatingAssessment, setBestObDating, voidObDating } from "../../lib/calculators";

type PatientLike = { id: string; firstName?: string; lastName?: string };
type PregnancyLike = { id?: string; status?: string | null };

const methods = [
  ["LMP", "LMP"],
  ["LMP_CYCLE_ADJUSTED", "LMP + cycle length"],
  ["CONCEPTION", "Conception date"],
  ["IUI", "IUI / trigger / known ovulation"],
  ["IVF_DAY3", "IVF / ICSI day 3 embryo transfer"],
  ["IVF_DAY5", "IVF / ICSI day 5 blastocyst transfer"],
  ["IVF_DAY6", "IVF / ICSI day 6 blastocyst transfer"],
  ["IVF", "IVF transfer - custom embryo age"],
  ["KNOWN_EDD", "Known EDD"],
  ["MANUAL_DOCTOR", "Manual doctor-reviewed EDD"],
  ["GA_ON_DATE", "GA on date"],
  ["ULTRASOUND_GA", "Ultrasound GA"],
  ["ULTRASOUND_BIOMETRY", "Raw ultrasound measurements"]
] as const;

export function ObDatingReviewPanel({ patient, pregnancies = [] }: { patient: PatientLike; pregnancies?: PregnancyLike[] }) {
  const activePregnancy = pregnancies.find((pregnancy) => pregnancy.status === "active") ?? pregnancies[0];
  const [method, setMethod] = useState("LMP");
  const [candidate, setCandidate] = useState<PregnancyDatingAssessment | null>(null);
  const [history, setHistory] = useState<PregnancyDatingAssessment[]>([]);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    getPatientObDating(patient.id).then((data) => setHistory(data.datingAssessments)).catch(() => setHistory([]));
  }, [patient.id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload = normalizeDatingPayload(method, formPayload(event.currentTarget));
    const { datingSource, ...inputValues } = payload;
    try {
      const result = await calculateObDating({
        patientId: patient.id,
        pregnancyEpisodeId: activePregnancy?.id,
        datingSource: String(datingSource),
        ...inputValues,
        measurements: {
          crlMm: payload.crlMm,
          bpdMm: payload.bpdMm,
          hcMm: payload.hcMm,
          acMm: payload.acMm,
          flMm: payload.flMm
        }
      });
      if ("message" in result) {
        setMessage("Measurement recorded, but dating formula is not verified yet.");
      } else {
        setCandidate(result);
        setHistory((current) => [result, ...current]);
        setMessage("Dating candidate saved for doctor review.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not calculate dating candidate.");
    }
  }

  async function action(kind: "best" | "lock" | "change" | "void") {
    const target = candidate ?? history[0];
    if (!target) return;
    try {
      if (kind === "best") setCandidate(await setBestObDating(target.id, { reason }));
      if (kind === "lock") setCandidate(await lockObDating(target.id, { reason }));
      if (kind === "change") {
        if (!reason.trim()) {
          setMessage("Reason is required to change a locked EDD.");
          return;
        }
        setCandidate(await changeLockedObDating(target.id, { reason }));
      }
      if (kind === "void") {
        if (!reason.trim()) {
          setMessage("Reason is required to void a dating assessment.");
          return;
        }
        await voidObDating(target.id, reason);
        setCandidate(null);
      }
      const data = await getPatientObDating(patient.id);
      setHistory(data.datingAssessments);
      setMessage("Dating workflow updated and audited.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update dating workflow.");
    }
  }

  return (
    <article className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">OB Dating Review</p>
          <h2>{patient.firstName ?? "Patient"} dating workflow</h2>
        </div>
        <span className="badge warning">Doctor review</span>
      </div>
      {!activePregnancy ? <p className="notice safety-note">Create an active pregnancy episode before saving OB dating.</p> : null}
      <form className="obgyn-form-grid grouped" onSubmit={submit}>
        <fieldset className="obgyn-fieldset wide">
          <legend>Input method</legend>
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            {methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </fieldset>
        {method.includes("LMP") ? <Field name="lmpDate" label="LMP date" type="date" /> : null}
        {method === "LMP_CYCLE_ADJUSTED" ? <Field name="cycleLengthDays" label="Cycle length" type="number" /> : null}
        {method === "CONCEPTION" || method === "IUI" ? <Field name="conceptionDate" label={method === "IUI" ? "IUI / trigger / ovulation date" : "Conception date"} type="date" /> : null}
        {method === "IVF" ? <><Field name="embryoTransferDate" label="Embryo transfer date" type="date" /><Field name="embryoAgeDays" label="Embryo age in days" type="number" /></> : null}
        {method === "IVF_DAY3" || method === "IVF_DAY5" || method === "IVF_DAY6" ? <Field name="embryoTransferDate" label="Embryo transfer date" type="date" /> : null}
        {method === "KNOWN_EDD" || method === "MANUAL_DOCTOR" ? <Field name="knownEdd" label={method === "MANUAL_DOCTOR" ? "Manual reviewed EDD" : "Known EDD"} type="date" /> : null}
        {method === "GA_ON_DATE" ? <><Field name="assessmentDate" label="Known date" type="date" /><Field name="gaWeeks" label="GA weeks" type="number" /><Field name="gaDays" label="GA days" type="number" /></> : null}
        {method === "ULTRASOUND_GA" ? <><Field name="scanDate" label="Scan date" type="date" /><Field name="gaWeeks" label="GA weeks" type="number" /><Field name="gaDays" label="GA days" type="number" /></> : null}
        {method === "ULTRASOUND_BIOMETRY" ? (
          <fieldset className="obgyn-fieldset wide">
            <legend>Raw measurements</legend>
            <div className="obgyn-biometry">
              {["crlMm", "bpdMm", "hcMm", "acMm", "flMm"].map((name) => <label key={name}>{name.replace("Mm", " mm").toUpperCase()}<input name={name} type="number" step="0.1" /></label>)}
            </div>
            <p className="notice safety-note">Measurement recorded, but dating formula is not verified yet.</p>
          </fieldset>
        ) : null}
        <button className="button wide" disabled={!activePregnancy} type="submit">Save dating candidate</button>
      </form>

      {candidate ? (
        <dl className="profile-grid">
          <div><dt>Candidate EDD</dt><dd>{candidate.calculatedEdd?.slice(0, 10)}</dd></div>
          <div><dt>Source</dt><dd>{candidate.datingSource.replaceAll("_", " ")}</dd></div>
          <div><dt>Status</dt><dd>{candidate.confidenceStatus.replaceAll("_", " ")}</dd></div>
          <div><dt>Lock</dt><dd>{candidate.isLocked ? "Locked" : "Unlocked"}</dd></div>
        </dl>
      ) : null}

      <label>
        Review or change reason
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for locked changes and voids" />
      </label>
      <div className="form-actions">
        <button className="button compact" onClick={() => void action("best")} type="button">Set as Best OB EDD</button>
        <button className="button compact" onClick={() => void action("lock")} type="button">Review and lock EDD</button>
        <button className="button secondary compact" onClick={() => void action("change")} type="button">Change locked EDD</button>
        <button className="button secondary compact" onClick={() => void action("void")} type="button">Void</button>
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <div className="data-list">
        {history.map((item) => (
          <article className="data-row" key={item.id}>
            <div className="data-row-header">
              <strong>{item.calculatedEdd.slice(0, 10)}</strong>
              <span className="badge">{item.isLocked ? "Locked" : item.confidenceStatus}</span>
            </div>
            <p className="muted">{item.datingSource.replaceAll("_", " ")} - {item.isBestObstetricEstimate ? "Best estimate" : "Candidate"}</p>
          </article>
        ))}
      </div>
    </article>
  );
}

function Field({ name, label, type }: { name: string; label: string; type: string }) {
  return <label>{label}<input name={name} type={type} required /></label>;
}

function formPayload(form: HTMLFormElement) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of new FormData(form).entries()) {
    const text = String(value).trim();
    if (!text) continue;
    const input = form.elements.namedItem(key) as HTMLInputElement | null;
    payload[key] = input?.type === "number" ? Number(text) : text;
  }
  return payload;
}

function normalizeDatingPayload(method: string, payload: Record<string, unknown>): Record<string, unknown> {
  if (method === "IUI") return { ...payload, datingSource: "CONCEPTION" };
  if (method === "IVF_DAY3") return { ...payload, datingSource: "IVF", embryoAgeDays: 3 };
  if (method === "IVF_DAY5") return { ...payload, datingSource: "IVF", embryoAgeDays: 5 };
  if (method === "IVF_DAY6") return { ...payload, datingSource: "IVF", embryoAgeDays: 6 };
  return { ...payload, datingSource: method };
}

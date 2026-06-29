"use client";

import { FormEvent, useEffect, useState } from "react";
import { createManagementSnapshot, listManagementSnapshots, ManagementSnapshot, reviewManagementSnapshot, saveManagementMemory } from "../../lib/ai-management";

type Props = {
  patientId: string;
  encounterId?: string;
  defaultDiagnosis?: string;
  defaultProtocolCode?: string;
  compact?: boolean;
};

const goals = ["pain control", "fertility", "bleeding control", "contraception", "pregnancy planning", "postpartum recovery", "pelvic floor rehab", "menopause symptom control", "follow-up only"];

export function ManagementSnapshotPanel({ patientId, encounterId, defaultDiagnosis = "", defaultProtocolCode = "", compact }: Props) {
  const [snapshot, setSnapshot] = useState<ManagementSnapshot | null>(null);
  const [snapshots, setSnapshots] = useState<ManagementSnapshot[]>([]);
  const [status, setStatus] = useState("");
  const [editText, setEditText] = useState("");

  useEffect(() => {
    void listManagementSnapshots(patientId).then((data) => setSnapshots(data.snapshots)).catch(() => setSnapshots([]));
  }, [patientId]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Generating draft snapshot");
    try {
      const next = await createManagementSnapshot({
        patientId,
        encounterId,
        diagnosisText: String(form.get("diagnosisText") ?? ""),
        protocolCode: String(form.get("protocolCode") ?? "") || undefined,
        clinicalGoal: String(form.get("clinicalGoal") ?? "") || undefined,
        age: Number(form.get("age") || 0) || undefined,
        pregnancyStatus: String(form.get("pregnancyStatus") || "unknown") as never,
        tryingToConceive: form.get("tryingToConceive") === "on",
        lactating: form.get("lactating") === "on",
        previousTreatments: String(form.get("previousTreatments") ?? "") || undefined,
        contraindications: String(form.get("contraindications") ?? "") || undefined,
        redFlags: String(form.get("redFlags") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined
      });
      setSnapshot(next);
      setSnapshots((current) => [next, ...current]);
      setStatus("Draft snapshot ready for doctor review");
    } catch {
      setStatus("Could not generate snapshot. Check clinical role and patient access.");
    }
  }

  async function review(decision: "approved" | "edited" | "rejected") {
    if (!snapshot) return;
    const reason = decision === "rejected" ? window.prompt("Reason for rejection") ?? "" : undefined;
    try {
      const next = await reviewManagementSnapshot(snapshot.id, { decision, doctorEditedPlan: decision === "edited" ? editText : undefined, reason });
      setSnapshot(next);
      setStatus(decision === "rejected" ? "Snapshot rejected" : "Snapshot reviewed by doctor");
    } catch {
      setStatus("Review action was not saved.");
    }
  }

  async function saveMemory() {
    if (!snapshot) return;
    try {
      await saveManagementMemory(snapshot.id, {
        memoryType: "protocol_used",
        title: snapshot.outputJson.protocolCode ?? snapshot.outputJson.title,
        valueJson: {
          protocolCode: snapshot.outputJson.protocolCode,
          status: snapshot.status,
          source: snapshot.outputJson.source?.name
        }
      });
      setStatus("Structured key facts saved to patient memory");
    } catch {
      setStatus("Memory can be saved only after approval or edit approval.");
    }
  }

  return (
    <section className={compact ? "panel management-panel compact" : "panel management-panel"}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI Management Snapshot</p>
          <h2>AI Management Snapshot</h2>
        </div>
        <span className="badge warning">Draft - doctor review required</span>
      </div>
      <p className="notice">Draft support only. The doctor must verify and approve before using it in care.</p>
      <form className="form-grid management-form" onSubmit={generate}>
        <label>Diagnosis/problem<input name="diagnosisText" required defaultValue={defaultDiagnosis} /></label>
        <label>Protocol code<input name="protocolCode" defaultValue={defaultProtocolCode} placeholder="Optional verified protocol code" /></label>
        <label>Patient goal<select name="clinicalGoal">{goals.map((goal) => <option key={goal}>{goal}</option>)}</select></label>
        <label>Age<input name="age" min="0" max="120" type="number" /></label>
        <label>Pregnancy status<select name="pregnancyStatus" defaultValue="unknown"><option value="unknown">Unknown</option><option value="not_pregnant">Not pregnant</option><option value="pregnant">Pregnant</option><option value="postpartum">Postpartum</option><option value="trying_to_conceive">Trying to conceive</option></select></label>
        <label className="toggle-row"><input name="tryingToConceive" type="checkbox" /> Trying to conceive</label>
        <label className="toggle-row"><input name="lactating" type="checkbox" /> Lactating</label>
        <label>Previous treatment<textarea name="previousTreatments" /></label>
        <label>Contraindications<textarea name="contraindications" /></label>
        <label>Red flags<textarea name="redFlags" /></label>
        <label>Notes<textarea name="notes" /></label>
        <button className="button" type="submit">Generate snapshot</button>
      </form>
      {status ? <p className="notice">{status}</p> : null}
      {snapshot ? <SnapshotResult snapshot={snapshot} editText={editText} onEditText={setEditText} onReview={review} onSaveMemory={saveMemory} /> : null}
      {snapshots.length ? (
        <div className="data-list">
          {snapshots.slice(0, 5).map((item) => (
            <button className="data-row text-left" key={item.id} onClick={() => setSnapshot(item)} type="button">
              <strong>{item.outputJson.title}</strong>
              <span className="badge">{item.status}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SnapshotResult({ snapshot, editText, onEditText, onReview, onSaveMemory }: { snapshot: ManagementSnapshot; editText: string; onEditText: (value: string) => void; onReview: (decision: "approved" | "edited" | "rejected") => void; onSaveMemory: () => void }) {
  const output = snapshot.outputJson;
  const catalogOnly = output.implementationStatus !== "verified";
  return (
    <article className="snapshot-result">
      <h3>{output.title}</h3>
      <span className="badge">{output.statusLabel}</span>
      {catalogOnly ? <p className="notice safety-note">Protocol is listed in the Women&apos;s Health Atlas, but management snapshot is not yet verified. Add a guideline source and verify protocol before using AI management options.</p> : null}
      <SnapshotList title="Key context" items={output.keyContext} />
      {!catalogOnly ? <SnapshotList title="Guideline-based options" items={output.guidelineBasedOptions} /> : null}
      <SnapshotList title="Safety checks" items={output.safetyChecks} />
      <div className="snapshot-source"><strong>Source</strong><p className="muted">{output.source?.name || "Source not verified"} {output.source?.year || ""}</p></div>
      <SnapshotList title="Limitations" items={output.limitations} />
      <label>Doctor edited plan<textarea value={editText} onChange={(event) => onEditText(event.target.value)} /></label>
      <div className="form-actions">
        <button className="button secondary" onClick={() => onReview("rejected")} type="button">Reject</button>
        <button className="button secondary" onClick={() => onReview("edited")} type="button">Edit and approve</button>
        <button className="button" onClick={() => onReview("approved")} type="button">Approve</button>
        <button className="button secondary" onClick={onSaveMemory} type="button">Save key facts to patient memory</button>
      </div>
    </article>
  );
}

function SnapshotList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="snapshot-section">
      <strong>{title}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

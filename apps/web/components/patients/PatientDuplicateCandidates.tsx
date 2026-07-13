import Link from "next/link";

export type DuplicateCandidate = {
  patientId: string;
  displayName: string;
  mrn: string;
  phoneSuffix: string | null;
  ageSummary: string | null;
  patientType: string;
  lastVisitDate: string | null;
  matchReasons: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  score: number;
};

export function PatientDuplicateCandidates({ candidates }: { candidates: DuplicateCandidate[] }) {
  if (!candidates.length) return null;
  return (
    <section className="alert warning wide" aria-live="polite" data-testid="patient-duplicate-candidates">
      <strong>Possible existing patient records</strong>
      <p>Review these limited details before creating a new file. High-confidence matches require an override reason.</p>
      <div className="data-list">
        {candidates.map((candidate) => (
          <article className="data-row" key={candidate.patientId}>
            <div className="data-row-header"><strong>{candidate.displayName}</strong><span className={`badge ${candidate.confidence === "HIGH" ? "warning" : ""}`}>{candidate.confidence}</span></div>
            <p className="muted">MRN {candidate.mrn} · Phone ending {candidate.phoneSuffix ?? "not available"} · {candidate.ageSummary ?? "age unavailable"} · {candidate.patientType}</p>
            <p className="muted">Matches: {candidate.matchReasons.join(", ")}{candidate.lastVisitDate ? ` · Last visit ${candidate.lastVisitDate}` : ""}</p>
            <Link className="button secondary compact" data-action-id="patient.openExistingCandidate" href={`/patients/${candidate.patientId}`}>Open Existing Patient</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

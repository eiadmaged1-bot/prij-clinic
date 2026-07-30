import Link from "next/link";
import { ThreeDMedicalIcon } from "@/components/ThreeDMedicalIcon";
import { ageLabel, patientTypeLabel } from "@/lib/patient-labels";
import type { Patient, TimelineItem } from "@/app/patients/[id]/patient-components";

type Row = Record<string, unknown>;

export function CalmPatientOverview({ patient, related, timelineItems }: {
  patient: Patient;
  related: Record<string, Row[]>;
  timelineItems: TimelineItem[];
}) {
  const pendingResults = (related.results ?? []).filter((row) => String(row.reviewStatus ?? "") === "pending_review").length;
  const openTasks = (related.tasks ?? []).filter((row) => ["open", "in_progress"].includes(String(row.status ?? ""))).length;
  const unreviewedDocuments = (related.documents ?? []).filter((row) => ["draft_metadata", "active"].includes(String(row.status ?? ""))).length;
  const consentGaps = (related.consents ?? []).filter((row) => ["unknown", "declined"].includes(String(row.status ?? ""))).length;
  const allergyCount = related.allergies?.length;
  const attentionCount = pendingResults + openTasks + unreviewedDocuments + consentGaps;
  const recentTimeline = timelineItems.slice(0, 3);

  return (
    <section className="panel calm-patient-overview" aria-labelledby="patient-snapshot-title">
      <header className="calm-patient-overview-heading">
        <div>
          <p className="eyebrow">Patient workspace</p>
          <h2 id="patient-snapshot-title">Patient snapshot</h2>
        </div>
        <Link className="button compact" href={`/doctor/visit?patientId=${patient.id}`}>
          <ThreeDMedicalIcon name="doctor" size="sm" />
          Start visit
        </Link>
      </header>

      <div className="calm-patient-overview-grid">
        <section aria-label="Patient essentials">
          <h3>Essentials</h3>
          <dl className="calm-fact-list">
            <div><dt>Patient</dt><dd>{patient.firstName} {patient.lastName}</dd></div>
            <div><dt>MRN</dt><dd>{patient.medicalRecordNumber}</dd></div>
            <div><dt>Age</dt><dd>{ageLabel(patient.dateOfBirth)}</dd></div>
            <div><dt>Phone</dt><dd>{patient.phone || "Not recorded"}</dd></div>
            <div><dt>Care context</dt><dd>{patientTypeLabel(patient.patientType)}</dd></div>
            <div><dt>Allergies</dt><dd>{allergyCount === undefined ? "Needs review" : allergyCount ? `${allergyCount} recorded` : "None recorded"}</dd></div>
          </dl>
        </section>

        <section className="calm-attention-column" aria-label="Items needing attention">
          <div className="calm-section-title">
            <h3>Needs attention</h3>
            <strong>{attentionCount}</strong>
          </div>
          <div className="calm-attention-list">
            <AttentionRow label="Pending results" value={pendingResults} />
            <AttentionRow label="Open tasks" value={openTasks} />
            <AttentionRow label="Documents to review" value={unreviewedDocuments} />
            <AttentionRow label="Consent gaps" value={consentGaps} />
          </div>
        </section>

        <section aria-label="Recent patient activity">
          <div className="calm-section-title">
            <h3>Recent activity</h3>
            <span>{recentTimeline.length}</span>
          </div>
          {recentTimeline.length ? (
            <div className="calm-activity-list">
              {recentTimeline.map((item) => (
                <article key={`${item.type}-${item.dateTime}-${item.title}`}>
                  <strong>{item.title}</strong>
                  <span>{item.description || item.status}</span>
                </article>
              ))}
            </div>
          ) : <p className="muted">No recent activity.</p>}
        </section>
      </div>

      {patient.notes ? <p className="calm-patient-note"><strong>Note:</strong> {patient.notes}</p> : null}
    </section>
  );
}

function AttentionRow({ label, value }: { label: string; value: number }) {
  return <div className={value ? "needs-attention" : ""}><span>{label}</span><strong>{value}</strong></div>;
}

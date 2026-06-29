"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentPatientObDating, PregnancyDatingAssessment } from "../../lib/calculators";
import { ThreeDMedicalIcon } from "../ThreeDMedicalIcon";

type PatientLike = { id: string; patientType?: string | null };
type PregnancyLike = { status?: string | null };

export function PregnancyDatingCard({ patient, pregnancies = [], compact = false }: { patient: PatientLike; pregnancies?: PregnancyLike[]; compact?: boolean }) {
  const [dating, setDating] = useState<PregnancyDatingAssessment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const hasActivePregnancy = pregnancies.some((pregnancy) => pregnancy.status === "active");
  const show = patient.patientType === "OB" || hasActivePregnancy;
  const hiddenByType = (patient.patientType === "GYN" || patient.patientType === "WOMEN_HEALTH") && !hasActivePregnancy;

  useEffect(() => {
    if (!show) return;
    getCurrentPatientObDating(patient.id)
      .then((data) => setDating(data.dating))
      .catch(() => setDating(null))
      .finally(() => setLoaded(true));
  }, [patient.id, show]);

  if (!show || hiddenByType) return null;

  return (
    <article className={`panel pregnancy-dating-card ${compact ? "compact" : ""}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Best Obstetric Dating</p>
          <h2>{dating ? "EDD and GA" : "Dating needs review"}</h2>
        </div>
        <ThreeDMedicalIcon name="pregnancy" size="sm" tone="teal" />
      </div>
      <dl className="profile-grid">
        <div><dt>GA today</dt><dd>{dating?.currentGestationalAge?.display ?? "Not set"}</dd></div>
        <div><dt>EDD</dt><dd>{dating?.calculatedEdd?.slice(0, 10) ?? "Not set"}</dd></div>
        <div><dt>Source</dt><dd>{dating?.datingSource?.replaceAll("_", " ") ?? "No best estimate"}</dd></div>
        <div><dt>Status</dt><dd>{dating?.confidenceStatus?.replaceAll("_", " ") ?? (loaded ? "Needs review" : "Loading")}</dd></div>
        <div><dt>Lock</dt><dd>{dating?.isLocked ? "Locked" : "Unlocked"}</dd></div>
        <div><dt>Best</dt><dd>{dating?.isBestObstetricEstimate ? "Best estimate" : "Candidate only"}</dd></div>
        <div className="wide"><dt>Reviewed by</dt><dd>{dating?.reviewedByUser?.displayName ?? "Not reviewed yet"}</dd></div>
      </dl>
      <div className="form-actions">
        <Link className="button compact" href={`/patients/${patient.id}?panel=dating`}>
          Review Dating
        </Link>
        <Link className="button secondary compact" href={`/patients/${patient.id}?panel=dating`}>
          Add Dating Input
        </Link>
      </div>
    </article>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getMedicationSafetyProfile, type MedicationSafetyProfileResult } from "../../lib/care-assist";
import { MedicationSafetyBadge } from "./MedicationSafetyBadge";

export function PregnancyLactationSafetyProfile({ medicationGenericId }: { medicationGenericId?: string | null }) {
  const [profile, setProfile] = useState<MedicationSafetyProfileResult | null>(null);
  const [status, setStatus] = useState("No generic selected");

  useEffect(() => {
    if (!medicationGenericId) return;
    setStatus("Loading safety profile");
    void getMedicationSafetyProfile(medicationGenericId)
      .then((data) => {
        setProfile(data);
        setStatus("Reference only. Doctor review required.");
      })
      .catch(() => setStatus("Safety profile requires authorized clinical access"));
  }, [medicationGenericId]);

  if (!medicationGenericId) return <p className="muted">{status}</p>;
  const medication = profile?.medication;
  const safety = profile?.profile;
  return (
    <article className="data-row">
      <div className="data-row-header">
        <strong>{medication?.genericName ?? "Generic medication"}</strong>
        <span className="badge warning">Doctor review required</span>
      </div>
      <div className="chip-list">
        <MedicationSafetyBadge label="Legacy pregnancy category" value={safety?.legacyPregnancyCategory} />
        <MedicationSafetyBadge label="Lactation profile" value={safety?.lactationRiskLevel} />
      </div>
      <dl>
        <div><dt>Class/family</dt><dd>{[medication?.familyName, medication?.className, medication?.pharmacologicClass].filter(Boolean).join(" / ") || "Not listed"}</dd></div>
        <div><dt>Source</dt><dd>{safety?.sourceName ?? "Not reviewed"}</dd></div>
        <div><dt>Review status</dt><dd>{safety?.reviewStatus ?? "needs_review"}</dd></div>
        <div><dt>Confidence</dt><dd>{safety?.confidenceLevel ?? "unknown"}</dd></div>
      </dl>
      {critical(safety) ? <p className="warning-text">Critical review flag. Manual doctor review and reason are required before overriding.</p> : <p className="muted">{status}</p>}
      {safety?.pregnancyRiskSummary ? <p className="muted">{safety.pregnancyRiskSummary}</p> : null}
      {safety?.lactationRiskSummary ? <p className="muted">{safety.lactationRiskSummary}</p> : null}
    </article>
  );
}

function critical(profile: MedicationSafetyProfileResult["profile"] | undefined | null) {
  if (!profile) return true;
  return profile.legacyPregnancyCategory === "D" || profile.legacyPregnancyCategory === "X" || profile.lactationRiskLevel === "AVOID" || profile.reviewStatus !== "reviewed" || !profile.sourceName;
}

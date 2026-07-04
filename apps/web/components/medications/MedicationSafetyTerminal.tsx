"use client";

import { useEffect, useState } from "react";
import { getMedicationSafetyProfile, type MedicationSafetyProfileResult } from "../../lib/care-assist";
import type { MedicationResult } from "../../lib/medications";
import { MedicationSafetyBadge } from "./MedicationSafetyBadge";

export function MedicationSafetyTerminal({
  medication,
  title = "Medication Safety Terminal"
}: {
  medication?: MedicationResult | null;
  title?: string;
}) {
  const genericId = medication?.type === "generic_medication" ? medication.id : undefined;
  const [profile, setProfile] = useState<MedicationSafetyProfileResult | null>(null);
  const [status, setStatus] = useState("Select a generic medication to review profile metadata.");

  useEffect(() => {
    setProfile(null);
    if (!genericId) {
      setStatus(medication ? "Generic profile is not linked for this result. Review required." : "Select a generic medication to review profile metadata.");
      return;
    }
    setStatus("Loading profile");
    void getMedicationSafetyProfile(genericId)
      .then((data) => {
        setProfile(data);
        setStatus(data.profile ? "Doctor review required." : "Review required.");
      })
      .catch(() => setStatus("Safety profile requires authorized clinical access."));
  }, [genericId, medication]);

  const safety = profile?.profile;
  const displayGeneric = profile?.medication?.genericName ?? medication?.genericName ?? medication?.brandName ?? medication?.tradeName ?? "Generic medication";
  const classFamily = [profile?.medication?.familyName ?? medication?.familyName ?? medication?.family, profile?.medication?.className ?? medication?.className, profile?.medication?.pharmacologicClass ?? medication?.pharmacologicClass].filter(Boolean).join(" / ");
  const needsReview = !safety || safety.reviewStatus !== "reviewed" || safety.sourceRefreshStatus === "REVIEW_REQUIRED" || !safety.sourceName;

  return (
    <aside className="panel medication-safety-terminal" aria-label={title}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p className="muted">Doctor review required. Reference metadata only.</p>
        </div>
        <span className={needsReview ? "badge danger" : "badge warning"}>{needsReview ? "Review required" : "Reviewed reference"}</span>
      </div>
      <dl className="profile-grid">
        <div><dt>Generic name</dt><dd>{displayGeneric}</dd></div>
        <div><dt>Trade or search match</dt><dd>{[medication?.tradeName, medication?.brandName].filter(Boolean).join(" / ") || "None selected"}</dd></div>
        <div><dt>Class/family</dt><dd>{classFamily || "Not listed"}</dd></div>
      </dl>
      <div className="chip-list">
        <MedicationSafetyBadge label="Legacy pregnancy category" value={safety?.legacyPregnancyCategory} />
        <MedicationSafetyBadge label="Lactation profile" value={safety?.lactationRiskLevel} />
      </div>
      <dl className="profile-grid">
        <div><dt>Source</dt><dd>{safety?.sourceName || "Missing source"}</dd></div>
        <div><dt>Source year</dt><dd>{safety?.sourceYear ?? "Not recorded"}</dd></div>
        <div><dt>Source link</dt><dd>{safety?.sourceUrl || "Not recorded"}</dd></div>
        <div><dt>Review status</dt><dd>{safety?.reviewStatus ?? "needs_review"}</dd></div>
        <div><dt>Reviewed by</dt><dd>{safety?.reviewedByUser?.displayName ?? safety?.reviewedByUser?.email ?? "Not recorded"}</dd></div>
        <div><dt>Reviewed at</dt><dd>{formatDate(safety?.reviewedAt) || "Not recorded"}</dd></div>
        <div><dt>Confidence</dt><dd>{safety?.confidenceLevel ?? "unknown"}</dd></div>
        <div><dt>Last checked</dt><dd>{formatDate(safety?.lastCheckedAt) || "unknown"}</dd></div>
        <div><dt>Last updated</dt><dd>{formatDate(safety?.sourceLastUpdatedAt) || "unknown"}</dd></div>
        <div><dt>Source version</dt><dd>{safety?.sourceVersionLabel || "Not recorded"}</dd></div>
      </dl>
      {safety?.sourceRefreshNote ? <p className="muted">{safety.sourceRefreshNote}</p> : null}
      <p className={needsReview ? "warning-text" : "muted"}>{needsReview ? "Review required before clinical reliance." : status}</p>
    </aside>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

"use client";

import { useState } from "react";
import { decideCareAssistFinding } from "../../lib/care-assist";

export function CareAssistDecisionControls({ findingId, severity, onSaved }: { findingId: string; severity: string; onSaved: () => void }) {
  const [reason, setReason] = useState("");
  const [snoozedUntil, setSnoozedUntil] = useState("");
  const [status, setStatus] = useState("");
  const requiresReason = severity === "HIGH" || severity === "CRITICAL_REVIEW";

  async function decide(decision: "ACCEPT" | "DISMISS" | "SNOOZE" | "RESOLVE", decisionReason?: string) {
    if (decision === "DISMISS" && requiresReason && reason.trim().length < 3) {
      setStatus("Reason required for high or critical review dismissal");
      return;
    }
    if (decision === "SNOOZE" && !snoozedUntil) {
      setStatus("Choose snooze date");
      return;
    }
    setStatus("Saving decision");
    try {
      await decideCareAssistFinding(findingId, { decision, reason: decisionReason ?? reason, snoozedUntil });
      setStatus("Decision saved");
      onSaved();
    } catch {
      setStatus("Decision was denied or could not be saved");
    }
  }

  return (
    <div className="data-list">
      <form className="inline-form" onSubmit={(event) => event.preventDefault()}>
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for dismissal or override" />
        <input type="date" value={snoozedUntil} onChange={(event) => setSnoozedUntil(event.target.value)} />
      </form>
      <div className="toolbar">
        <button className="button compact" type="button" onClick={() => void decide("ACCEPT")}>Review</button>
        <button className="button secondary compact" type="button" onClick={() => void decide("DISMISS")}>Dismiss</button>
        <button className="button secondary compact" type="button" onClick={() => void decide("SNOOZE")}>Snooze</button>
        <button className="button secondary compact" type="button" onClick={() => void decide("RESOLVE", "Not applicable")}>Not applicable</button>
      </div>
      <p className="muted">{status}</p>
    </div>
  );
}

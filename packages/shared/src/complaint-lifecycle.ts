export const COMPLAINT_LIFECYCLE_STATUSES = ["ACTIVE", "IMPROVING", "RESOLVED", "CHRONIC", "REFRACTORY"] as const;

export type ComplaintLifecycleStatus = (typeof COMPLAINT_LIFECYCLE_STATUSES)[number];

export const COMPLAINT_LIFECYCLE_LABELS: Record<ComplaintLifecycleStatus, string> = {
  ACTIVE: "Active",
  IMPROVING: "Improving",
  RESOLVED: "Resolved",
  CHRONIC: "Chronic",
  REFRACTORY: "Refractory"
};

export type ComplaintLifecycleEvent = {
  status: string;
  encounterId: string;
  recordedAt: string;
  source: "ENCOUNTER";
};

export type ComplaintLifecycleRecord = ComplaintLifecycleEvent & {
  signedAt?: string;
  history: ComplaintLifecycleEvent[];
};

export type LongitudinalComplaint = {
  text: string;
  status: string;
  label: string;
  encounterId: string;
  recordedAt: string;
  source: string;
  active: boolean;
};

export function isComplaintLifecycleStatus(value: unknown): value is ComplaintLifecycleStatus {
  return typeof value === "string" && (COMPLAINT_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function complaintStatusLabel(value: unknown) {
  return isComplaintLifecycleStatus(value) ? COMPLAINT_LIFECYCLE_LABELS[value] : "Unknown";
}

export function isActiveComplaintStatus(value: unknown) {
  return isComplaintLifecycleStatus(value) && value !== "RESOLVED";
}

export function complaintLifecycleFromEncounter(encounter: Record<string, unknown>): ComplaintLifecycleRecord | null {
  const followUp = asRecord(encounter.followUpJson);
  const lifecycle = asRecord(followUp?.complaintLifecycle);
  if (!lifecycle || typeof lifecycle.status !== "string") return null;
  return {
    status: lifecycle.status,
    encounterId: typeof lifecycle.encounterId === "string" ? lifecycle.encounterId : String(encounter.id ?? ""),
    recordedAt: typeof lifecycle.recordedAt === "string" ? lifecycle.recordedAt : String(encounter.createdAt ?? ""),
    source: "ENCOUNTER",
    ...(typeof lifecycle.signedAt === "string" ? { signedAt: lifecycle.signedAt } : {}),
    history: Array.isArray(lifecycle.history)
      ? lifecycle.history.flatMap((item) => {
          const event = asRecord(item);
          return event && typeof event.status === "string"
            ? [{ status: event.status, encounterId: String(event.encounterId ?? encounter.id ?? ""), recordedAt: String(event.recordedAt ?? encounter.createdAt ?? ""), source: "ENCOUNTER" as const }]
            : [];
        })
      : []
  };
}

export function longitudinalComplaintsFromEncounters(encounters: Record<string, unknown>[]): LongitudinalComplaint[] {
  return encounters.flatMap((encounter) => {
    const text = typeof encounter.chiefComplaint === "string" ? encounter.chiefComplaint.trim() : "";
    if (!text || encounter.status === "voided") return [];
    const lifecycle = complaintLifecycleFromEncounter(encounter);
    const status = lifecycle?.status ?? "ACTIVE";
    return [{
      text,
      status,
      label: complaintStatusLabel(status),
      encounterId: lifecycle?.encounterId || String(encounter.id ?? ""),
      recordedAt: lifecycle?.recordedAt || String(encounter.createdAt ?? ""),
      source: lifecycle?.source ?? "ENCOUNTER",
      active: isActiveComplaintStatus(status)
    }];
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

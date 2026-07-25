import type { Prisma } from "@prisma/client";

export const COMPLAINT_LIFECYCLE_STATUS = {
  ACTIVE: "ACTIVE",
  IMPROVING: "IMPROVING",
  RESOLVED: "RESOLVED",
  CHRONIC: "CHRONIC",
  REFRACTORY: "REFRACTORY"
} as const;

export type ComplaintLifecycleStatus = (typeof COMPLAINT_LIFECYCLE_STATUS)[keyof typeof COMPLAINT_LIFECYCLE_STATUS];

export const COMPLAINT_LIFECYCLE_LABELS: Record<ComplaintLifecycleStatus, string> = {
  ACTIVE: "Active",
  IMPROVING: "Improving",
  RESOLVED: "Resolved",
  CHRONIC: "Chronic",
  REFRACTORY: "Refractory"
};

type ComplaintContext = {
  encounterId: string;
  recordedAt: Date;
  signedAt?: Date;
};

export function mergeComplaintLifecycle(existingJson: unknown, status: ComplaintLifecycleStatus, context: ComplaintContext): Prisma.InputJsonValue {
  const root = asRecord(existingJson) ?? {};
  const existing = asRecord(root.complaintLifecycle);
  const history = Array.isArray(existing?.history) ? existing.history.filter((event) => asRecord(event)) : [];
  const event = {
    status,
    encounterId: context.encounterId,
    recordedAt: context.recordedAt.toISOString(),
    source: "ENCOUNTER"
  };
  const previous = asRecord(history.at(-1));
  const nextHistory = previous?.status === status && previous.encounterId === context.encounterId ? history : [...history, event];
  return {
    ...root,
    complaintLifecycle: {
      status,
      encounterId: context.encounterId,
      recordedAt: typeof existing?.recordedAt === "string" ? existing.recordedAt : event.recordedAt,
      source: "ENCOUNTER",
      ...(context.signedAt ? { signedAt: context.signedAt.toISOString() } : typeof existing?.signedAt === "string" ? { signedAt: existing.signedAt } : {}),
      history: nextHistory
    }
  } as Prisma.InputJsonValue;
}

export function complaintStatusFromJson(value: unknown): ComplaintLifecycleStatus {
  const lifecycle = asRecord(asRecord(value)?.complaintLifecycle);
  const status = lifecycle?.status;
  return Object.values(COMPLAINT_LIFECYCLE_STATUS).includes(status as ComplaintLifecycleStatus)
    ? status as ComplaintLifecycleStatus
    : COMPLAINT_LIFECYCLE_STATUS.ACTIVE;
}

export function complaintLifecycleFromJson(value: unknown) {
  return asRecord(asRecord(value)?.complaintLifecycle);
}

export function complaintStatusLabel(value: unknown) {
  return typeof value === "string" && value in COMPLAINT_LIFECYCLE_LABELS
    ? COMPLAINT_LIFECYCLE_LABELS[value as ComplaintLifecycleStatus]
    : "Unknown";
}

export function isActiveComplaintStatus(value: unknown) {
  return typeof value === "string"
    && Object.values(COMPLAINT_LIFECYCLE_STATUS).includes(value as ComplaintLifecycleStatus)
    && value !== COMPLAINT_LIFECYCLE_STATUS.RESOLVED;
}

export function longitudinalComplaintsFromEncounters(encounters: Array<{
  id: string;
  chiefComplaint: string | null;
  status: string;
  followUpJson: unknown;
  createdAt: Date;
}>) {
  return encounters.flatMap((encounter) => {
    const text = encounter.chiefComplaint?.trim();
    if (!text || encounter.status === "voided") return [];
    const lifecycle = complaintLifecycleFromJson(encounter.followUpJson);
    const status = typeof lifecycle?.status === "string" ? lifecycle.status : COMPLAINT_LIFECYCLE_STATUS.ACTIVE;
    return [{
      text,
      status,
      label: complaintStatusLabel(status),
      encounterId: typeof lifecycle?.encounterId === "string" ? lifecycle.encounterId : encounter.id,
      recordedAt: typeof lifecycle?.recordedAt === "string" ? lifecycle.recordedAt : encounter.createdAt.toISOString(),
      source: typeof lifecycle?.source === "string" ? lifecycle.source : "ENCOUNTER",
      active: isActiveComplaintStatus(status)
    }];
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

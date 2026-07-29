"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  completeDoctorVisit,
  DoctorVisitRequestError,
  getDoctorVisitPacket,
  getEncounterReadiness,
  updateDoctorVisit,
  type DoctorVisitState,
  type EncounterReadiness
} from "../../lib/doctor-visit";

export const encounterStages = [
  { key: "patient-context", label: "Patient Context", ar: "سياق المريضة" },
  { key: "history", label: "History", ar: "التاريخ المرضي" },
  { key: "examination", label: "Examination", ar: "الفحص" },
  { key: "assessment", label: "Assessment", ar: "التقييم" },
  { key: "investigations", label: "Investigations", ar: "الفحوصات" },
  { key: "plan", label: "Plan", ar: "الخطة" },
  { key: "review", label: "Review", ar: "المراجعة" }
] as const;

export type EncounterStageKey = typeof encounterStages[number]["key"];
export type EncounterDraft = {
  chiefComplaint: string;
  historyText: string;
  examText: string;
  assessmentText: string;
  planText: string;
  examinationJson: Record<string, unknown>;
};
export type WorkspaceSaveState = "loading" | "saved" | "dirty" | "saving" | "waiting-sync" | "failed" | "offline" | "conflict" | "completed" | "read-only";
export type WorkspaceLoadState = "loading" | "partial-ready" | "ready" | "authentication-failed" | "access-denied" | "resource-failed";

export type EncounterWorkspaceController = {
  patientId: string;
  encounterId: string;
  visit: DoctorVisitState | null;
  patient: Record<string, unknown> | null;
  encounter: Record<string, unknown> | null;
  draft: EncounterDraft;
  activeStage: EncounterStageKey;
  setActiveStage: (stage: EncounterStageKey) => void;
  updateDraft: (patch: Partial<EncounterDraft>) => void;
  loadState: WorkspaceLoadState;
  resourceError: string | null;
  resourceErrors: Array<{ resource: string; message: string }>;
  saveState: WorkspaceSaveState;
  saveMessage: string;
  dirty: boolean;
  isReadOnly: boolean;
  serverRevision: string | null;
  lastSavedRevision: string | null;
  readiness: EncounterReadiness | null;
  readinessLoading: boolean;
  announce: string;
  reload: () => Promise<void>;
  save: () => Promise<boolean>;
  refreshReadiness: () => Promise<EncounterReadiness | null>;
  finish: () => Promise<boolean>;
  prepareModeSwitch: () => Promise<boolean>;
};

const emptyDraft: EncounterDraft = { chiefComplaint: "", historyText: "", examText: "", assessmentText: "", planText: "", examinationJson: {} };

export function useSharedEncounterWorkspaceController({ patientId, encounterId, initialStage = "history" }: { patientId: string; encounterId: string; initialStage?: EncounterStageKey }): EncounterWorkspaceController {
  const [visit, setVisit] = useState<DoctorVisitState | null>(null);
  const [draft, setDraft] = useState<EncounterDraft>(emptyDraft);
  const [activeStage, setActiveStage] = useState<EncounterStageKey>(initialStage);
  const [loadState, setLoadState] = useState<WorkspaceLoadState>("loading");
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<WorkspaceSaveState>("loading");
  const [serverRevision, setServerRevision] = useState<string | null>(null);
  const [lastSavedRevision, setLastSavedRevision] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<EncounterReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [announce, setAnnounce] = useState("");
  const dirtyRef = useRef(false);
  const draftRef = useRef(draft);
  const revisionRef = useRef<string | null>(null);
  const editVersionRef = useRef(0);
  const savingRef = useRef(false);
  const storageKey = `prij:encounter-draft:${encounterId}`;

  const load = useCallback(async () => {
    setLoadState("loading");
    setResourceError(null);
    try {
      const packet = await getDoctorVisitPacket(patientId, encounterId);
      const encounter = record(packet.encounter);
      if (!encounter || String(encounter.id ?? "") !== encounterId) throw new Error("The requested encounter could not be loaded.");
      const revision = String(encounter.updatedAt ?? "") || null;
      const nextDraft = draftFromEncounter(encounter);
      const readOnly = String(encounter.status ?? "draft") !== "draft";
      const hadUnsavedChanges = dirtyRef.current;
      const previousRevision = revisionRef.current;
      setVisit(packet);
      setServerRevision(revision);
      setLoadState(packet.resourceErrors?.length ? "partial-ready" : "ready");
      if (readOnly) {
        setDraft(nextDraft);
        draftRef.current = nextDraft;
        revisionRef.current = revision;
        setLastSavedRevision(revision);
        dirtyRef.current = false;
        setSaveState(String(encounter.status) === "signed" ? "completed" : "read-only");
      } else if (hadUnsavedChanges) {
        if (previousRevision === revision) {
          setSaveState(navigator.onLine ? "dirty" : "waiting-sync");
          setAnnounce("Related resources refreshed. Unsaved encounter changes were preserved.");
        } else {
          setSaveState("conflict");
          setAnnounce("The server encounter changed while local edits were pending. Reload and reconcile before saving.");
        }
      } else {
        setDraft(nextDraft);
        draftRef.current = nextDraft;
        revisionRef.current = revision;
        setLastSavedRevision(revision);
        dirtyRef.current = false;
        setSaveState("saved");
      }

      if (!readOnly && !hadUnsavedChanges && revision) {
        const recovered = readRecoveryDraft(storageKey, revision);
        if (recovered) {
          setDraft(recovered);
          draftRef.current = recovered;
          dirtyRef.current = true;
          setSaveState(navigator.onLine ? "dirty" : "waiting-sync");
          setAnnounce("Recovered unsaved encounter changes from this device.");
        }
      }
    } catch (error) {
      const state = error instanceof DoctorVisitRequestError && error.status === 401
        ? "authentication-failed"
        : error instanceof DoctorVisitRequestError && error.status === 403
          ? "access-denied"
          : "resource-failed";
      setLoadState(state);
      setResourceError(error instanceof Error ? error.message : "The encounter workspace could not be loaded.");
      setSaveState("failed");
    }
  }, [encounterId, patientId, storageKey]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setActiveStage(initialStage); }, [initialStage]);

  useEffect(() => {
    const online = () => {
      if (dirtyRef.current) {
        setSaveState("dirty");
        setAnnounce("Connection restored. Unsaved changes are ready to sync.");
      }
    };
    const offline = () => {
      if (dirtyRef.current) setSaveState("waiting-sync");
      else setSaveState((current) => current === "completed" || current === "read-only" ? current : "offline");
      setAnnounce("You are offline. Encounter changes will not be signed until they sync.");
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  const isReadOnly = useMemo(() => {
    const status = String(record(visit?.encounter)?.status ?? "draft");
    return status !== "draft";
  }, [visit]);

  const updateDraft = useCallback((patch: Partial<EncounterDraft>) => {
    if (isReadOnly) return;
    setDraft((current) => {
      const next = { ...current, ...patch };
      draftRef.current = next;
      dirtyRef.current = true;
      editVersionRef.current += 1;
      if (revisionRef.current) writeRecoveryDraft(storageKey, revisionRef.current, next);
      return next;
    });
    setReadiness(null);
    setSaveState(navigator.onLine ? "dirty" : "waiting-sync");
    setAnnounce("Encounter has unsaved changes.");
  }, [isReadOnly, storageKey]);

  const save = useCallback(async () => {
    if (isReadOnly) return true;
    if (!dirtyRef.current) return true;
    if (savingRef.current) return false;
    if (!navigator.onLine) {
      setSaveState("waiting-sync");
      setAnnounce("Offline. Changes are waiting to sync.");
      return false;
    }
    if (!revisionRef.current) {
      setSaveState("failed");
      setAnnounce("A server revision is required before saving.");
      return false;
    }
    setSaveState("saving");
    setAnnounce("Autosaving encounter changes.");
    savingRef.current = true;
    const savedEditVersion = editVersionRef.current;
    try {
      const updated = await updateDoctorVisit(patientId, encounterId, draftRef.current, revisionRef.current);
      const nextRevision = String(updated.updatedAt ?? "") || null;
      setServerRevision(nextRevision);
      setLastSavedRevision(nextRevision);
      revisionRef.current = nextRevision;
      setVisit((current) => current ? { ...current, encounter: { ...(record(current.encounter) ?? {}), ...updated } } : current);
      if (editVersionRef.current === savedEditVersion) {
        dirtyRef.current = false;
        localStorage.removeItem(storageKey);
        setSaveState("saved");
        setAnnounce("Encounter saved.");
      } else {
        dirtyRef.current = true;
        if (nextRevision) writeRecoveryDraft(storageKey, nextRevision, draftRef.current);
        setSaveState(navigator.onLine ? "dirty" : "waiting-sync");
        setAnnounce("Earlier changes were saved. Newer edits are still waiting to sync.");
      }
      return true;
    } catch (error) {
      if (error instanceof DoctorVisitRequestError && error.status === 409) {
        setSaveState("conflict");
        setAnnounce("Save conflict. Reload and reconcile before continuing.");
      } else {
        setSaveState("failed");
        setAnnounce(error instanceof Error ? error.message : "Encounter save failed.");
      }
      return false;
    } finally {
      savingRef.current = false;
    }
  }, [encounterId, isReadOnly, patientId, storageKey]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(() => { void save(); }, 1200);
    return () => window.clearTimeout(timer);
  }, [draft, save, saveState]);

  const refreshReadiness = useCallback(async () => {
    setReadinessLoading(true);
    try {
      const result = await getEncounterReadiness(encounterId);
      setReadiness(result);
      setAnnounce(result.ready ? "Encounter is ready for final review." : `${result.issues.filter((issue) => issue.severity === "blocking").length} blocking review issue(s).`);
      return result;
    } catch (error) {
      setAnnounce(error instanceof Error ? error.message : "Readiness check failed.");
      return null;
    } finally {
      setReadinessLoading(false);
    }
  }, [encounterId]);

  const finish = useCallback(async () => {
    if (!await save()) return false;
    const result = await refreshReadiness();
    if (!result?.ready || !revisionRef.current) return false;
    try {
      const completed = await completeDoctorVisit(encounterId, revisionRef.current);
      setVisit((current) => current ? { ...current, encounter: { ...(record(current.encounter) ?? {}), ...completed } } : current);
      setSaveState("completed");
      setAnnounce("Encounter signed and completed. It is now read-only.");
      dirtyRef.current = false;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      if (error instanceof DoctorVisitRequestError) {
        const nested = record(error.payload.readiness);
        if (nested) setReadiness(nested as EncounterReadiness);
        if (error.status === 409) setSaveState("conflict");
      }
      setAnnounce(error instanceof Error ? error.message : "Encounter completion failed.");
      return false;
    }
  }, [encounterId, refreshReadiness, save, storageKey]);

  const prepareModeSwitch = useCallback(async () => {
    if (["saving", "conflict", "failed", "waiting-sync", "offline"].includes(saveState)) return false;
    return dirtyRef.current ? save() : true;
  }, [save, saveState]);

  return {
    patientId,
    encounterId,
    visit,
    patient: record(visit?.patient),
    encounter: record(visit?.encounter),
    draft,
    activeStage,
    setActiveStage,
    updateDraft,
    loadState,
    resourceError,
    resourceErrors: visit?.resourceErrors ?? [],
    saveState,
    saveMessage: saveStateLabel(saveState),
    dirty: dirtyRef.current,
    isReadOnly,
    serverRevision,
    lastSavedRevision,
    readiness,
    readinessLoading,
    announce,
    reload: load,
    save,
    refreshReadiness,
    finish,
    prepareModeSwitch
  };
}

export function stageFromModule(moduleKey?: string): EncounterStageKey {
  if (!moduleKey || moduleKey === "encounter") return "history";
  if (["complaint", "history"].includes(moduleKey)) return "history";
  if (moduleKey === "examination") return "examination";
  if (moduleKey === "impression") return "assessment";
  if (["investigations", "ultrasound"].includes(moduleKey)) return "investigations";
  if (["prescription", "follow-up"].includes(moduleKey)) return "plan";
  if (moduleKey === "finish") return "review";
  return "patient-context";
}

function draftFromEncounter(encounter: Record<string, unknown>): EncounterDraft {
  return {
    chiefComplaint: String(encounter.chiefComplaint ?? ""),
    historyText: String(encounter.historyText ?? ""),
    examText: String(encounter.examText ?? ""),
    assessmentText: String(encounter.assessmentText ?? ""),
    planText: String(encounter.planText ?? ""),
    examinationJson: record(encounter.examinationJson) ?? {}
  };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readRecoveryDraft(key: string, revision: string): EncounterDraft | null {
  try {
    const value = record(JSON.parse(localStorage.getItem(key) ?? "null"));
    return value?.baseRevision === revision && record(value.draft) ? value.draft as EncounterDraft : null;
  } catch { return null; }
}

function writeRecoveryDraft(key: string, baseRevision: string, draft: EncounterDraft) {
  localStorage.setItem(key, JSON.stringify({ baseRevision, savedAt: new Date().toISOString(), draft }));
}

function saveStateLabel(state: WorkspaceSaveState) {
  const labels: Record<WorkspaceSaveState, string> = {
    loading: "Loading encounter", saved: "Saved", dirty: "Unsaved changes", saving: "Autosaving", "waiting-sync": "Waiting to sync", failed: "Save failed", offline: "Offline", conflict: "Version conflict", completed: "Completed · read-only", "read-only": "Read-only historical encounter"
  };
  return labels[state];
}
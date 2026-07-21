export type ClinicRefreshDependency = "queue" | "appointments" | "patient" | "timeline" | "owner-operations";

const EVENT_NAME = "clinic-data:changed";
const CHANNEL_NAME = "prij-clinic-data";

export type ClinicDataChange = { dependencies: ClinicRefreshDependency[]; patientId?: string; occurredAt: number };

export function publishClinicDataChange(dependencies: ClinicRefreshDependency[], patientId?: string) {
  const detail: ClinicDataChange = { dependencies, patientId, occurredAt: Date.now() };
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  if (dependencies.includes("queue")) window.dispatchEvent(new CustomEvent("clinic-queue:changed", { detail }));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(detail);
    channel.close();
  }
}

export function subscribeToClinicData(dependency: ClinicRefreshDependency, listener: (change: ClinicDataChange) => void) {
  const local = (event: Event) => {
    const change = (event as CustomEvent<ClinicDataChange>).detail;
    if (change?.dependencies.includes(dependency)) listener(change);
  };
  window.addEventListener(EVENT_NAME, local);
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  if (channel) channel.onmessage = (event: MessageEvent<ClinicDataChange>) => {
    if (event.data?.dependencies.includes(dependency)) listener(event.data);
  };
  return () => { window.removeEventListener(EVENT_NAME, local); channel?.close(); };
}

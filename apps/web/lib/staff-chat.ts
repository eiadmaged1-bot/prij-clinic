import { getApiBaseUrl } from "./api-base-url";

function authHeaders() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("prijClinicToken") : null;
  return { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) }
  });
  if (!response.ok) throw new Error("Could not load staff messages.");
  return (await response.json()) as T;
}

export type StaffDirectoryUser = { id: string; displayName: string; roles: string[]; doctorColor?: string | null };
export type StaffConversation = { id: string; title: string; patientId?: string | null; updatedAt: string; latestMessage?: StaffMessage | null };
export type StaffMessage = { id: string; senderUserId: string; senderName: string; body: string; createdAt: string; seenStatus: string; patientId?: string | null };

export function listStaffDirectory() {
  return request<{ staff: StaffDirectoryUser[] }>("/staff-chat/directory");
}

export function listStaffConversations() {
  return request<{ conversations: StaffConversation[] }>("/staff-chat/conversations");
}

export function getUnreadStaffChatCount() {
  return request<{ unreadCount: number }>("/staff-chat/unread-count");
}

export function getOrCreateDirectConversation(userId: string, patientId?: string) {
  return request<{ conversation: StaffConversation }>("/staff-chat/direct", { method: "POST", body: JSON.stringify({ userId, patientId }) });
}

export function listStaffMessages(conversationId: string) {
  return request<{ messages: StaffMessage[] }>(`/staff-chat/conversations/${encodeURIComponent(conversationId)}/messages`);
}

export function sendStaffMessage(conversationId: string, body: string, patientId?: string) {
  return request<{ message: StaffMessage }>(`/staff-chat/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", body: JSON.stringify({ body, patientId }) });
}

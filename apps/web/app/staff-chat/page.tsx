"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "../mvp-page";
import { ThreeDMedicalIcon } from "../../components/ThreeDMedicalIcon";
import {
  StaffConversation,
  StaffDirectoryUser,
  StaffMessage,
  getOrCreateDirectConversation,
  listStaffConversations,
  listStaffDirectory,
  listStaffMessages,
  sendStaffMessage
} from "@/lib/staff-chat";

export default function StaffChatPage() {
  const [staff, setStaff] = useState<StaffDirectoryUser[]>([]);
  const [conversations, setConversations] = useState<StaffConversation[]>([]);
  const [active, setActive] = useState<StaffConversation | null>(null);
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const [directory, conversationResult] = await Promise.all([listStaffDirectory(), listStaffConversations()]);
      setStaff(directory.staff);
      setConversations(conversationResult.conversations);
      setStatus("Ready");
    } catch {
      setStatus("Messages unavailable");
    }
  }

  async function openDirect(userId: string) {
    const result = await getOrCreateDirectConversation(userId);
    const conversation = result.conversation;
    setActive(conversation);
    const messageResult = await listStaffMessages(conversation.id);
    setMessages(messageResult.messages);
    await load();
  }

  async function openConversation(conversation: StaffConversation) {
    setActive(conversation);
    const messageResult = await listStaffMessages(conversation.id);
    setMessages(messageResult.messages);
    await load();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !body.trim()) return;
    await sendStaffMessage(active.id, body);
    setBody("");
    const messageResult = await listStaffMessages(active.id);
    setMessages(messageResult.messages);
    await load();
  }

  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Internal Staff Chat</p>
            <h1>Clinic messages</h1>
            <p className="muted">Operational staff messages with per-recipient seen status. Patient-linked messages are not formal clinical notes.</p>
          </div>
          <ThreeDMedicalIcon name="files" size="md" tone="navy" />
        </div>
      </section>

      <section className="staff-chat-layout">
        <aside className="panel compact-panel staff-chat-sidebar">
          <div className="section-heading"><h2>Conversations</h2><span className="badge">{status}</span></div>
          <div className="dense-card-list">
            {conversations.map((conversation) => (
              <button className={`picker-row ${active?.id === conversation.id ? "active" : ""}`} type="button" key={conversation.id} onClick={() => void openConversation(conversation)}>
                <strong>{conversation.title}</strong>
                <span>{conversation.latestMessage?.body ?? "No messages yet"}</span><span>{conversation.unreadCount ? `${conversation.unreadCount} unread · ` : ""}{new Date(conversation.updatedAt).toLocaleString()}</span>
              </button>
            ))}
          </div>
          <div className="section-heading staff-picker-heading"><h2>Staff</h2></div>
          <div className="dense-card-list">
            {staff.map((member) => (
              <button className="picker-row" type="button" key={member.id} onClick={() => void openDirect(member.id)}>
                <strong><span className="doctor-color-dot" style={{ background: member.doctorColor ?? "#64748B" }} />{member.displayName}</strong>
                <span>{member.roles.join(", ")} · {member.branchName || "Assigned branches"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel staff-chat-thread">
          <div className="section-heading">
            <h2>{active?.title ?? "Select a conversation"}</h2>
            <span className="badge">Seen/read status</span>
          </div>
          <div className="message-list">
            {messages.length === 0 ? <p className="empty-state"><ThreeDMedicalIcon name="files" size="sm" tone="slate" /><span>No messages in this conversation.</span></p> : null}
            {messages.map((message) => (
              <article className="staff-message" key={message.id}>
                <div className="data-row-header"><strong>{message.senderName}</strong><span className="badge">{message.seenStatus}</span></div>
                <p>{message.body}</p>
                <small>{new Date(message.createdAt).toLocaleString()}</small>
                {message.patientId ? <span className="badge warning">Linked to patient</span> : null}
              </article>
            ))}
          </div>
          <form className="staff-chat-compose" onSubmit={submit}>
            <label>Message<textarea disabled={!active} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder={active ? "Write an internal staff message" : "Select a conversation first"} /></label>
            <button className="button" type="submit" disabled={!active || !body.trim()}>Send</button>
          </form>
        </section>
      </section>
    </AppShell>
  );
}

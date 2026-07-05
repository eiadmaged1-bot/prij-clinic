"use client";

import { SafeAiAssistantPanel } from "../../components/ai-assistant/SafeAiAssistantPanel";
import { AppShell, SafetyAlert } from "../mvp-page";

export default function AiAssistantPage() {
  return (
    <AppShell>
      <section className="page-header">
        <div className="header-row">
          <div>
            <p className="eyebrow">Safe AI Assistant</p>
            <h1>Assistant draft workspace</h1>
          </div>
          <div className="topbar-actions">
            <span className="badge warning">Draft - doctor review required</span>
            <span className="badge">External AI disabled</span>
          </div>
        </div>
        <p className="muted">Generate local draft summaries, missing-field checklists, follow-up reminder drafts, and patient-file search results without external AI calls.</p>
      </section>
      <SafetyAlert />
      <SafeAiAssistantPanel />
    </AppShell>
  );
}

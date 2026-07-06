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
            <span className="badge warning">Draft only · Doctor approval required · Local/private</span>
          </div>
        </div>
      </section>
      <SafetyAlert />
      <SafeAiAssistantPanel />
    </AppShell>
  );
}

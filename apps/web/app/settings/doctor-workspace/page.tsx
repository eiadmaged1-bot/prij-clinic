"use client";

import { DoctorWorkspaceModeSettings } from "@/components/settings/DoctorWorkspaceModeSettings";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

export default function DoctorWorkspaceSettingsPage() {
  const { status, user } = useSession();
  const allowed = Boolean(user?.roles.some((role) => role === "Doctor" || role === "Owner"));

  return <AppShell>
    <main aria-labelledby="doctor-workspace-heading">
      <section className="page-header">
        <p className="eyebrow">Personal settings</p>
        <h1 id="doctor-workspace-heading">Doctor workspace</h1>
        <p className="muted">Choose how active encounters are presented. Your clinical record remains the same.</p>
      </section>
      {status === "loading" ? <section className="panel" aria-busy="true">Loading workspace settings…</section>
        : status === "unauthenticated" ? <section className="panel safety-alert" role="alert">Your session ended. Sign in again to continue.</section>
          : !allowed ? <section className="panel safety-alert" role="alert"><h2>Access denied</h2><p>Doctor workspace preferences are available to Doctor and Owner roles only.</p></section>
            : <section className="panel"><DoctorWorkspaceModeSettings /></section>}
    </main>
  </AppShell>;
}
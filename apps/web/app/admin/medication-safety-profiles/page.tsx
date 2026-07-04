"use client";

import { MedicationSafetyProfileSearch } from "../../../components/care-assist/MedicationSafetyProfileSearch";
import { AppShell } from "../../mvp-page";
import { useSession } from "../../session";

export default function AdminMedicationSafetyProfilesPage() {
  const { user, status } = useSession();
  const canManageProfiles = Boolean(
    user?.roles.includes("Owner") ||
      user?.roles.includes("Admin") ||
      user?.permissions.includes("medication_safety_profile.manage")
  );

  return (
    <AppShell>
      <section className="page-header">
        <h1>Medication Safety Profiles</h1>
        <p className="muted">Pregnancy/lactation source and review metadata. Doctor review required.</p>
      </section>
      {status === "loading" ? <section className="panel"><div className="skeleton" /></section> : null}
      {status === "unauthenticated" ? (
        <section className="panel">
          <p className="form-error">Sign in with an Owner/Admin account to review medication safety source metadata.</p>
        </section>
      ) : null}
      {status === "authenticated" && !canManageProfiles ? (
        <section className="panel">
          <p className="form-error">Owner/Admin access is required for medication safety source review.</p>
        </section>
      ) : null}
      {status === "authenticated" && canManageProfiles ? <MedicationSafetyProfileSearch /> : null}
    </AppShell>
  );
}

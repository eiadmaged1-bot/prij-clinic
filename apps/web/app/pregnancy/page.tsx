import { MvpPage } from "../mvp-page";

export default function PregnancyPage() {
  return (
    <MvpPage
      eyebrow="OB care"
      title="Pregnancy"
      items={[
        "Pregnancy overview records linked to patient profiles",
        "Gravida, para, dates, risk label, and notes are stored as structured draft data",
        "Pregnancy record changes are protected by RBAC and audit logging"
      ]}
    />
  );
}

import { GuidelineCenterClient } from "../../components/guidelines/GuidelineCenterClient";
import { AppShell, SafetyAlert } from "../mvp-page";

export default function GuidelinesPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Guideline Center</p>
        <h1>Guideline Center</h1>
        <p className="muted">Evidence library only. Doctor review required.</p>
      </section>
      <SafetyAlert />
      <GuidelineCenterClient mode="home" />
    </AppShell>
  );
}

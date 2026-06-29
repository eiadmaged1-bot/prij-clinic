import { GuidelineCenterClient } from "../../../components/guidelines/GuidelineCenterClient";
import { AppShell, SafetyAlert } from "../../mvp-page";

export default function GuidelineSourcesPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Guideline Center</p>
        <h1>Source registry</h1>
      </section>
      <SafetyAlert />
      <GuidelineCenterClient mode="sources" />
    </AppShell>
  );
}

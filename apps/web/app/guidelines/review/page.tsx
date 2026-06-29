import { GuidelineCenterClient } from "../../../components/guidelines/GuidelineCenterClient";
import { AppShell, SafetyAlert } from "../../mvp-page";

export default function GuidelineReviewPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Guideline Center</p>
        <h1>Governance review</h1>
      </section>
      <SafetyAlert />
      <GuidelineCenterClient mode="review" />
    </AppShell>
  );
}

import { GuidelineCenterClient } from "../../../components/guidelines/GuidelineCenterClient";
import { AppShell, SafetyAlert } from "../../mvp-page";

export default function GuidelineSearchPage() {
  return (
    <AppShell>
      <section className="page-header">
        <p className="eyebrow">Guideline Center</p>
        <h1>Search evidence</h1>
      </section>
      <SafetyAlert />
      <GuidelineCenterClient mode="search" />
    </AppShell>
  );
}

import { AppShell } from "../../../mvp-page";
import { MergeCandidatePanel, ReviewQueuePanel } from "../../../../components/medications/MedicationComponents";

export default function AdminDrugMarketReviewQueuePage() {
  return (
    <AppShell>
      <section className="page-header">
        <h1>Medication Review Queue</h1>
        <p className="muted">Review low-confidence official rows, source conflicts, price conflicts, and duplicate candidates before verification.</p>
      </section>
      <ReviewQueuePanel />
      <MergeCandidatePanel />
    </AppShell>
  );
}

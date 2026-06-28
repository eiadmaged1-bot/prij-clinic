import { MvpPage } from "../mvp-page";

export default function ReportsPage() {
  return (
    <MvpPage
      eyebrow="Reports"
      title="Reports"
      items={[
        "Report record foundation for uploaded or external results",
        "Review status separates uploaded results from doctor-reviewed reports",
        "Report create, update, review, and void actions are audit logged"
      ]}
      endpoint="/reports"
      collectionKey="reports"
      createEndpoint="/reports"
      createNote="Record reference only. Do not upload or reference real PHI files."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "category", label: "Category", required: true, defaultValue: "laboratory" },
        { name: "title", label: "Title", required: true, defaultValue: "Demo report placeholder" },
        { name: "source", label: "Source", defaultValue: "local_demo" },
        { name: "resultSummary", label: "Summary", defaultValue: "Demo report summary only. Doctor review required." }
      ]}
    />
  );
}

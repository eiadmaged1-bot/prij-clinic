import { ClinicOperationsPage } from "../clinic-operations-page";

export default function ReportsPage() {
  return (
    <ClinicOperationsPage
      mode="reports"
      eyebrow="Reports"
      title="Daily Clinic Reports"
      description="Daily appointments, queue, visits, billing notes, investigations, pending results, and role summaries are shown without exporting PHI."
    />
  );
}

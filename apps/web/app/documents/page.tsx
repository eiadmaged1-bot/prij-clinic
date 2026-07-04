import { ClinicOperationsPage } from "../clinic-operations-page";

export default function DocumentsPage() {
  return (
    <ClinicOperationsPage
      mode="documents"
      eyebrow="Document archive"
      title="Documents"
      description="Patient document and result timelines stay metadata-first, audited, and protected by existing upload sanitization."
    />
  );
}

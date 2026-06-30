import { MvpPage } from "../mvp-page";

export default function DocumentsPage() {
  return (
    <MvpPage
      eyebrow="Document archive"
      title="Documents"
      items={[
        "Document archive is metadata-only in this demo",
        "Files are treated as untrusted and production PHI storage is future work",
        "Review, archive, and void actions are audited and reason-controlled"
      ]}
    />
  );
}

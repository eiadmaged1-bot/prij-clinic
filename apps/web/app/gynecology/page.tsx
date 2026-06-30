import { MvpPage } from "../mvp-page";

export default function GynecologyPage() {
  return (
    <MvpPage
      title="Gynecology"
      eyebrow="Women's Health"
      items={[
        "Open patient file before recording gynecology details.",
        "Use recording-only templates for clinician-entered findings.",
        "Doctor-written impression and plan stay under doctor control.",
        "No diagnosis, treatment selection, contraception recommendation, or prescribing automation."
      ]}
      endpoint="/gynecology-visits"
      collectionKey="gynecologyVisits"
      primaryAction={["/patients", "Open Patient Files"]}
    />
  );
}

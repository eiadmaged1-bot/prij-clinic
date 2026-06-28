import { MvpPage } from "../mvp-page";

export default function EncountersPage() {
  return (
    <MvpPage
      eyebrow="Clinical records"
      title="Encounters"
      items={[
        "Doctor-authored encounter draft foundation",
        "Signed encounters are blocked from silent edits",
        "Create, update, and sign actions are audit logged"
      ]}
    />
  );
}

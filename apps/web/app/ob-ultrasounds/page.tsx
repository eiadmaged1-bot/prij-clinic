import { MvpPage } from "../mvp-page";

export default function ObUltrasoundsPage() {
  return (
    <MvpPage
      eyebrow="OB ultrasound"
      title="OB Ultrasounds"
      items={[
        "Structured OB ultrasound draft measurements and findings",
        "Measurements stay recording-only for doctor review",
        "Doctor review status and audit logging are part of the foundation"
      ]}
      endpoint="/ob-ultrasounds"
      collectionKey="obUltrasounds"
      createEndpoint="/ob-ultrasounds"
      createNote="Demo measurements only. The doctor completes all clinical interpretation."
      createFields={[
        { name: "patientId", label: "Patient ID", required: true },
        { name: "pregnancyId", label: "Pregnancy ID" },
        { name: "encounterId", label: "Encounter ID" },
        { name: "gestationalAgeWeeks", label: "GA weeks", type: "number" },
        { name: "gestationalAgeDays", label: "GA days", type: "number" },
        { name: "fetalHeartRateBpm", label: "FHR bpm", type: "number" },
        { name: "impressionText", label: "Draft note", defaultValue: "Demo OB ultrasound note only. Doctor review required." }
      ]}
    />
  );
}

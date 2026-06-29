import { MvpPage } from "../mvp-page";

export default function ObUltrasoundsPage() {
  return (
    <MvpPage
      eyebrow="OB ultrasound"
      title="OB Ultrasounds"
      items={[
        "OB patient files show current GA and EDD context when a reviewed dating estimate exists",
        "Use ultrasound GA as a dating candidate from the patient Pregnancy/OB review panel",
        "Structured OB ultrasound draft measurements and findings",
        "No diagnostic fetal-image AI or automatic clinical conclusions",
        "Raw biometry measurements remain recording-only until formulas are verified",
        "Doctor review status and audit logging are part of the foundation"
      ]}
      endpoint="/ob-ultrasounds"
      collectionKey="obUltrasounds"
      createEndpoint="/ob-ultrasounds"
      createNote="Demo measurements only. Ultrasound biometry formulas are not used for clinical dating, EFW, percentile, Doppler interpretation, or FGR diagnosis unless verified later."
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

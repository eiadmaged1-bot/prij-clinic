import { MvpPage } from "../mvp-page";

export default function ObUltrasoundsPage() {
  return (
    <MvpPage
      eyebrow="OB ultrasound"
      title="OB Ultrasounds"
      items={[
        "Structured OB ultrasound draft measurements and findings",
        "No diagnostic fetal-image AI or automatic clinical conclusions",
        "Doctor review status and audit logging are part of the foundation"
      ]}
    />
  );
}

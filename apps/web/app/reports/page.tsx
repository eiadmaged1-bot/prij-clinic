import { MvpPage } from "../mvp-page";

export default function ReportsPage() {
  return (
    <MvpPage
      eyebrow="Reports"
      title="Reports"
      items={[
        "Report metadata foundation for uploaded or external results",
        "Review status separates uploaded results from doctor-reviewed reports",
        "Report create, update, review, and void actions are audit logged"
      ]}
    />
  );
}

import { MvpPage } from "../mvp-page";

export default function OrdersPage() {
  return (
    <MvpPage
      eyebrow="Orders"
      title="Orders Workspace"
      items={[
        "Lab orders, radiology orders, and service orders are visible in one workflow.",
        "Statuses are ordered, pending result, completed, and cancelled.",
        "Result attachment is a placeholder only; use existing safe storage policy before real files."
      ]}
      endpoint="/investigations/orders"
      collectionKey="investigationOrders"
      createEndpoint="/investigations/orders"
      createNote="Create demo-only orders from a patient file when possible. No external lab integration is connected."
      createFields={[
        { name: "patientId", label: "Patient file", required: true },
        { name: "testName", label: "Order name", required: true, defaultValue: "Demo lab order" },
        { name: "priority", label: "Priority", defaultValue: "routine" },
        { name: "instructions", label: "Clinical reason" }
      ]}
    />
  );
}

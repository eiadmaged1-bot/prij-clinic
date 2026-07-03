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
        {
          name: "category",
          label: "Order category",
          type: "select",
          required: true,
          defaultValue: "laboratory",
          options: [
            { label: "Laboratory", value: "laboratory" },
            { label: "Radiology", value: "radiology" },
            { label: "Ultrasound", value: "ultrasound" },
            { label: "Pathology", value: "pathology" },
            { label: "Cytology", value: "cytology" },
            { label: "Procedure", value: "procedure" },
            { label: "Other", value: "other" }
          ]
        },
        {
          name: "testName",
          label: "Order name",
          required: true,
          suggestionsEndpoint: "/investigations/catalog",
          suggestionCollectionKey: "investigationCatalog",
          suggestionLabelKey: "name"
        },
        { name: "priority", label: "Priority", defaultValue: "routine" },
        { name: "instructions", label: "Clinical reason" }
      ]}
    />
  );
}

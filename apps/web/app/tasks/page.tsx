import { MvpPage } from "../mvp-page";

export default function TasksPage() {
  return (
    <MvpPage
      eyebrow="Task inbox"
      title="Tasks"
      items={[
        "Open tasks, overdue work, result reviews, consents, and follow-ups",
        "Accountant views remain limited to finance-related tasks",
        "Cancelled tasks require a reason and stay in history"
      ]}
      endpoint="/patient-tasks"
      collectionKey="patientTasks"
    />
  );
}

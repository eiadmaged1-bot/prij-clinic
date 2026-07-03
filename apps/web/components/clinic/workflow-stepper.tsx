export function WorkflowStepper({ steps }: { steps: string[] }) {
  return (
    <div className="workflow-band">
      {steps.map((step) => (
        <span key={step}>{step}</span>
      ))}
    </div>
  );
}

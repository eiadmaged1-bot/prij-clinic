import { AppShell, SafetyAlert } from "@/app/mvp-page";
import { ActiveVisitWorkspace } from "@/components/clinic/ActiveVisitWorkspace";

export default async function ActiveVisitPage({
  params
}: {
  params: Promise<{ id: string; visitId: string; module?: string[] }>;
}) {
  const { id, visitId, module } = await params;
  return (
    <AppShell>
      <SafetyAlert />
      <ActiveVisitWorkspace patientId={id} visitId={visitId} moduleKey={module?.[0]} />
    </AppShell>
  );
}

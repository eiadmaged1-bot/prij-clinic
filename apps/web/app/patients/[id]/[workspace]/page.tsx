import { notFound, redirect } from "next/navigation";

const legacyWorkspaceRoutes: Record<string, string> = {
  overview: "overview",
  timeline: "timeline",
  visits: "doctor-visit",
  prescriptions: "prescriptions",
  investigations: "investigations",
  pregnancy: "pregnancy",
  gynecology: "gynecology",
  infertility: "infertility",
  documents: "documents",
  billing: "billing",
  consents: "consents"
};

export default async function LegacyPatientWorkspaceRoute({ params }: { params: Promise<{ id: string; workspace: string }> }) {
  const { id, workspace } = await params;
  const moduleKey = legacyWorkspaceRoutes[workspace.toLowerCase()];
  if (!moduleKey) notFound();
  redirect(`/patients/${encodeURIComponent(id)}?module=${encodeURIComponent(moduleKey)}`);
}
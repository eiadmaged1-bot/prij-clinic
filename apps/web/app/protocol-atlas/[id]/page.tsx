"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/app/mvp-page";
import { useSession } from "@/app/session";
import { getProtocol, getProtocolEditor, updateProtocolCompletion, type ClinicalProtocol } from "@/lib/protocol-atlas";

const sections = ["scope", "inclusion", "exclusion", "requiredHistory", "examination", "investigations", "redFlags", "management", "medicationConsiderations", "followUp", "escalationReferral", "counselling", "sourceVersion", "clinicWorkflow", "reviewer", "approval"] as const;

export default function ProtocolWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();
  const canEdit = Boolean(user?.roles.some((role) => ["Owner", "Admin"].includes(role)));
  const [protocol, setProtocol] = useState<(ClinicalProtocol & { completionQuestionnaireJson?: Record<string, unknown>; connectionsJson?: Record<string, unknown>; completionPercentage?: number; completionVersion?: number }) | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Loading protocol…");

  useEffect(() => { void (canEdit ? getProtocolEditor(id) : getProtocol(id)).then((data) => { const item = data as typeof protocol; setProtocol(item); const stored = item?.completionQuestionnaireJson ?? {}; setAnswers(Object.fromEntries(sections.map((key) => [key, Array.isArray(stored[key]) ? (stored[key] as string[]).join("\n") : ""]))); setStatus("Protocol loaded. Doctor review required."); }).catch(() => setStatus("Protocol is unavailable for this role.")); }, [canEdit, id]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!protocol || !reason.trim()) return setStatus("An audit reason is required.");
    try {
      const questionnaire = Object.fromEntries(sections.map((key) => [key, answers[key]?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) ?? []]));
      const connections = Object.fromEntries(Object.entries(protocol.connectionsJson ?? {}).map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : []]));
      const saved = await updateProtocolCompletion(id, { reason: reason.trim(), questionnaire, connections });
      setProtocol({ ...protocol, ...saved }); setReason(""); setStatus("Draft questionnaire saved and completion recalculated. This does not approve or apply the protocol.");
    } catch { setStatus("Protocol draft could not be saved. Check permission and required fields."); }
  }

  const reference = referenceContent(protocol?.contentJson);

  return <AppShell><section className="page-header"><p className="eyebrow">Protocol completion studio</p><h1>{protocol?.title ?? "Clinical protocol"}</h1><p className="muted">{status}</p><Link className="button secondary compact" href="/protocol-atlas">Back to Protocol Atlas</Link></section>{protocol ? <><section className="knowledge-metric-grid"><article><strong>{protocol.completionPercentage ?? 0}%</strong><span>Reference structure</span></article><article><strong>{friendlyState(protocol.publicationState ?? protocol.implementationStatus)}</strong><span>Publication state</span></article><article><strong>{protocol.completionVersion ?? 1}</strong><span>Completion version</span></article></section><section className="panel"><h2>Source and governance</h2><p>{protocol.sourceName} · {protocol.sourceVersion ?? protocol.sourceYear ?? "Version/date not recorded"}</p>{protocol.sourceIdentifier ? <p className="muted">Source ID: <Link href={`/guidelines/${encodeURIComponent(protocol.sourceIdentifier)}`}>{protocol.sourceIdentifier}</Link></p> : null}{protocol.sourceRetrievedAt ? <p className="muted">Registry checked: {new Date(protocol.sourceRetrievedAt).toLocaleDateString()}</p> : null}{protocol.sourceUrl ? <a href={protocol.sourceUrl} target="_blank" rel="noreferrer">Open authoritative source</a> : <p className="warning-text">No source URL is attached; verification cannot be completed.</p>}<p className="notice">This protocol is assistive. It cannot diagnose, prescribe, order, or change a patient record. Doctor review is required.</p></section>{reference ? <section className="protocol-reference-grid" aria-label="Structured source reference"><ReferenceCard title="Purpose" value={reference.purpose} /><ReferenceCard title="Scope" value={reference.scope} /><ReferenceCard title="Entry criteria" value={reference.entryCriteria} /><ReferenceCard title="Exclusions" value={reference.exclusions} /><ReferenceCard title="Required information" value={reference.requiredInformation} /><ReferenceCard title="Red flags" value={reference.redFlags} /><ReferenceCard title="Assessment steps" value={reference.assessmentSteps} /><ReferenceCard title="Relevant investigations" value={reference.investigations} /><ReferenceCard title="Medication references" value={reference.medicationClasses} /><ReferenceCard title="Ultrasound links" value={reference.ultrasoundLinks} /><ReferenceCard title="Referral and escalation" value={reference.referralEscalation} /><ReferenceCard title="Follow-up" value={reference.followUp} /><ReferenceCard title="Patient information" value={reference.patientInformation} /><ReferenceCard title="Source citations" value={reference.sourceCitations.map((citation) => `${citation.sourceIdentifier} · ${citation.version} · ${citation.section}${citation.page ? ` · p. ${citation.page}` : " · web section"}`)} /></section> : null}{canEdit ? <form className="panel protocol-questionnaire" onSubmit={(event) => void save(event)}><div className="section-heading"><h2>Clinic customization questionnaire</h2><span className="badge warning">Local changes stay draft until approved</span></div>{sections.map((key) => <label key={key}>{label(key)}<textarea value={answers[key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))} placeholder="One source-backed answer per line; leave blank when unresolved" /></label>)}<label>Audit reason<input value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={500} /></label><button className="button" type="submit">Save local draft questionnaire</button></form> : <section className="panel"><p className="empty-state compact">Questionnaire editing is restricted to Owner/Admin. Doctors may review published references but cannot silently alter the clinic template.</p></section>}</> : <div className="skeleton" />}</AppShell>;
}

function label(value: string) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
function friendlyState(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()); }
type ReferenceContent = { purpose: string; scope: string[]; entryCriteria: string[]; exclusions: string[]; requiredInformation: string[]; redFlags: string[]; assessmentSteps: string[]; investigations: string[]; medicationClasses: string[]; ultrasoundLinks: string[]; referralEscalation: string[]; followUp: string[]; patientInformation: string[]; sourceCitations: Array<{ sourceIdentifier: string; version: string; section: string; page?: number | null }> };
function referenceContent(value: unknown): ReferenceContent | null { if (!value || typeof value !== "object" || !("purpose" in value)) return null; return value as ReferenceContent; }
function ReferenceCard({ title, value }: { title: string; value: string | string[] }) { const items = Array.isArray(value) ? value : [value]; return <article className="panel compact-panel"><h2>{title}</h2><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>; }

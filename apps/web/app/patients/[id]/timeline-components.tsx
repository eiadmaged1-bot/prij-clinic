import Link from "next/link";
import Image from "next/image";
import { AppActionButton } from "@/components/actions/AppActionButton";
import { AppActionLink } from "@/components/actions/AppActionLink";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";
import { HerbalSearchPanel, MedicationSafetyPanel, PatientAllergyList, PatientMedicationList, PrescriptionSafetyPanel } from "../../../components/medications/MedicationComponents";
import { PregnancyDatingCard } from "../../../components/patients/PregnancyDatingCard";
import { patientWorkspaceRegistry, visiblePatientWorkspaceItems } from "../../../components/patients/patient-workspace-registry";
import { DoctorMobilePatientHeader } from "../../../components/doctor/DoctorMobilePatientHeader";
import { DoctorMobileVisitFooter } from "../../../components/doctor/DoctorMobileVisitFooter";
import { AppShell, SafetyAlert } from "../../mvp-page";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { visitTypeLabel } from "@/lib/visit-types";
import { useInterfaceMode } from "@/lib/interface-mode";
import type { PatientWorkspaceSummary } from "@prij-clinic/shared";
import { createDoctorVisitFollowUp, getCurrentDoctorVisit, getDoctorVisitPacket, startDoctorVisit, updateDoctorVisit, type DoctorVisitState } from "@/lib/doctor-visit";
import { searchMedications, type MedicationResult } from "@/lib/medications";
import { patientQrSvgDataUri } from "@/lib/patient-qr";
import { ageLabel as patientAgeLabel, patientTypeLabel, patientTypeOptions, phaseTypeLabel } from "@/lib/patient-labels";
import { caseBoards, conceptionMethodChips, currentPregnancyTags, feedItemTypes, importantPatientBannerItems, previousHistoryChips, smartClinicalTags } from "@/lib/v1200-productivity";
import type { Patient, TimelineItem } from "./patient-components";
import { formatDateTime } from "./workspace-formatters";

export function Timeline({ patient, items, hasMore = false, onLoadMore }: { patient: Patient; items: TimelineItem[]; hasMore?: boolean; onLoadMore?: () => void }) {
    const [filter, setFilter] = useState("All");
    const filters = ["All", "Clinical", "Billing", "Documents", "Pregnancy", "Gynecology", "Investigations", "AI drafts", "Queue/appointments"];
    const baseItems = items.length > 0 ? items : [{ title: "Patient file opened", description: `MRN ${patient.medicalRecordNumber}`, type: "patients", status: patient.status, dateTime: new Date().toISOString() }];
    const displayItems = filter === "All" ? baseItems : baseItems.filter((item) => timelineMatchesFilter(item, filter));
    return (
    <section className="panel">
      <div className="section-heading">
        <h2>Timeline</h2>
        <span className="badge">{displayItems.length} items</span>
      </div>
      <div className="segmented-control timeline-filter-control" aria-label="Patient timeline filters">
        {filters.map((option) => (
          <button className={filter === option ? "active" : ""} key={option} type="button" onClick={() => setFilter(option)}>
            {option}
          </button>
        ))}
      </div>
      {displayItems.length === 0 ? <p className="empty-state compact smart-empty-state"><ThreeDMedicalIcon name="timeline" size="sm" tone="slate" /><span>No timeline items in this filter.</span></p> : null}
      <div className="timeline-list">
        {displayItems.map((item, index) => (
          <article className="timeline-item" key={`${item.title}-${index}`}>
            <ThreeDMedicalIcon name={timelineIcon(item.type)} size="sm" />
            <div>
              <div className="data-row-header">
                <strong>{item.title}</strong>
                <span className="badge">{item.status}</span>
              </div>
              <p className="muted">{formatDateTime(item.dateTime)} | {item.actor || "Clinic team"}</p>
              {item.doctorSignature?.doctorName ? <DoctorSignatureBadge signature={item.doctorSignature} /> : null}
              <p>{item.description}</p>
              {item.href ? <Link className="button compact secondary" href={item.href}>Open details</Link> : null}
            </div>
          </article>
        ))}
      </div>
      {hasMore ? <button className="button secondary" type="button" onClick={onLoadMore}>Load older events</button> : null}
    </section>
    );
}

export function timelineMatchesFilter(item: TimelineItem, filter: string) {
    const text = `${item.type} ${item.title} ${item.description}`.toLowerCase();
    const map: Record<string, string[]> = {
                    Clinical: ["visit", "encounter", "prescription", "clinical"],
                    Billing: ["billing", "invoice", "payment"],
                    Documents: ["document", "report", "consent", "file"],
                    Pregnancy: ["pregnancy", "antenatal", "ob"],
                    Gynecology: ["gynecology", "gyn"],
                    Investigations: ["investigation", "order", "result"],
                    "AI drafts": ["ai", "draft"],
                    "Queue/appointments": ["queue", "appointment"]
                  };
    return (map[filter] ?? []).some((keyword) => text.includes(keyword));
}

export function timelineIcon(key: string): IconName {
    if (key.includes("gynecology")) return "doctor";
    if (key.includes("visit") || key.includes("encounter")) return "encounter";
    if (key.includes("prescription")) return "prescription";
    if (key.includes("order") || key.includes("investigation")) return "investigations";
    if (key.includes("billing") || key.includes("invoice") || key.includes("payment")) return "billing";
    if (key.includes("document")) return "files";
    if (key.includes("referral")) return "reports";
    if (key.includes("task")) return "queue";
    if (key.includes("note")) return "doctor";
    if (key.includes("pregnancy")) return "pregnancy";
    if (key.includes("ultrasound")) return "ultrasound";
    if (key.includes("consent")) return "consent";
    return "timeline";
}

export function DoctorSignatureBadge({ signature }: { signature: NonNullable<TimelineItem["doctorSignature"]> }) {
    const color = signature.doctorColor ?? "#64748B";
    return (
    <p className="doctor-signature-badge">
      <span style={{ background: color }} />
      Seen by {signature.doctorName}
    </p>
    );
}

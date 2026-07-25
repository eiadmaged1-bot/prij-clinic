# Latest QA Calendar History Final Verify Run

- Run ID: `30178617794`
- Status: `completed`
- Conclusion: `failure`
- Head SHA: `798c81119ca6dfdc75c3c5d1fc66fcfde9cb4ab2`
- URL: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30178617794

## Run summary
```text

X security/rbac-scope-enforcement Prij Sprint 1 QA Calendar History Final Verify · 30178617794
Triggered via push about 5 minutes ago

JOBS
X Final verify compact calendar and History package in 1m46s (ID 89731386908)
  ✓ Set up job
  ✓ Prepare isolated SECTRA workspace
  ✓ Checkout QA repair branch
  ✓ Setup Node 22
  ✓ Load local development configuration safely
  ✓ Install and prepare verification prerequisites
  X Run all eight mandatory checks
  - Record verified Package 2
  ✓ Upload final diagnostics
  - Post Setup Node 22
  ✓ Post Checkout QA repair branch
  ✓ Complete job

ANNOTATIONS
requesting annotations returned 403 Forbidden as the token does not have sufficient permissions. Note that it is not currently possible to create a fine-grained PAT with the `checks:read` permission.

ARTIFACTS
qa-calendar-history-final-30178617794

To see what failed, try: gh run view 30178617794 --log-failed
View this run on GitHub: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30178617794
```

## Failed log tail
```text
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5347180Z   '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5351125Z   '    title: "Presenting complaint",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5355348Z   '    sourceType: "manual",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5359572Z   '    items: [["aub", "AUB"], ["pelvic_pain", "Pelvic pain"], ["amenorrhea", "Amenorrhea"], ["vaginal_discharge", "Vaginal discharge"]]\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5363235Z   '  },\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5367035Z   '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5371107Z   '    title: "Gynecology symptoms",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5374919Z   '    sourceType: "manual",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5380045Z   '    items: [["heavy_menstrual_bleeding", "Heavy menstrual bleeding"], ["intermenstrual_bleeding", "Intermenstrual bleeding"], ["postcoital_bleeding", "Postcoital bleeding"], ["postmenopausal_bleeding", "Postmenopausal bleeding"], ["dysmenorrhea", "Dysmenorrhea"], ["dyspareunia", "Dyspareunia"], ["oligomenorrhea", "Oligomenorrhea"]]\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5382709Z   '  },\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5386557Z   '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5390389Z   '    title: "Gynecology diagnoses",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5394311Z   '    sourceType: "manual",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5398764Z   '    items: [["pcos", "PCOS"], ["fibroid", "Fibroid"], ["endometriosis", "Endometriosis"], ["adenomyosis", "Adenomyosis"], ["ovarian_cyst", "Ovarian cyst"], ["pid", "PID"], ["infertility", "Infertility"]]\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5412202Z   '  },\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5416355Z   '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5420902Z   '    title: "Medical history",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5425067Z   '    sourceType: "history_sheet",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5429126Z   '    items: [["diabetes", "Diab'... 107305 more characters
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5431797Z 
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5436915Z     at file:///C:/Users/SuperUser/actions-runner/_work/prij-clinic/prij-clinic/qa-calendar-history-final-workspace/scripts/clinical-workflow-unification-test.mjs:30:157 {
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5440519Z   generatedMessage: true,
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5444321Z   code: 'ERR_ASSERTION',
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5448471Z   actual: 'import Link from "next/link";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5452197Z     'import Image from "next/image";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5456262Z     'import { AppActionButton } from "@/components/actions/AppActionButton";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5460242Z     'import { AppActionLink } from "@/components/actions/AppActionLink";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5464302Z     'import { FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5468278Z     'import dynamic from "next/dynamic";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5472209Z     'import { ThreeDMedicalIcon, IconName } from "../../../components/ThreeDMedicalIcon";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5476590Z     'import { HerbalSearchPanel, MedicationSafetyPanel, PatientAllergyList, PatientMedicationList, PrescriptionSafetyPanel } from "../../../components/medications/MedicationComponents";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5479822Z     'import { getApiBaseUrl } from "@/lib/api-base-url";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5483601Z     'import { visitTypeLabel } from "@/lib/visit-types";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5487439Z     'import { patientQrSvgDataUri } from "@/lib/patient-qr";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5491380Z     'import { patientTypeLabel } from "@/lib/patient-labels";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5495853Z     'import { caseBoards, conceptionMethodChips, currentPregnancyTags, feedItemTypes, importantPatientBannerItems, previousHistoryChips, smartClinicalTags } from "@/lib/v1200-productivity";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5499294Z     'import { DoctorSignatureBadge, timelineIcon } from "./timeline-components";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5502931Z     'export { formatDateTime } from "./workspace-formatters";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5506811Z     'import { formatDateTime } from "./workspace-formatters";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5510904Z     'import { addUniqueBasketItem, SelectedBasket, type SelectedBasketItem } from "@/components/clinical/SelectedBasket";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5514296Z     '\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5518164Z     'export type Patient = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5522162Z     '      id: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5525899Z     '      branchId?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5530160Z     '      medicalRecordNumber: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5534043Z     '      firstName: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5537999Z     '      lastName: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5541879Z     '      dateOfBirth?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5545578Z     '      sex?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5549448Z     '      phone?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5553179Z     '      email?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5557046Z     '      status: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5561163Z     '      patientType?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5565126Z     '      sexualActivityStatus?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5568987Z     '      notes?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5572835Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5576866Z     'export type PregnancyRecord = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5580861Z     '      id?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5584944Z     '      gravida?: number | string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5589065Z     '      para?: number | string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5592910Z     '      living?: number | string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5596734Z     '      abortions?: number | string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5600545Z     '      lmp?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5604551Z     '      lmpDate?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5608623Z     '      edd?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5612501Z     '      estimatedDueDate?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5616354Z     '      datingMethod?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5620395Z     '      datingScanDate?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5624320Z     '      status?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5628207Z     '      notes?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5631979Z     '      fetuses?: FetusRecord[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5635958Z     '      previousPregnancies?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5639761Z     '      antenatalVisits?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5643620Z     '      obUltrasounds?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5647419Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5651275Z     'export type FetusRecord = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5655007Z     '      id?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5659155Z     '      label?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5663023Z     '      chorionicity?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5667193Z     '      amnionicity?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5671107Z     '      status?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5675310Z     '      notes?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5679054Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5682982Z     'export type GynecologyVisit = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5686836Z     '      id?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5691036Z     '      templateType?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5694982Z     '      visitDate?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5699148Z     '      reasonForVisit?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5703218Z     '      menstrualHistory?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5707537Z     '      bleedingPattern?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5711360Z     '      painSymptoms?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5715633Z     '      dischargeSymptoms?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5719713Z     '      contraceptionHistory?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5723661Z     '      examinationNotes?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5727921Z     '      doctorImpression?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5731781Z     '      doctorPlan?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5735868Z     '      followUpDate?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5739874Z     '      createdByUser?: { displayName?: string | null } | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5743994Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5748161Z     'export type TabConfig = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5752097Z     '      key: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5756108Z     '      label: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5760040Z     '      icon: IconName;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5763910Z     '      endpoint?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5767675Z     '      collectionKey?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5771788Z     '      empty: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5775772Z     '      permissions?: string[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5779624Z     '      roles?: string[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5783536Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5787471Z     'export type TimelineItem = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5791270Z     '      id?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5795168Z     '      sourceId?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5798964Z     '      dateTime: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5802840Z     '      type: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5806712Z     '      title: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5810513Z     '      status: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5814461Z     '      description: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5818249Z     '      actor?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5822152Z     '      href?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5826048Z     '      doctorSignature?: {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5829816Z     '        doctorName?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5833810Z     '        doctorColor?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5837671Z     '        doctorShortLabel?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5841480Z     '        startedAt?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5845499Z     '      };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5849315Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5853600Z     'export type ClinicalPhase = { id: string; phaseType: string; title: string; status: string; startDate?: string; outcome?: string | null; notes?: string | null };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5857091Z     'export type InfertilityWorkspace = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5861218Z     '      phases?: ClinicalPhase[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5865130Z     '      episodes?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5868912Z     '      cycles?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5873060Z     '      monitoringVisits?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5876997Z     '      estradiolResults?: Record<string, unknown>[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5880759Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5885172Z     'export type PatientWorkspaceMode = "gynecology" | "infertility" | "pregnancy" | "postpartum" | "menopause" | "postoperative" | "general";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5888532Z     'export type PatientWorkspaceContext = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5892677Z     '      mode: PatientWorkspaceMode;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5896437Z     '      activePhase?: ClinicalPhase;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5900644Z     '      pregnancy?: Record<string, unknown>;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5904481Z     '      infertilityEpisode?: Record<string, unknown>;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5908306Z     '      cycle?: Record<string, unknown>;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5912139Z     '      monitoringVisit?: Record<string, unknown>;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5916056Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5919805Z     '\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5923864Z     'export function resolvePatientWorkspaceContext({\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5927744Z     '  patient,\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5931732Z     '  clinicalPhases,\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5935586Z     '  related,\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5939420Z     '  infertility\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5943167Z     '}: {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5947051Z     '  patient: Patient;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5951139Z     '  clinicalPhases: ClinicalPhase[];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5955114Z     '  related: Record<string, Record<string, unknown>[]>;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5958877Z     '  infertility: InfertilityWorkspace;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5963028Z     '}): PatientWorkspaceContext {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5966821Z     '  const activePhase = clinicalPhases.find((phase) => phase.status.toLowerCase() === "active");\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5970590Z     '  const pregnancy = related.pregnancy?.find((row) => String(row.status ?? "").toLowerCase() === "active");\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5974638Z     '  const infertilityEpisode = infertility.episodes?.find((row) => ["active", "current", "in_progress"].includes(String(row.status ?? "").toLowerCase()));\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5978377Z     '  const activeCycle = infertility.cycles?.find((row) => ["active", "current", "in_progress"].includes(String(row.status ?? "").toLowerCase()));\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5982045Z     '  const cycle = activeCycle ?? infertility.cycles?.[0];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5985952Z     '  const monitoringVisit = infertility.monitoringVisits?.[0];\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5989717Z     '  const phaseMode = workspaceModeFromValue(activePhase?.phaseType);\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5993754Z     '  const explicitTypeMode = workspaceModeFromValue(patient.patientType);\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.5997447Z     '  const mode = phaseMode\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6001230Z     '    ?? (pregnancy ? "pregnancy" : undefined)\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6005433Z     '    ?? (infertilityEpisode || activeCycle ? "infertility" : undefined)\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6009043Z     '    ?? explicitTypeMode\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6013148Z     '    ?? ((infertility.episodes?.length ?? 0) > 0 || (infertility.cycles?.length ?? 0) > 0 ? "infertility" : undefined)\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6016637Z     '    ?? "general";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6020560Z     '\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6024687Z     '  return { mode, activePhase, pregnancy, infertilityEpisode, cycle, monitoringVisit };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6028297Z     '}\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6032145Z     '\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6036240Z     'function workspaceModeFromValue(value?: string | null): PatientWorkspaceMode | undefined {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6040164Z     '  const normalized = String(value ?? "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6044669Z     '  if (["postpartum", "post_partum", "postnatal", "puerperium"].some((mode) => normalized === mode || normalized.startsWith(`${mode}_`))) return "postpartum";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6049172Z     '  if (["postoperative", "post_operative", "postop", "post_op", "surgical_follow_up", "hysterectomy", "post_hysterectomy"].some((mode) => normalized === mode || normalized.startsWith(`${mode}_`))) return "postoperative";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6053313Z     '  if (["menopause", "perimenopause", "postmenopause", "postmenopausal"].some((mode) => normalized === mode || normalized.startsWith(`${mode}_`))) return "menopause";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6056961Z     '  if (["gynecology", "gynaecology", "gynecologic", "gyn"].some((mode) => normalized === mode || normalized.startsWith(`${mode}_`))) return "gynecology";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6061219Z     '  if (["infertility", "fertility", "reproductive_medicine", "icsi", "ivf"].some((mode) => normalized === mode || normalized.startsWith(`${mode}_`))) return "infertility";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6065123Z     '  if (["pregnancy", "pregnant", "obstetric", "obstetrics", "antenatal", "high_risk_pregnancy"].some((mode) => normalized === mode || normalized.startsWith(`${mode}_`))) return "pregnancy";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6069118Z     '  if (["general", "other"].includes(normalized)) return "general";\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6072727Z     '  return undefined;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6076691Z     '}\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6080671Z     'export type ReferenceResult = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6084755Z     '      id: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6088707Z     '      label: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6092489Z     '      type: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6096314Z     '      genericName?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6100182Z     '      familyName?: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6104488Z     '      category?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6108478Z     '      specialty?: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6112522Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6116703Z     'export type ServiceItem = {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6120360Z     '      id: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6124362Z     '      code: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6128737Z     '      name: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6132458Z     '      category: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6136382Z     '      price: string | null;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6140213Z     '      currency: string;\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6144205Z     '    };\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6148221Z     '\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6152910Z     'export const SafeAiAssistantPanel = dynamic(() => import("../../../components/ai-assistant/SafeAiAssistantPanel").then((module) => module.SafeAiAssistantPanel), { loading: () => <div className="skeleton" aria-label="Loading review hints" /> });\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6156697Z     'export const ObDatingReviewPanel = dynamic(() => import("../../../components/calculators/ObDatingReviewPanel").then((module) => module.ObDatingReviewPanel), { loading: () => <div className="skeleton" aria-label="Loading calculator" /> });\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6160512Z     'export const CareAssistPanel = dynamic(() => import("../../../components/care-assist/CareAssistPanel").then((module) => module.CareAssistPanel), { loading: () => <div className="skeleton" aria-label="Loading care review" /> });\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6164520Z     'export const MedicationSafetyTerminal = dynamic(() => import("../../../components/medications/MedicationSafetyTerminal").then((module) => module.MedicationSafetyTerminal), { loading: () => <div className="skeleton" aria-label="Loading medication safety" /> });\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6167934Z     'export const smartHistoryGroups = [\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6171646Z     '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6175515Z     '    title: "Presenting complaint",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6179340Z     '    sourceType: "manual",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6183715Z     '    items: [["aub", "AUB"], ["pelvic_pain", "Pelvic pain"], ["amenorrhea", "Amenorrhea"], ["vaginal_discharge", "Vaginal discharge"]]\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6187280Z     '  },\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6191157Z     '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6195006Z     '    title: "Gynecology symptoms",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6199093Z     '    sourceType: "manual",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6204131Z     '    items: [["heavy_menstrual_bleeding", "Heavy menstrual bleeding"], ["intermenstrual_bleeding", "Intermenstrual bleeding"], ["postcoital_bleeding", "Postcoital bleeding"], ["postmenopausal_bleeding", "Postmenopausal bleeding"], ["dysmenorrhea", "Dysmenorrhea"], ["dyspareunia", "Dyspareunia"], ["oligomenorrhea", "Oligomenorrhea"]]\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6207127Z     '  },\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6211027Z     '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6214965Z     '    title: "Gynecology diagnoses",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6218907Z     '    sourceType: "manual",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6223656Z     '    items: [["pcos", "PCOS"], ["fibroid", "Fibroid"], ["endometriosis", "Endometriosis"], ["adenomyosis", "Adenomyosis"], ["ovarian_cyst", "Ovarian cyst"], ["pid", "PID"], ["infertility", "Infertility"]]\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6226896Z     '  },\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6230674Z     '  {\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6234557Z     '    title: "Medical history",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6238635Z     '    sourceType: "history_sheet",\r\n' +
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6242461Z     '    items: [["diabetes", "Diab'... 107305 more characters,
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6246429Z   expected: />Previous</,
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6250357Z   operator: 'match',
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6256986Z   diff: 'simple'
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6258522Z }
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6260949Z 
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6264823Z Node.js v22.23.1
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6726660Z Mandatory check failed: clinical-workflow, exit 1.
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6727364Z At C:\Users\SuperUser\actions-runner\_work\_temp\bb03356e-f4fb-4052-b6e9-7e3b62c679c6.ps1:21 char:34
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6728059Z + ... de -ne 0) { throw "Mandatory check failed: $($entry.Key), exit $($pro ...
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6728561Z +                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6729525Z     + CategoryInfo          : OperationStopped: (Mandatory check...rkflow, exit 1.:String) [], RuntimeException
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6730236Z     + FullyQualifiedErrorId : Mandatory check failed: clinical-workflow, exit 1.
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6730641Z  
Final verify compact calendar and History package	Run all eight mandatory checks	2026-07-25T23:04:29.6874559Z ##[error]Process completed with exit code 1.
```

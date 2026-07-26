import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, "utf8");
}

function replaceOnce(relativePath, before, after) {
  const source = read(relativePath);
  if (!source.includes(before)) throw new Error(`Missing expected contract in ${relativePath}: ${before.slice(0, 120)}`);
  const next = source.replace(before, after);
  if (next === source) throw new Error(`Replacement made no change in ${relativePath}`);
  write(relativePath, next);
}

function replaceRange(relativePath, startMarker, endMarker, replacement) {
  const source = read(relativePath);
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing start marker in ${relativePath}: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing end marker in ${relativePath}: ${endMarker}`);
  write(relativePath, source.slice(0, start) + replacement + source.slice(end));
}

replaceOnce(
  "apps/api/src/doctor-visit/dto.ts",
  "export class UpdateDoctorVisitDto {\n",
  `export class UpdateDoctorVisitDto {\n  @IsOptional()\n  @IsDateString()\n  expectedUpdatedAt?: string;\n\n`
);

replaceRange(
  "apps/api/src/doctor-visit/doctor-visit.service.ts",
  "  async update(patientId: string, encounterId: string, dto: UpdateDoctorVisitDto, user: AuthUser) {",
  "\n\n  async createFollowUp",
  `  async update(patientId: string, encounterId: string, dto: UpdateDoctorVisitDto, user: AuthUser) {
    const encounter = await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    if (!encounter) throw new NotFoundException("Doctor visit not found.");
    if (encounter.status !== "draft") throw new BadRequestException("Only draft visits can be edited.");

    const changedFields = Object.keys(dto).filter((field) => field !== "expectedUpdatedAt");
    if (!changedFields.length) return encounter;

    const data: Prisma.EncounterUpdateManyMutationInput = {};
    if (dto.chiefComplaint !== undefined) data.chiefComplaint = clean(dto.chiefComplaint);
    if (dto.complaintStatus !== undefined) {
      data.followUpJson = mergeComplaintLifecycle(encounter.followUpJson, dto.complaintStatus, {
        encounterId,
        recordedAt: encounter.createdAt
      });
    }
    if (dto.historyText !== undefined) data.historyText = clean(dto.historyText);
    if (dto.examText !== undefined) data.examText = clean(dto.examText);
    if (dto.assessmentText !== undefined) data.assessmentText = clean(dto.assessmentText);
    if (dto.planText !== undefined) data.planText = clean(dto.planText);
    if (dto.examinationJson !== undefined) data.examinationJson = stampStructuredInput(dto.examinationJson, encounterId, user.id);

    const expectedUpdatedAt = dto.expectedUpdatedAt ? new Date(dto.expectedUpdatedAt) : encounter.updatedAt;
    const claimed = await this.prisma.encounter.updateMany({
      where: { id: encounterId, patientId, status: "draft", updatedAt: expectedUpdatedAt },
      data
    });
    if (claimed.count !== 1) {
      throw new ConflictException({
        code: "VISIT_DRAFT_STALE",
        message: "This visit changed in another tab or device. Reload the locked patient visit before saving again."
      });
    }

    const updated = await assertCanReferenceEncounter(this.prisma, encounterId, user, { patientId, requireDoctorScope: true });
    if (!updated) throw new NotFoundException("Doctor visit not found after saving.");

    await this.audit.record({
      actorUserId: user.id,
      action: "doctor_visit.encounter_draft_updated",
      resourceType: "encounter",
      resourceId: encounterId,
      branchId: updated.branchId,
      severity: "high",
      metadataJson: { patientId, changedFields, expectedUpdatedAt: expectedUpdatedAt.toISOString(), savedUpdatedAt: updated.updatedAt.toISOString() }
    });

    return updated;
  }`
);

replaceOnce(
  "apps/api/src/encounters/dto.ts",
  "export class VoidEncounterDto {",
  `export class SignEncounterDto {\n  @IsUUID()\n  patientId!: string;\n}\n\nexport class VoidEncounterDto {`
);

replaceOnce(
  "apps/api/src/encounters/encounters.controller.ts",
  'import { CreateEncounterDto, UpdateEncounterDto, VoidEncounterDto } from "./dto";',
  'import { CreateEncounterDto, SignEncounterDto, UpdateEncounterDto, VoidEncounterDto } from "./dto";'
);
replaceOnce(
  "apps/api/src/encounters/encounters.controller.ts",
  `  sign(@Param("id") id: string, @CurrentUser() user: AuthUser) {\n    return this.encounters.sign(id, user);\n  }`,
  `  sign(@Param("id") id: string, @Body() dto: SignEncounterDto, @CurrentUser() user: AuthUser) {\n    return this.encounters.sign(id, dto.patientId, user);\n  }`
);

replaceOnce(
  "apps/api/src/encounters/encounters.service.ts",
  'import { assertCanReferenceAppointment, assertCanReferencePatient } from "../auth/reference-scope";',
  'import { assertCanReferenceAppointment, assertCanReferenceEncounter, assertCanReferencePatient } from "../auth/reference-scope";'
);

replaceRange(
  "apps/api/src/encounters/encounters.service.ts",
  "  async sign(id: string, user: AuthUser) {",
  "\n\n  async voidEncounter",
  `  async sign(id: string, patientId: string, user: AuthUser) {
    const existing = await assertCanReferenceEncounter(this.prisma, id, user, { patientId, requireDoctorScope: true });
    if (!existing) throw new NotFoundException("Encounter not found.");

    if (existing.status === "signed") {
      // Signed clinical records are immutable and replay safely.
      return existing;
    }
    if (existing.status !== "draft") {
      throw new BadRequestException("Only draft encounters can be signed.");
    }

    const completedAt = new Date();
    const { encounter, queueTicketId, replayed } = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.encounter.updateMany({
        where: { id, patientId, status: "draft", updatedAt: existing.updatedAt },
        data: {
          status: "signed",
          signedAt: completedAt,
          signedByUserId: user.id,
          ...(existing.chiefComplaint || complaintLifecycleFromJson(existing.followUpJson) ? {
            followUpJson: mergeComplaintLifecycle(existing.followUpJson, complaintStatusFromJson(existing.followUpJson), {
              encounterId: existing.id,
              recordedAt: existing.createdAt,
              signedAt: completedAt
            })
          } : {})
        }
      });

      if (claim.count !== 1) {
        const replay = await tx.encounter.findUnique({ where: { id } });
        if (replay?.patientId === patientId && replay.status === "signed") {
          return { encounter: replay, queueTicketId: null, replayed: true };
        }
        throw new ConflictException({
          code: "ENCOUNTER_SIGN_CONFLICT",
          message: "This visit changed before signing. Reload the locked patient visit and review it again."
        });
      }

      const signed = await tx.encounter.findUnique({ where: { id } });
      if (!signed || signed.patientId !== patientId) throw new NotFoundException("Signed encounter could not be reloaded.");

      const queueTicket = await tx.queueTicket.findFirst({ where: { patientId: signed.patientId, branchId: signed.branchId, status: "in_room" }, orderBy: { checkedInAt: "desc" } });
      if (queueTicket) {
        await tx.queueTicket.update({ where: { id: queueTicket.id }, data: { status: "completed", completedAt } });
        await tx.activeQueueTicketLock.deleteMany({ where: { queueTicketId: queueTicket.id } });
        await tx.auditLog.create({ data: { actorUserId: user.id, action: "queue.completed_with_encounter", resourceType: "queue_ticket", resourceId: queueTicket.id, branchId: signed.branchId, severity: "high", metadataJson: { patientId: signed.patientId, encounterId: signed.id, from: "in_room", to: "completed" } } });
      }
      const dating = pregnancyDatingFromEncounter(existing.examinationJson);
      if (dating) {
        const pregnancy = await tx.pregnancy.findFirst({
          where: { patientId: signed.patientId, status: "active", ...(dating.episodeId ? { id: dating.episodeId } : {}) },
          orderBy: { createdAt: "desc" }
        });
        if (pregnancy) {
          const lmpChanged = Boolean(dating.lmp && pregnancy.lmpDate && dateKey(pregnancy.lmpDate) !== dating.lmp);
          const eddChanged = Boolean(dating.edd && pregnancy.estimatedDueDate && dateKey(pregnancy.estimatedDueDate) !== dating.edd);
          const correctionAllowed = !lmpChanged && !eddChanged || Boolean(dating.datingCorrectionReason);
          if (correctionAllowed) {
            const lmpDate = dating.lmp ? safeDate(dating.lmp) : pregnancy.lmpDate;
            const estimatedDueDate = dating.edd ? safeDate(dating.edd) : pregnancy.estimatedDueDate;
            await tx.pregnancy.update({
              where: { id: pregnancy.id },
              data: {
                lmpDate,
                estimatedDueDate,
                datingMethod: dating.datingMethod || pregnancy.datingMethod
              }
            });
            if (estimatedDueDate && dating.datingMethod) {
              await tx.pregnancyDatingAssessment.create({
                data: {
                  patientId: signed.patientId,
                  pregnancyEpisodeId: pregnancy.id,
                  datingSource: dating.datingMethod,
                  lmpDate,
                  cycleLengthDays: positiveInteger(dating.cycleLength),
                  knownEdd: estimatedDueDate,
                  calculatedEdd: estimatedDueDate,
                  confidenceStatus: dating.lmpCertainty || "doctor_confirmed",
                  isBestObstetricEstimate: true,
                  isLocked: true,
                  lockedByUserId: user.id,
                  lockedAt: completedAt,
                  changeReason: dating.datingCorrectionReason || "Confirmed from signed antenatal encounter",
                  inputJson: dating as Prisma.InputJsonValue,
                  outputJson: { authoritativeEdd: dateKey(estimatedDueDate), sourceEncounterId: signed.id },
                  createdByUserId: user.id,
                  reviewedByUserId: user.id,
                  reviewedAt: completedAt
                }
              });
            }
            await tx.auditLog.create({ data: { actorUserId: user.id, action: "pregnancy.dating_confirmed_from_encounter", resourceType: "pregnancy", resourceId: pregnancy.id, branchId: signed.branchId, severity: "high", metadataJson: { patientId: signed.patientId, encounterId: signed.id, datingMethod: dating.datingMethod, correctionReasonPresent: Boolean(dating.datingCorrectionReason) } } });
          } else {
            await tx.auditLog.create({ data: { actorUserId: user.id, action: "pregnancy.dating_change_requires_review", resourceType: "pregnancy", resourceId: pregnancy.id, branchId: signed.branchId, severity: "high", metadataJson: { patientId: signed.patientId, encounterId: signed.id, lmpChanged, eddChanged } } });
          }
        }
      }
      const derivedTags = structuredTagsFromEncounter(existing.examinationJson);
      for (const tag of derivedTags) {
        await tx.patientClinicalTag.updateMany({
          where: { patientId: signed.patientId, tagCode: tag.tagCode, sourceType: "encounter_structured", sourceId: { not: signed.id }, isRemoved: false },
          data: { status: tag.status === "resolved" ? "resolved" : "historical", historyStatus: tag.status === "resolved" ? "resolved" : "historical", resolutionDate: tag.status === "resolved" ? completedAt : undefined }
        });
        const existingTag = await tx.patientClinicalTag.findFirst({ where: { patientId: signed.patientId, tagCode: tag.tagCode, sourceType: "encounter_structured", sourceId: signed.id } });
        if (!existingTag) {
          const definition = await tx.clinicalTagDefinition.findUnique({ where: { code: tag.tagCode } });
          await tx.patientClinicalTag.create({
            data: {
              patientId: signed.patientId,
              tagDefinitionId: definition?.id,
              tagCode: tag.tagCode,
              label: tag.label,
              category: tag.category,
              sourceType: "encounter_structured",
              sourceId: signed.id,
              sourceEncounterId: signed.id,
              assignmentType: "doctor_documented",
              doctorConfirmed: true,
              status: tag.status,
              historyStatus: tag.status === "resolved" ? "resolved" : "current",
              effectiveDate: completedAt,
              tagDate: completedAt,
              detailJson: tag.detail as Prisma.InputJsonValue,
              createdByUserId: user.id
            }
          });
        }
      }
      return { encounter: signed, queueTicketId: queueTicket?.id ?? null, replayed: false };
    });

    if (!replayed) {
      await this.audit.record({
        actorUserId: user.id,
        action: "encounter.signed",
        resourceType: "encounter",
        resourceId: encounter.id,
        branchId: encounter.branchId,
        severity: "high",
        metadataJson: { patientId, queueTicketId, atomicClaim: true }
      });
    }

    return encounter;
  }`
);

replaceOnce(
  "apps/web/lib/doctor-visit.ts",
  '  if (!response.ok) throw new Error("Could not update the doctor visit workflow.");',
  `  if (!response.ok) {\n    const payload = await response.json().catch(() => ({})) as { code?: string; message?: string | string[]; error?: { code?: string; message?: string } };\n    const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message ?? payload.error?.message ?? "Could not update the doctor visit workflow.";\n    const error = new Error(message);\n    Object.assign(error, { status: response.status, code: payload.code ?? payload.error?.code });\n    throw error;\n  }`
);
replaceOnce(
  "apps/web/lib/doctor-visit.ts",
  `export function updateDoctorVisit(patientId: string, encounterId: string, input: Record<string, unknown>) {\n  return request<Record<string, unknown>>(\`/patients/\${encodeURIComponent(patientId)}/doctor-visit/\${encodeURIComponent(encounterId)}\`, { method: "PATCH", body: JSON.stringify(input) });\n}`,
  `export function updateDoctorVisit(patientId: string, encounterId: string, input: Record<string, unknown>, expectedUpdatedAt?: string) {\n  return request<Record<string, unknown>>(\`/patients/\${encodeURIComponent(patientId)}/doctor-visit/\${encodeURIComponent(encounterId)}\`, { method: "PATCH", body: JSON.stringify({ ...input, ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}) }) });\n}`
);
replaceOnce(
  "apps/web/lib/doctor-visit.ts",
  `export function completeDoctorVisit(encounterId: string) {\n  return request<Record<string, unknown>>(\`/encounters/\${encodeURIComponent(encounterId)}/sign\`, { method: "PATCH", body: JSON.stringify({}) });\n}`,
  `export function completeDoctorVisit(patientId: string, encounterId: string) {\n  return request<Record<string, unknown>>(\`/encounters/\${encodeURIComponent(encounterId)}/sign\`, { method: "PATCH", body: JSON.stringify({ patientId }) });\n}`
);

replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '  const [finishing, setFinishing] = useState(false);\n  const draftKey =',
  '  const [finishing, setFinishing] = useState(false);\n  const [finishIntent, setFinishIntent] = useState<"finish" | "print" | null>(null);\n  const draftKey ='
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '  const contextReady = Boolean(patientId && visitId && patient?.id === patientId && encounter?.id === visitId);',
  '  const contextReady = Boolean(patientId && visitId && patient?.id === patientId && encounter?.id === visitId && encounter?.patientId === patientId);'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `      if (String(data.encounter?.id ?? "") !== visitId) {\n        data = await getDoctorVisitPacket(patientId, visitId);\n      }\n      setVisit(data);`,
  `      if (String(data.encounter?.id ?? "") !== visitId) {\n        data = await getDoctorVisitPacket(patientId, visitId);\n      }\n      const loadedPatientId = String(data.patient?.id ?? "");\n      const loadedEncounterId = String(data.encounter?.id ?? "");\n      const loadedEncounterPatientId = String(data.encounter?.patientId ?? "");\n      if (loadedPatientId !== patientId || loadedEncounterId !== visitId || loadedEncounterPatientId !== patientId) {\n        throw new Error("Locked patient and visit context mismatch.");\n      }\n      setVisit(data);`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `      await updateDoctorVisit(patientId, visitId, encounterForm);\n      localStorage.removeItem(draftKey);`,
  `      await updateDoctorVisit(patientId, visitId, encounterForm, String(encounter?.updatedAt ?? ""));\n      localStorage.removeItem(draftKey);`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `    } catch {\n      setSaveState(navigator.onLine ? "failed" : "offline");\n    }\n  }\n\n  function changeEncounterForm`,
  `    } catch (saveError) {\n      setSaveState(navigator.onLine ? "failed" : "offline");\n      setStatus(saveError instanceof Error ? saveError.message : "Draft save failed.");\n    }\n  }\n\n  function changeEncounterForm`
);
replaceRange(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  "  async function finishVisit(printAfter = false) {",
  "\n\n  function addMedication",
  `  async function finishVisit(printAfter = false) {
    if (!contextReady || finishing || signedVisit) return;
    setFinishing(true);
    try {
      if (saveState !== "synced") {
        await updateDoctorVisit(patientId, visitId, encounterForm, String(encounter?.updatedAt ?? ""));
      }
      await completeDoctorVisit(patientId, visitId);
      localStorage.removeItem(draftKey);
      setSaveState("synced");
      window.dispatchEvent(new CustomEvent("patient-workspace:refresh"));
      if (printAfter) {
        await refreshPacket();
        window.setTimeout(() => window.print(), 100);
      } else {
        window.location.assign(\`/patients/\${patientId}\`);
      }
    } catch (finishError) {
      setStatus(finishError instanceof Error ? finishError.message : "Finish failed — reload the locked patient visit and retry.");
      setFinishing(false);
    }
  }

  function requestFinish(printAfter = false) {
    if (!contextReady || signedVisit || finishing) return;
    setFinishIntent(printAfter ? "print" : "finish");
  }`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '        actions={\n          <details className="filter-drawer"',
  '        actions={signedVisit ? <span className="badge lock-badge">Signed · read only</span> : (\n          <details className="filter-drawer"'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `          </details>\n        }\n      />`,
  `          </details>\n        )}\n      />`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button compact" disabled={finishing} type="button" onClick={() => void finishVisit(false)}>Finish visit</button>',
  '<button className="button compact" disabled={finishing || signedVisit || !contextReady} type="button" onClick={() => requestFinish(false)}>Finish visit</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '<button className="button secondary compact" disabled={finishing} type="button" onClick={() => void finishVisit(true)}>Finish and print</button>',
  '<button className="button secondary compact" disabled={finishing || signedVisit || !contextReady} type="button" onClick={() => requestFinish(true)}>Finish and print</button>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `          {voidModalOpen && (`,
  `          {finishIntent && (
            <dialog open className="patient-modal" aria-label="Sign and lock visit confirmation">
              <div className="modal-backdrop" onClick={() => !finishing && setFinishIntent(null)} />
              <div className="modal-content" style={{ maxWidth: "520px" }}>
                <div className="modal-header"><h2>Sign and lock this visit?</h2><button className="button-icon" type="button" disabled={finishing} onClick={() => setFinishIntent(null)} aria-label="Close">×</button></div>
                <div className="modal-body">
                  <p><strong>Patient:</strong> {String(patient?.name ?? "Patient")}</p>
                  <p><strong>MRN:</strong> {String(patient?.medicalRecordNumber ?? "not recorded")}</p>
                  <p><strong>Visit ID:</strong> {visitId}</p>
                  <p><strong>Save state:</strong> {saveStateLabel(saveState)}</p>
                  <div className="warning-callout" style={{ color: "var(--rose)", background: "var(--rose-light)", padding: "0.75rem", borderRadius: "0.5rem" }}><strong>Clinical record lock:</strong> Signing completes the queue visit and makes this encounter read only. Confirm the patient identity before continuing.</div>
                </div>
                <div className="modal-actions form-actions">
                  <button className="button secondary" type="button" disabled={finishing} onClick={() => setFinishIntent(null)}>Cancel</button>
                  <button className="button" type="button" disabled={finishing || !contextReady || signedVisit} onClick={() => { const printAfter = finishIntent === "print"; setFinishIntent(null); void finishVisit(printAfter); }}>{finishing ? "Signing..." : finishIntent === "print" ? "Confirm, sign and print" : "Confirm sign and lock"}</button>
                </div>
              </div>
            </dialog>
          )}

          {voidModalOpen && (`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '{activeModule === "prescription" ? <PrescriptionModule query={medicationQuery}',
  '{activeModule === "prescription" ? <PrescriptionModule readOnly={signedVisit} query={medicationQuery}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '{activeModule === "investigations" ? <InvestigationStationV3 lockedPatientId={patientId} lockedEncounterId={visitId} embedded onSaved={() => void loadVisit()} /> : null}',
  '{activeModule === "investigations" ? signedVisit ? <SignedVisitReadOnlyNotice /> : <InvestigationStationV3 lockedPatientId={patientId} lockedEncounterId={visitId} embedded onSaved={() => void loadVisit()} /> : null}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '{activeModule === "ultrasound" ? <UltrasoundModule patientType=',
  '{activeModule === "ultrasound" ? <UltrasoundModule readOnly={signedVisit} patientType='
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '{activeModule === "follow-up" ? <FollowUpModule followUp={followUp} setFollowUp={setFollowUp} onSubmit={saveFollowUp} /> : null}',
  '{activeModule === "follow-up" ? signedVisit ? <SignedVisitReadOnlyNotice /> : <FollowUpModule followUp={followUp} setFollowUp={setFollowUp} onSubmit={saveFollowUp} /> : null}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '{activeModule === "finish" ? <FinishModule visit={visit} patientName={String(patient?.name ?? "Patient")} saveState={saveState} finishing={finishing} onRefresh={refreshPacket} onFinish={finishVisit} /> : null}',
  '{activeModule === "finish" ? <FinishModule visit={visit} patientName={String(patient?.name ?? "Patient")} saveState={saveState} finishing={finishing} signedVisit={signedVisit} onRefresh={refreshPacket} onRequestFinish={requestFinish} /> : null}'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function PrescriptionModule({ query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: { query: string;',
  'function PrescriptionModule({ readOnly, query, setQuery, results, lines, setLines, onAdd, onSave, onSafety, safety, templates, shortcuts }: { readOnly: boolean; query: string;'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  '    <div className="form-grid structured-rx-workspace">',
  '    <fieldset className="form-grid structured-rx-workspace" disabled={readOnly} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `      </div>\n    </div>\n  );\n}\n\nfunction MedicationCard`,
  `      </div>\n    </fieldset>\n  );\n}\n\nfunction MedicationCard`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  'function UltrasoundModule({ patientType, pregnancyEpisode, infertilityEpisode }: { patientType: string;',
  'function UltrasoundModule({ readOnly, patientType, pregnancyEpisode, infertilityEpisode }: { readOnly: boolean; patientType: string;'
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `    <div className="form-grid">\n      <h3 className="wide">{title}</h3>`,
  `    <fieldset className="form-grid" disabled={readOnly} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>\n      <h3 className="wide">{title}</h3>`
);
replaceOnce(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  `      <p className="empty-state compact smart-empty-state wide">No ultrasound reports yet.</p>\n    </div>\n  );\n}\n\nfunction FollowUpModule`,
  `      <p className="empty-state compact smart-empty-state wide">No ultrasound reports yet.</p>\n    </fieldset>\n  );\n}\n\nfunction FollowUpModule`
);
replaceRange(
  "apps/web/components/clinic/ActiveVisitWorkspace.tsx",
  "function FinishModule(",
  "\n\nfunction StructuredTagPicker",
  `function FinishModule({ visit, patientName, saveState, finishing, signedVisit, onRefresh, onRequestFinish }: { visit: DoctorVisitState | null; patientName: string; saveState: string; finishing: boolean; signedVisit: boolean; onRefresh: () => void; onRequestFinish: (printAfter?: boolean) => void }) {
  const encounter = visit?.encounter;
  const structured = structuredInput(encounter?.examinationJson);
  const context = visitContext(String(visit?.patient?.patientType ?? ""), visit?.pregnancyEpisode ?? null, visit?.infertilityEpisode ?? null);
  const pregnancyDatingComplete = Boolean(visit?.pregnancyEpisode?.lmpDate && visit?.pregnancyEpisode?.estimatedDueDate && visit?.pregnancyEpisode?.datingMethod);
  const confirmedSnapshotDatingComplete = Boolean(structured.reproductiveSnapshot?.edd && structured.reproductiveSnapshot?.datingMethod && structured.reproductiveSnapshot?.datingConfirmationDate && structured.reproductiveSnapshot?.datingClinician);
  const reproductiveComplete = context === "pregnancy"
    ? pregnancyDatingComplete || confirmedSnapshotDatingComplete
    : Boolean(structured.reproductiveSnapshot?.changeStatus && (structured.reproductiveSnapshot.changeStatus === "no_change" || structured.reproductiveSnapshot.context));
  const requiredMissing = [
    !String(encounter?.chiefComplaint ?? "").trim() && !structured.complaints.length ? "Complaint" : null,
    !reproductiveComplete ? (context === "pregnancy" ? "Pregnancy dating (confirmed EDD, source, confirmation date, clinician)" : "Menstrual / reproductive status") : null
  ].filter((item): item is string => Boolean(item));
  const recommendedMissing = [["History", encounter?.historyText], ["Examination", encounter?.examText], ["Impression", encounter?.assessmentText], ["Follow-up", (visit?.followUps ?? []).length]].filter(([, value]) => !value).map(([label]) => String(label));
  return (
    <div className="print-packet">
      <div className="form-actions no-print"><button className="button secondary" type="button" onClick={onRefresh}>Refresh packet</button><button className="button" disabled={finishing || signedVisit || requiredMissing.length > 0} type="button" onClick={() => onRequestFinish(false)}>Finish visit</button><button className="button secondary" disabled={finishing || signedVisit || requiredMissing.length > 0} type="button" onClick={() => onRequestFinish(true)}>Finish and print</button></div>
      <h2>{patientName}</h2>
      {signedVisit ? <p className="notice">Signed visit · read only. The clinical record is locked.</p> : null}
      {requiredMissing.length ? <p className="alert danger">Required to finish: {requiredMissing.join(", ")}.</p> : <p className="notice">Required fields complete.</p>}
      {recommendedMissing.length ? <p className="notice">Recommended, nonblocking: {recommendedMissing.join(", ")}.</p> : null}
      {saveState !== "synced" ? <p className="alert warning">Unsaved local changes must sync before completion.</p> : null}
      <section><h3>Encounter</h3><p>{String(visit?.encounter?.chiefComplaint ?? "No chief complaint saved.")}</p></section>
      <section><h3>Prescriptions</h3><p>{(visit?.prescriptions ?? []).length} prescription draft(s)</p></section>
      <section><h3>Requested investigations</h3><p>{(visit?.investigationOrders ?? []).length} request(s)</p></section>
      <section><h3>Follow-up</h3><p>{(visit?.followUps ?? []).length} follow-up task(s)</p></section>
    </div>
  );
}

function SignedVisitReadOnlyNotice() {
  return <p className="notice">Signed visit · read only. Create a governed correction or a new visit instead of changing the signed record.</p>;
}`
);

const safetyTest = `import assert from "node:assert/strict";
import fs from "node:fs";

const doctorDto = fs.readFileSync("apps/api/src/doctor-visit/dto.ts", "utf8");
const doctorService = fs.readFileSync("apps/api/src/doctor-visit/doctor-visit.service.ts", "utf8");
const encounterDto = fs.readFileSync("apps/api/src/encounters/dto.ts", "utf8");
const encounterController = fs.readFileSync("apps/api/src/encounters/encounters.controller.ts", "utf8");
const encounterService = fs.readFileSync("apps/api/src/encounters/encounters.service.ts", "utf8");
const client = fs.readFileSync("apps/web/lib/doctor-visit.ts", "utf8");
const workspace = fs.readFileSync("apps/web/components/clinic/ActiveVisitWorkspace.tsx", "utf8");
const identity = fs.readFileSync("apps/web/components/clinic/PatientVisitIdentityBar.tsx", "utf8");

assert.match(doctorDto, /expectedUpdatedAt\?: string/);
assert.match(doctorDto, /@IsDateString\(\)[\s\S]*?expectedUpdatedAt/);
assert.match(doctorService, /code: "VISIT_DRAFT_STALE"/);
assert.match(doctorService, /encounter\.updateMany\([\s\S]*?status: "draft"[\s\S]*?updatedAt: expectedUpdatedAt/);
assert.match(doctorService, /changedFields = Object\.keys\(dto\)\.filter/);

assert.match(encounterDto, /export class SignEncounterDto[\s\S]*?@IsUUID\(\)[\s\S]*?patientId!: string/);
assert.match(encounterController, /@Patch\(":id\/sign"\)[\s\S]*?@Permissions\("encounter\.sign"\)[\s\S]*?@Body\(\) dto: SignEncounterDto/);
assert.match(encounterService, /assertCanReferenceEncounter\(this\.prisma, id, user, \{ patientId, requireDoctorScope: true \}\)/);
assert.match(encounterService, /tx\.encounter\.updateMany\([\s\S]*?patientId[\s\S]*?status: "draft"[\s\S]*?updatedAt: existing\.updatedAt/);
assert.match(encounterService, /code: "ENCOUNTER_SIGN_CONFLICT"/);
assert.match(encounterService, /replayed: true/);
assert.match(encounterService, /atomicClaim: true/);

assert.match(client, /updateDoctorVisit\(patientId: string, encounterId: string, input: Record<string, unknown>, expectedUpdatedAt\?: string\)/);
assert.match(client, /JSON\.stringify\(\{ \.\.\.input, \.\.\.\(expectedUpdatedAt \? \{ expectedUpdatedAt \} : \{\}\) \}\)/);
assert.match(client, /completeDoctorVisit\(patientId: string, encounterId: string\)/);
assert.match(client, /JSON\.stringify\(\{ patientId \}\)/);

assert.match(workspace, /encounter\?\.patientId === patientId/);
assert.match(workspace, /loadedPatientId !== patientId \|\| loadedEncounterId !== visitId \|\| loadedEncounterPatientId !== patientId/);
assert.match(workspace, /finishIntent/);
assert.match(workspace, /Sign and lock this visit\?/);
assert.match(workspace, /Confirm the patient identity before continuing/);
assert.match(workspace, /<strong>MRN:<\/strong>/);
assert.match(workspace, /<strong>Visit ID:<\/strong>/);
assert.match(workspace, /completeDoctorVisit\(patientId, visitId\)/);
assert.match(workspace, /String\(encounter\?\.updatedAt \?\? ""\)/);
assert.match(workspace, /Signed visit · read only/);
assert.match(workspace, /SignedVisitReadOnlyNotice/);
assert.match(identity, /data-locked-patient-bar/);
assert.doesNotMatch(workspace, /PatientPicker/);

console.log("Sprint 1 patient safety core PASS");
`;
write("scripts/sprint1-patient-safety-core-test.mjs", safetyTest);

console.log("Sprint 1 patient safety core patch applied.");

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PatientType, Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { CommitPatientImportDto, PreviewPatientImportDto, RollbackPatientImportDto, UpdatePatientImportReviewDto } from "./dto";

@Injectable()
export class PatientImportService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async preview(dto: PreviewPatientImportDto, user: AuthUser) {
    this.assertManager(user);
    if (!/^[a-f0-9]{64}$/i.test(dto.fileHash)) throw new BadRequestException("A SHA-256 file hash is required.");
    if (dto.rows.some((row) => Object.keys(row).length > 100)) throw new BadRequestException("Import stopped: the 100-column limit was exceeded.");
    if (dto.rows.some((row) => Object.values(row).some((value) => String(value ?? "").length > 10_000))) throw new BadRequestException("Import stopped: a cell exceeds the safe text limit.");
    if (dto.rows.some((row) => Object.values(row).some((value) => unsafeCell(value)))) throw new BadRequestException("Import stopped: formula-like or corrupted text was detected.");
    const prepared = [];
    for (let index = 0; index < dto.rows.length; index += 1) prepared.push(await this.prepareRow(dto.rows[index]!, dto.mapping, index + 2, user));
    const replay = await this.prisma.patientImportBatch.findFirst({ where: { fileHash: dto.fileHash.toLowerCase(), createdByUserId: user.id, status: "previewed" }, include: { rows: { orderBy: { rowNumber: "asc" } } } });
    if (replay) return replay;
    const batch = await this.prisma.patientImportBatch.create({
      data: { fileName: safeFileName(dto.fileName), fileHash: dto.fileHash.toLowerCase(), fileType: dto.fileType, encoding: dto.encoding, mappingJson: dto.mapping, rowCount: prepared.length, createdByUserId: user.id,
        rows: { create: prepared.map((row) => ({ rowNumber: row.rowNumber, status: row.status, decision: row.decision, selected: row.selected, normalizedJson: row.normalized as Prisma.InputJsonValue, warningsJson: row.warnings as Prisma.InputJsonValue, duplicateJson: row.duplicates as Prisma.InputJsonValue })) } } as never,
      include: { rows: { orderBy: { rowNumber: "asc" } } }
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_import.previewed", resourceType: "patient_import_batch", resourceId: batch.id, branchId: user.branchId, severity: "high", metadataJson: { fileHash: dto.fileHash, rowCount: prepared.length, noPatientWrites: true } });
    return batch;
  }

  async get(id: string, user: AuthUser) { this.assertManager(user); const batch = await this.prisma.patientImportBatch.findFirst({ where: { id, ...(user.roles.includes("Owner") ? {} : { createdByUserId: user.id }) }, include: { rows: { orderBy: { rowNumber: "asc" } } } }); if (!batch) throw new NotFoundException("Patient import batch not found."); return batch; }

  async list(user: AuthUser) {
    this.assertManager(user);
    const batches = await this.prisma.patientImportBatch.findMany({ where: user.roles.includes("Owner") ? {} : { createdByUserId: user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { createdBy: { select: { displayName: true } } } });
    return { batches, totalShown: batches.length, limit: 50 };
  }

  async updateReview(id: string, rowId: string, dto: UpdatePatientImportReviewDto, user: AuthUser) {
    await this.get(id, user);
    if (dto.decision === "CREATE_SEPARATE_WITH_REASON" && !dto.reason?.trim()) throw new BadRequestException("Creating a separate patient requires a reason.");
    if (["RESOLVE_EXISTING", "BLOCKED"].includes(dto.decision)) throw new BadRequestException("Choose an actionable review decision.");
    return this.prisma.patientImportRow.update({ where: { id: rowId, batchId: id }, data: { decision: dto.decision, selected: dto.selected ?? dto.decision !== "SKIP", decisionReason: dto.reason?.trim() || null, reviewerUpdatedAt: new Date() } } as never);
  }

  async commit(id: string, dto: CommitPatientImportDto, user: AuthUser) {
    this.assertManager(user);
    const batch = await this.get(id, user);
    if (batch.status !== "previewed") throw new BadRequestException("Only a previewed batch can be imported.");
    const selected = batch.rows.filter((row) => dto.rowIds.includes(row.id));
    let imported = 0; let failed = 0;
    for (const row of selected) {
      const value = row.normalizedJson as Record<string, unknown>;
      const persisted = row as typeof row & { decision?: string; selected?: boolean; decisionReason?: string | null };
      const decision = dto.decisions?.[row.id] ?? persisted.decision;
      const decisionReason = dto.decisionReasons?.[row.id] ?? persisted.decisionReason;
      if (!decision) throw new BadRequestException("A missing review decision cannot silently become Skip.");
      if (["RESOLVE_EXISTING", "BLOCKED", "REQUEST_CORRECTION"].includes(decision)) throw new BadRequestException("Resolve duplicate or blocked rows before commit.");
      if (decision === "SKIP" || persisted.selected === false) continue;
      if (decision === "CREATE_SEPARATE_WITH_REASON" && !decisionReason?.trim()) throw new BadRequestException("Creating a separate patient requires a reason.");
      try {
        const birth = birthFields(value.birthValue);
        const notes = importNotes(value);
        let patient;
        if (["UPDATE_EXISTING", "ATTACH_EXISTING"].includes(decision)) {
          const duplicates = Array.isArray(row.duplicateJson) ? row.duplicateJson as Array<Record<string, unknown>> : [];
          const patientId = duplicates.length === 1 ? text(duplicates[0]?.id) : null;
          if (!patientId) throw new Error("EXACT_PHONE_MATCH_REQUIRED");
          patient = decision === "ATTACH_EXISTING" ? await this.prisma.patient.findUniqueOrThrow({ where: { id: patientId } }) : await this.prisma.patient.update({ where: { id: patientId }, data: { firstName: String(value.firstName), lastName: String(value.lastName), phone: text(value.primaryPhone), ...birth, patientType: patientType(value.patientType), notes } });
        } else {
          if (row.status === "POSSIBLE_DUPLICATE" && decision !== "CREATE_SEPARATE_WITH_REASON") throw new Error("EXPLICIT_DUPLICATE_RESOLUTION_REQUIRED");
          patient = await this.prisma.patient.create({ data: { branchId: user.branchId, medicalRecordNumber: `IMP-${new Date().getUTCFullYear()}-${row.id.slice(0, 8).toUpperCase()}`, firstName: String(value.firstName), lastName: String(value.lastName), phone: text(value.primaryPhone), ...birth, patientType: patientType(value.patientType), notes, status: "active", createdByUserId: user.id, address: text(value.address), spouseName: text(value.spouseName), secondaryPhone: text(value.secondaryPhone), externalFileNumber: text(value.externalId), originalRegistrationDate: date(value.registrationDate), importSource: "spreadsheet", importBatchId: id, dataVerificationState: row.status === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "VERIFIED", validationWarnings: row.warningsJson, originalSourceMetadata: { batchId: id, rowNumber: row.rowNumber } } as never });
        }
        await this.prisma.patientImportRow.update({ where: { id: row.id }, data: { status: "IMPORTED", createdPatientId: patient.id, importedAt: new Date() } }); imported += 1;
        await this.audit.record({ actorUserId: user.id, action: decision === "UPDATE_EXISTING" ? "patient_import.row_updated" : decision === "ATTACH_EXISTING" ? "patient_import.row_attached" : "patient_import.row_created", resourceType: "patient", resourceId: patient.id, branchId: user.branchId, severity: "high", reason: decisionReason ?? undefined, metadataJson: { batchId: id, rowId: row.id, rowNumber: row.rowNumber, decision } });
      } catch { await this.prisma.patientImportRow.update({ where: { id: row.id }, data: { status: "FAILED", errorCode: "PATIENT_CREATE_FAILED" } }); failed += 1; }
    }
    const skipped = batch.rows.filter((row) => !dto.rowIds.includes(row.id) || (dto.decisions?.[row.id] ?? (row as typeof row & { decision?: string }).decision) === "SKIP").length;
    const updated = await this.prisma.patientImportBatch.update({ where: { id }, data: { status: failed ? "completed_with_errors" : "completed", importedCount: imported, skippedCount: skipped, failedCount: failed, completedAt: new Date() }, include: { rows: { orderBy: { rowNumber: "asc" } } } });
    await this.audit.record({ actorUserId: user.id, action: "patient_import.committed", resourceType: "patient_import_batch", resourceId: id, branchId: user.branchId, severity: "high", metadataJson: { imported, skipped, failed, automaticMerge: false } });
    return updated;
  }

  async rollback(id: string, dto: RollbackPatientImportDto, user: AuthUser) {
    this.assertManager(user);
    if (dto.reason.trim().length < 3) throw new BadRequestException("Rollback reason is required.");
    const batch = await this.get(id, user);
    if (!batch.status.startsWith("completed")) throw new BadRequestException("Only a completed import batch can be rolled back.");
    const importedRows = batch.rows.filter((row) => row.createdPatientId && row.status === "IMPORTED");
    const blocked: Array<{ rowId: string; code: string }> = [];
    const eligible: typeof importedRows = [];
    for (const row of importedRows) {
      const references = await this.patientReferenceCount(row.createdPatientId!);
      if (references > 0) blocked.push({ rowId: row.id, code: "PATIENT_HAS_DEPENDENT_RECORDS" }); else eligible.push(row);
    }
    if (blocked.length) return { batchId: id, rolledBack: 0, blocked, constrained: true, message: "Rollback refused: one or more imported patients now have dependent records." };
    await this.prisma.$transaction(async (transaction) => {
      for (const row of eligible) {
        await transaction.patientImportRow.update({ where: { id: row.id }, data: { createdPatientId: null, status: "ROLLED_BACK", errorCode: null } });
        await transaction.patient.delete({ where: { id: row.createdPatientId! } });
      }
      await transaction.patientImportBatch.update({ where: { id }, data: { status: "rolled_back", importedCount: 0 } });
    });
    await this.audit.record({ actorUserId: user.id, action: "patient_import.rolled_back", resourceType: "patient_import_batch", resourceId: id, branchId: user.branchId, severity: "critical", reason: dto.reason.trim(), metadataJson: { patientRecordsDeleted: eligible.length, dependentClinicalRecordsDeleted: 0, constrained: true } });
    return { batchId: id, rolledBack: eligible.length, blocked: [], constrained: true };
  }

  private async patientReferenceCount(patientId: string) {
    const foreignKeys = await this.prisma.$queryRaw<Array<{ tableName: string; columnName: string }>>`SELECT child.relname AS "tableName", attribute.attname AS "columnName" FROM pg_constraint constraint_row JOIN pg_class parent ON parent.oid = constraint_row.confrelid JOIN pg_class child ON child.oid = constraint_row.conrelid JOIN unnest(constraint_row.conkey) WITH ORDINALITY AS key(attnum, ordinal) ON true JOIN pg_attribute attribute ON attribute.attrelid = child.oid AND attribute.attnum = key.attnum WHERE constraint_row.contype = 'f' AND parent.relname = 'Patient'`;
    let count = 0;
    for (const foreignKey of foreignKeys) {
      if (foreignKey.tableName === "PatientImportRow") continue;
      const table = foreignKey.tableName.replace(/"/g, '""'); const column = foreignKey.columnName.replace(/"/g, '""');
      const rows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT count(*)::bigint count FROM "${table}" WHERE "${column}" = $1::uuid`, patientId);
      count += Number(rows[0]?.count ?? 0);
    }
    return count;
  }

  private async prepareRow(raw: Record<string, unknown>, mapping: Record<string, string>, rowNumber: number, user: AuthUser) {
    const get = (field: string) => text(raw[mapping[field] ?? ""]);
    const fullName = get("fullName") ?? ""; const parts = fullName.split(/\s+/).filter(Boolean);
    const normalized = { fullName, firstName: parts[0] ?? "", lastName: parts.slice(1).join(" "), primaryPhone: normalizePhone(get("primaryPhone")), secondaryPhone: normalizePhone(get("secondaryPhone")), address: get("address"), spouseName: get("spouseName"), birthValue: get("birthValue"), patientType: get("patientType"), currentPhase: get("currentPhase"), registrationDate: get("registrationDate"), notes: get("notes"), externalId: get("externalId") };
    const warnings: string[] = [];
    if (!validName(fullName) || !normalized.lastName) return { rowNumber, status: "INVALID", decision: "BLOCKED", selected: false, normalized, warnings: ["Valid full name is required."], duplicates: [] };
    if (normalized.birthValue && !date(normalized.birthValue)) warnings.push("Birth date/year needs review.");
    const duplicates = normalized.primaryPhone ? await this.prisma.patient.findMany({ where: { phone: { in: egyptianPhoneVariants(normalized.primaryPhone) } }, select: { id: true, medicalRecordNumber: true, firstName: true, lastName: true, phone: true, dateOfBirth: true }, take: 5 }) : [];
    return { rowNumber, status: duplicates.length ? "POSSIBLE_DUPLICATE" : warnings.length ? "NEEDS_REVIEW" : "READY", decision: duplicates.length ? "RESOLVE_EXISTING" : "CONFIRM_CREATE", selected: true, normalized, warnings, duplicates };
  }
  private assertManager(user: AuthUser) { if (!user.roles.some((role) => ["Owner", "Admin"].includes(role))) throw new ForbiddenException("Patient import is restricted to Owner and Admin roles."); }
}

function text(value: unknown) { const result = typeof value === "string" || typeof value === "number" ? String(value).trim() : ""; return result || null; }
function unsafeCell(value: unknown) { const item = text(value) ?? ""; return /^[=+@-]/.test(item) || item.includes("\uFFFD") || /\?{3,}/.test(item); }
function safeFileName(value: string) { return value.replace(/[^a-zA-Z0-9._\-\u0600-\u06ff ]/g, "_").slice(0, 240); }
function validName(value: string) { return /^[\p{L}][\p{L}\p{M} .'’-]{1,239}$/u.test(value); }
function normalizePhone(value: string | null) { const digits = value?.replace(/\D/g, "") ?? ""; if (/^01\d{9}$/.test(digits)) return `+20${digits.slice(1)}`; if (/^201\d{9}$/.test(digits)) return `+${digits}`; return digits.length >= 8 ? `+${digits}` : null; }
function egyptianPhoneVariants(normalized: string) { const digits = normalized.replace(/\D/g, ""); return digits.startsWith("20") ? [normalized, digits, `0${digits.slice(2)}`] : [normalized, digits]; }
function date(value: unknown) { const input = text(value); if (!input || /^\d{4}$/.test(input)) return null; const parsed = new Date(`${input.slice(0, 10)}T00:00:00.000Z`); return Number.isNaN(parsed.getTime()) ? null : parsed; }
function birthFields(value: unknown) { const input = text(value); return /^\d{4}$/.test(input ?? "") ? { yearOfBirth: Number(input), dateOfBirth: null } : { dateOfBirth: date(input), yearOfBirth: null }; }
function importNotes(value: Record<string, unknown>) { return [text(value.notes), text(value.address) ? `Address: ${text(value.address)}` : null, text(value.spouseName) ? `Husband name: ${text(value.spouseName)}` : null].filter(Boolean).join("\n") || null; }
function patientType(value: unknown): PatientType { const key = String(value ?? "GENERAL").trim().toUpperCase(); if (["OB", "OBSTETRIC", "PREGNANCY", "OBSTETRIC/PREGNANCY", "حمل", "حوامل"].includes(key)) return "OB"; if (["GYN", "GYNECOLOGY", "نساء", "أمراض نساء"].includes(key)) return "GYN"; if (["INFERTILITY", "FERTILITY", "تأخر الإنجاب", "عقم"].includes(key)) return "INFERTILITY"; if (["WOMEN_HEALTH", "WOMEN'S HEALTH", "WOMENS HEALTH", "صحة المرأة"].includes(key)) return "WOMEN_HEALTH"; return "GENERAL"; }

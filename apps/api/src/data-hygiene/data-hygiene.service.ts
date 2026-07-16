import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

export type ClassifiedResource = "patient" | "external-intake" | "ultrasound" | "encounter" | "queue-ticket";
type Classification = "REAL" | "TEST" | "NEEDS_REVIEW" | "QUARANTINED";

const TABLES: Record<ClassifiedResource, string> = {
  patient: "Patient",
  "external-intake": "ExternalPatientSubmission",
  ultrasound: "ObUltrasound",
  encounter: "Encounter",
  "queue-ticket": "QueueTicket"
};

@Injectable()
export class DataHygieneService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async review(user: AuthUser, view = "candidates") {
    this.assertOwner(user);
    const records = view === "duplicates"
      ? await this.prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT p.id, p."medicalRecordNumber", p."firstName", p."lastName", p."dataClassification", p."createdAt", 'exact_normalized_phone' AS signal FROM "Patient" p JOIN (SELECT regexp_replace(phone, '\\D', '', 'g') normalized FROM "Patient" WHERE phone IS NOT NULL GROUP BY normalized HAVING count(*) > 1) d ON regexp_replace(p.phone, '\\D', '', 'g') = d.normalized ORDER BY p."createdAt" DESC LIMIT 100`
      : view === "incomplete"
        ? await this.prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT id, "medicalRecordNumber", "firstName", "lastName", "dataClassification", "createdAt", 'missing_phone_or_birth_date' AS signal FROM "Patient" WHERE phone IS NULL OR ("dateOfBirth" IS NULL AND "yearOfBirth" IS NULL) ORDER BY "createdAt" DESC LIMIT 100`
        : view === "external-intake"
          ? await this.prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT id, 'external-intake' AS resource, "dataClassification", "classificationReason", "createdAt", CASE WHEN "dataClassification" <> 'REAL' THEN 'explicit_classification' ELSE 'test_external_submission_candidate' END AS signal FROM "ExternalPatientSubmission" WHERE "dataClassification" <> 'REAL' OR source ~* '(test|qa|demo|playwright|automated)' OR "rawAnswersJson"::text ~* '(Demo Route|Demo Workflow|Demo Clinical|Test Intake Only)' ORDER BY "createdAt" DESC LIMIT 100`
          : view === "empty-ultrasounds"
            ? await this.prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT id, 'ultrasound' AS resource, "dataClassification", "classificationReason", "createdAt", 'clinically_empty_ultrasound_candidate' AS signal FROM "ObUltrasound" WHERE "dataClassification" <> 'REAL' OR ("impressionText" IS NULL AND "scanType" IS NULL AND "fetalHeartRateBpm" IS NULL AND "bpdMm" IS NULL AND "hcMm" IS NULL AND "acMm" IS NULL AND "flMm" IS NULL AND "structuredFindingsJson" IS NULL) ORDER BY "createdAt" DESC LIMIT 100`
            : view === "orphan-locks"
              ? await this.prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT l.id, 'queue-lock' AS resource, l."createdAt", 'orphan_or_inactive_queue_lock' AS signal FROM "ActiveQueueTicketLock" l LEFT JOIN "QueueTicket" q ON q.id = l."queueTicketId" WHERE q.id IS NULL OR q.status NOT IN ('waiting','called','in_room') ORDER BY l."createdAt" DESC LIMIT 100`
              : await this.prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT p.id, 'patient' AS resource, p."medicalRecordNumber", p."firstName", p."lastName", p."dataClassification", p."classificationReason", p."createdAt", CASE WHEN p."dataClassification" = 'NEEDS_REVIEW' THEN 'explicit_needs_review' WHEN p."dataClassification" IN ('TEST','QUARANTINED') THEN 'explicit_non_operational_classification' WHEN u.id IS NOT NULL THEN 'configured_automated_actor_candidate' WHEN NOT EXISTS (SELECT 1 FROM "Encounter" e WHERE e."patientId" = p.id) THEN 'qa_pattern_and_clinically_empty_candidate' ELSE 'qa_name_candidate_not_classified' END AS signal FROM "Patient" p LEFT JOIN "User" u ON u.id = p."createdByUserId" AND concat_ws(' ', u."loginId", u."displayName", u.email) ~* '(test|qa|demo|playwright|automated)' WHERE p."dataClassification" <> 'REAL' OR p."medicalRecordNumber" ~* '^(DEMO|TEST|QA|PW|AUTO)-' OR concat_ws(' ', p."firstName", p."lastName") ~* '(Demo Route|Demo Workflow|Demo Clinical|Test Intake Only|(^|[[:space:]])(QA|Test|Demo)([[:space:]]|$))' OR u.id IS NOT NULL ORDER BY p."createdAt" DESC LIMIT 100`;
    return { view, records: records.map((record) => ({ resource: "patient", ...record })), policy: "Signals create review candidates only. They never classify, merge, or delete a record automatically." };
  }

  async report(user: AuthUser) {
    this.assertOwner(user);
    const [classifications, incomplete, duplicatePhones, orphanLocks, emptyUltrasounds] = await Promise.all([
      this.prisma.$queryRaw<Array<{ classification: string; count: bigint }>>`SELECT "dataClassification"::text classification, count(*)::bigint count FROM "Patient" GROUP BY "dataClassification"`,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint count FROM "Patient" WHERE phone IS NULL OR ("dateOfBirth" IS NULL AND "yearOfBirth" IS NULL)`,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint count FROM (SELECT regexp_replace(phone, '\\D', '', 'g') FROM "Patient" WHERE phone IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d`,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint count FROM "ActiveQueueTicketLock" l LEFT JOIN "QueueTicket" q ON q.id = l."queueTicketId" WHERE q.id IS NULL OR q.status NOT IN ('waiting','called','in_room')`,
      this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*)::bigint count FROM "ObUltrasound" WHERE "impressionText" IS NULL AND "scanType" IS NULL AND "fetalHeartRateBpm" IS NULL AND "bpdMm" IS NULL AND "hcMm" IS NULL AND "acMm" IS NULL AND "flMm" IS NULL`
    ]);
    return { generatedAt: new Date().toISOString(), classifications: classifications.map((row) => ({ ...row, count: Number(row.count) })), incompletePatients: Number(incomplete[0]?.count ?? 0), exactPhoneDuplicateGroups: Number(duplicatePhones[0]?.count ?? 0), orphanQueueLocks: Number(orphanLocks[0]?.count ?? 0), emptyUltrasounds: Number(emptyUltrasounds[0]?.count ?? 0), automaticDeletion: false };
  }

  async classify(user: AuthUser, resource: ClassifiedResource, id: string, classification: Classification, reason: string) {
    this.assertOwner(user);
    const table = TABLES[resource];
    if (!table) throw new NotFoundException("Classification resource is not supported.");
    const previous = await this.prisma.$queryRawUnsafe<Array<{ dataClassification: Classification }>>(`SELECT "dataClassification" FROM "${table}" WHERE id = $1::uuid`, id);
    if (!previous[0]) throw new NotFoundException("Record was not found.");
    const hasMetadata = ["patient", "external-intake", "ultrasound"].includes(resource);
    const changed = hasMetadata
      ? await this.prisma.$executeRawUnsafe(`UPDATE "${table}" SET "dataClassification" = $1::"DataClassification", "classificationReason" = $2, "classifiedAt" = now(), "classifiedByUserId" = $3::uuid WHERE id = $4::uuid`, classification, reason.trim(), user.id, id)
      : await this.prisma.$executeRawUnsafe(`UPDATE "${table}" SET "dataClassification" = $1::"DataClassification" WHERE id = $2::uuid`, classification, id);
    if (!changed) throw new NotFoundException("Record was not found.");
    await this.audit.record({ actorUserId: user.id, action: "data_classification.changed", resourceType: resource, resourceId: id, branchId: user.branchId, severity: "high", reason: reason.trim(), metadataJson: { beforeClassification: previous[0].dataClassification, afterClassification: classification } });
    return { id, resource, classification, audited: true };
  }

  private assertOwner(user: AuthUser) {
    if (!user.roles.includes("Owner")) throw new ForbiddenException("Data Hygiene Center is restricted to Owner accounts.");
  }
}

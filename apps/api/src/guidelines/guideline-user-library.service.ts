import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

export type ArchiveGuidelineInput = {
  reason: string;
  confirmation: string;
};

type FavoriteRow = {
  documentId: string;
  createdAt: Date;
};

type RecentRow = {
  documentId: string;
  openedAt: Date;
};

@Injectable()
export class GuidelineUserLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async state(user: AuthUser) {
    const [favoriteRows, recentRows] = await Promise.all([
      this.prisma.$queryRaw<FavoriteRow[]>(Prisma.sql`
        SELECT "documentId", "createdAt"
        FROM "GuidelineFavorite"
        WHERE "userId" = ${user.id}::uuid
        ORDER BY "createdAt" DESC
        LIMIT 100
      `),
      this.prisma.$queryRaw<RecentRow[]>(Prisma.sql`
        SELECT DISTINCT ON ("resourceId")
          "resourceId" AS "documentId",
          "createdAt" AS "openedAt"
        FROM "AuditLog"
        WHERE "actorUserId" = ${user.id}::uuid
          AND "resourceType" = 'guideline_document'
          AND "action" IN ('guideline.document_opened', 'guideline.document_read', 'guideline.file_viewed')
          AND "resourceId" IS NOT NULL
        ORDER BY "resourceId", "createdAt" DESC
        LIMIT 100
      `)
    ]);

    const orderedIds = unique([
      ...favoriteRows.map((row) => row.documentId),
      ...recentRows.map((row) => row.documentId)
    ]);

    const documents = orderedIds.length
      ? await this.prisma.guidelineDocument.findMany({
          where: {
            id: { in: orderedIds },
            ...this.accessWhere(user)
          },
          include: {
            source: true,
            _count: { select: { chunks: true, sections: true } }
          }
        })
      : [];

    const byId = new Map(documents.map((document) => [document.id, this.safeDocument(document)]));

    return {
      favoriteIds: favoriteRows.map((row) => row.documentId).filter((id) => byId.has(id)),
      favorites: favoriteRows.flatMap((row) => {
        const document = byId.get(row.documentId);
        return document ? [{ ...document, favoritedAt: row.createdAt }] : [];
      }),
      recent: recentRows.flatMap((row) => {
        const document = byId.get(row.documentId);
        return document ? [{ ...document, openedAt: row.openedAt }] : [];
      })
    };
  }

  async favorite(documentId: string, user: AuthUser) {
    await this.ensureAccessibleDocument(documentId, user);
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "GuidelineFavorite" ("id", "userId", "documentId", "createdAt")
      VALUES (gen_random_uuid(), ${user.id}::uuid, ${documentId}::uuid, NOW())
      ON CONFLICT ("userId", "documentId") DO NOTHING
    `);
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.favorite_added",
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: "low"
    });
    return { documentId, favorite: true };
  }

  async unfavorite(documentId: string, user: AuthUser) {
    await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM "GuidelineFavorite"
      WHERE "userId" = ${user.id}::uuid
        AND "documentId" = ${documentId}::uuid
    `);
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.favorite_removed",
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: "low"
    });
    return { documentId, favorite: false };
  }

  async recordOpened(documentId: string, user: AuthUser) {
    const document = await this.ensureAccessibleDocument(documentId, user);
    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.document_opened",
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: "medium",
      metadataJson: {
        title: document.title,
        status: document.guidelineStatus,
        accessLevel: document.accessLevel
      }
    });
    return { documentId, opened: true };
  }

  async archive(documentId: string, input: ArchiveGuidelineInput, user: AuthUser) {
    this.assertDoctorOrOwner(user);
    const document = await this.ensureAccessibleDocument(documentId, user, true);
    if (document.archivedAt || document.guidelineStatus === "ARCHIVED") {
      throw new BadRequestException("This guideline is already archived.");
    }
    if (input.confirmation.trim() !== document.title) {
      throw new BadRequestException("Type the exact guideline title to confirm archiving.");
    }
    const reason = input.reason.trim();
    if (reason.length < 4) {
      throw new BadRequestException("Archive reason must contain at least four characters.");
    }

    const archived = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM "GuidelineFavorite"
        WHERE "documentId" = ${documentId}::uuid
      `);
      return tx.guidelineDocument.update({
        where: { id: documentId },
        data: {
          guidelineStatus: "ARCHIVED",
          archivedAt: new Date(),
          reviewStatus: "archived"
        },
        include: {
          source: true,
          _count: { select: { chunks: true, sections: true } }
        }
      });
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.document_archived_safe",
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: "high",
      reason,
      metadataJson: {
        title: document.title,
        previousStatus: document.guidelineStatus,
        citationsPreserved: true,
        filePreserved: true
      }
    });

    return this.safeDocument(archived);
  }

  async restore(documentId: string, user: AuthUser) {
    this.assertDoctorOrOwner(user);
    const document = await this.ensureAccessibleDocument(documentId, user, true);
    if (!document.archivedAt && document.guidelineStatus !== "ARCHIVED") {
      return this.safeDocument(document);
    }

    const restored = await this.prisma.guidelineDocument.update({
      where: { id: documentId },
      data: {
        guidelineStatus: "NEEDS_REVIEW",
        archivedAt: null,
        reviewStatus: "pending_governance_review"
      },
      include: {
        source: true,
        _count: { select: { chunks: true, sections: true } }
      }
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.document_restored",
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: "high",
      metadataJson: {
        title: document.title,
        restoredTo: "NEEDS_REVIEW"
      }
    });

    return this.safeDocument(restored);
  }

  private async ensureAccessibleDocument(documentId: string, user: AuthUser, includeArchived = false) {
    const document = await this.prisma.guidelineDocument.findFirst({
      where: {
        id: documentId,
        ...this.accessWhere(user),
        ...(includeArchived ? {} : { archivedAt: null })
      },
      include: {
        source: true,
        _count: { select: { chunks: true, sections: true } }
      }
    });
    if (!document) throw new NotFoundException("Guideline document not found.");
    return document;
  }

  private accessWhere(user: AuthUser) {
    if (user.isSystemOwner || user.roles.includes("Owner")) return {};
    if (user.roles.includes("Doctor")) {
      return { accessLevel: { in: ["OWNER_DOCTOR", "CLINICAL_TEAM"] as const } };
    }
    return { accessLevel: "CLINICAL_TEAM" as const };
  }

  private assertDoctorOrOwner(user: AuthUser) {
    if (!user.isSystemOwner && !user.roles.some((role) => role === "Doctor" || role === "Owner")) {
      throw new ForbiddenException("Only a Doctor or Owner can archive or restore guideline documents.");
    }
  }

  private safeDocument(document: any) {
    return {
      id: document.id,
      title: document.title,
      organization: document.organization,
      specialty: document.specialty,
      topic: document.topic,
      subtopic: document.subtopic,
      versionLabel: document.versionLabel,
      publicationDate: document.publicationDate,
      updatedAt: document.updatedAt,
      guidelineStatus: document.guidelineStatus,
      reviewStatus: document.reviewStatus,
      licenseStatus: document.licenseStatus,
      accessLevel: document.accessLevel,
      archivedAt: document.archivedAt,
      fileName: document.fileName,
      fileMimeType: document.fileMimeType,
      pageCount: document.pageCount,
      hasAsset: Boolean(document.localFilePath || document.storageRef),
      source: document.source
        ? {
            id: document.source.id,
            name: document.source.name,
            organization: document.source.organization
          }
        : null,
      _count: document._count ?? { chunks: 0, sections: 0 }
    };
  }
}

function unique(values: string[]) {
  return [...new Set(values)];
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { GuidelineStatus, Prisma } from "@prisma/client";
import type { AuthUser } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import type { ReviewGuidelineDto } from "./dto/review-guideline.dto";

const governanceDocumentInclude = {
  source: true,
  _count: { select: { chunks: true, sections: true } }
} satisfies Prisma.GuidelineDocumentInclude;

type GovernanceDocument = Prisma.GuidelineDocumentGetPayload<{
  include: typeof governanceDocumentInclude;
}>;

@Injectable()
export class GuidelineGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async reviewDocument(documentId: string, dto: ReviewGuidelineDto, user: AuthUser) {
    this.assertClinicalReviewer(user);

    const existing = await this.prisma.guidelineDocument.findUnique({
      where: { id: documentId },
      include: governanceDocumentInclude
    });
    if (!existing) throw new NotFoundException("Guideline document not found.");
    if (existing.guidelineStatus === GuidelineStatus.ARCHIVED || existing.archivedAt) {
      throw new BadRequestException("Restore the archived guideline to Needs Review before making a review decision.");
    }

    const reason = dto.reason?.trim() ?? "";
    if (reason.length < 4) {
      throw new BadRequestException("A clinical review note of at least four characters is required.");
    }

    if (dto.decision === "APPROVED") {
      const hasUsableSource = Boolean(
        existing.localFilePath ||
        existing.storageRef ||
        existing._count.chunks > 0
      );
      if (!hasUsableSource) {
        throw new BadRequestException("An incomplete metadata shell cannot be activated. Attach a source file or indexed source text first.");
      }
    }

    if (dto.decision === "ARCHIVED") {
      throw new BadRequestException("Use the protected archive workflow with reason and exact-title confirmation.");
    }

    const nextStatus = dto.decision === "APPROVED"
      ? GuidelineStatus.ACTIVE
      : GuidelineStatus.NEEDS_REVIEW;

    const document: GovernanceDocument = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.guidelineDocument.update({
        where: { id: documentId },
        data: {
          guidelineStatus: nextStatus,
          reviewedByUserId: user.id,
          reviewedAt: new Date(),
          reviewStatus: dto.decision === "APPROVED" ? "clinically_reviewed" : "rejected"
        },
        include: governanceDocumentInclude
      });

      await tx.guidelineReviewDecision.create({
        data: {
          documentId,
          decision: dto.decision,
          reason,
          decidedByUserId: user.id,
          reviewerUserId: user.id
        }
      });
      return updated;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.governance_reviewed",
      resourceType: "guideline_document",
      resourceId: documentId,
      severity: "high",
      reason,
      metadataJson: {
        previousStatus: existing.guidelineStatus,
        nextStatus,
        decision: dto.decision,
        sourceAssetPresent: Boolean(existing.localFilePath || existing.storageRef),
        indexedChunkCount: existing._count.chunks,
        automaticActivation: false
      }
    });

    return {
      id: document.id,
      title: document.title,
      organization: document.organization,
      specialty: document.specialty,
      topic: document.topic,
      versionLabel: document.versionLabel,
      guidelineStatus: document.guidelineStatus,
      reviewStatus: document.reviewStatus,
      reviewedAt: document.reviewedAt,
      source: document.source,
      _count: document._count,
      hasAsset: Boolean(document.localFilePath || document.storageRef)
    };
  }

  private assertClinicalReviewer(user: AuthUser) {
    if (!user.isSystemOwner && !user.roles.some((role) => role === "Doctor" || role === "Owner")) {
      throw new ForbiddenException("Guideline activation and rejection require a Doctor or Owner clinical reviewer.");
    }
  }
}

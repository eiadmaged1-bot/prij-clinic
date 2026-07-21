import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { AuthUser } from "../auth/auth.types";
import { GuidelineKnowledgeSearchService } from "./guideline-knowledge-search.service";

@Injectable()
export class GuidelineEvidenceAssistantService {
  constructor(
    private readonly knowledgeSearch: GuidelineKnowledgeSearchService,
    private readonly audit: AuditService
  ) {}

  async answer(questionInput: string | undefined, user: AuthUser) {
    const question = questionInput?.trim() ?? "";
    if (question.length < 4) {
      throw new BadRequestException("Enter a clinical question of at least four characters.");
    }

    const search = await this.knowledgeSearch.search({ q: question, limit: "6" }, user);
    const citedEvidence = search.guidelineResults
      .filter((result) => result.pageStart !== null || result.citedBullets.length > 0)
      .slice(0, 5);

    const citations = citedEvidence.map((result) => ({
      documentId: result.documentId,
      title: result.title,
      organization: result.organization,
      versionLabel: result.versionLabel,
      sectionHeading: result.sectionHeading,
      citationLabel: result.citationLabel,
      pageStart: result.pageStart,
      pageEnd: result.pageEnd,
      link: result.pageStart
        ? `/guidelines/${result.documentId}?page=${result.pageStart}`
        : `/guidelines/${result.documentId}?tab=summary`
    }));

    const statements = citedEvidence.flatMap((result) => {
      const bullets = result.citedBullets.length
        ? result.citedBullets.slice(0, 2)
        : [result.snippet];
      return bullets.map((statement) => ({
        statement: cleanStatement(statement),
        documentId: result.documentId,
        page: result.pageStart,
        citationLabel: result.citationLabel
      }));
    }).filter((entry) => entry.statement).slice(0, 6);

    const noSupportingSource = statements.length === 0;
    const response = {
      question,
      answer: noSupportingSource
        ? "No supporting source was found in the approved guideline library."
        : "The approved local library contains the cited evidence statements below. Review each source in context before applying it to a patient.",
      statements,
      citations,
      relatedProtocols: search.protocolResults.slice(0, 5),
      noSupportingSource,
      doctorReviewRequired: true,
      externalAiAccess: false,
      generatedClinicalPlan: false
    };

    await this.audit.record({
      actorUserId: user.id,
      action: "guideline.source_grounded_assistant_used",
      resourceType: "guideline_query",
      severity: "medium",
      metadataJson: {
        citationCount: citations.length,
        statementCount: statements.length,
        relatedProtocolCount: response.relatedProtocols.length,
        noSupportingSource,
        externalAiAccess: false,
        generatedClinicalPlan: false
      }
    });

    return response;
  }
}

function cleanStatement(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 700);
}

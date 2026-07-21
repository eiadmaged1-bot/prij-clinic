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
    const questionTerms = meaningfulQuestionTerms(question);
    const citedEvidence = search.guidelineResults
      .map((result) => ({ result, relevance: evidenceRelevance(result, questionTerms) }))
      .filter(({ result, relevance }) => relevance > 0 && (result.pageStart !== null || result.citedBullets.length > 0))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5)
      .map(({ result }) => result);

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
    const relatedProtocols = noSupportingSource
      ? []
      : search.protocolResults.slice(0, 5);
    const response = {
      question,
      answer: noSupportingSource
        ? "No supporting source was found in the approved guideline library."
        : "The approved local library contains the cited evidence statements below. Review each source in context before applying it to a patient.",
      statements,
      citations,
      relatedProtocols,
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
        meaningfulQuestionTermCount: questionTerms.length,
        noSupportingSource,
        externalAiAccess: false,
        generatedClinicalPlan: false
      }
    });

    return response;
  }
}

function evidenceRelevance(
  result: {
    title: string;
    sectionHeading: string;
    snippet: string;
    citedBullets: string[];
    clinicalSubtopic: string;
  },
  terms: string[]
) {
  const title = normalize(result.title);
  const section = normalize(`${result.sectionHeading} ${result.clinicalSubtopic}`);
  const evidence = normalize(`${result.snippet} ${result.citedBullets.join(" ")}`);
  const matchedTerms = new Set<string>();
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) {
      score += 5;
      matchedTerms.add(term);
    }
    if (section.includes(term)) {
      score += 3;
      matchedTerms.add(term);
    }
    if (evidence.includes(term)) {
      score += 2;
      matchedTerms.add(term);
    }
  }

  if (terms.length >= 2 && matchedTerms.size < 2 && score < 5) return 0;
  return score;
}

function meaningfulQuestionTerms(question: string) {
  const stopWords = new Set([
    "about",
    "approved",
    "does",
    "evidence",
    "from",
    "guideline",
    "guidelines",
    "library",
    "protocol",
    "query",
    "show",
    "source",
    "sources",
    "supporting",
    "that",
    "this",
    "what",
    "with"
  ]);
  const terms = normalize(question)
    .split(" ")
    .filter((term) => term.length >= 3 && !stopWords.has(term));
  return [...new Set(terms)].slice(0, 12);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .trim();
}

function cleanStatement(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 700);
}

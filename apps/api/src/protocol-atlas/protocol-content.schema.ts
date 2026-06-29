import { BadRequestException } from "@nestjs/common";

export const protocolStatuses = ["catalog_only", "draft", "verified", "retired"] as const;
export type ProtocolImplementationStatus = (typeof protocolStatuses)[number];

export type StructuredProtocolContent = {
  summary: string;
  verifiedManagementAvailable: boolean;
  goals: string[];
  options: string[];
  safetyChecks: string[];
  contraindicationChecks: string[];
  redFlags: string[];
  followUpConsiderations: string[];
  referralConsiderations: string[];
  limitations: string[];
};

export type ProtocolForVerification = {
  implementationStatus: string;
  sourceName?: string | null;
  sourceYear?: number | null;
  sourceUrl?: string | null;
  sourceVersion?: string | null;
  contentJson?: unknown;
};

const emptyContent: StructuredProtocolContent = {
  summary: "",
  verifiedManagementAvailable: false,
  goals: [],
  options: [],
  safetyChecks: [],
  contraindicationChecks: [],
  redFlags: [],
  followUpConsiderations: [],
  referralConsiderations: [],
  limitations: []
};

const listLimits: Record<keyof Omit<StructuredProtocolContent, "summary" | "verifiedManagementAvailable">, number> = {
  goals: 8,
  options: 5,
  safetyChecks: 8,
  contraindicationChecks: 8,
  redFlags: 8,
  followUpConsiderations: 8,
  referralConsiderations: 8,
  limitations: 8
};

const unsafePatterns = [
  { pattern: /\b\d+(\.\d+)?\s*(mg|mcg|g|gram|grams|ml|iu|units?|tabs?|tablets?|caps?|capsules?)\b/i, message: "Medication dose patterns are not allowed." },
  { pattern: /\b(must|should)\s+prescribe\b/i, message: "Prescribing commands are not allowed." },
  { pattern: /\bdefinitive diagnosis\b/i, message: "Definitive diagnosis language is not allowed." },
  { pattern: /\bguaranteed\b/i, message: "Guaranteed outcome language is not allowed." },
  { pattern: /\balways\b/i, message: "Always language is not allowed." }
];

const neverPattern = /\bnever\b/i;

export function blankStructuredProtocolContent(): StructuredProtocolContent {
  return { ...emptyContent, goals: [], options: [], safetyChecks: [], contraindicationChecks: [], redFlags: [], followUpConsiderations: [], referralConsiderations: [], limitations: [] };
}

export function normalizeProtocolContent(contentJson: unknown): StructuredProtocolContent {
  const input = isObject(contentJson) ? contentJson : {};
  return {
    summary: cleanText(input.summary),
    verifiedManagementAvailable: input.verifiedManagementAvailable === true,
    goals: cleanList(input.goals),
    options: cleanList(input.options),
    safetyChecks: cleanList(input.safetyChecks),
    contraindicationChecks: cleanList(input.contraindicationChecks),
    redFlags: cleanList(input.redFlags),
    followUpConsiderations: cleanList(input.followUpConsiderations),
    referralConsiderations: cleanList(input.referralConsiderations),
    limitations: cleanList(input.limitations)
  };
}

export function validateProtocolContentForStatus(status: string, contentJson: unknown): StructuredProtocolContent {
  if (!protocolStatuses.includes(status as ProtocolImplementationStatus)) {
    throw new BadRequestException("Unsupported protocol implementation status.");
  }

  const content = normalizeProtocolContent(contentJson);
  const errors: string[] = [];

  for (const [key, max] of Object.entries(listLimits) as Array<[keyof typeof listLimits, number]>) {
    if (content[key].length > max) errors.push(`${key} supports at most ${max} items.`);
  }

  if (status === "catalog_only" && content.options.length > 0) {
    errors.push("Catalog-only protocols cannot store management options.");
  }

  if (content.verifiedManagementAvailable && status !== "verified") {
    errors.push("Verified management availability can be true only for verified protocols.");
  }

  if (status === "verified" && !content.summary.trim()) {
    errors.push("Verified protocols require a structured summary.");
  }

  if (status === "verified" && content.options.length === 0) {
    errors.push("Verified protocols require at least one structured management option.");
  }

  const unsafe = detectUnsafeClinicalPhrases(flattenContent(content));
  errors.push(...unsafe);

  if (errors.length) throw new BadRequestException(errors.join(" "));
  return { ...content, verifiedManagementAvailable: status === "verified" && content.verifiedManagementAvailable === true };
}

export function validateVerifiedProtocolRequirements(protocol: ProtocolForVerification) {
  const errors: string[] = [];
  if (!protocol.sourceName?.trim()) errors.push("Verified protocols require a source name.");
  if (!protocol.sourceYear && !protocol.sourceUrl?.trim() && !protocol.sourceVersion?.trim()) {
    errors.push("Verified protocols require a source year, source version, source URL, or explicit source note.");
  }

  try {
    validateProtocolContentForStatus("verified", protocol.contentJson);
  } catch (error) {
    if (error instanceof BadRequestException) errors.push(String(error.message));
    else throw error;
  }

  if (errors.length) throw new BadRequestException(errors.join(" "));
}

export function detectUnsafeClinicalPhrases(text: string | string[]) {
  const haystack = Array.isArray(text) ? text.join("\n") : text;
  const errors: string[] = [];
  for (const { pattern, message } of unsafePatterns) {
    if (pattern.test(haystack)) errors.push(message);
  }
  if (neverPattern.test(haystack) && !/\b(safety|limitation|red flag|contraindication)\b/i.test(haystack)) {
    errors.push("Never language is allowed only when framed as a safety limitation.");
  }
  return errors;
}

function flattenContent(content: StructuredProtocolContent) {
  return [
    content.summary,
    ...content.goals,
    ...content.options,
    ...content.safetyChecks,
    ...content.contraindicationChecks,
    ...content.redFlags,
    ...content.followUpConsiderations,
    ...content.referralConsiderations,
    ...content.limitations
  ];
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter(Boolean).slice(0, 20);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 700) : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

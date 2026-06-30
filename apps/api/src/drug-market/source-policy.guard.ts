import { BadRequestException } from "@nestjs/common";

const blockedUrlWords = [
  "login",
  "captcha",
  "checkout",
  "cart",
  "order",
  "stock",
  "branch",
  "payment",
  "paywall",
  "protected"
];

export function assertAllowedSourcePolicy(source: {
  policyStatus?: string | null;
  sourcePolicyStatus?: string | null;
  sourceType?: string | null;
  websiteUrl?: string | null;
  officialUrl?: string | null;
  sourceAccessMode?: string | null;
  isRetailMetadata?: boolean | null;
  enabled?: boolean | null;
}) {
  if (source.policyStatus && source.policyStatus !== "approved") {
    throw new BadRequestException("Source is not approved for import.");
  }
  if (source.sourcePolicyStatus && source.sourcePolicyStatus !== "approved") {
    throw new BadRequestException("Source policy does not allow import.");
  }
  const sourceType = String(source.sourceType ?? "").toLowerCase();
  if (["login_required", "captcha", "paywall", "protected"].includes(sourceType)) {
    throw new BadRequestException("Protected or login-required sources cannot be imported.");
  }
  const accessMode = String(source.sourceAccessMode ?? "").toLowerCase();
  if (["approved_api_required", "gated_manual_required", "unavailable"].includes(accessMode)) {
    throw new BadRequestException("Source requires approved API access or an official owner-provided file.");
  }
  const url = `${source.websiteUrl ?? ""} ${source.officialUrl ?? ""}`.toLowerCase();
  if (blockedUrlWords.some((word) => url.includes(word))) {
    throw new BadRequestException("Purchasing, stock, login, or protected URLs cannot be imported.");
  }
  if (source.isRetailMetadata && !source.enabled) {
    throw new BadRequestException("Retail metadata connector is disabled by default.");
  }
}

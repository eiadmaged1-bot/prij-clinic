import { BadRequestException } from "@nestjs/common";

const blockedUrlWords = ["login", "captcha", "checkout", "cart", "order", "stock", "branch", "payment"];

export function assertAllowedSourcePolicy(source: {
  policyStatus?: string | null;
  sourceType?: string | null;
  websiteUrl?: string | null;
  isRetailMetadata?: boolean | null;
  enabled?: boolean | null;
}) {
  if (source.policyStatus && source.policyStatus !== "approved") {
    throw new BadRequestException("Source is not approved for import.");
  }
  const sourceType = String(source.sourceType ?? "").toLowerCase();
  if (["login_required", "captcha", "paywall", "protected"].includes(sourceType)) {
    throw new BadRequestException("Protected or login-required sources cannot be imported.");
  }
  const url = String(source.websiteUrl ?? "").toLowerCase();
  if (blockedUrlWords.some((word) => url.includes(word))) {
    throw new BadRequestException("Purchasing, stock, login, or protected URLs cannot be imported.");
  }
  if (source.isRetailMetadata && !source.enabled) {
    throw new BadRequestException("Retail metadata connector is disabled by default.");
  }
}

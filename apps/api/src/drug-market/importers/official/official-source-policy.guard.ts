import { BadRequestException } from "@nestjs/common";

const blockedWords = ["captcha", "login", "checkout", "cart", "order", "stock", "paywall", "branch"];

export function assertOfficialMedicationSourceAllowed(input: { url?: string | null; accessMode?: string | null; isRetail?: boolean | null }) {
  const url = String(input.url ?? "").toLowerCase();
  if (blockedWords.some((word) => url.includes(word))) throw new BadRequestException("Protected, purchase, or stock sources are not allowed.");
  if (input.isRetail) throw new BadRequestException("Retail metadata cannot be used for official medication imports.");
  if (["approved_api_required", "gated_manual_required", "unavailable"].includes(String(input.accessMode ?? ""))) {
    throw new BadRequestException("Approved API access or official owner-provided file is required.");
  }
}

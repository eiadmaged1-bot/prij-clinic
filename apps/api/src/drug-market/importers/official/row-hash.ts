import { createHash } from "node:crypto";

export function officialRowHash(countryCode: string, row: Record<string, unknown>) {
  return createHash("sha256").update(`${countryCode}|${JSON.stringify(row)}`).digest("hex");
}

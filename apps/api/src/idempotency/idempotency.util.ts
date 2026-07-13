import { createHash } from "crypto";

export function canonicalizePayload(payload: any): string {
  if (payload === null || payload === undefined) {
    return "";
  }

  if (typeof payload !== "object") {
    return String(payload);
  }

  // Handle arrays
  if (Array.isArray(payload)) {
    return `[${payload.map((item) => canonicalizePayload(item)).join(",")}]`;
  }

  // Handle objects: sort keys to ensure deterministic output
  const keys = Object.keys(payload)
    .filter((key) => payload[key] !== undefined) // Skip undefined values
    .sort();

  const properties = keys.map((key) => {
    return `"${key}":${canonicalizePayload(payload[key])}`;
  });

  return `{${properties.join(",")}}`;
}

export function hashString(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashPayload(payload: any): string {
  return hashString(canonicalizePayload(payload));
}

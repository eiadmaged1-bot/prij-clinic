import { BadRequestException } from "@nestjs/common";

const blockedHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

export function assertSafePublicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException("Use a valid public HTTP or HTTPS URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new BadRequestException("Only HTTP and HTTPS URLs are allowed.");
  }

  if (blockedHostnames.has(url.hostname) || url.hostname.endsWith(".local")) {
    throw new BadRequestException("Local or private URLs are not allowed for open guideline imports.");
  }

  const lower = value.toLowerCase();
  if (/(login|signin|subscribe|paywall|account|session)/.test(lower)) {
    throw new BadRequestException("Login, subscription, or paywall URLs are not allowed for import.");
  }

  return url;
}

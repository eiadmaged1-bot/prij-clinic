const localApiBaseUrl = "http://localhost:3001";
const defaultLanApiPort = "3001";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function configuredApiUrls() {
  return [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_LAN_API_ORIGIN
  ].filter((value): value is string => Boolean(value?.trim()));
}

function isDevelopmentRuntime() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? "";
  return process.env.NODE_ENV !== "production" && appEnv !== "staging" && appEnv !== "production";
}

function isAllowedLanFallback() {
  return process.env.NEXT_PUBLIC_ALLOW_LAN_API_FALLBACK === "true";
}

export function isLocalhost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    if (part.length > 1 && part.startsWith("0")) {
      return Number.NaN;
    }

    const value = Number(part);
    return value >= 0 && value <= 255 ? value : Number.NaN;
  });

  if (octets.some((octet) => Number.isNaN(octet))) {
    return false;
  }

  const first = octets[0] ?? Number.NaN;
  const second = octets[1] ?? Number.NaN;
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

export function isTailscaleOrCgnatIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    if (part.length > 1 && part.startsWith("0")) {
      return Number.NaN;
    }

    const value = Number(part);
    return value >= 0 && value <= 255 ? value : Number.NaN;
  });

  if (octets.some((octet) => Number.isNaN(octet))) {
    return false;
  }

  const first = octets[0] ?? Number.NaN;
  const second = octets[1] ?? Number.NaN;
  return first === 100 && second >= 64 && second <= 127;
}

export function isMdnsLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (!normalized.endsWith(".local") || normalized === ".local") {
    return false;
  }

  return normalized
    .split(".")
    .every((label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
}

export function isSafeDevApiOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || hostname.includes("*")) {
      return false;
    }

    if (url.protocol === "https:") {
      return true;
    }

    if (url.protocol !== "http:") {
      return false;
    }

    return isLocalhost(hostname) || isPrivateIpv4(hostname) || isMdnsLocalHost(hostname) || isTailscaleOrCgnatIpv4(hostname);
  } catch {
    return false;
  }
}

function isSafeConfiguredApiOrigin(origin: string) {
  if (isDevelopmentRuntime()) {
    return isSafeDevApiOrigin(origin);
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !hostname.includes("*")
    );
  } catch {
    return false;
  }
}

export function resolveConfiguredLanApiOrigin() {
  const explicitLanOrigin = process.env.NEXT_PUBLIC_LAN_API_ORIGIN?.trim();
  if (explicitLanOrigin) {
    return isDevelopmentRuntime() && isSafeDevApiOrigin(explicitLanOrigin) ? trimTrailingSlash(explicitLanOrigin) : undefined;
  }

  const lanHost = process.env.NEXT_PUBLIC_LAN_DEV_HOST?.trim();
  if (!isDevelopmentRuntime()) {
    return undefined;
  }

  if (
    !lanHost ||
    lanHost.includes("*") ||
    (!isPrivateIpv4(lanHost) && !isMdnsLocalHost(lanHost.toLowerCase()) && !isTailscaleOrCgnatIpv4(lanHost))
  ) {
    return undefined;
  }

  const lanPort = process.env.NEXT_PUBLIC_LAN_DEV_API_PORT?.trim() || defaultLanApiPort;
  if (!/^\d{1,5}$/.test(lanPort) || Number(lanPort) < 1 || Number(lanPort) > 65535) {
    return undefined;
  }

  const origin = `http://${lanHost}:${lanPort}`;
  return isSafeDevApiOrigin(origin) ? origin : undefined;
}

function resolveConfiguredApiUrl() {
  for (const value of configuredApiUrls()) {
    if (isSafeConfiguredApiOrigin(value)) {
      return trimTrailingSlash(value);
    }
  }

  return resolveConfiguredLanApiOrigin();
}

export function getApiBaseUrl() {
  const configured = resolveConfiguredApiUrl();
  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    if (isDevelopmentRuntime()) {
      return localApiBaseUrl;
    }

    throw new Error("API URL must be explicitly configured outside local development.");
  }

  const hostname = window.location.hostname.toLowerCase();
  if (isLocalhost(hostname)) {
    return localApiBaseUrl;
  }

  if (
    isDevelopmentRuntime() &&
    isAllowedLanFallback() &&
    (isPrivateIpv4(hostname) || isMdnsLocalHost(hostname))
  ) {
    return `http://${hostname}:${defaultLanApiPort}`;
  }

  throw new Error("LAN API fallback is disabled. Configure NEXT_PUBLIC_LAN_API_ORIGIN for this device.");
}

export const apiUnreachableMessage =
  "Cannot reach Prij API from this device. Configure an explicit local API origin or restart the app with a safe LAN dev profile.";

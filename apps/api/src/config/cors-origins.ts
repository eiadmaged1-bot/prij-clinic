type RuntimeEnvironment = "local" | "development" | "test" | "staging" | "production";

type PrivateCidrRule = {
  base: number;
  bits: number;
  cidr: string;
};

type CorsOriginConfig = {
  environment: RuntimeEnvironment;
  exactOrigins: Set<string>;
  privateCidrs: PrivateCidrRule[];
  privatePorts: Set<string>;
  allowTailscaleDevOrigins: boolean;
};

const defaultDevelopmentOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

function runtimeEnvironment(): RuntimeEnvironment {
  const value = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "local").toLowerCase();
  if (value === "production" || value === "staging" || value === "test" || value === "development") {
    return value;
  }

  return "local";
}

function isStrictEnvironment(environment: RuntimeEnvironment) {
  return environment === "production" || environment === "staging";
}

function normalizeOrigin(origin: string, environment: RuntimeEnvironment) {
  const value = origin.trim();
  if (!value || value === "*" || value.includes("*")) {
    throw new Error(`Invalid CORS origin: ${origin}`);
  }

  const url = new URL(value);
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`Invalid CORS origin: ${origin}`);
  }

  if (isStrictEnvironment(environment) && url.protocol === "http:") {
    throw new Error(`HTTP CORS origin is forbidden in ${environment}: ${origin}`);
  }

  return url.origin;
}

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return undefined;
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
    return undefined;
  }

  const first = octets[0] ?? Number.NaN;
  const second = octets[1] ?? Number.NaN;
  const third = octets[2] ?? Number.NaN;
  const fourth = octets[3] ?? Number.NaN;
  return (((first * 256 + second) * 256 + third) * 256 + fourth) >>> 0;
}

function isPrivateIpv4Number(value: number) {
  const first = value >>> 24;
  const second = (value >>> 16) & 255;
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function cidrMask(bits: number) {
  return bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
}

function parsePrivateCidr(cidr: string): PrivateCidrRule {
  const [ip, bitsText] = cidr.trim().split("/");
  const bits = Number(bitsText);
  const ipNumber = ip ? ipv4ToNumber(ip) : undefined;

  if (ipNumber === undefined || !Number.isInteger(bits) || bits < 1 || bits > 32) {
    throw new Error(`Invalid CORS private CIDR: ${cidr}`);
  }

  const mask = cidrMask(bits);
  const network = (ipNumber & mask) >>> 0;
  const startIsPrivate = isPrivateIpv4Number(network);
  const endIsPrivate = isPrivateIpv4Number((network | (~mask >>> 0)) >>> 0);

  if (!startIsPrivate || !endIsPrivate) {
    throw new Error(`CORS private CIDR must stay inside RFC1918 ranges: ${cidr}`);
  }

  return { base: network, bits, cidr: `${ip}/${bits}` };
}

function parsePrivatePorts(value: string | undefined) {
  const ports = (value ?? "")
    .split(",")
    .map((port) => port.trim())
    .filter(Boolean);

  if (ports.length === 0) {
    return new Set(["3000"]);
  }

  return new Set(
    ports.map((port) => {
      if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
        throw new Error(`Invalid CORS private port: ${port}`);
      }

      return String(Number(port));
    })
  );
}

function parseExactOrigins(environment: RuntimeEnvironment) {
  const raw = process.env.CORS_ORIGINS ?? process.env.APP_URL ?? "";
  const values = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (values.length === 0 && !isStrictEnvironment(environment)) {
    return new Set(defaultDevelopmentOrigins);
  }

  return new Set(values.map((origin) => normalizeOrigin(origin, environment)));
}

function isTailscaleIpv4Number(value: number) {
  const first = value >>> 24;
  const second = (value >>> 16) & 255;
  return first === 100 && second >= 64 && second <= 127;
}

function isTailscaleMagicDnsHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (!normalized.endsWith(".ts.net") || normalized === ".ts.net") {
    return false;
  }

  return normalized
    .split(".")
    .every((label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
}

function parsePrivateCidrs(environment: RuntimeEnvironment) {
  const values = (process.env.CORS_PRIVATE_CIDRS ?? "")
    .split(",")
    .map((cidr) => cidr.trim())
    .filter(Boolean);

  if (values.length > 0 && isStrictEnvironment(environment)) {
    throw new Error("CORS_PRIVATE_CIDRS is forbidden in staging and production.");
  }

  return values.map(parsePrivateCidr);
}

export function createCorsOriginConfig(): CorsOriginConfig {
  const environment = runtimeEnvironment();
  const exactOrigins = parseExactOrigins(environment);
  const privateCidrs = parsePrivateCidrs(environment);
  const privatePorts = parsePrivatePorts(process.env.CORS_PRIVATE_PORTS);
  const allowTailscaleDevOrigins =
    !isStrictEnvironment(environment) && process.env.CORS_ALLOW_TAILSCALE_DEV !== "false";

  if (isStrictEnvironment(environment) && exactOrigins.size === 0) {
    console.warn(`[cors] ${environment} has no configured exact origins; browser CORS is fail-closed.`);
  }

  console.log(
    `[cors] environment=${environment} exactOrigins=${exactOrigins.size} privateCidrs=${privateCidrs.length} tailscaleDev=${allowTailscaleDevOrigins}`
  );

  return { environment, exactOrigins, privateCidrs, privatePorts, allowTailscaleDevOrigins };
}

export function isCorsOriginAllowed(origin: string | undefined, config: CorsOriginConfig) {
  if (!origin) {
    return true;
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.origin !== origin || url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  if (config.exactOrigins.has(url.origin)) {
    return true;
  }

  if (isStrictEnvironment(config.environment)) {
    return false;
  }

  if (
    config.allowTailscaleDevOrigins &&
    url.protocol === "http:" &&
    url.port === "3000" &&
    (isTailscaleMagicDnsHost(url.hostname) || isTailscaleIpv4Number(ipv4ToNumber(url.hostname) ?? 0))
  ) {
    return true;
  }

  const ipNumber = ipv4ToNumber(url.hostname);
  if (ipNumber === undefined || !config.privatePorts.has(url.port)) {
    return false;
  }

  return config.privateCidrs.some((rule) => {
    const mask = cidrMask(rule.bits);
    return (ipNumber & mask) >>> 0 === rule.base;
  });
}

export function createCorsOptions() {
  const config = createCorsOriginConfig();

  return {
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (isCorsOriginAllowed(origin, config)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  };
}

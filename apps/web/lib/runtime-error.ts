export type RuntimeErrorKind =
  | "auth_expired"
  | "permission_denied"
  | "api_unavailable"
  | "unsupported_capability"
  | "initialization_failure"
  | "unexpected_runtime_failure";

export type ClassifiedRuntimeError = {
  kind: RuntimeErrorKind;
  internalCode: string;
  safeDigest?: string;
};

type ErrorDetails = Error & {
  code?: string;
  digest?: string;
  status?: number;
  statusCode?: number;
};

export function classifyRuntimeError(error: ErrorDetails): ClassifiedRuntimeError {
  const status = error.status ?? error.statusCode;
  const code = String(error.code ?? "").toLowerCase();
  const message = String(error.message ?? "").toLowerCase();
  const evidence = `${code} ${message}`;
  const safeDigest = sanitizeDigest(error.digest);

  if (status === 401 || /(auth|session).*(expired|invalid)|unauthori[sz]ed|login required/.test(evidence)) {
    return { kind: "auth_expired", internalCode: "CLINIC-RT-AUTH", safeDigest };
  }
  if (status === 403 || /forbidden|permission denied|access denied/.test(evidence)) {
    return { kind: "permission_denied", internalCode: "CLINIC-RT-RBAC", safeDigest };
  }
  if (/secure_id_generation_unavailable|randomuuid|secure identifier|unsupported.*(browser|capability)/.test(evidence)) {
    return { kind: "unsupported_capability", internalCode: "CLINIC-RT-CAP", safeDigest };
  }
  if (/failed to fetch|networkerror|econnrefused|api unavailable|service unavailable|load failed/.test(evidence)) {
    return { kind: "api_unavailable", internalCode: "CLINIC-RT-API", safeDigest };
  }
  if (/initiali[sz]|hydration|provider|bootstrap/.test(evidence)) {
    return { kind: "initialization_failure", internalCode: "CLINIC-RT-INIT", safeDigest };
  }
  return { kind: "unexpected_runtime_failure", internalCode: "CLINIC-RT-UNEXPECTED", safeDigest };
}

function sanitizeDigest(digest: string | undefined) {
  if (!digest || !/^[a-z0-9_-]{1,64}$/i.test(digest)) return undefined;
  return digest;
}

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const { classifyRuntimeError } = await import("../apps/web/lib/runtime-error.ts");

const cases = [
  [Object.assign(new Error("session expired"), { status: 401 }), "auth_expired", "CLINIC-RT-AUTH"],
  [Object.assign(new Error("access denied"), { statusCode: 403 }), "permission_denied", "CLINIC-RT-RBAC"],
  [new Error("Failed to fetch"), "api_unavailable", "CLINIC-RT-API"],
  [Object.assign(new Error("secure identifier generation is unavailable"), { code: "SECURE_ID_GENERATION_UNAVAILABLE" }), "unsupported_capability", "CLINIC-RT-CAP"],
  [new Error("provider initialization failed"), "initialization_failure", "CLINIC-RT-INIT"],
  [new Error("unexpected render"), "unexpected_runtime_failure", "CLINIC-RT-UNEXPECTED"]
];

for (const [error, kind, internalCode] of cases) {
  const result = classifyRuntimeError(error);
  assert.equal(result.kind, kind);
  assert.equal(result.internalCode, internalCode);
}

assert.equal(classifyRuntimeError(Object.assign(new Error("safe"), { digest: "abc_123" })).safeDigest, "abc_123");
assert.equal(classifyRuntimeError(Object.assign(new Error("safe"), { digest: "patient name: unsafe" })).safeDigest, undefined);

const view = await readFile("apps/web/components/clinic/runtime-error-view.tsx", "utf8");
assert.equal(view.includes("console.error(error"), false, "error objects must not be logged");
assert.equal(view.includes("error.message"), false, "error messages must not be logged by the boundary view");

const runner = await readFile("scripts/uat-runtime.mjs", "utf8");
assert.match(runner, /API_HOST: "127\.0\.0\.1"/, "UAT API must bind to loopback");
assert.match(runner, /0\.0\.0\.0:3000/, "UAT web must be available for LAN QA");
assert.match(runner, /same-origin \/api\/backend\//, "UAT must document the browser proxy path");

console.log("v1.4.4 runtime error/UAT safety: 17 assertions passed");

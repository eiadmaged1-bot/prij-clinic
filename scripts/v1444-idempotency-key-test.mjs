import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const {
  UnsupportedSecureIdError,
  createSecureIdempotencyKey
} = await import("../apps/web/lib/idempotency-key.ts");

const nativeUuid = "123e4567-e89b-42d3-a456-426614174000";
let fallbackCalled = false;
assert.equal(createSecureIdempotencyKey({
  randomUUID: () => nativeUuid,
  getRandomValues: (array) => {
    fallbackCalled = true;
    return array;
  }
}), nativeUuid, "HTTPS/ngrok-capable browsers should use native randomUUID");
assert.equal(fallbackCalled, false, "native randomUUID should not consume fallback entropy");

function deterministicCrypto(seed) {
  return {
    getRandomValues(array) {
      for (let index = 0; index < array.byteLength; index += 1) {
        array[index] = (seed + index * 17) & 0xff;
      }
      return array;
    }
  };
}

for (const [context, seed] of [["LAN HTTP", 7], ["mobile browser", 31]]) {
  const key = createSecureIdempotencyKey(deterministicCrypto(seed));
  assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, `${context} fallback should be UUID v4`);
}

const throwingNativeKey = createSecureIdempotencyKey({
  randomUUID: () => { throw new Error("secure context required"); },
  ...deterministicCrypto(43)
});
assert.match(throwingNativeKey, /^[0-9a-f-]{36}$/i, "a rejected native method should fall back to getRandomValues");

assert.throws(
  () => createSecureIdempotencyKey({}),
  (error) => error instanceof UnsupportedSecureIdError && error.code === "SECURE_ID_GENERATION_UNAVAILABLE",
  "a browser without secure entropy must fail closed"
);

let refreshSeed = 61;
const refreshProvider = {
  getRandomValues(array) {
    refreshSeed += 1;
    return deterministicCrypto(refreshSeed).getRandomValues(array);
  }
};
const beforeRefresh = createSecureIdempotencyKey(refreshProvider);
const afterRefresh = createSecureIdempotencyKey(refreshProvider);
assert.notEqual(beforeRefresh, afterRefresh, "a fresh mount/refresh should receive a fresh key");

const submissionKey = createSecureIdempotencyKey(deterministicCrypto(83));
assert.equal(submissionKey, submissionKey, "double submit during one logical attempt must retain its key");
const retryAfterFailureKey = submissionKey;
assert.equal(retryAfterFailureKey, submissionKey, "an ambiguous failed request must retry with the same key");

const helperSource = await readFile(resolve("apps/web/lib/idempotency-key.ts"), "utf8");
assert.equal(helperSource.includes("window."), false, "SSR import must not depend on window");
assert.equal(helperSource.includes("Math.random"), false, "idempotency keys must never use Math.random");

const retryCallers = [
  "apps/web/app/patients/new/page.tsx",
  "apps/web/app/reception/qr-scan/page.tsx",
  "apps/web/app/reception/check-in/page.tsx",
  "apps/web/app/reception/page.tsx",
  "apps/web/components/patients/DoctorQuickPatientCreate.tsx"
];
for (const file of retryCallers) {
  const source = await readFile(resolve(file), "utf8");
  assert.equal(source.includes("regenerateIdempotencyKey"), false, `${file} must retain the key after failure`);
}

console.log("v1.4.4 idempotency compatibility: 12 assertions passed");

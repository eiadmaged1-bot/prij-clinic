import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type SecureCryptoProvider = {
  randomUUID?: () => string;
  getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
};

export class UnsupportedSecureIdError extends Error {
  readonly code = "SECURE_ID_GENERATION_UNAVAILABLE";

  constructor() {
    super("Secure identifier generation is unavailable in this browser.");
    this.name = "UnsupportedSecureIdError";
  }
}

function runtimeCrypto(): SecureCryptoProvider | undefined {
  return typeof globalThis === "undefined" ? undefined : globalThis.crypto;
}

export function createSecureIdempotencyKey(provider: SecureCryptoProvider | undefined = runtimeCrypto()) {
  if (typeof provider?.randomUUID === "function") {
    try {
      return provider.randomUUID.call(provider);
    } catch {
      // Some browsers expose randomUUID but reject it outside a secure context.
    }
  }

  if (typeof provider?.getRandomValues === "function") {
    const random = new Uint8Array(16);
    provider.getRandomValues.call(provider, random);
    return uuidv4({ random });
  }

  throw new UnsupportedSecureIdError();
}

export function useIdempotencyKey() {
  const [key, setKey] = useState<string>("");
  const [error, setError] = useState<UnsupportedSecureIdError | null>(null);
  const keyRef = useRef<string>("");

  useEffect(() => {
    try {
      const initialKey = createSecureIdempotencyKey();
      setKey(initialKey);
      keyRef.current = initialKey;
    } catch (generationError) {
      setError(generationError instanceof UnsupportedSecureIdError ? generationError : new UnsupportedSecureIdError());
    }
  }, []);

  const regenerate = useCallback(() => {
    try {
      const newKey = createSecureIdempotencyKey();
      setKey(newKey);
      keyRef.current = newKey;
      setError(null);
      return newKey;
    } catch (generationError) {
      setError(generationError instanceof UnsupportedSecureIdError ? generationError : new UnsupportedSecureIdError());
      return "";
    }
  }, []);

  return { key, regenerate, ready: Boolean(key), error };
}

export function getIdempotencyHeaders(key: string) {
  return {
    "Idempotency-Key": key
  };
}

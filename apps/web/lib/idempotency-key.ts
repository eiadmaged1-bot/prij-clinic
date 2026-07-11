import { useEffect, useRef, useState } from "react";

export function useIdempotencyKey() {
  const [key, setKey] = useState<string>("");
  const keyRef = useRef<string>("");

  useEffect(() => {
    // Generate initial key on mount
    const initialKey = crypto.randomUUID();
    setKey(initialKey);
    keyRef.current = initialKey;
  }, []);

  const regenerate = () => {
    const newKey = crypto.randomUUID();
    setKey(newKey);
    keyRef.current = newKey;
  };

  return { key, regenerate };
}

export function getIdempotencyHeaders(key: string) {
  return {
    "Idempotency-Key": key
  };
}

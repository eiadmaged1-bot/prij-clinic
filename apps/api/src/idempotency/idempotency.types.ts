export interface BeginOrReplayParams {
  userId: string;
  branchId?: string | null;
  operation: string;
  rawKey: string;
  requestPayload: any;
  /** Expiry in hours, defaults to 24 */
  expiryHours?: number;
}

export interface CompleteIdempotencyParams {
  recordId: string;
  responseStatus?: number;
  responseBody?: any;
  resourceType?: string;
  resourceId?: string;
}

export interface FailOrReleaseIdempotencyParams {
  recordId: string;
  safeReason: string;
  /** If true, the record is deleted entirely, releasing the key for reuse. If false, it's marked FAILED. Defaults to true. */
  releaseLock?: boolean;
}

export interface IdempotencyRecordResult {
  isReplay: boolean;
  recordId: string;
  responseStatus?: number | null;
  responseBody?: any | null;
}

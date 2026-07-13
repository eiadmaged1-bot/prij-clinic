import { Prisma } from "@prisma/client";

export interface BeginOrReplayParams {
  userId: string;
  branchId?: string | null;
  scopeKey?: string;
  operation: string;
  rawKey: string;
  requestPayload: any;
  /** Expiry in hours, defaults to 24 */
  expiryHours?: number;
}

export interface CompleteIdempotencyParams {
  tx?: Prisma.TransactionClient;
  recordId: string;
  responseStatus?: number;
  resourceType?: string;
  resourceId?: string;
}

export interface FailOrReleaseIdempotencyParams {
  tx?: Prisma.TransactionClient;
  recordId: string;
  safeReason: string;
  /** If true, the record is deleted entirely, releasing the key for reuse. If false, it's marked FAILED. Defaults to true. */
  releaseLock?: boolean;
}

export interface IdempotencyRecordResult {
  isReplay: boolean;
  recordId: string;
  responseStatus?: number | null;
  resourceType?: string | null;
  resourceId?: string | null;
}
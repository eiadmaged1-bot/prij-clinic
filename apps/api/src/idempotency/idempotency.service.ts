import { BadRequestException, ConflictException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BeginOrReplayParams, CompleteIdempotencyParams, FailOrReleaseIdempotencyParams, IdempotencyRecordResult } from "./idempotency.types";
import { hashPayload, hashString } from "./idempotency.util";

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async beginOrReplay(params: BeginOrReplayParams): Promise<IdempotencyRecordResult> {
    const cleanKey = params.rawKey?.trim();
    if (!cleanKey) {
      throw new BadRequestException({ code: "IDEMPOTENCY_KEY_REQUIRED", message: "Idempotency-Key header is required for this operation." });
    }
    if (cleanKey.length < 8 || cleanKey.length > 128) {
      throw new BadRequestException({ code: "IDEMPOTENCY_KEY_INVALID", message: "Idempotency-Key must be between 8 and 128 characters." });
    }

    const keyHash = hashString(cleanKey);
    const requestHash = hashPayload(params.requestPayload);
    const expiryHours = params.expiryHours ?? 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const scopeKey = params.scopeKey ?? params.branchId ?? "GLOBAL";

    try {
      const record = await this.prisma.idempotencyRecord.create({
        data: {
          userId: params.userId,
          branchId: params.branchId,
          scopeKey,
          operation: params.operation,
          keyHash,
          requestHash,
          status: "IN_PROGRESS",
          expiresAt
        }
      });

      return {
        isReplay: false,
        recordId: record.id
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Unique constraint failed, meaning the key has been used before.
        const existing = await this.prisma.idempotencyRecord.findUnique({
          where: {
            userId_scopeKey_operation_keyHash: {
              userId: params.userId,
              scopeKey,
              operation: params.operation,
              keyHash
            }
          }
        });

        if (!existing) {
          throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Operation is currently in progress." });
        }

        if (existing.requestHash !== requestHash) {
          throw new ConflictException({ code: "IDEMPOTENCY_KEY_REUSED", message: "Idempotency key was already used for different details." });
        }

        if (existing.status === "IN_PROGRESS") {
          // Check for stale IN_PROGRESS (e.g. server crashed before tx commit).
          // 5 minutes threshold to ensure no long transaction is still active.
          if (Date.now() - existing.createdAt.getTime() > 5 * 60 * 1000) {
            // It's safely stale. We must check if the resource was actually created.
            // But since we can't generically check, we assume the transaction rolled back.
            // If the transaction committed but complete() failed, deleting it would allow duplicate!
            // BUT we also changed complete() to throw and crash the transaction if it fails.
            // So if it's IN_PROGRESS, the transaction DEFINITELY rolled back or crashed.
            await this.prisma.idempotencyRecord.delete({ where: { id: existing.id } });
            return this.beginOrReplay(params);
          }

          throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Operation is currently in progress. Please wait." });
        }

        if (existing.status === "COMPLETED") {
          return {
            isReplay: true,
            recordId: existing.id,
            responseStatus: existing.responseStatus,
            resourceType: existing.resourceType,
            resourceId: existing.resourceId
          };
        }

        throw new ConflictException({ code: "IDEMPOTENCY_KEY_REUSED", message: "Idempotency key was already used for a failed operation. Generate a new key." });
      }

      throw error;
    }
  }

  async complete(params: CompleteIdempotencyParams): Promise<void> {
    const db = params.tx ?? this.prisma;
    await db.idempotencyRecord.update({
      where: { id: params.recordId },
      data: {
        status: "COMPLETED",
        responseStatus: params.responseStatus,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        completedAt: new Date()
      }
    });
  }

  async failOrRelease(params: FailOrReleaseIdempotencyParams): Promise<void> {
    const db = params.tx ?? this.prisma;
    if (params.releaseLock !== false) {
      await db.idempotencyRecord.delete({
        where: { id: params.recordId }
      });
    } else {
      await db.idempotencyRecord.update({
        where: { id: params.recordId },
        data: {
          status: "FAILED",
          completedAt: new Date()
        }
      });
    }
  }
}
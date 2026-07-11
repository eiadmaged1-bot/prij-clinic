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

    try {
      const record = await this.prisma.idempotencyRecord.create({
        data: {
          userId: params.userId,
          branchId: params.branchId,
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
            userId_operation_keyHash: {
              userId: params.userId,
              operation: params.operation,
              keyHash
            }
          }
        });

        if (!existing) {
          // Extremely rare race condition where the record was deleted between create failure and findUnique
          throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Operation is currently in progress." });
        }

        if (existing.requestHash !== requestHash) {
          throw new ConflictException({ code: "IDEMPOTENCY_KEY_REUSED", message: "Idempotency key was already used for different details." });
        }

        if (existing.status === "IN_PROGRESS") {
          throw new ConflictException({ code: "IDEMPOTENCY_REQUEST_IN_PROGRESS", message: "Operation is currently in progress. Please wait." });
        }

        if (existing.status === "COMPLETED") {
          return {
            isReplay: true,
            recordId: existing.id,
            responseStatus: existing.responseStatus,
            responseBody: existing.responseBody
          };
        }

        // If it's FAILED or some other state, we don't allow replay of a failed terminal state without a new key
        throw new ConflictException({ code: "IDEMPOTENCY_KEY_REUSED", message: "Idempotency key was already used for a failed operation. Generate a new key." });
      }

      throw error;
    }
  }

  async complete(params: CompleteIdempotencyParams): Promise<void> {
    try {
      await this.prisma.idempotencyRecord.update({
        where: { id: params.recordId },
        data: {
          status: "COMPLETED",
          responseStatus: params.responseStatus,
          responseBody: params.responseBody ?? Prisma.DbNull,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          completedAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Failed to complete idempotency record ${params.recordId}`, error);
    }
  }

  async failOrRelease(params: FailOrReleaseIdempotencyParams): Promise<void> {
    try {
      if (params.releaseLock !== false) {
        // Default behavior: release the lock by deleting the record so the client can retry
        await this.prisma.idempotencyRecord.delete({
          where: { id: params.recordId }
        });
      } else {
        await this.prisma.idempotencyRecord.update({
          where: { id: params.recordId },
          data: {
            status: "FAILED",
            completedAt: new Date()
          }
        });
      }
    } catch (error) {
      this.logger.error(`Failed to failOrRelease idempotency record ${params.recordId}`, error);
    }
  }
}

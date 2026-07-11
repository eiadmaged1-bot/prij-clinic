import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RequestWithId } from '../middleware/request-id.middleware';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

export type StableErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DUPLICATE_RESOURCE'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'INTERNAL_SERVER_ERROR'
  | string;

export interface ErrorEnvelope {
  error: {
    code: StableErrorCode;
    message: string;
    fieldErrors: Record<string, string[]>;
    requestId: string;
    status: number;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    const requestId = request.requestId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: StableErrorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let fieldErrors: Record<string, string[]> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (status === HttpStatus.BAD_REQUEST && Array.isArray(exceptionResponse?.message)) {
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
        // Map class-validator messages roughly if it's an array
        fieldErrors = { _general: exceptionResponse.message };
      } else {
        message = typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse?.message || exception.message;
        
        // Map HTTP status to our stable codes
        switch (status) {
          case HttpStatus.UNAUTHORIZED: code = 'AUTHENTICATION_REQUIRED'; break;
          case HttpStatus.FORBIDDEN: code = 'PERMISSION_DENIED'; break;
          case HttpStatus.NOT_FOUND: code = 'NOT_FOUND'; break;
          case HttpStatus.CONFLICT: code = 'CONFLICT'; break;
          case HttpStatus.PAYLOAD_TOO_LARGE: code = 'PAYLOAD_TOO_LARGE'; break;
          case HttpStatus.TOO_MANY_REQUESTS: code = 'RATE_LIMITED'; break;
          case HttpStatus.SERVICE_UNAVAILABLE: code = 'SERVICE_UNAVAILABLE'; break;
          case HttpStatus.GATEWAY_TIMEOUT: code = 'GATEWAY_TIMEOUT'; break;
          case HttpStatus.BAD_REQUEST: code = 'VALIDATION_ERROR'; break;
          default: code = 'INTERNAL_SERVER_ERROR'; break;
        }

        // Preserve domain-specific codes if thrown via HttpException
        if (exceptionResponse?.code && typeof exceptionResponse.code === 'string') {
          code = exceptionResponse.code;
        }
        if (exceptionResponse?.fieldErrors) {
          fieldErrors = exceptionResponse.fieldErrors;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma known errors safely
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'CONFLICT';
        message = 'A resource with this identifier already exists.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'The requested resource was not found.';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        code = 'INTERNAL_SERVER_ERROR';
        message = 'A database error occurred.';
      }
    } else if (exception instanceof Error) {
      // Generic errors (e.g. TypeError) are caught here.
      // Do not expose stack traces or raw messages to the client.
      this.logger.error(`[${requestId}] Unhandled Error: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`[${requestId}] Unknown exception thrown`, String(exception));
    }

    if (status >= 500) {
      this.logger.error(`[${requestId}] ${code} - ${message}`);
    }

    const errorEnvelope: ErrorEnvelope = {
      error: {
        code,
        message,
        fieldErrors,
        requestId,
        status,
      },
    };

    response.status(status).json(errorEnvelope);
  }
}

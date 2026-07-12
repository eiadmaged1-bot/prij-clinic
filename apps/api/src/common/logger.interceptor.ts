import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  // Fields that should be redacted from logs
  private readonly redactedKeys = new Set([
    "password",
    "oldPassword",
    "newPassword",
    "token",
    "authorization",
    "cookie",
    "set-cookie",
    "x-csrf-token",
    "nationalId",
    "iqama",
    "phone",
    "email",
    "patientName",
    "firstName",
    "lastName",
    "medicalRecordNumber",
    "mrn"
  ]);

  private redact(obj: any): any {
    if (obj == null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redact(item));
    }

    const copy = { ...obj };
    for (const key of Object.keys(copy)) {
      if (this.redactedKeys.has(key.toLowerCase()) || key.toLowerCase().includes('password')) {
        copy[key] = "[REDACTED]";
      } else if (typeof copy[key] === "object") {
        copy[key] = this.redact(copy[key]);
      }
    }
    return copy;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    
    const { method, ip } = req;
    const requestPath = req.path;
    const userAgent = req.get("user-agent") || "";
    const startTime = Date.now();

    // Log the incoming request, but redact sensitive body/query parameters
    const safeBody = this.redact(req.body);
    const safeQuery = this.redact(req.query);

    this.logger.log(`[REQ] ${method} ${requestPath} - IP: ${ip} - Body: ${JSON.stringify(safeBody)} - Query: ${JSON.stringify(safeQuery)}`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        this.logger.log(`[RES] ${method} ${requestPath} ${statusCode} - ${duration}ms - ${userAgent}`);
      })
    );
  }
}

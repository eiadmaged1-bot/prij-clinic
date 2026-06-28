import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = status >= 500 ? "Internal server error." : safeMessage(body);
    const requestId = firstHeader(request.headers?.["x-request-id"]);

    response.status(status).json({
      statusCode: status,
      message,
      error: status >= 500 ? "Internal Server Error" : httpErrorName(status),
      ...(requestId ? { requestId } : {})
    });
  }
}

function safeMessage(body: unknown) {
  if (typeof body === "string") return body;
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join("; ");
    if (typeof message === "string") return message;
  }
  return "Request failed.";
}

function httpErrorName(status: number) {
  if (status === 400) return "Bad Request";
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not Found";
  return "Error";
}

function firstHeader(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

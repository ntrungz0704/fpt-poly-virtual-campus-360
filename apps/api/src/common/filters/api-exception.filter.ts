import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Prisma } from "@prisma/client";
import type {
  ApiErrorCode,
  ApiErrorDetail,
  ApiErrorEnvelope,
} from "@fpt-campus/shared";
import type { Response } from "express";
import type { RequestWithMeta } from "../middleware/request-id.middleware";

interface StructuredErrorResponse {
  code?: ApiErrorCode;
  message?: string | string[];
  details?: ApiErrorDetail[];
}

function defaultCodeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return "VALIDATION_ERROR";
    case HttpStatus.UNAUTHORIZED:
      return "UNAUTHORIZED";
    case HttpStatus.FORBIDDEN:
      return "FORBIDDEN";
    case HttpStatus.NOT_FOUND:
      return "NOT_FOUND";
    case HttpStatus.CONFLICT:
      return "CONFLICT";
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return "UNPROCESSABLE_ENTITY";
    case HttpStatus.TOO_MANY_REQUESTS:
      return "RATE_LIMITED";
    case HttpStatus.SERVICE_UNAVAILABLE:
      return "SERVICE_UNAVAILABLE";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithMeta>();
    const requestId = req.requestId ?? "req_unknown";
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ApiErrorCode = "INTERNAL_SERVER_ERROR";
    let message = "Đã xảy ra lỗi hệ thống nội bộ.";
    let details: ApiErrorDetail[] | undefined;

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = "RATE_LIMITED";
      message = "Quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau.";
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const rawResponse = exception.getResponse();
      if (typeof rawResponse === "string") {
        code = defaultCodeForStatus(status);
        message = rawResponse;
      } else if (typeof rawResponse === "object" && rawResponse !== null) {
        const body = rawResponse as StructuredErrorResponse;
        code = body.code ?? defaultCodeForStatus(status);
        if (Array.isArray(body.message)) {
          message = "Dữ liệu đầu vào không hợp lệ.";
          details = body.message.map((msg) => ({ message: String(msg) }));
        } else if (typeof body.message === "string" && body.message.length > 0) {
          message = body.message;
        } else {
          message = exception.message || "Yêu cầu không hợp lệ.";
        }
        if (Array.isArray(body.details)) {
          details = body.details;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        code = "CONFLICT";
        message = "Giá trị định danh hoặc khóa duy nhất đã tồn tại trong hệ thống.";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        code = "NOT_FOUND";
        message = "Không tìm thấy dữ liệu yêu cầu.";
      } else if (exception.code === "P2003") {
        status = HttpStatus.BAD_REQUEST;
        code = "VALIDATION_ERROR";
        message = "Tham chiếu khóa ngoại không hợp lệ.";
      } else {
        this.logger.error(
          `Database request failure [${exception.code}] requestId=${requestId}`,
        );
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error [${exception.name}] requestId=${requestId}`,
      );
    }

    const envelope: ApiErrorEnvelope = {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        requestId,
        timestamp,
      },
    };

    res.status(status).json(envelope);
  }
}

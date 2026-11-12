import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { AppConfigValues } from "../../config/env.schema";

function extractHeaderValue(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") {
    return value.trim();
  }
  return null;
}

/**
 * Enforces CSRF protection on cookie-authenticated endpoints (`POST /auth/refresh`, `POST /auth/logout`)
 * per D-2A2-04: verifies BOTH Origin/Referer against WEB_ORIGIN allowlist AND `X-Requested-With: XMLHttpRequest`.
 */
@Injectable()
export class CsrfCookieGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<AppConfigValues, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const allowedOrigins = this.configService.get("allowedOrigins", {
      infer: true,
    });

    const requestedWith = extractHeaderValue(req.headers["x-requested-with"]);
    if (requestedWith !== "XMLHttpRequest") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Yêu cầu không hợp lệ (thiếu hoặc sai header bảo vệ CSRF).",
      });
    }

    const originHeader = extractHeaderValue(req.headers.origin);
    if (originHeader !== null) {
      if (!allowedOrigins.includes(originHeader)) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Origin không nằm trong danh sách được phép.",
        });
      }
      return true;
    }

    const refererHeader = extractHeaderValue(req.headers.referer);
    if (!refererHeader) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Thiếu thông tin Origin/Referer hợp lệ cho phiên cookie.",
      });
    }

    let refererOrigin: string;
    try {
      refererOrigin = new URL(refererHeader).origin;
    } catch {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Referer không hợp lệ.",
      });
    }

    if (!allowedOrigins.includes(refererOrigin)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Referer origin không nằm trong danh sách được phép.",
      });
    }

    return true;
  }
}

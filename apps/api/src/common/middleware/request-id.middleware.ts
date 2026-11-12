import crypto from "node:crypto";
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;

export interface RequestWithMeta extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithMeta, res: Response, next: NextFunction): void {
    const incomingHeader = req.headers["x-request-id"];
    const candidate =
      typeof incomingHeader === "string" ? incomingHeader.trim() : "";
    const requestId = SAFE_REQUEST_ID_PATTERN.test(candidate)
      ? candidate
      : `req_${crypto.randomUUID()}`;
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  }
}

import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AuditLogEntryDto } from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import {
  createPaginatedPayload,
  type PaginatedPayload,
} from "../../common/interceptors/response-envelope.interceptor";
import { sanitizeIpAddress } from "../../common/utils/ip-sanitizer";
import type { AuditLogQueryDto } from "./dto/audit-log-query.dto";

const SENSITIVE_KEY_PATTERN =
  /(password|passcode|secret|token|hash|authorization|cookie|credential)/i;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function scrubAuditDetails(
  input: Record<string, unknown> | undefined | null,
): Prisma.InputJsonValue | undefined {
  if (!input) {
    return undefined;
  }

  const scrubValue = (val: unknown): unknown => {
    if (val === null || val === undefined) {
      return val;
    }
    if (Array.isArray(val)) {
      return val.map((item) => scrubValue(item));
    }
    if (typeof val === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(val as Record<string, unknown>)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = scrubValue(nested);
        }
      }
      return sanitized;
    }
    return val;
  };

  return scrubValue(input) as Prisma.InputJsonValue;
}

export interface RecordAuditParams {
  actorUserId?: string | null;
  actorUsername?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  diffJson?: Record<string, unknown> | null;
  ipAddress?: string | null;
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditParams): Promise<void> {
    const client = params.tx ?? this.prisma;
    const sanitizedDiff = scrubAuditDetails(params.diffJson);
    const sanitizedIp = sanitizeIpAddress(params.ipAddress);

    await client.auditLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        actorUsername: params.actorUsername ?? null,
        action: params.action,
        resourceType: params.resourceType ?? null,
        resourceId: params.resourceId ?? null,
        ...(sanitizedDiff !== undefined ? { diffJson: sanitizedDiff } : {}),
        ipAddress: sanitizedIp,
      },
    });
  }

  async findPaginated(
    query: AuditLogQueryDto,
  ): Promise<PaginatedPayload<AuditLogEntryDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) {
      where.action = query.action;
    }
    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }
    if (query.actor) {
      if (UUID_PATTERN.test(query.actor)) {
        where.actorUserId = query.actor;
      } else {
        where.actorUsername = {
          contains: query.actor,
          mode: "insensitive",
        };
      }
    }
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const items: AuditLogEntryDto[] = rows.map((row) => ({
      id: row.id,
      actorUserId: row.actorUserId,
      actorUsername: row.actorUsername,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      diffJson:
        row.diffJson && typeof row.diffJson === "object" && !Array.isArray(row.diffJson)
          ? (row.diffJson as Record<string, unknown>)
          : null,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
    }));

    return createPaginatedPayload(items, page, limit, total);
  }
}

import type {
  AdminAuditLogsQuery,
  AdminAuditLogsResponseDto,
  AdminOverviewMetricsDto,
  AuditLogEntryDto,
} from "@fpt-campus/shared";
import {
  ApiClientError,
  apiRequest,
  apiRequestEnvelope,
} from "../auth/api-client";

export function isForbiddenApiError(error: unknown): boolean {
  if (error instanceof ApiClientError) {
    return error.status === 403 || error.code === "FORBIDDEN";
  }
  if (typeof error === "object" && error !== null) {
    const candidate = error as { status?: unknown; code?: unknown };
    return candidate.status === 403 || candidate.code === "FORBIDDEN";
  }
  return false;
}

/**
 * Fetch real-time aggregated PostgreSQL KPIs for Admin Overview.
 * GET /api/v1/admin/overview
 */
export async function fetchAdminOverviewMetrics(): Promise<AdminOverviewMetricsDto> {
  return apiRequest<AdminOverviewMetricsDto>("/admin/overview", {
    auth: true,
  });
}

/**
 * Fetch real PostgreSQL audit log entries (requires audit:read permission).
 * GET /api/v1/admin/audit-logs
 */
export async function fetchAdminAuditLogs(
  params: AdminAuditLogsQuery = {},
): Promise<AdminAuditLogsResponseDto> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.action?.trim()) query.set("action", params.action.trim());
  if (params.resourceType?.trim()) {
    query.set("resourceType", params.resourceType.trim());
  }
  if (params.actorUsername?.trim()) {
    query.set("actor", params.actorUsername.trim());
  }

  const qs = query.toString();
  const path = qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs";

  const { data, meta } = await apiRequestEnvelope<
    AuditLogEntryDto[] | AdminAuditLogsResponseDto
  >(path, {
    auth: true,
  });

  if (Array.isArray(data)) {
    return {
      items: data,
      page: meta.page ?? params.page ?? 1,
      limit: meta.limit ?? params.limit ?? 8,
      total: meta.total ?? data.length,
    };
  }

  return data;
}

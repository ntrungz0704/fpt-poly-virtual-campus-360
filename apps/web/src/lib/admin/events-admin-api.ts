import type {
  AdminOpenDayEventDto,
  AdminOpenDaySessionDto,
  AdminParticipationsListResponseDto,
  CheckInResultDto,
  CheckInTicketInput,
} from "@fpt-campus/shared";
import { apiRequest } from "../auth/api-client";

export interface PaginatedResult<T> {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface ListParticipationsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * List all events for admin.
 * GET /api/v1/admin/events
 */
export async function fetchAdminEvents(): Promise<AdminOpenDayEventDto[]> {
  const res = await apiRequest<AdminOpenDayEventDto[] | PaginatedResult<AdminOpenDayEventDto>>("/admin/events", {
    auth: true,
  });
  if (Array.isArray(res)) {
    return res;
  }
  return res.items ?? [];
}

/**
 * List sessions for an event.
 * GET /api/v1/admin/events/:eventId/sessions
 */
export async function fetchAdminEventSessions(
  eventId: string,
): Promise<AdminOpenDaySessionDto[]> {
  return apiRequest<AdminOpenDaySessionDto[]>(
    `/admin/events/${encodeURIComponent(eventId)}/sessions`,
    { auth: true },
  );
}

/**
 * List participations / attendee roster for an event.
 * GET /api/v1/admin/events/:eventId/participations
 */
export async function fetchAdminParticipations(
  eventId: string,
  params: ListParticipationsParams = {},
): Promise<AdminParticipationsListResponseDto> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const queryStr = searchParams.toString();
  const url = `/admin/events/${encodeURIComponent(eventId)}/participations${queryStr ? `?${queryStr}` : ""}`;
  return apiRequest<AdminParticipationsListResponseDto>(url, { auth: true });
}

/**
 * Check-in attendee by ticket code.
 * POST /api/v1/admin/events/check-in
 */
export async function checkInAttendeeTicket(
  input: CheckInTicketInput,
): Promise<CheckInResultDto> {
  return apiRequest<CheckInResultDto>("/admin/events/check-in", {
    method: "POST",
    body: input,
    auth: true,
  });
}

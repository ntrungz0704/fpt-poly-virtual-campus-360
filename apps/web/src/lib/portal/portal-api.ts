import {
  type CreateLinkRequest,
  type ParentStudentDetailDto,
  type ParentStudentSummaryDto,
  type PortalProgressDto,
  type PortalScheduleItemDto,
  type PortalTicketDto,
  type RespondLinkRequest,
  type StudentLinkRequestItemDto,
  type StudentProfileDto,
  type UpdateStudentProfileRequest,
} from "@fpt-campus/shared";
import { apiRequest } from "../auth/api-client";

export const portalApi = {
  getProfile(): Promise<StudentProfileDto> {
    return apiRequest<StudentProfileDto>("/portal/profile");
  },

  updateProfile(dto: UpdateStudentProfileRequest): Promise<StudentProfileDto> {
    return apiRequest<StudentProfileDto>("/portal/profile", {
      method: "PATCH",
      body: dto,
    });
  },

  getTickets(): Promise<PortalTicketDto[]> {
    return apiRequest<PortalTicketDto[]>("/portal/tickets");
  },

  getSchedule(): Promise<PortalScheduleItemDto[]> {
    return apiRequest<PortalScheduleItemDto[]>("/portal/schedule");
  },

  getGamification(): Promise<PortalProgressDto> {
    return apiRequest<PortalProgressDto>("/portal/gamification");
  },

  getStudentLinkRequests(): Promise<StudentLinkRequestItemDto[]> {
    return apiRequest<StudentLinkRequestItemDto[]>("/portal/link-requests");
  },

  respondLinkRequest(
    id: string,
    action: "APPROVE" | "REJECT",
  ): Promise<{ success: boolean; status: string }> {
    const payload: RespondLinkRequest = { action };
    return apiRequest<{ success: boolean; status: string }>(
      `/portal/link-requests/${id}`,
      {
        method: "PATCH",
        body: payload,
      },
    );
  },

  // Parent methods
  getLinkedStudents(): Promise<ParentStudentSummaryDto[]> {
    return apiRequest<ParentStudentSummaryDto[]>("/parent/students");
  },

  getLinkedStudentDetail(studentId: string): Promise<ParentStudentDetailDto> {
    return apiRequest<ParentStudentDetailDto>(`/parent/students/${studentId}`);
  },

  createLinkRequest(
    dto: CreateLinkRequest,
  ): Promise<{ linkId: string; status: string }> {
    return apiRequest<{ linkId: string; status: string }>(
      "/parent/link-requests",
      {
        method: "POST",
        body: dto,
      },
    );
  },
};

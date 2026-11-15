import {
  type CreateLinkRequest,
  type ParentStudentDetailDto,
  type ParentStudentSummaryDto,
  type PortalProgressDto,
  type PortalQuizAttemptDto,
  type PortalQuizDetailDeliveryDto,
  type PortalQuizSummaryDto,
  type PortalScheduleItemDto,
  type PortalTicketDto,
  type RespondLinkRequest,
  type SaveQuizProgressDto,
  type SaveQuizProgressItemDto,
  type SaveQuizProgressResponseDto,
  type StudentLinkRequestItemDto,
  type StudentProfileDto,
  type SubmitQuizAttemptResponseDto,
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

  // Quiz Delivery methods (M7.2)
  getActiveQuizzes(): Promise<PortalQuizSummaryDto[]> {
    return apiRequest<PortalQuizSummaryDto[]>("/portal/quiz/active");
  },

  getQuizDelivery(quizId: string): Promise<PortalQuizDetailDeliveryDto> {
    return apiRequest<PortalQuizDetailDeliveryDto>(`/portal/quiz/${quizId}`);
  },

  // Quiz Attempt methods (M7.3)
  startOrResumeQuizAttempt(quizConfigId: string): Promise<PortalQuizAttemptDto> {
    return apiRequest<PortalQuizAttemptDto>(`/portal/quiz/${quizConfigId}/attempts`, {
      method: "POST",
    });
  },

  getQuizAttempt(attemptId: string): Promise<PortalQuizAttemptDto> {
    return apiRequest<PortalQuizAttemptDto>(`/portal/quiz/attempts/${attemptId}`);
  },

  saveQuizProgress(
    attemptId: string,
    answers: SaveQuizProgressItemDto[],
  ): Promise<SaveQuizProgressResponseDto> {
    const payload: SaveQuizProgressDto = { answers };
    return apiRequest<SaveQuizProgressResponseDto>(
      `/portal/quiz/attempts/${attemptId}/progress`,
      {
        method: "PUT",
        body: payload,
      },
    );
  },

  submitQuizAttempt(attemptId: string): Promise<SubmitQuizAttemptResponseDto> {
    return apiRequest<SubmitQuizAttemptResponseDto>(
      `/portal/quiz/attempts/${attemptId}/submit`,
      {
        method: "POST",
      },
    );
  },
};


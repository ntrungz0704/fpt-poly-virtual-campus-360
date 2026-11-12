import type { BuildingCode } from "./campus.js";
import type { ISO8601Timestamp, PublishStatus, UUID } from "./common.js";

export type SessionPeriod = "MORNING" | "NOON" | "AFTERNOON";

export type SessionAccessType = "public" | "invited";

/** Minimal Open Day participation lifecycle in MVP (no CHECKED_IN / QR ticket per OD-05). */
export type ParticipationStatus = "INVITED" | "CONFIRMED" | "CANCELLED";

export interface EventParticipationSummaryDto {
  id: UUID;
  eventId: UUID;
  eventKey: string;
  eventTitle: string;
  eventDate: string | null;
  participationStatus: ParticipationStatus;
}

export interface PublicOpenDayEventDto {
  id: UUID;
  eventKey: string;
  title: string;
  subtitle: string | null;
  dateLabel: string;
  timeLabel: string;
  eventDate: string | null;
}

export interface PublicOpenDaySessionDto {
  id: UUID;
  eventId: UUID;
  period: SessionPeriod;
  timeRange: string;
  title: string;
  description: string;
  buildingCode: BuildingCode;
  locationLabel: string;
  nodeSlug: string | null;
  accessType: SessionAccessType;
  hostUnit: string;
  sortOrder: number;
}

export interface PublicOpenDayFaqDto {
  id: UUID;
  question: string;
  answer: string;
  sortOrder: number;
}

/** Public quiz question payload without answer leakage (OD-08). */
export interface PublicQuizQuestionDto {
  id: UUID;
  tourNodeSlug: string | null;
  questionText: string;
  options: string[];
}

export interface QuizVerifyAnswerInput {
  questionId: UUID;
  selectedIndex: number;
}

export interface QuizVerifyRequest {
  items: QuizVerifyAnswerInput[];
}

export interface QuizVerifyItemResultDto {
  questionId: UUID;
  selectedIndex: number;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface QuizVerifyResponse {
  results: QuizVerifyItemResultDto[];
  correctCount: number;
  total: number;
}

export interface PublicEventsResponseDto {
  event: PublicOpenDayEventDto | null;
  sessions: PublicOpenDaySessionDto[];
  faqs: PublicOpenDayFaqDto[];
  quizItems: PublicQuizQuestionDto[];
}

export interface UpsertOpenDayEventInput {
  eventKey: string;
  title: string;
  subtitle?: string | null;
  dateLabel: string;
  timeLabel: string;
  eventDate?: string | null;
  isDefault?: boolean;
  status?: PublishStatus;
}

export interface UpsertOpenDaySessionInput {
  buildingId?: UUID | null;
  locationId?: UUID | null;
  tourNodeId?: UUID | null;
  title: string;
  sessionPeriod: SessionPeriod;
  startTimeLabel: string;
  endTimeLabel: string;
  customLocationLabel: string;
  hostUnit: string;
  isPublic?: boolean;
  description: string;
  sortOrder?: number;
  status?: PublishStatus;
}

export interface UpsertOpenDayFaqInput {
  eventId?: UUID | null;
  question: string;
  answer: string;
  sortOrder?: number;
  status?: PublishStatus;
}

export interface UpsertOpenDayQuizItemInput {
  eventId: UUID;
  tourNodeId?: UUID | null;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sortOrder?: number;
  status?: PublishStatus;
}

export interface OpenDayEventMetadataDto {
  id: UUID;
  eventKey: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  eventDate: string | null;
  isDefault: boolean;
  status: PublishStatus;
}

export interface AdminOpenDayEventDto extends OpenDayEventMetadataDto {
  campusId: UUID;
  subtitle: string | null;
  sessionCount: number;
  faqCount: number;
  quizItemCount: number;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface AdminOpenDaySessionDto extends PublicOpenDaySessionDto {
  campusId: UUID;
  buildingId: UUID | null;
  locationId: UUID | null;
  tourNodeId: UUID | null;
  sessionPeriod: SessionPeriod;
  startTimeLabel: string;
  endTimeLabel: string;
  customLocationLabel: string;
  isPublic: boolean;
  status: PublishStatus;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface AdminOpenDayFaqDto extends PublicOpenDayFaqDto {
  eventId: UUID | null;
  campusId: UUID;
  status: PublishStatus;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface AdminOpenDayQuizItemDto {
  id: UUID;
  eventId: UUID;
  tourNodeId: UUID | null;
  tourNodeSlug: string | null;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sortOrder: number;
  status: PublishStatus;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

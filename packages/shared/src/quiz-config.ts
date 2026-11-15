// ============================================================================
// Milestone M7.1: Quiz Configuration & Question Snapshot Shared Contracts
// ============================================================================

import type { QuestionDifficulty } from "./questions";

export type QuizConfigStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface QuizConfigQuestionDto {
  id: string;
  quizConfigId: string;
  questionBankItemId: string | null;
  sortOrder: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: QuestionDifficulty;
  createdAt: string;
  updatedAt: string;
}

export interface QuizConfigurationDto {
  id: string;
  title: string;
  description: string | null;
  eventId: string | null;
  eventTitle?: string | null;
  timeLimitMinutes: number;
  passingScore: number;
  maxAttempts: number;
  isShuffleQuestions: boolean;
  isShuffleOptions: boolean;
  status: QuizConfigStatus;
  questionsCount: number;
  questions?: QuizConfigQuestionDto[];
  createdById: string | null;
  creatorName?: string | null;
  updatedById: string | null;
  updaterName?: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizConfigListResponseDto {
  items: QuizConfigurationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuizConfigInputDto {
  title: string;
  description?: string;
  eventId?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  isShuffleQuestions?: boolean;
  isShuffleOptions?: boolean;
  questionIds?: string[];
}

export interface UpdateQuizConfigInputDto {
  title?: string;
  description?: string;
  eventId?: string | null;
  timeLimitMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  isShuffleQuestions?: boolean;
  isShuffleOptions?: boolean;
}

export interface ManageQuizQuestionsInputDto {
  questionIds: string[];
}

export interface QuizConfigFilterQuery {
  page?: number;
  limit?: number;
  q?: string;
  status?: QuizConfigStatus;
  eventId?: string;
}

// ============================================================================
// Milestone M7.2: Quiz Delivery Shared Contracts (Strict Allowlist / Zero Leak)
// ============================================================================

export interface PortalQuizQuestionDeliveryDto {
  id: string;
  sortOrder: number;
  questionText: string;
  options: string[];
  topic: string;
  difficulty: QuestionDifficulty;
}

export interface PortalQuizSummaryDto {
  id: string;
  title: string;
  description: string | null;
  eventId: string | null;
  eventName: string | null;
  timeLimitMinutes: number;
  passingScore: number;
  maxAttempts: number;
  totalQuestions: number;
  isShuffleQuestions: boolean;
  isShuffleOptions: boolean;
  publishedAt: string | null;
}

export interface PortalQuizDetailDeliveryDto extends PortalQuizSummaryDto {
  questions: PortalQuizQuestionDeliveryDto[];
}


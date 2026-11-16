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

// ============================================================================
// Milestone M7.3: Quiz Attempt Shared Contracts
// ============================================================================

export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface PortalAttemptQuestionDto {
  id: string; // quizConfigQuestionId
  displayedOrder: number;
  questionText: string;
  options: string[]; // displayed options in shuffled/assigned order
  topic: string;
  difficulty: QuestionDifficulty;
  selectedOptionIndex: number | null; // index according to displayed options
}

export interface PortalQuizAttemptDto {
  id: string;
  quizConfigId: string;
  quizTitle: string;
  attemptNumber: number;
  maxAttempts: number;
  status: QuizAttemptStatus;
  startedAt: string;
  expiresAt: string;
  serverTime: string;
  timeLimitMinutes: number;
  remainingSeconds: number;
  totalQuestions: number;
  answeredQuestions: number;
  questions: PortalAttemptQuestionDto[];
  submissionResult?: SubmitQuizAttemptResponseDto;
}

export interface SaveQuizProgressItemDto {
  quizConfigQuestionId: string;
  selectedOptionIndex: number | null;
}

export interface SaveQuizProgressDto {
  answers: SaveQuizProgressItemDto[];
}

export interface SaveQuizProgressResponseDto {
  attemptId: string;
  status: QuizAttemptStatus;
  savedCount: number;
  answeredQuestions: number;
  totalQuestions: number;
  remainingSeconds: number;
  isExpired: boolean;
}

// ============================================================================
// Milestone M7.3 (B03): Admin Exam Room Monitoring Shared Contracts
// ============================================================================

export interface AdminQuizAttemptStudentDto {
  id: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  avatarUrl?: string | null;
}

export interface AdminQuizAttemptMonitoringDto {
  id: string;
  quizConfigId: string;
  quizTitle: string;
  student: AdminQuizAttemptStudentDto;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  totalQuestions: number;
  answeredCount: number;
  remainingSeconds: number;
}

export interface AdminQuizAttemptListQueryDto {
  page?: number;
  limit?: number;
  quizConfigId?: string;
  status?: QuizAttemptStatus;
  search?: string;
}

export interface AdminQuizAttemptListResponseDto {
  items: AdminQuizAttemptMonitoringDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Milestone M7.4: Quiz Submission, Scoring & XP Award Contracts
// ============================================================================

export interface QuizAttemptQuestionResultDto {
  questionId: string;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string | null;
}

export interface QuizAttemptSummaryDto {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  passingScore: number;
  passed: boolean;
}

export interface QuizAttemptXpAwardDto {
  baseXp: number;
  bonusXp: number;
  awardedXp: number;
  isXpAwarded: boolean;
  reason: string;
}

export interface SubmitQuizAttemptResponseDto {
  attemptId: string;
  status: QuizAttemptStatus;
  submittedAt: string;
  summary: QuizAttemptSummaryDto;
  xp: QuizAttemptXpAwardDto;
  results: QuizAttemptQuestionResultDto[];
}

// ============================================================================
// Milestone M7.5: Quiz Results & History Review Dashboard Contracts
// ============================================================================

export interface StudentQuizHistoryItemDto {
  id: string;
  quizConfigId: string;
  quizTitle: string;
  attemptNumber: number;
  maxAttempts: number;
  isRetake: boolean;
  status: QuizAttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number | null;
  scorePercent: number | null;
  passingScore: number;
  passed: boolean | null;
  baseXp: number | null;
  bonusXp: number | null;
  awardedXp: number | null;
  isXpAwarded: boolean;
  xpReason?: string | null;
}

export interface StudentQuizHistoryQueryDto {
  page?: number;
  limit?: number;
  quizConfigId?: string;
  status?: QuizAttemptStatus;
  passed?: boolean;
}

export interface StudentQuizHistoryListResponseDto {
  items: StudentQuizHistoryItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentQuizQuestionReviewDto {
  questionId: string;
  displayedOrder: number;
  questionText: string;
  options: string[];
  selectedOptionIndex: number | null;
  correctOptionIndex?: number | null;
  isCorrect?: boolean | null;
  explanation?: string | null;
}

export interface StudentQuizHistoryDetailDto extends StudentQuizHistoryItemDto {
  summary?: QuizAttemptSummaryDto;
  xp?: QuizAttemptXpAwardDto;
  results?: StudentQuizQuestionReviewDto[];
}

export interface AdminQuizResultItemDto {
  id: string;
  quizConfigId: string;
  quizTitle: string;
  student: AdminQuizAttemptStudentDto;
  attemptNumber: number;
  maxAttempts: number;
  isRetake: boolean;
  status: QuizAttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number | null;
  scorePercent: number | null;
  passingScore: number;
  passed: boolean | null;
  baseXp: number | null;
  bonusXp: number | null;
  awardedXp: number | null;
  isXpAwarded: boolean;
  xpReason?: string | null;
}

export interface AdminQuizResultQueryDto {
  page?: number;
  limit?: number;
  quizConfigId?: string;
  search?: string;
  passed?: boolean;
  status?: QuizAttemptStatus;
  from?: string;
  to?: string;
  sortBy?: "submittedAt" | "startedAt" | "scorePercent" | "awardedXp" | "attemptNumber";
  sortOrder?: "asc" | "desc";
}

export interface AdminQuizResultListResponseDto {
  items: AdminQuizResultItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminQuizResultSummaryDto {
  totalAttempts: number;
  totalSubmitted: number;
  totalPassed: number;
  totalFailed: number;
  passRatePercent: number;
  avgScorePercent: number;
  uniqueStudentsCount: number;
  totalAwardedXp: number;
}

export interface AdminQuizResultDetailDto extends AdminQuizResultItemDto {
  summary?: QuizAttemptSummaryDto;
  xp?: QuizAttemptXpAwardDto;
  results: Array<{
    questionId: string;
    displayedOrder: number;
    questionText: string;
    options: string[];
    selectedOptionIndex: number | null;
    correctOptionIndex: number;
    isCorrect: boolean;
    explanation?: string | null;
  }>;
}





// ============================================================================
// Milestone M6: Question Bank Management Shared Contracts
// Independent, reusable Question Bank models, CRUD, filters & Excel Import
// ============================================================================

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionReviewStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export interface QuestionBankItemDto {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: QuestionDifficulty;
  status: QuestionReviewStatus;
  tags: string[];
  createdById: string | null;
  updatedById: string | null;
  creatorName?: string | null;
  updaterName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionListResponseDto {
  items: QuestionBankItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuestionInputDto {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionReviewStatus;
  tags?: string[];
}

export interface UpdateQuestionInputDto {
  questionText?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionReviewStatus;
  tags?: string[];
}

export interface UpdateQuestionStatusDto {
  status: QuestionReviewStatus;
  note?: string;
}

export interface QuestionFilterQuery {
  page?: number;
  limit?: number;
  q?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionReviewStatus;
  tag?: string;
}

export interface QuestionImportPreviewRowDto {
  rowNumber: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
  difficulty: QuestionDifficulty;
  status: QuestionReviewStatus;
  tags: string[];
  validationStatus: "VALID" | "INVALID" | "DUPLICATE";
  validationErrors: string[];
}

export interface QuestionImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: QuestionImportPreviewRowDto[];
}

export interface QuestionImportConfirmRequest {
  rows: QuestionImportPreviewRowDto[];
}

export interface QuestionImportConfirmResponse {
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
}

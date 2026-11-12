export type ApiErrorCode =
  | "TOUR_VALIDATION_FAILED"
  | "AI_PLACEHOLDER_BLOCKED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "UNSTITCHED_PANORAMA_UNSUPPORTED"
  | "ASPECT_RATIO_NOT_2_TO_1"
  | "PIXEL_RESOLUTION_TOO_LOW"
  | "FILE_TOO_LARGE"
  | "IDENTITY_CONFLICT"
  | "ROLE_CONFLICT"
  | "IMPORT_ROW_LIMIT_EXCEEDED"
  | "ALIGNMENT_PENDING_REVIEW"
  | "UPLOAD_TOKEN_USED"
  | "UPLOAD_TOKEN_EXPIRED"
  | "UPLOAD_TOKEN_INVALID"
  | "MEDIA_IN_USE"
  | "MEDIA_NOT_APPROVED"
  | "PDF_RENDERER_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR"
  | (string & {});

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  requestId?: string;
  timestamp?: string;
}

export interface ApiErrorDetail {
  rule?: string;
  field?: string;
  nodeId?: string;
  nodeSlug?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export function isApiSuccessEnvelope<T>(
  envelope: ApiEnvelope<T>
): envelope is ApiSuccessEnvelope<T> {
  return envelope.success === true;
}

export function isApiErrorEnvelope<T>(
  envelope: ApiEnvelope<T>
): envelope is ApiErrorEnvelope {
  return envelope.success === false;
}

export interface HealthStatusDto {
  status: "ok" | "error";
  database: "up" | "down";
  timestamp: string;
}

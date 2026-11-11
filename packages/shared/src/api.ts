export type ApiErrorCode =
  | "TOUR_VALIDATION_FAILED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "UNSTITCHED_PANORAMA_UNSUPPORTED"
  | "ASPECT_RATIO_NOT_2_TO_1"
  | "PIXEL_RESOLUTION_TOO_LOW"
  | "FILE_TOO_LARGE"
  | "IDENTITY_CONFLICT"
  | "ALIGNMENT_PENDING_REVIEW"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
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

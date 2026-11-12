import {
  isApiErrorEnvelope,
  isApiSuccessEnvelope,
  type ApiEnvelope,
  type ApiErrorCode,
  type ApiErrorDetail,
  type AuthUserProfileDto,
  type ChangePasswordRequest,
  type LoginRequest,
  type LoginResponse,
} from "@fpt-campus/shared";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";
const SESSION_HINT_COOKIE = "vc_session_hint";

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const base = raw && raw.length > 0 ? raw : DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, "");
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiErrorDetail[];
  readonly requestId?: string;

  constructor(params: {
    status: number;
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.requestId = params.requestId;
  }
}

export interface SessionLifecycleHandlers {
  onSessionUpdated?: (user: AuthUserProfileDto) => void;
  onSessionInvalidated?: () => void;
  onPasswordChangeRequired?: () => void;
}

// Strict in-memory only access token store (never persisted to localStorage/sessionStorage).
let inMemoryAccessToken: string | null = null;
let inFlightRefreshPromise: Promise<LoginResponse> | null = null;
let lifecycleHandlers: SessionLifecycleHandlers = {};

export function registerSessionLifecycleHandlers(
  handlers: SessionLifecycleHandlers,
): () => void {
  lifecycleHandlers = handlers;
  return () => {
    lifecycleHandlers = {};
  };
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setInMemoryAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

/**
 * Non-secret UI hint cookie indicating an active login flow in this browser.
 * NEVER carries tokens, user IDs, roles, or authorization truth; ONLY prevents
 * firing unauthenticated `POST /auth/refresh` on anonymous public page views.
 */
export function setSessionHintCookie(active: boolean): void {
  if (typeof document === "undefined") return;
  if (active) {
    const maxAgeSeconds = 60 * 60 * 24 * 7;
    const secureFlag =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${SESSION_HINT_COOKIE}=1; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
  } else {
    document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function hasSessionHintCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${SESSION_HINT_COOKIE}=1`));
}

export function clearClientSessionState(): void {
  inMemoryAccessToken = null;
  setSessionHintCookie(false);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (response.ok && payload && isApiSuccessEnvelope(payload)) {
    return payload.data;
  }

  if (payload && isApiErrorEnvelope(payload)) {
    throw new ApiClientError({
      status: response.status,
      code: payload.error.code,
      message: payload.error.message,
      details: payload.error.details,
      requestId: payload.meta?.requestId,
    });
  }

  const fallbackMessage =
    response.status === 429
      ? "Bạn thao tác quá nhanh. Vui lòng đợi ít phút rồi thử lại."
      : response.status === 401
        ? "Phiên làm việc không hợp lệ hoặc đã hết hạn."
        : response.status === 403
          ? "Bạn không có quyền thực hiện thao tác này."
          : "Không thể xử lý phản hồi từ máy chủ.";

  throw new ApiClientError({
    status: response.status,
    code:
      response.status === 401
        ? "UNAUTHORIZED"
        : response.status === 403
          ? "FORBIDDEN"
          : response.status === 429
            ? "RATE_LIMITED"
            : "INTERNAL_SERVER_ERROR",
    message: fallbackMessage,
  });
}

async function executeRefreshRequest(): Promise<LoginResponse> {
  const url = `${getApiBaseUrl()}/auth/refresh`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
    });
  } catch {
    clearClientSessionState();
    throw new ApiClientError({
      status: 0,
      code: "SERVICE_UNAVAILABLE",
      message: "Không thể kết nối tới máy chủ xác thực.",
    });
  }

  try {
    const data = await parseApiResponse<LoginResponse>(response);
    inMemoryAccessToken = data.accessToken;
    setSessionHintCookie(true);
    lifecycleHandlers.onSessionUpdated?.(data.user);
    return data;
  } catch (err) {
    clearClientSessionState();
    if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
      lifecycleHandlers.onSessionInvalidated?.();
    }
    throw err;
  }
}

/**
 * Single-flight refresh mutex: prevents concurrent 401 responses or StrictMode mounts
 * from sending overlapping refresh requests that would trigger server-side
 * refresh token reuse detection.
 */
export async function refreshSessionSingleFlight(): Promise<LoginResponse> {
  if (!inFlightRefreshPromise) {
    inFlightRefreshPromise = executeRefreshRequest().finally(() => {
      inFlightRefreshPromise = null;
    });
  }
  return inFlightRefreshPromise;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Set `false` for `@Public()` endpoints that do not require Bearer JWT. */
  auth?: boolean;
  credentials?: RequestCredentials;
  skipRefreshRetry?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    auth = true,
    credentials = "include",
    skipRefreshRetry = false,
  } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getApiBaseUrl()}${normalizedPath}`;

  if (auth && !inMemoryAccessToken && !skipRefreshRetry) {
    await refreshSessionSingleFlight();
  }

  const runFetch = async (bearerToken: string | null): Promise<Response> => {
    const requestHeaders: Record<string, string> = {
      "X-Requested-With": "XMLHttpRequest",
      ...headers,
    };
    if (body !== undefined && !requestHeaders["Content-Type"]) {
      requestHeaders["Content-Type"] = "application/json";
    }
    if (auth && bearerToken) {
      requestHeaders["Authorization"] = `Bearer ${bearerToken}`;
    }

    try {
      return await fetch(url, {
        method,
        credentials,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
    } catch {
      throw new ApiClientError({
        status: 0,
        code: "SERVICE_UNAVAILABLE",
        message: "Không thể kết nối tới máy chủ API. Vui lòng kiểm tra kết nối mạng.",
      });
    }
  };

  let response = await runFetch(inMemoryAccessToken);

  if (response.status === 401 && auth && !skipRefreshRetry) {
    try {
      const refreshed = await refreshSessionSingleFlight();
      response = await runFetch(refreshed.accessToken);
    } catch (refreshError) {
      throw refreshError;
    }
  }

  try {
    return await parseApiResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 401 && auth) {
        clearClientSessionState();
        lifecycleHandlers.onSessionInvalidated?.();
      } else if (error.status === 403 && error.code === "PASSWORD_CHANGE_REQUIRED") {
        lifecycleHandlers.onPasswordChangeRequired?.();
      }
    }
    throw error;
  }
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const data = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
      credentials: "include",
      skipRefreshRetry: true,
    });
    inMemoryAccessToken = data.accessToken;
    setSessionHintCookie(true);
    lifecycleHandlers.onSessionUpdated?.(data.user);
    return data;
  },

  async refresh(): Promise<LoginResponse> {
    return refreshSessionSingleFlight();
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<{ loggedOut: true }>("/auth/logout", {
        method: "POST",
        auth: false,
        credentials: "include",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
        skipRefreshRetry: true,
      });
    } finally {
      clearClientSessionState();
      lifecycleHandlers.onSessionInvalidated?.();
    }
  },

  async getMe(): Promise<AuthUserProfileDto> {
    return apiRequest<AuthUserProfileDto>("/auth/me", {
      method: "GET",
      auth: true,
    });
  },

  async changePassword(
    payload: ChangePasswordRequest,
  ): Promise<{ updated: true; mustChangePassword: false }> {
    return apiRequest<{ updated: true; mustChangePassword: false }>(
      "/auth/me/password",
      {
        method: "PATCH",
        body: payload,
        auth: true,
        credentials: "include",
      },
    );
  },
};

export interface AdminMediaAssetItem {
  id: string;
  assetKind: "PANORAMA_2_1" | "PHOTO_2D" | "THUMBNAIL";
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  isValid2To1: boolean;
  isPreviewApproved: boolean;
  processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  processingError: string | null;
  publicUrl: string | null;
  optimizedDesktopUrl: string | null;
  optimizedMobileUrl: string | null;
  thumbnailUrl: string | null;
  sha256Checksum: string;
  cameraMetadata: Record<string, unknown> | null;
  isAiPlaceholder: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  usageDetails: {
    buildings: number;
    tourNodes: number;
    locations: number;
  };
}

export interface MediaPresignPayload {
  assetKind: "PANORAMA_2_1" | "PHOTO_2D" | "THUMBNAIL";
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  declaredWidth: number;
  declaredHeight: number;
  sha256: string;
}

export interface MediaPresignResult {
  assetId: string;
  storageDriver: "local" | "s3";
  uploadUrl: string;
  targetType: string;
  uploadToken: string;
  maxSizeBytes: number;
  expiresAt: string;
}

export const mediaApi = {
  async listMedia(params?: {
    assetKind?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AdminMediaAssetItem[]; total: number; page: number; limit: number }> {
    const searchParams = new URLSearchParams();
    if (params?.assetKind && params.assetKind !== "all") {
      searchParams.set("assetKind", params.assetKind.toUpperCase());
    }
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<{
      items: AdminMediaAssetItem[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/media${qs}`, {
      method: "GET",
      auth: true,
    });
  },

  async presign(payload: MediaPresignPayload): Promise<MediaPresignResult> {
    return apiRequest<MediaPresignResult>("/admin/media/presign", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  async uploadBinary(uploadUrl: string, file: File): Promise<void> {
    const fullUrl = uploadUrl.startsWith("http")
      ? uploadUrl
      : `${getApiBaseUrl().replace(/\/+$/, "")}${uploadUrl.startsWith("/") ? "" : "/"}${uploadUrl}`;
    const res = await fetch(fullUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}): ${text || res.statusText}`);
    }
  },

  async completeUpload(
    token: string,
    sha256Checksum: string,
  ): Promise<AdminMediaAssetItem> {
    return apiRequest<AdminMediaAssetItem>("/admin/media/complete-upload", {
      method: "POST",
      body: { token, sha256Checksum },
      auth: true,
    });
  },

  async deleteMedia(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(
      `/admin/media/${id}`,
      {
        method: "DELETE",
        auth: true,
      },
    );
  },
};

export function formatAuthErrorMessage(
  error: unknown,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
): string {
  if (error instanceof ApiClientError) {
    if (error.code === "RATE_LIMITED" || error.status === 429) {
      return "Bạn thao tác quá nhanh hoặc thử sai nhiều lần. Vui lòng đợi ít phút rồi thử lại.";
    }
    if (error.details && error.details.length > 0 && error.details[0]?.message) {
      return String(error.details[0].message);
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

if (typeof window !== "undefined") {
  (window as unknown as { __authApi?: typeof authApi }).__authApi = authApi;
}

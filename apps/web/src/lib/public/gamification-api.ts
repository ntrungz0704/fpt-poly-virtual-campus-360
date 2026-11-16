import type {
  GamificationGuestSessionDto,
  GamificationProfileDto,
  LeaderboardResponseDto,
  QuizSubmissionResultDto,
  SpinWheelConfigResponseDto,
  SpinWheelResultDto,
  SubmitQuizInputDto,
  SpinWheelInputDto,
} from "@fpt-campus/shared";
import {
  ApiClientError,
  apiRequest,
  getInMemoryAccessToken,
  hasSessionHintCookie,
} from "../auth/api-client";

let guestSessionReady = false;
let inFlightGuestSessionPromise: Promise<GamificationGuestSessionDto> | null = null;

/**
 * Ensures the browser holds a server-issued, HMAC-signed HttpOnly cookie for
 * anonymous walk-in gamification sessions (B-A1), deduplicated via single-flight.
 */
export async function ensureGamificationGuestSession(
  forceRefresh = false,
): Promise<GamificationGuestSessionDto> {
  if (guestSessionReady && !forceRefresh) {
    return { sessionActive: true, expiresAt: "" };
  }
  if (!inFlightGuestSessionPromise) {
    inFlightGuestSessionPromise = apiRequest<GamificationGuestSessionDto>(
      "/public/gamification/guest-session",
      {
        method: "POST",
        auth: false,
      },
    )
      .then((res) => {
        guestSessionReady = res.sessionActive;
        return res;
      })
      .finally(() => {
        inFlightGuestSessionPromise = null;
      });
  }
  return inFlightGuestSessionPromise;
}

async function withAnonymousGuestSession<T>(
  hasTicketCode: boolean,
  operation: () => Promise<T>,
): Promise<T> {
  const hasAuthenticatedHint =
    Boolean(getInMemoryAccessToken()) || hasSessionHintCookie();

  if (!hasTicketCode && !hasAuthenticatedHint && !guestSessionReady) {
    await ensureGamificationGuestSession().catch(() => undefined);
  }

  try {
    return await operation();
  } catch (err) {
    if (
      err instanceof ApiClientError &&
      err.status === 401 &&
      (err.code === "GUEST_SESSION_REQUIRED" ||
        err.code === "INVALID_GUEST_SESSION")
    ) {
      await ensureGamificationGuestSession(true);
      return operation();
    }
    throw err;
  }
}

/**
 * Fetch active spin wheel slices configuration.
 * GET /api/v1/public/gamification/spin/config
 */
export async function fetchSpinConfig(): Promise<SpinWheelConfigResponseDto> {
  return apiRequest<SpinWheelConfigResponseDto>(
    "/public/gamification/spin/config",
    { auth: false },
  );
}

/**
 * Fetch participant profile (total XP, spins remaining, recent activities).
 * GET /api/v1/public/gamification/profile
 */
export async function fetchGamificationProfile(
  ticketCode?: string,
  attendeeName?: string,
): Promise<GamificationProfileDto> {
  const params = new URLSearchParams();
  if (ticketCode) params.set("ticketCode", ticketCode);
  if (attendeeName) params.set("attendeeName", attendeeName);

  const qs = params.toString();
  return withAnonymousGuestSession(Boolean(ticketCode), () =>
    apiRequest<GamificationProfileDto>(
      `/public/gamification/profile${qs ? `?${qs}` : ""}`,
      { auth: "optional" },
    ),
  );
}

/**
 * Fetch leaderboard ranking.
 * GET /api/v1/public/gamification/leaderboard
 */
export async function fetchLeaderboard(
  ticketCode?: string,
  attendeeName?: string,
  limit = 10,
): Promise<LeaderboardResponseDto> {
  const params = new URLSearchParams();
  if (ticketCode) params.set("ticketCode", ticketCode);
  if (attendeeName) params.set("attendeeName", attendeeName);
  params.set("limit", String(limit));

  const qs = params.toString();
  return withAnonymousGuestSession(Boolean(ticketCode), () =>
    apiRequest<LeaderboardResponseDto>(
      `/public/gamification/leaderboard${qs ? `?${qs}` : ""}`,
      { auth: "optional" },
    ),
  );
}

/**
 * Submit answers to backend for authoritative scoring and XP award.
 * POST /api/v1/public/gamification/quiz/submit
 */
export async function submitQuizAnswers(
  input: SubmitQuizInputDto,
): Promise<QuizSubmissionResultDto> {
  return withAnonymousGuestSession(Boolean(input.ticketCode), () =>
    apiRequest<QuizSubmissionResultDto>(
      "/public/gamification/quiz/submit",
      {
        method: "POST",
        body: input,
        auth: "optional",
      },
    ),
  );
}

/**
 * Trigger lucky wheel spin on backend.
 * POST /api/v1/public/gamification/spin
 */
export async function executeSpinWheel(
  input: SpinWheelInputDto,
): Promise<SpinWheelResultDto> {
  return withAnonymousGuestSession(Boolean(input.ticketCode), () =>
    apiRequest<SpinWheelResultDto>("/public/gamification/spin", {
      method: "POST",
      body: input,
      auth: "optional",
    }),
  );
}

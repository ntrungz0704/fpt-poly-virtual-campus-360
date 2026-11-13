import type {
  GamificationProfileDto,
  LeaderboardResponseDto,
  QuizSubmissionResultDto,
  SpinWheelConfigResponseDto,
  SpinWheelResultDto,
  SubmitQuizInputDto,
  SpinWheelInputDto,
} from "@fpt-campus/shared";
import { apiRequest } from "../auth/api-client";

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
  return apiRequest<GamificationProfileDto>(
    `/public/gamification/profile${qs ? `?${qs}` : ""}`,
    { auth: false },
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
  return apiRequest<LeaderboardResponseDto>(
    `/public/gamification/leaderboard${qs ? `?${qs}` : ""}`,
    { auth: false },
  );
}

/**
 * Submit answers to backend for authoritative scoring and XP award.
 * POST /api/v1/public/gamification/quiz/submit
 */
export async function submitQuizAnswers(
  input: SubmitQuizInputDto,
): Promise<QuizSubmissionResultDto> {
  return apiRequest<QuizSubmissionResultDto>(
    "/public/gamification/quiz/submit",
    {
      method: "POST",
      body: input,
      auth: false,
    },
  );
}

/**
 * Trigger lucky wheel spin on backend.
 * POST /api/v1/public/gamification/spin
 */
export async function executeSpinWheel(
  input: SpinWheelInputDto,
): Promise<SpinWheelResultDto> {
  return apiRequest<SpinWheelResultDto>("/public/gamification/spin", {
    method: "POST",
    body: input,
    auth: false,
  });
}

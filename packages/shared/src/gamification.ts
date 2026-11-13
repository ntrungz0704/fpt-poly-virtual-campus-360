// ============================================================================
// Milestone M3D: Gamification Shared Contracts
// Quiz scoring, XP Ledger, Spin Wheel & Server-Authoritative Leaderboard
// ============================================================================

export interface QuizAnswerSubmissionDto {
  questionId: string;
  selectedIndex: number;
}

export interface SubmitQuizInputDto {
  eventId: string;
  attendeeName: string;
  ticketCode?: string;
  items: QuizAnswerSubmissionDto[];
}

export interface QuizSubmissionItemResultDto {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface QuizSubmissionResultDto {
  attemptId: string;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  scoreXp: number;
  isXpAwarded: boolean;
  message: string;
  results: QuizSubmissionItemResultDto[];
}

export interface SpinSliceDto {
  id: string;
  label: string;
  rewardType: "XP" | "GIFT" | "BADGE" | "LUCK_NEXT_TIME" | string;
  amountXp: number;
  colorHex: string;
  icon: string;
  sortOrder: number;
}

export interface SpinWheelConfigResponseDto {
  slices: SpinSliceDto[];
}

export interface SpinWheelInputDto {
  attendeeName: string;
  ticketCode?: string;
}

export interface SpinWheelResultDto {
  historyId: string;
  rewardId: string;
  rewardLabel: string;
  rewardType: string;
  awardedXp: number;
  sliceIndex: number;
  spinsRemaining: number;
  totalXp: number;
  message: string;
}

export interface XpTransactionSummaryDto {
  id: string;
  amountXp: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface UserRewardSummaryDto {
  id: string;
  label: string;
  rewardType: string;
  awardedXp: number;
  createdAt: string;
}

export interface GamificationProfileDto {
  attendeeName: string;
  ticketCode: string | null;
  totalXp: number;
  spinsAvailable: number;
  spinsUsed: number;
  quizAttemptsCount: number;
  recentTransactions: XpTransactionSummaryDto[];
  recentRewards: UserRewardSummaryDto[];
}

export interface LeaderboardEntryDto {
  rank: number;
  attendeeName: string;
  totalXp: number;
  level: string;
  badge: string;
  totalSpins: number;
  isCurrentAttendee?: boolean;
}

export interface LeaderboardResponseDto {
  topEntries: LeaderboardEntryDto[];
  totalParticipants: number;
  currentEntry?: LeaderboardEntryDto | null;
}

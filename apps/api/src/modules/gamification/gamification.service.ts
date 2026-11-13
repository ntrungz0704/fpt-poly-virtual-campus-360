import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import crypto from "node:crypto";
import { Prisma, PublishStatus } from "@prisma/client";
import type {
  GamificationProfileDto,
  LeaderboardEntryDto,
  LeaderboardResponseDto,
  QuizSubmissionResultDto,
  SpinSliceDto,
  SpinWheelConfigResponseDto,
  SpinWheelResultDto,
  UserRewardSummaryDto,
  XpTransactionSummaryDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type {
  GamificationProfileQueryDto,
  LeaderboardQueryDto,
  SpinWheelDto,
  SubmitQuizDto,
} from "./dto/gamification.dto";

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // 1. QUIZ SUBMISSION & SCORING
  // ---------------------------------------------------------------------------

  async submitQuiz(
    dto: SubmitQuizDto,
    userId?: string,
  ): Promise<QuizSubmissionResultDto> {
    const rawName = dto.attendeeName.trim();
    const rawTicket = dto.ticketCode?.trim().toUpperCase();

    // Verify event is published and not deleted
    const event = await this.prisma.openDayEvent.findFirst({
      where: {
        id: dto.eventId,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        campus: true,
      },
    });

    if (!event || event.campus.deletedAt !== null) {
      throw new NotFoundException({
        code: "EVENT_NOT_FOUND",
        message: "Sự kiện không tồn tại hoặc chưa được công khai.",
      });
    }

    const uniqueQuestionIds = Array.from(
      new Set(dto.items.map((i) => i.questionId)),
    );

    // Fetch questions from DB
    const quizRows = await this.prisma.openDayQuizItem.findMany({
      where: {
        id: { in: uniqueQuestionIds },
        eventId: dto.eventId,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
    });

    const quizById = new Map(quizRows.map((q) => [q.id, q]));
    if (quizById.size !== uniqueQuestionIds.length) {
      throw new NotFoundException({
        code: "INVALID_QUIZ_QUESTIONS",
        message: "Một số câu hỏi không hợp lệ hoặc đã bị gỡ.",
      });
    }

    let correctCount = 0;
    const itemResults = dto.items.map((item) => {
      const quiz = quizById.get(item.questionId)!;
      const options = Array.isArray(quiz.optionsJson)
        ? (quiz.optionsJson as string[])
        : [];

      if (item.selectedIndex < 0 || item.selectedIndex >= options.length) {
        throw new BadRequestException({
          code: "INVALID_OPTION_INDEX",
          message: `Lựa chọn cho câu hỏi "${quiz.questionText.slice(0, 30)}..." không hợp lệ.`,
        });
      }

      const isCorrect = item.selectedIndex === quiz.correctIndex;
      if (isCorrect) correctCount += 1;

      return {
        questionId: quiz.id,
        selectedIndex: item.selectedIndex,
        isCorrect,
        correctIndex: quiz.correctIndex,
        explanation: quiz.explanation,
      };
    });

    const totalQuestions = itemResults.length;
    const scorePercent =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Authoritative XP calculation: 20 XP per correct + 40 bonus if perfect score
    let calculatedXp = correctCount * 20;
    if (correctCount === totalQuestions && totalQuestions > 0) {
      calculatedXp += 40;
    }

    // Idempotency check: prevent duplicate XP awards for the same event
    const participantKey = (rawTicket || rawName.toLowerCase()).replace(
      /\s+/g,
      "_",
    );
    const idempotentRefId = `quiz_${dto.eventId}_${participantKey}`;

    const existingXpLedger = await this.prisma.xpLedger.findFirst({
      where: {
        source: "QUIZ_COMPLETION",
        referenceId: idempotentRefId,
      },
    });

    const isXpAwarded = !existingXpLedger && calculatedXp > 0;
    const finalScoreXp = isXpAwarded ? calculatedXp : 0;

    // Database write in atomic transaction
    const attempt = await this.prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.quizAttempt.create({
        data: {
          eventId: dto.eventId,
          userId: userId ?? null,
          ticketCode: rawTicket || null,
          attendeeName: rawName,
          totalQuestions,
          correctCount,
          scorePercent,
          scoreXp: finalScoreXp,
          answersJson: itemResults,
        },
      });

      if (isXpAwarded) {
        await tx.xpLedger.create({
          data: {
            userId: userId ?? null,
            ticketCode: rawTicket || null,
            attendeeName: rawName,
            amountXp: finalScoreXp,
            source: "QUIZ_COMPLETION",
            referenceId: idempotentRefId,
            metadataJson: {
              eventId: dto.eventId,
              correctCount,
              totalQuestions,
              scorePercent,
            },
          },
        });
      }

      return createdAttempt;
    });

    const message = isXpAwarded
      ? `Chúc mừng bạn đạt ${scorePercent}% và nhận được ${finalScoreXp} XP!`
      : existingXpLedger
        ? "Bạn đã nhận XP cho bài thi này trước đó. Kết quả lần này vẫn được lưu vào lịch sử."
        : `Bạn trả lời đúng ${correctCount}/${totalQuestions} câu. Hãy ôn luyện thêm nhé!`;

    return {
      attemptId: attempt.id,
      correctCount,
      totalQuestions,
      scorePercent,
      scoreXp: finalScoreXp,
      isXpAwarded,
      message,
      results: itemResults,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. SPIN WHEEL CONFIG & EXECUTION
  // ---------------------------------------------------------------------------

  async getSpinConfig(): Promise<SpinWheelConfigResponseDto> {
    const rewards = await this.prisma.spinRewardConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const slices: SpinSliceDto[] = rewards.map((r) => ({
      id: r.id,
      label: r.label,
      rewardType: r.rewardType,
      amountXp: r.amountXp,
      colorHex: r.colorHex,
      icon: r.icon,
      sortOrder: r.sortOrder,
    }));

    return { slices };
  }

  async spinWheel(
    dto: SpinWheelDto,
    userId?: string,
  ): Promise<SpinWheelResultDto> {
    const rawName = dto.attendeeName.trim();
    const rawTicket = dto.ticketCode?.trim().toUpperCase();

    // Check available spins
    const profile = await this.calculateParticipantSpins(rawTicket, rawName, userId);
    if (profile.spinsAvailable <= 0) {
      throw new BadRequestException({
        code: "NO_SPINS_REMAINING",
        message:
          "Bạn đã hết lượt quay may mắn! Hãy hoàn thành Quiz tìm hiểu khuôn viên hoặc Check-in tại sự kiện để nhận thêm lượt quay.",
      });
    }

    // Load active rewards
    const rewards = await this.prisma.spinRewardConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (rewards.length === 0) {
      throw new NotFoundException({
        code: "NO_ACTIVE_REWARDS",
        message: "Hiện chưa có phần thưởng nào cho vòng quay.",
      });
    }

    // Weighted random selection using secure crypto
    const totalWeight = rewards.reduce((sum, r) => sum + r.probabilityWeight, 0);
    const randomPick = crypto.randomInt(0, totalWeight);

    let accumulated = 0;
    let selectedIndex = 0;
    for (let i = 0; i < rewards.length; i++) {
      accumulated += rewards[i].probabilityWeight;
      if (randomPick < accumulated) {
        selectedIndex = i;
        break;
      }
    }

    let winningReward = rewards[selectedIndex];

    // If prize is out of stock, fallback to standard XP slice
    if (
      winningReward.remainingQuantity !== null &&
      winningReward.remainingQuantity <= 0
    ) {
      const fallbackReward = rewards.find((r) => r.rewardType === "XP") ?? winningReward;
      winningReward = fallbackReward;
      selectedIndex = rewards.findIndex((r) => r.id === fallbackReward.id);
    }

    // Atomic transaction: record spin, decrement stock if applicable, award XP
    const result = await this.prisma.$transaction(async (tx) => {
      if (winningReward.remainingQuantity !== null) {
        await tx.spinRewardConfig.update({
          where: { id: winningReward.id },
          data: {
            remainingQuantity: {
              decrement: 1,
            },
          },
        });
      }

      const spinHistory = await tx.userSpinHistory.create({
        data: {
          userId: userId ?? null,
          ticketCode: rawTicket || null,
          attendeeName: rawName,
          rewardConfigId: winningReward.id,
          rewardLabel: winningReward.label,
          rewardType: winningReward.rewardType,
          awardedXp: winningReward.amountXp,
        },
      });

      if (winningReward.amountXp > 0) {
        await tx.xpLedger.create({
          data: {
            userId: userId ?? null,
            ticketCode: rawTicket || null,
            attendeeName: rawName,
            amountXp: winningReward.amountXp,
            source: "SPIN_WHEEL",
            referenceId: spinHistory.id,
            metadataJson: {
              rewardConfigId: winningReward.id,
              rewardLabel: winningReward.label,
              rewardType: winningReward.rewardType,
            },
          },
        });
      }

      return spinHistory;
    });

    const updatedProfile = await this.calculateParticipantSpins(
      rawTicket,
      rawName,
      userId,
    );

    let message = `Tuyệt vời! Bạn nhận được ${winningReward.label}`;
    if (winningReward.amountXp > 0) {
      message += ` (+${winningReward.amountXp} XP)`;
    }

    return {
      historyId: result.id,
      rewardId: winningReward.id,
      rewardLabel: winningReward.label,
      rewardType: winningReward.rewardType,
      awardedXp: winningReward.amountXp,
      sliceIndex: selectedIndex,
      spinsRemaining: updatedProfile.spinsAvailable,
      totalXp: updatedProfile.totalXp,
      message,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. GAMIFICATION PROFILE & SPINS CALCULATION
  // ---------------------------------------------------------------------------

  async getProfile(
    query: GamificationProfileQueryDto,
    userId?: string,
  ): Promise<GamificationProfileDto> {
    const rawTicket = query.ticketCode?.trim().toUpperCase();
    const rawName = query.attendeeName?.trim();

    return this.calculateParticipantSpins(rawTicket, rawName, userId);
  }

  private async calculateParticipantSpins(
    ticketCode?: string,
    attendeeName?: string,
    userId?: string,
  ): Promise<GamificationProfileDto> {
    const rawName = attendeeName || (ticketCode ? `Khách mời ${ticketCode.slice(-4)}` : "Khách tham quan");
    const xpWhereConditions: Prisma.XpLedgerWhereInput[] = [];
    const spinWhereConditions: Prisma.UserSpinHistoryWhereInput[] = [];
    const quizWhereConditions: Prisma.QuizAttemptWhereInput[] = [];

    if (ticketCode) {
      xpWhereConditions.push({ ticketCode });
      spinWhereConditions.push({ ticketCode });
      quizWhereConditions.push({ ticketCode });
    }
    if (userId) {
      xpWhereConditions.push({ userId });
      spinWhereConditions.push({ userId });
      quizWhereConditions.push({ userId });
    }
    if (attendeeName) {
      xpWhereConditions.push({ attendeeName: { equals: attendeeName, mode: "insensitive" } });
      spinWhereConditions.push({ attendeeName: { equals: attendeeName, mode: "insensitive" } });
      quizWhereConditions.push({ attendeeName: { equals: attendeeName, mode: "insensitive" } });
    }

    const xpFilter: Prisma.XpLedgerWhereInput =
      xpWhereConditions.length > 0 ? { OR: xpWhereConditions } : { ticketCode: "NONE" };
    const spinFilter: Prisma.UserSpinHistoryWhereInput =
      spinWhereConditions.length > 0 ? { OR: spinWhereConditions } : { ticketCode: "NONE" };
    const quizFilter: Prisma.QuizAttemptWhereInput =
      quizWhereConditions.length > 0 ? { OR: quizWhereConditions } : { ticketCode: "NONE" };

    // 1. Calculate Total XP from Ledger
    const xpRecords = await this.prisma.xpLedger.findMany({
      where: xpFilter,
      orderBy: { createdAt: "desc" },
    });

    const totalXp = xpRecords.reduce((sum, r) => sum + r.amountXp, 0);

    // 2. Count Spins Used
    const spinsUsed = await this.prisma.userSpinHistory.count({
      where: spinFilter,
    });

    // 3. Count Quiz Attempts
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: quizFilter,
    });

    // 4. Check Open Day Ticket Status (for bonus spins)
    let hasValidTicket = false;
    let isCheckedIn = false;

    if (ticketCode) {
      const ticket = await this.prisma.eventParticipation.findUnique({
        where: { ticketCode },
      });
      if (ticket) {
        hasValidTicket = true;
        if (ticket.checkedInAt !== null) {
          isCheckedIn = true;
        }
      }
    }

    // Earned spins rules:
    // - Base: 1 spin for anyone with valid ticket OR completing at least 1 quiz
    // - Bonus +2 spins if checked in at event
    // - Bonus +1 spin if passed quiz (>= 60%)
    let earnedSpins = 0;
    if (hasValidTicket || quizAttempts.length > 0) {
      earnedSpins += 1;
    }
    if (isCheckedIn) {
      earnedSpins += 2;
    }
    const hasPassedQuiz = quizAttempts.some((q) => q.scorePercent >= 60);
    if (hasPassedQuiz) {
      earnedSpins += 1;
    }

    const spinsAvailable = Math.max(0, earnedSpins - spinsUsed);

    const recentTransactions: XpTransactionSummaryDto[] = xpRecords.slice(0, 5).map((r) => ({
      id: r.id,
      amountXp: r.amountXp,
      source: r.source,
      description:
        r.source === "QUIZ_COMPLETION"
          ? "Hoàn thành bài trắc nghiệm khuôn viên"
          : r.source === "SPIN_WHEEL"
            ? "Thưởng từ Vòng quay may mắn"
            : r.source === "CHECK_IN"
              ? "Điểm danh tham gia Open Day"
              : "Hoạt động khám phá trường",
      createdAt: r.createdAt.toISOString(),
    }));

    const recentRewardsRows = await this.prisma.userSpinHistory.findMany({
      where: spinFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentRewards: UserRewardSummaryDto[] = recentRewardsRows.map((r) => ({
      id: r.id,
      label: r.rewardLabel,
      rewardType: r.rewardType,
      awardedXp: r.awardedXp,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      attendeeName: rawName,
      ticketCode: ticketCode || null,
      totalXp,
      spinsAvailable,
      spinsUsed,
      quizAttemptsCount: quizAttempts.length,
      recentTransactions,
      recentRewards,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. LEADERBOARD
  // ---------------------------------------------------------------------------

  async getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardResponseDto> {
    const limit = Math.min(query.limit || 20, 100);
    const rawTicket = query.ticketCode?.trim().toUpperCase();
    const rawName = query.attendeeName?.trim();

    // Group XP by attendee
    const ledgerTotals = await this.prisma.xpLedger.groupBy({
      by: ["attendeeName", "ticketCode"],
      _sum: {
        amountXp: true,
      },
      orderBy: {
        _sum: {
          amountXp: "desc",
        },
      },
      take: limit,
    });

    // Count spins per attendee
    const spinsGrouped = await this.prisma.userSpinHistory.groupBy({
      by: ["attendeeName"],
      _count: {
        id: true,
      },
    });
    const spinCountByName = new Map(
      spinsGrouped.map((s) => [s.attendeeName.toLowerCase(), s._count.id]),
    );

    // Baseline campus ambassadors to ensure inspiring initial ranking
    const baselineAmbassadors = [
      { name: "Đặng Quốc Hưng (K19 CNTT)", xp: 480, spins: 3 },
      { name: "Lê Hoàng Yến (K19 QTKD)", xp: 380, spins: 2 },
      { name: "Trần Minh Quang (K18 Đồ Họa)", xp: 290, spins: 2 },
      { name: "Phạm Thu Trang (K19 Marketing)", xp: 210, spins: 1 },
      { name: "Vũ Gia Bảo (K19 Lập trình Web)", xp: 160, spins: 1 },
    ];

    const entriesMap = new Map<string, { attendeeName: string; totalXp: number; totalSpins: number }>();

    // Add baseline
    for (const amb of baselineAmbassadors) {
      entriesMap.set(amb.name.toLowerCase(), {
        attendeeName: amb.name,
        totalXp: amb.xp,
        totalSpins: amb.spins,
      });
    }

    // Merge real database participants (takes precedence or updates)
    for (const row of ledgerTotals) {
      const name = row.attendeeName;
      const totalXp = row._sum.amountXp ?? 0;
      const totalSpins = spinCountByName.get(name.toLowerCase()) ?? 0;

      entriesMap.set(name.toLowerCase(), {
        attendeeName: name,
        totalXp,
        totalSpins,
      });
    }

    // Sort all entries by XP descending
    const sortedList = Array.from(entriesMap.values()).sort(
      (a, b) => b.totalXp - a.totalXp,
    );

    const formatEntry = (
      item: { attendeeName: string; totalXp: number; totalSpins: number },
      rank: number,
      isCurrent: boolean,
    ): LeaderboardEntryDto => {
      let level = "Level 1 - Khám phá";
      let badge = "Tân binh Poly";

      if (item.totalXp >= 400) {
        level = "Level 5 - Tinh hoa";
        badge = "Huyền thoại QTSC";
      } else if (item.totalXp >= 250) {
        level = "Level 4 - Chuyên gia";
        badge = "Đại sứ Campus 360";
      } else if (item.totalXp >= 150) {
        level = "Level 3 - Tài ba";
        badge = "Nhà Thám hiểm Poly";
      } else if (item.totalXp >= 50) {
        level = "Level 2 - Tích cực";
        badge = "Sinh viên Tiên phong";
      }

      return {
        rank,
        attendeeName: item.attendeeName,
        totalXp: item.totalXp,
        level,
        badge,
        totalSpins: item.totalSpins,
        isCurrentAttendee: isCurrent,
      };
    };

    let currentEntry: LeaderboardEntryDto | null = null;
    const topEntries: LeaderboardEntryDto[] = [];

    sortedList.slice(0, limit).forEach((item, idx) => {
      const isCurrent =
        (rawName && item.attendeeName.toLowerCase() === rawName.toLowerCase()) ||
        (rawTicket && item.attendeeName.includes(rawTicket.slice(-4)));

      const entry = formatEntry(item, idx + 1, !!isCurrent);
      if (isCurrent) currentEntry = entry;
      topEntries.push(entry);
    });

    // If current attendee is not in top limit, find their rank in full list
    if (!currentEntry && (rawName || rawTicket)) {
      const foundIdx = sortedList.findIndex(
        (item) =>
          (rawName && item.attendeeName.toLowerCase() === rawName.toLowerCase()) ||
          (rawTicket && item.attendeeName.includes(rawTicket.slice(-4))),
      );
      if (foundIdx !== -1) {
        currentEntry = formatEntry(sortedList[foundIdx], foundIdx + 1, true);
      }
    }

    return {
      topEntries,
      totalParticipants: sortedList.length,
      currentEntry,
    };
  }
}

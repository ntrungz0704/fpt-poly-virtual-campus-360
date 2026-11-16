import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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

type DbClient = PrismaService | Prisma.TransactionClient;

interface ResolvedParticipantScope {
  displayName: string;
  ticketCode: string | null;
  userId: string | null;
  idempotencyIdentity: string;
  lockKey: string;
  xpFilter: Prisma.XpLedgerWhereInput;
  spinFilter: Prisma.UserSpinHistoryWhereInput;
  quizFilter: Prisma.QuizAttemptWhereInput;
  hasValidTicket: boolean;
  isCheckedIn: boolean;
}

const MATCH_NONE_ID = "00000000-0000-0000-0000-000000000000";

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

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
    const rawTicket = dto.ticketCode?.trim().toUpperCase() || undefined;

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

    const scope = await this.resolveParticipantScope(this.prisma, {
      userId,
      ticketCode: rawTicket,
      attendeeName: rawName,
      enforceTicketOwnership: Boolean(rawTicket),
    });

    const refSuffix = scope.idempotencyIdentity.replace(/\s+/g, "_");
    const idempotentRefId = `quiz_${dto.eventId}_${refSuffix}`.slice(0, 128);
    const idempotencyHash = crypto
      .createHash("sha256")
      .update(`${dto.eventId}:${scope.idempotencyIdentity}`)
      .digest("hex")
      .slice(0, 40);
    const idempotencyKey = `gamification:quiz:${dto.eventId}:${idempotencyHash}`;

    const txResult = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`quiz:${idempotencyKey}`}))`,
      );

      const existingXpLedger = await tx.xpLedger.findFirst({
        where: {
          OR: [
            { idempotencyKey },
            { source: "QUIZ_COMPLETION", referenceId: idempotentRefId },
          ],
        },
        select: { id: true },
      });

      const shouldAwardXp = !existingXpLedger && calculatedXp > 0;
      let finalScoreXp = shouldAwardXp ? calculatedXp : 0;
      let isXpAwarded = false;

      if (shouldAwardXp) {
        try {
          await tx.xpLedger.create({
            data: {
              userId: scope.userId,
              ticketCode: scope.ticketCode,
              attendeeName: scope.displayName,
              amountXp: calculatedXp,
              source: "QUIZ_COMPLETION",
              referenceId: idempotentRefId,
              idempotencyKey,
              metadataJson: {
                eventId: dto.eventId,
                correctCount,
                totalQuestions,
                scorePercent,
              },
            },
          });
          isXpAwarded = true;
        } catch (err) {
          if (!isUniqueConstraintError(err)) {
            throw err;
          }
          finalScoreXp = 0;
          isXpAwarded = false;
        }
      }

      const createdAttempt = await tx.quizAttempt.create({
        data: {
          eventId: dto.eventId,
          userId: scope.userId,
          ticketCode: scope.ticketCode,
          attendeeName: scope.displayName,
          totalQuestions,
          correctCount,
          scorePercent,
          scoreXp: finalScoreXp,
          answersJson: itemResults,
        },
      });

      return {
        attempt: createdAttempt,
        finalScoreXp,
        isXpAwarded,
        alreadyAwarded: Boolean(existingXpLedger),
      };
    });

    const message = txResult.isXpAwarded
      ? `Chúc mừng bạn đạt ${scorePercent}% và nhận được ${txResult.finalScoreXp} XP!`
      : txResult.alreadyAwarded
        ? "Bạn đã nhận XP cho bài thi này trước đó. Kết quả lần này vẫn được lưu vào lịch sử."
        : `Bạn trả lời đúng ${correctCount}/${totalQuestions} câu. Hãy ôn luyện thêm nhé!`;

    return {
      attemptId: txResult.attempt.id,
      correctCount,
      totalQuestions,
      scorePercent,
      scoreXp: txResult.finalScoreXp,
      isXpAwarded: txResult.isXpAwarded,
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
    const rawTicket = dto.ticketCode?.trim().toUpperCase() || undefined;

    const txResult = await this.prisma.$transaction(async (tx) => {
      const scope = await this.resolveParticipantScope(tx, {
        userId,
        ticketCode: rawTicket,
        attendeeName: rawName,
        enforceTicketOwnership: Boolean(rawTicket),
      });

      // Serialize concurrent spins per participant identity
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${scope.lockKey}))`,
      );

      const currentProfile = await this.computeParticipantProfile(tx, scope);
      if (currentProfile.spinsAvailable <= 0) {
        throw new BadRequestException({
          code: "NO_SPINS_REMAINING",
          message:
            "Bạn đã hết lượt quay may mắn! Hãy hoàn thành Quiz tìm hiểu khuôn viên hoặc Check-in tại sự kiện để nhận thêm lượt quay.",
        });
      }

      const rewards = await tx.spinRewardConfig.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      if (rewards.length === 0) {
        throw new NotFoundException({
          code: "NO_ACTIVE_REWARDS",
          message: "Hiện chưa có phần thưởng nào cho vòng quay.",
        });
      }

      // Only draw from rewards currently in stock (unlimited remainingQuantity===null or > 0)
      const availableRewards = rewards.filter(
        (r) => r.remainingQuantity === null || r.remainingQuantity > 0,
      );
      if (availableRewards.length === 0) {
        throw new ConflictException({
          code: "NO_ACTIVE_REWARDS",
          message: "Tất cả phần thưởng trong vòng quay hiện đã hết số lượng.",
        });
      }

      const totalWeight = availableRewards.reduce(
        (sum, r) => sum + Math.max(0, r.probabilityWeight),
        0,
      );
      let pickedReward = availableRewards[0];
      if (totalWeight > 0) {
        const randomPick = crypto.randomInt(0, totalWeight);
        let accumulated = 0;
        for (const candidate of availableRewards) {
          accumulated += Math.max(0, candidate.probabilityWeight);
          if (randomPick < accumulated) {
            pickedReward = candidate;
            break;
          }
        }
      }

      let winningReward = pickedReward;
      if (winningReward.remainingQuantity !== null) {
        // Guarded conditional stock decrement guarantees remainingQuantity >= 0
        const decremented = await tx.spinRewardConfig.updateMany({
          where: {
            id: winningReward.id,
            isActive: true,
            remainingQuantity: { gt: 0 },
          },
          data: {
            remainingQuantity: {
              decrement: 1,
            },
          },
        });

        if (decremented.count === 0) {
          const unlimitedFallback =
            rewards.find(
              (r) => r.remainingQuantity === null && r.rewardType === "XP",
            ) ?? rewards.find((r) => r.remainingQuantity === null);

          if (!unlimitedFallback) {
            throw new ConflictException({
              code: "REWARD_OUT_OF_STOCK",
              message: "Phần thưởng vừa hết số lượng, vui lòng thử lại.",
            });
          }
          winningReward = unlimitedFallback;
        }
      }

      const selectedIndex = Math.max(
        0,
        rewards.findIndex((r) => r.id === winningReward.id),
      );

      const spinHistory = await tx.userSpinHistory.create({
        data: {
          userId: scope.userId,
          ticketCode: scope.ticketCode,
          attendeeName: scope.displayName,
          rewardConfigId: winningReward.id,
          rewardLabel: winningReward.label,
          rewardType: winningReward.rewardType,
          awardedXp: winningReward.amountXp,
        },
      });

      if (winningReward.amountXp > 0) {
        await tx.xpLedger.create({
          data: {
            userId: scope.userId,
            ticketCode: scope.ticketCode,
            attendeeName: scope.displayName,
            amountXp: winningReward.amountXp,
            source: "SPIN_WHEEL",
            referenceId: spinHistory.id,
            idempotencyKey: `gamification:spin:${spinHistory.id}`,
            metadataJson: {
              rewardConfigId: winningReward.id,
              rewardLabel: winningReward.label,
              rewardType: winningReward.rewardType,
            },
          },
        });
      }

      const updatedProfile = await this.computeParticipantProfile(tx, scope);

      return {
        spinHistory,
        winningReward,
        selectedIndex,
        updatedProfile,
      };
    });

    let message = `Tuyệt vời! Bạn nhận được ${txResult.winningReward.label}`;
    if (txResult.winningReward.amountXp > 0) {
      message += ` (+${txResult.winningReward.amountXp} XP)`;
    }

    return {
      historyId: txResult.spinHistory.id,
      rewardId: txResult.winningReward.id,
      rewardLabel: txResult.winningReward.label,
      rewardType: txResult.winningReward.rewardType,
      awardedXp: txResult.winningReward.amountXp,
      sliceIndex: txResult.selectedIndex,
      spinsRemaining: txResult.updatedProfile.spinsAvailable,
      totalXp: txResult.updatedProfile.totalXp,
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
    const rawTicket = query.ticketCode?.trim().toUpperCase() || undefined;
    const rawName = query.attendeeName?.trim() || undefined;

    const scope = await this.resolveParticipantScope(this.prisma, {
      userId,
      ticketCode: rawTicket,
      attendeeName: rawName,
      enforceTicketOwnership: false,
    });

    return this.computeParticipantProfile(this.prisma, scope);
  }

  private async resolveParticipantScope(
    db: DbClient,
    params: {
      userId?: string;
      ticketCode?: string;
      attendeeName?: string;
      enforceTicketOwnership: boolean;
    },
  ): Promise<ResolvedParticipantScope> {
    const rawTicket = params.ticketCode?.trim().toUpperCase() || undefined;
    const rawName = params.attendeeName?.trim() || undefined;

    let inspectedTicket: {
      ticketCode: string;
      userId: string | null;
      attendeeName: string | null;
      participationStatus: string;
      checkedInAt: Date | null;
      eventDeletedAt: Date | null;
    } | null = null;

    if (rawTicket) {
      const ticketRow = await db.eventParticipation.findUnique({
        where: { ticketCode: rawTicket },
        include: {
          event: { select: { deletedAt: true } },
        },
      });

      if (ticketRow) {
        inspectedTicket = {
          ticketCode: ticketRow.ticketCode,
          userId: ticketRow.userId,
          attendeeName: ticketRow.attendeeName,
          participationStatus: ticketRow.participationStatus,
          checkedInAt: ticketRow.checkedInAt,
          eventDeletedAt: ticketRow.event.deletedAt,
        };

        if (ticketRow.userId !== null && ticketRow.userId !== params.userId) {
          throw new ForbiddenException({
            code: "TICKET_BELONGS_TO_ACCOUNT",
            message:
              "Vé này đã liên kết với tài khoản thành viên. Vui lòng đăng nhập đúng tài khoản để tiếp tục.",
          });
        }

        if (
          params.enforceTicketOwnership &&
          (ticketRow.event.deletedAt !== null ||
            ticketRow.participationStatus === "CANCELLED")
        ) {
          throw new BadRequestException({
            code: "TICKET_CANCELLED",
            message: "Vé tham gia đã bị hủy hoặc sự kiện không còn hiệu lực.",
          });
        }
      }
    }

    // Priority 1: Authenticated User (isolated strictly to userId + user-owned tickets)
    if (params.userId) {
      const [userRecord, ownedTickets] = await Promise.all([
        db.user.findUnique({
          where: { id: params.userId },
          select: { fullName: true },
        }),
        db.eventParticipation.findMany({
          where: {
            userId: params.userId,
            participationStatus: { not: "CANCELLED" },
            event: { deletedAt: null },
          },
          orderBy: { createdAt: "desc" },
          select: {
            ticketCode: true,
            checkedInAt: true,
          },
        }),
      ]);

      const ownedCodes = ownedTickets.map((t) => t.ticketCode);
      const matchingTicket = rawTicket
        ? ownedTickets.find((t) => t.ticketCode === rawTicket)
        : ownedTickets[0];
      const hasValidTicket = ownedTickets.length > 0;
      const isCheckedIn = ownedTickets.some((t) => t.checkedInAt !== null);

      const safeStoredTicket =
        matchingTicket?.ticketCode ??
        (rawTicket && !inspectedTicket ? rawTicket : ownedTickets[0]?.ticketCode ?? null);

      return {
        displayName:
          rawName || userRecord?.fullName || "Thành viên FPT Poly",
        ticketCode: safeStoredTicket,
        userId: params.userId,
        idempotencyIdentity: `user_${params.userId}`,
        lockKey: `gamification:user:${params.userId}`,
        xpFilter: {
          OR: [
            { userId: params.userId },
            ...(ownedCodes.length > 0
              ? [{ ticketCode: { in: ownedCodes }, userId: null }]
              : []),
          ],
        },
        spinFilter: {
          OR: [
            { userId: params.userId },
            ...(ownedCodes.length > 0
              ? [{ ticketCode: { in: ownedCodes }, userId: null }]
              : []),
          ],
        },
        quizFilter: {
          OR: [
            { userId: params.userId },
            ...(ownedCodes.length > 0
              ? [{ ticketCode: { in: ownedCodes }, userId: null }]
              : []),
          ],
        },
        hasValidTicket,
        isCheckedIn,
      };
    }

    // Priority 2: Unauthenticated Open Day Ticket Holder (strictly isolated to ticketCode & userId: null)
    if (rawTicket) {
      const isTicketValid = Boolean(
        inspectedTicket &&
          inspectedTicket.eventDeletedAt === null &&
          inspectedTicket.participationStatus !== "CANCELLED",
      );
      const isTicketCheckedIn = Boolean(
        isTicketValid && inspectedTicket?.checkedInAt !== null,
      );

      return {
        displayName:
          rawName ||
          inspectedTicket?.attendeeName ||
          `Khách mời ${rawTicket.slice(-4)}`,
        ticketCode: rawTicket,
        userId: null,
        idempotencyIdentity: `ticket_${rawTicket}`,
        lockKey: `gamification:ticket:${rawTicket}`,
        xpFilter: { ticketCode: rawTicket, userId: null },
        spinFilter: { ticketCode: rawTicket, userId: null },
        quizFilter: { ticketCode: rawTicket, userId: null },
        hasValidTicket: isTicketValid,
        isCheckedIn: isTicketCheckedIn,
      };
    }

    // Priority 3: Anonymous Walk-in Guest without ticket (strictly isolated to userId: null AND ticketCode: null)
    if (rawName) {
      const guestNameKey = rawName.toLowerCase();
      return {
        displayName: rawName,
        ticketCode: null,
        userId: null,
        idempotencyIdentity: `guest_${guestNameKey}`,
        lockKey: `gamification:guest:${guestNameKey}`,
        xpFilter: {
          userId: null,
          ticketCode: null,
          attendeeName: { equals: rawName, mode: "insensitive" },
        },
        spinFilter: {
          userId: null,
          ticketCode: null,
          attendeeName: { equals: rawName, mode: "insensitive" },
        },
        quizFilter: {
          userId: null,
          ticketCode: null,
          attendeeName: { equals: rawName, mode: "insensitive" },
        },
        hasValidTicket: false,
        isCheckedIn: false,
      };
    }

    // No identity supplied
    return {
      displayName: "Khách tham quan",
      ticketCode: null,
      userId: null,
      idempotencyIdentity: "anonymous_empty",
      lockKey: "gamification:empty",
      xpFilter: { id: MATCH_NONE_ID },
      spinFilter: { id: MATCH_NONE_ID },
      quizFilter: { id: MATCH_NONE_ID },
      hasValidTicket: false,
      isCheckedIn: false,
    };
  }

  private async computeParticipantProfile(
    db: DbClient,
    scope: ResolvedParticipantScope,
  ): Promise<GamificationProfileDto> {
    const [xpAggregate, recentXpRecords, spinsUsed, quizAttempts, recentRewardsRows] =
      await Promise.all([
        db.xpLedger.aggregate({
          where: scope.xpFilter,
          _sum: { amountXp: true },
        }),
        db.xpLedger.findMany({
          where: scope.xpFilter,
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        db.userSpinHistory.count({
          where: scope.spinFilter,
        }),
        db.quizAttempt.findMany({
          where: scope.quizFilter,
          select: { scorePercent: true },
        }),
        db.userSpinHistory.findMany({
          where: scope.spinFilter,
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const totalXp = xpAggregate._sum.amountXp ?? 0;

    // Earned spins rules:
    // - Base: 1 spin for anyone with valid ticket OR completing at least 1 quiz
    // - Bonus +2 spins if checked in at event
    // - Bonus +1 spin if passed quiz (>= 60%)
    let earnedSpins = 0;
    if (scope.hasValidTicket || quizAttempts.length > 0) {
      earnedSpins += 1;
    }
    if (scope.isCheckedIn) {
      earnedSpins += 2;
    }
    if (quizAttempts.some((q) => q.scorePercent >= 60)) {
      earnedSpins += 1;
    }

    const spinsAvailable = Math.max(0, earnedSpins - spinsUsed);

    const recentTransactions: XpTransactionSummaryDto[] = recentXpRecords.map(
      (r) => ({
        id: r.id,
        amountXp: r.amountXp,
        source: r.source,
        description:
          r.source === "QUIZ_COMPLETION" || r.source === "QUIZ_CONFIG_COMPLETION"
            ? "Hoàn thành bài trắc nghiệm khuôn viên"
            : r.source === "SPIN_WHEEL"
              ? "Thưởng từ Vòng quay may mắn"
              : r.source === "CHECK_IN"
                ? "Điểm danh tham gia Open Day"
                : "Hoạt động khám phá trường",
        createdAt: r.createdAt.toISOString(),
      }),
    );

    const recentRewards: UserRewardSummaryDto[] = recentRewardsRows.map((r) => ({
      id: r.id,
      label: r.rewardLabel,
      rewardType: r.rewardType,
      awardedXp: r.awardedXp,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      attendeeName: scope.displayName,
      ticketCode: scope.ticketCode,
      totalXp,
      spinsAvailable,
      spinsUsed,
      quizAttemptsCount: quizAttempts.length,
      recentTransactions,
      recentRewards,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. LEADERBOARD (100% Real PostgreSQL Aggregation — Zero Mock Baselines)
  // ---------------------------------------------------------------------------

  async getLeaderboard(
    query: LeaderboardQueryDto,
    userId?: string,
  ): Promise<LeaderboardResponseDto> {
    const limit = Math.min(query.limit || 20, 100);
    const rawTicket = query.ticketCode?.trim().toUpperCase() || undefined;
    const rawName = query.attendeeName?.trim() || undefined;

    const [ledgerBuckets, spinBuckets] = await Promise.all([
      this.prisma.xpLedger.groupBy({
        by: ["userId", "ticketCode", "attendeeName"],
        _sum: { amountXp: true },
      }),
      this.prisma.userSpinHistory.groupBy({
        by: ["userId", "ticketCode", "attendeeName"],
        _count: { id: true },
      }),
    ]);

    const resolveBucketKey = (row: {
      userId: string | null;
      ticketCode: string | null;
      attendeeName: string;
    }): string => {
      if (row.userId) return `u:${row.userId}`;
      if (row.ticketCode) return `t:${row.ticketCode.trim().toUpperCase()}`;
      return `g:${row.attendeeName.trim().toLowerCase()}`;
    };

    const spinCountByKey = new Map<string, number>();
    for (const s of spinBuckets) {
      const key = resolveBucketKey(s);
      spinCountByKey.set(key, (spinCountByKey.get(key) ?? 0) + s._count.id);
    }

    const userIds = Array.from(
      new Set(
        ledgerBuckets
          .map((row) => row.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const userNamesById = new Map<string, string>();
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds }, deletedAt: null },
        select: { id: true, fullName: true },
      });
      for (const u of users) {
        userNamesById.set(u.id, u.fullName);
      }
    }

    const entriesMap = new Map<
      string,
      { key: string; attendeeName: string; totalXp: number; totalSpins: number }
    >();

    for (const row of ledgerBuckets) {
      const key = resolveBucketKey(row);
      const addedXp = row._sum.amountXp ?? 0;
      const canonicalName =
        (row.userId && userNamesById.get(row.userId)) || row.attendeeName;

      const existing = entriesMap.get(key);
      if (existing) {
        existing.totalXp += addedXp;
      } else {
        entriesMap.set(key, {
          key,
          attendeeName: canonicalName,
          totalXp: addedXp,
          totalSpins: spinCountByKey.get(key) ?? 0,
        });
      }
    }

    const sortedList = Array.from(entriesMap.values())
      .filter((entry) => entry.totalXp > 0 || entry.totalSpins > 0)
      .sort(
        (a, b) =>
          b.totalXp - a.totalXp ||
          b.totalSpins - a.totalSpins ||
          a.attendeeName.localeCompare(b.attendeeName, "vi"),
      );

    const currentIdentityKey = userId
      ? `u:${userId}`
      : rawTicket
        ? `t:${rawTicket}`
        : rawName
          ? `g:${rawName.toLowerCase()}`
          : null;

    const formatEntry = (
      item: {
        key: string;
        attendeeName: string;
        totalXp: number;
        totalSpins: number;
      },
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
        currentIdentityKey !== null && item.key === currentIdentityKey;
      const entry = formatEntry(item, idx + 1, isCurrent);
      if (isCurrent) currentEntry = entry;
      topEntries.push(entry);
    });

    if (!currentEntry && currentIdentityKey !== null) {
      const foundIdx = sortedList.findIndex(
        (item) => item.key === currentIdentityKey,
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

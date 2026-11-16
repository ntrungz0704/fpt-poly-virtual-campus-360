import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  PortalAttemptQuestionDto,
  PortalQuizAttemptDto,
  PortalQuizDetailDeliveryDto,
  PortalQuizQuestionDeliveryDto,
  PortalQuizSummaryDto,
  QuizAttemptQuestionResultDto,
  QuizAttemptStatus,
  SaveQuizProgressDto,
  SaveQuizProgressResponseDto,
  StudentQuizHistoryDetailDto,
  StudentQuizHistoryItemDto,
  StudentQuizHistoryListResponseDto,
  StudentQuizQuestionReviewDto,
  SubmitQuizAttemptResponseDto,
} from "@fpt-campus/shared";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { StudentQuizHistoryQueryDto } from "./dto/portal.dto";

@Injectable()
export class PortalQuizService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách các bài thi đã xuất bản (PUBLISHED) mà sinh viên đủ điều kiện tham gia
   */
  async getActiveQuizzes(userId: string): Promise<PortalQuizSummaryDto[]> {
    // 1. Lấy danh sách sự kiện mà người học đã đăng ký hợp lệ
    const participations = await this.prisma.eventParticipation.findMany({
      where: {
        userId,
        participationStatus: { not: "CANCELLED" },
      },
      select: { eventId: true },
    });
    const eligibleEventIds = participations.map((p) => p.eventId);

    // 2. Tìm các bài thi PUBLISHED (toàn trường hoặc thuộc sự kiện đã đăng ký)
    const quizzes = await this.prisma.quizConfiguration.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        OR: [
          { eventId: null },
          ...(eligibleEventIds.length > 0
            ? [{ eventId: { in: eligibleEventIds } }]
            : []),
        ],
      },
      include: {
        event: {
          select: { id: true, title: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    // 3. Map strictly sang Allowlist DTO
    return quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      eventId: q.eventId,
      eventName: q.event?.title ?? null,
      timeLimitMinutes: q.timeLimitMinutes,
      passingScore: q.passingScore,
      maxAttempts: q.maxAttempts,
      totalQuestions: q._count.questions,
      isShuffleQuestions: q.isShuffleQuestions,
      isShuffleOptions: q.isShuffleOptions,
      publishedAt: q.publishedAt ? q.publishedAt.toISOString() : null,
    }));
  }

  /**
   * Phát đề thi an toàn (Delivery) cho sinh viên:
   * TUYỆT ĐỐI KHÔNG TRẢ VỀ: correctIndex, explanation, questionBankItemId, AuditLog.
   */
  async getQuizDeliveryById(
    userId: string,
    quizId: string,
  ): Promise<PortalQuizDetailDeliveryDto> {
    // 1. Truy vấn đề thi đã xuất bản từ PostgreSQL
    const quiz = await this.prisma.quizConfiguration.findFirst({
      where: {
        id: quizId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        event: {
          select: { id: true, title: true },
        },
        questions: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            sortOrder: true,
            questionText: true,
            optionsJson: true,
            topic: true,
            difficulty: true,
            // KHÔNG SELECT: correctIndex, explanation, questionBankItemId
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException({
        code: "QUIZ_NOT_FOUND",
        message: "Bài thi không tồn tại hoặc chưa được phát hành.",
      });
    }

    // 2. Kiểm tra điều kiện tham dự nếu bài thi gắn với sự kiện cụ thể
    if (quiz.eventId) {
      const participation = await this.prisma.eventParticipation.findFirst({
        where: {
          userId,
          eventId: quiz.eventId,
          participationStatus: { not: "CANCELLED" },
        },
      });

      if (!participation) {
        throw new ForbiddenException({
          code: "FORBIDDEN_NOT_ELIGIBLE",
          message:
            "Bạn chưa đăng ký tham gia sự kiện tương ứng với bài thi này.",
        });
      }
    }

    // 3. Chuyển đổi câu hỏi sang Allowlist Response (loại bỏ 100% dữ liệu nhạy cảm)
    const questions: PortalQuizQuestionDeliveryDto[] = quiz.questions.map((q) => {
      const options = Array.isArray(q.optionsJson)
        ? (q.optionsJson as string[])
        : typeof q.optionsJson === "string"
          ? JSON.parse(q.optionsJson)
          : [];

      return {
        id: q.id,
        sortOrder: q.sortOrder,
        questionText: q.questionText,
        options,
        topic: q.topic,
        difficulty: q.difficulty,
      };
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      eventId: quiz.eventId,
      eventName: quiz.event?.title ?? null,
      timeLimitMinutes: quiz.timeLimitMinutes,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      totalQuestions: questions.length,
      isShuffleQuestions: quiz.isShuffleQuestions,
      isShuffleOptions: quiz.isShuffleOptions,
      publishedAt: quiz.publishedAt ? quiz.publishedAt.toISOString() : null,
      questions,
    };
  }

  // ============================================================================
  // Milestone M7.3: Quiz Attempt Engine Core Logic
  // ============================================================================

  /**
   * Bắt đầu hoặc tiếp tục (Resume) lượt thi:
   * - Nếu sinh viên đang có attempt IN_PROGRESS còn hạn -> Resume lại attempt đó.
   * - Nếu attempt cũ đã quá expiresAt -> Đánh dấu EXPIRED.
   * - Kiểm soát số lượt thi (maxAttempts) với advisory lock giao dịch chống race condition.
   * - Xáo trộn câu hỏi và các phương án nếu cấu hình isShuffleQuestions / isShuffleOptions = true.
   * - Lưu snapshot thứ tự hiển thị và mapping options vào PostgreSQL.
   */
  async startOrResumeAttempt(
    userId: string,
    quizConfigId: string,
  ): Promise<PortalQuizAttemptDto> {
    // 1. Kiểm tra cấu hình bài thi
    const quiz = await this.prisma.quizConfiguration.findFirst({
      where: {
        id: quizConfigId,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        event: {
          select: { id: true, title: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException({
        code: "QUIZ_NOT_FOUND",
        message: "Bài thi không tồn tại hoặc chưa được phát hành.",
      });
    }

    // 2. Kiểm tra điều kiện tham gia sự kiện (nếu bài thi gắn với sự kiện)
    if (quiz.eventId) {
      const participation = await this.prisma.eventParticipation.findFirst({
        where: {
          userId,
          eventId: quiz.eventId,
          participationStatus: { not: "CANCELLED" },
        },
      });

      if (!participation) {
        throw new ForbiddenException({
          code: "FORBIDDEN_NOT_ELIGIBLE",
          message:
            "Bạn chưa đăng ký tham gia sự kiện tương ứng với bài thi này.",
        });
      }
    }

    // 3. Thực hiện tạo hoặc resume attempt trong transaction nguyên tử
    const attemptId = await this.prisma.$transaction(async (tx) => {
      // Khóa advisory lock theo user và quiz để chống đồng thời vượt maxAttempts
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`quiz_attempt_${userId}_${quizConfigId}`}))`;

      // Kiểm tra attempt đang làm dở (IN_PROGRESS)
      const activeAttempt = await tx.quizConfigAttempt.findFirst({
        where: {
          userId,
          quizConfigId,
          status: "IN_PROGRESS",
        },
      });

      const now = new Date();
      if (activeAttempt) {
        if (now < activeAttempt.expiresAt) {
          // Còn hạn: Resume lượt thi hiện tại
          return activeAttempt.id;
        }
        // Quá hạn: Chuyển sang EXPIRED
        await tx.quizConfigAttempt.update({
          where: { id: activeAttempt.id },
          data: { status: "EXPIRED" },
        });
      }

      // Đếm số lượt đã tạo (bao gồm cả EXPIRED và SUBMITTED)
      const existingAttemptsCount = await tx.quizConfigAttempt.count({
        where: {
          userId,
          quizConfigId,
        },
      });

      if (existingAttemptsCount >= quiz.maxAttempts) {
        throw new BadRequestException({
          code: "MAX_ATTEMPTS_EXCEEDED",
          message: `Bạn đã sử dụng hết số lượt thi cho phép (${quiz.maxAttempts} lượt).`,
        });
      }

      // Lấy danh sách câu hỏi của bài thi
      const questions = await tx.quizConfigQuestion.findMany({
        where: { quizConfigId },
        orderBy: { sortOrder: "asc" },
      });

      if (questions.length === 0) {
        throw new BadRequestException({
          code: "QUIZ_EMPTY_QUESTIONS",
          message: "Bài thi chưa có câu hỏi nào để bắt đầu.",
        });
      }

      // Xáo trộn câu hỏi nếu cấu hình bật
      let orderedQuestions = [...questions];
      if (quiz.isShuffleQuestions) {
        orderedQuestions = this.shuffleArray(orderedQuestions);
      }

      const startedAt = now;
      const expiresAt = new Date(startedAt.getTime() + quiz.timeLimitMinutes * 60 * 1000);
      const attemptNumber = existingAttemptsCount + 1;

      // Tạo attempt mới
      const newAttempt = await tx.quizConfigAttempt.create({
        data: {
          userId,
          quizConfigId,
          attemptNumber,
          status: "IN_PROGRESS",
          startedAt,
          expiresAt,
        },
      });

      // Tạo các bản ghi câu hỏi và mapping xáo trộn phương án cho attempt
      for (let i = 0; i < orderedQuestions.length; i++) {
        const q = orderedQuestions[i];
        const rawOptions = Array.isArray(q.optionsJson)
          ? (q.optionsJson as string[])
          : typeof q.optionsJson === "string"
            ? JSON.parse(q.optionsJson)
            : [];

        let optionOrder = rawOptions.map((_: string, idx: number) => idx);
        if (quiz.isShuffleOptions) {
          optionOrder = this.shuffleArray(optionOrder);
        }

        await tx.quizConfigAttemptAnswer.create({
          data: {
            attemptId: newAttempt.id,
            quizConfigQuestionId: q.id,
            displayedOrder: i + 1,
            optionOrderJson: optionOrder,
            selectedOptionIndex: null,
          },
        });
      }

      return newAttempt.id;
    });

    return this.formatAttemptDto(attemptId, userId);
  }

  /**
   * Lấy chi tiết lượt thi theo attemptId:
   * - Bảo vệ quyền sở hữu (chỉ đúng sinh viên sở hữu mới được xem).
   * - Tự động cập nhật EXPIRED nếu đã quá hạn.
   * - Zero-leak: Tuyệt đối không trả về correctIndex, explanation.
   */
  async getAttemptById(
    userId: string,
    attemptId: string,
  ): Promise<PortalQuizAttemptDto> {
    return this.formatAttemptDto(attemptId, userId);
  }

  /**
   * Lưu tiến độ làm bài (Save Progress) - Milestone M7.3 (B01 Atomic Remediation):
   * - Thực thi trong Prisma Transaction nguyên tử với hàng rào khóa hàng (FOR UPDATE) chống race-condition.
   * - Tái kiểm tra trạng thái và thời hạn (expiresAt) tại thời điểm ghi DB.
   * - Nếu hết hạn: Cập nhật status = EXPIRED và commit transaction thành công trước khi ném HTTP 400.
   * - Validate toàn bộ batch answers trước khi ghi; một item lỗi rollback toàn bộ.
   * - Tuyệt đối không cho phép ghi sau khi lượt thi đã hết hạn hoặc đã chuyển EXPIRED.
   */
  async saveProgress(
    userId: string,
    attemptId: string,
    dto: SaveQuizProgressDto,
  ): Promise<SaveQuizProgressResponseDto> {
    const txResult = await this.prisma.$transaction(async (tx) => {
      // 1. Khóa hàng bản ghi attempt để tuần tự hóa các request ghi/hết hạn đồng thời
      await tx.$executeRaw`SELECT id FROM quiz_config_attempts WHERE id = ${attemptId}::uuid FOR UPDATE`;

      // 2. Lấy dữ liệu attempt cùng toàn bộ answers dưới bảo hộ khóa hàng
      const attempt = await tx.quizConfigAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: {
            include: {
              quizConfigQuestion: {
                select: {
                  id: true,
                  optionsJson: true,
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        throw new NotFoundException({
          code: "ATTEMPT_NOT_FOUND",
          message: "Lượt thi không tồn tại.",
        });
      }

      if (attempt.userId !== userId) {
        throw new ForbiddenException({
          code: "FORBIDDEN_ATTEMPT_OWNERSHIP",
          message: "Bạn không có quyền chỉnh sửa lượt thi của sinh viên khác.",
        });
      }

      // 3. Tái kiểm tra thời gian thực sau khi đã lấy được quyền ghi khóa hàng
      const now = new Date();
      if (attempt.status !== "IN_PROGRESS" || now >= attempt.expiresAt) {
        if (attempt.status === "IN_PROGRESS" && now >= attempt.expiresAt) {
          await tx.quizConfigAttempt.update({
            where: { id: attempt.id },
            data: { status: "EXPIRED" },
          });
        }
        // Trả về kết quả nội bộ để transaction commit thành công việc đổi trạng thái sang EXPIRED
        return {
          expiredOrClosed: true,
          data: null,
        };
      }

      // 4. Validate toàn bộ batch answers TRƯỚC KHI ghi bất kỳ bản ghi nào (Atomic Validation)
      for (const item of dto.answers) {
        const matchingAnswer = attempt.answers.find(
          (a) => a.quizConfigQuestionId === item.quizConfigQuestionId,
        );
        if (!matchingAnswer) {
          throw new BadRequestException({
            code: "INVALID_QUESTION_IN_ATTEMPT",
            message: `Câu hỏi ${item.quizConfigQuestionId} không thuộc lượt thi này.`,
          });
        }

        const rawOptions = Array.isArray(matchingAnswer.quizConfigQuestion.optionsJson)
          ? (matchingAnswer.quizConfigQuestion.optionsJson as string[])
          : typeof matchingAnswer.quizConfigQuestion.optionsJson === "string"
            ? JSON.parse(matchingAnswer.quizConfigQuestion.optionsJson)
            : [];

        if (
          item.selectedOptionIndex !== null &&
          (item.selectedOptionIndex < 0 || item.selectedOptionIndex >= rawOptions.length)
        ) {
          throw new BadRequestException({
            code: "INVALID_OPTION_INDEX",
            message: `Phương án chọn không hợp lệ cho câu hỏi ${item.quizConfigQuestionId}.`,
          });
        }
      }

      // 5. Toàn bộ batch đã hợp lệ 100%, thực hiện cập nhật nguyên tử trong transaction
      for (const item of dto.answers) {
        const matchingAnswer = attempt.answers.find(
          (a) => a.quizConfigQuestionId === item.quizConfigQuestionId,
        )!;

        await tx.quizConfigAttemptAnswer.update({
          where: { id: matchingAnswer.id },
          data: {
            selectedOptionIndex: item.selectedOptionIndex,
            answeredAt: now,
          },
        });
      }

      const totalQuestions = attempt.answers.length;
      const answeredQuestions = await tx.quizConfigAttemptAnswer.count({
        where: {
          attemptId,
          selectedOptionIndex: { not: null },
        },
      });

      const remainingSeconds = Math.max(
        0,
        Math.floor((attempt.expiresAt.getTime() - now.getTime()) / 1000),
      );

      return {
        expiredOrClosed: false,
        data: {
          attemptId: attempt.id,
          status: attempt.status,
          savedCount: dto.answers.length,
          answeredQuestions,
          totalQuestions,
          remainingSeconds,
          isExpired: false,
        },
      };
    });

    // 6. Nếu lượt thi đã hết hạn hoặc đóng, transaction đã commit thành công cập nhật EXPIRED, ném lỗi 400 ra ngoài
    if (txResult.expiredOrClosed) {
      throw new BadRequestException({
        code: "ATTEMPT_EXPIRED_OR_CLOSED",
        message: "Lượt thi đã hết thời gian hoặc không còn hiệu lực làm bài.",
      });
    }

    return txResult.data!;
  }

  /**
   * Nộp bài thi (Quiz Submission & Real-time Scoring Engine) - Milestone M7.4:
   * - Thực thi trong PostgreSQL transaction nguyên tử với khóa hàng FOR UPDATE trên attempt.
   * - Kiểm tra quyền sở hữu IDOR và tính hợp lệ thời gian máy chủ (now < expiresAt).
   * - Idempotency: Lượt thi đã SUBMITTED sẽ trả lại kết quả đã lưu (HTTP 200), không chấm lại và không cấp XP lần 2.
   * - Chấm điểm 100% phía Server từ snapshot câu hỏi và ánh xạ optionOrderJson.
   * - Công thức điểm: scorePercent = round(C / N * 100); passed = scorePercent >= passingScore.
   * - Công thức XP: baseXp = correctCount * 10; bonusXp = passed ? 20 : 0.
   * - Chính sách XP 1 lần duy nhất cho mỗi Quiz Configuration: bảo vệ bằng Idempotency Key unique constraint trên XpLedger.
   * - Cập nhật trạng thái SUBMITTED cùng bảng tổng hợp điểm và XP trong 1 transaction nguyên tử duy nhất.
   */
  async submitAttempt(
    userId: string,
    attemptId: string,
  ): Promise<{ data: SubmitQuizAttemptResponseDto; isRepeat: boolean }> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Khóa hàng bản ghi attempt
      await tx.$queryRaw`SELECT id FROM quiz_config_attempts WHERE id = ${attemptId}::uuid FOR UPDATE`;

      // 2. Tải chi tiết attempt, quizConfig, câu hỏi snapshot và câu trả lời
      const attempt = await tx.quizConfigAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quizConfig: {
            include: {
              questions: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          answers: {
            include: {
              quizConfigQuestion: true,
            },
            orderBy: { displayedOrder: "asc" },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new NotFoundException({
          code: "ATTEMPT_NOT_FOUND",
          message: "Lượt thi không tồn tại.",
        });
      }

      if (attempt.userId !== userId) {
        throw new ForbiddenException({
          code: "FORBIDDEN_ATTEMPT_OWNERSHIP",
          message: "Bạn không có quyền nộp lượt thi của sinh viên khác.",
        });
      }

      // Khóa advisory lock theo user và quiz để tuần tự hóa các attempt đồng thời của cùng một sinh viên
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`quiz_submit_${userId}_${attempt.quizConfigId}`}))`;

      // 3. Idempotent check: Nếu attempt đã SUBMITTED, trả ngay kết quả đã lưu mà không chấm lại hay cấp XP
      if (attempt.status === "SUBMITTED") {
        return {
          expired: false,
          isRepeat: true,
          data: this.formatSubmittedResult(attempt),
        };
      }

      // 4. Kiểm tra thời hạn làm bài (Server-side Timer Guard)
      const now = new Date();
      if (attempt.status === "EXPIRED" || now >= attempt.expiresAt) {
        if (attempt.status === "IN_PROGRESS") {
          await tx.quizConfigAttempt.update({
            where: { id: attempt.id },
            data: { status: "EXPIRED" },
          });
        }
        return {
          expired: true,
          data: null,
        };
      }

      if (attempt.status !== "IN_PROGRESS") {
        throw new BadRequestException({
          code: "INVALID_ATTEMPT_STATUS",
          message: "Lượt thi không ở trạng thái hợp lệ để nộp bài.",
        });
      }

      // 5. Chấm điểm phía Server (Server-side Scoring)
      const totalQuestions = attempt.answers.length;
      let answeredCount = 0;
      let correctCount = 0;
      const results: QuizAttemptQuestionResultDto[] = [];

      for (const ans of attempt.answers) {
        const q = ans.quizConfigQuestion;
        const optionOrder = Array.isArray(ans.optionOrderJson)
          ? (ans.optionOrderJson as number[])
          : typeof ans.optionOrderJson === "string"
            ? JSON.parse(ans.optionOrderJson)
            : [];

        const correctDisplayedIndex = optionOrder.indexOf(q.correctIndex);
        const selectedIdx = ans.selectedOptionIndex;
        const isAnswered = selectedIdx !== null && selectedIdx !== undefined;

        if (isAnswered) {
          answeredCount++;
        }

        const isCorrect = isAnswered && selectedIdx === correctDisplayedIndex;
        if (isCorrect) {
          correctCount++;
        }

        results.push({
          questionId: q.id,
          selectedOptionIndex: selectedIdx,
          correctOptionIndex: correctDisplayedIndex,
          isCorrect,
          explanation: q.explanation || null,
        });
      }

      const scorePercent =
        totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const passed = scorePercent >= attempt.quizConfig.passingScore;

      // 6. Tính toán điểm XP và Chính sách cấp XP 1 lần duy nhất (B01 Fix)
      const baseXp = correctCount * 10;
      const bonusXp = passed ? 20 : 0;
      const calculatedXp = baseXp + bonusXp;

      // Kiểm tra xem sinh viên đã tiêu thụ quyền nhận XP của Quiz Configuration này chưa
      const existingClaim = await tx.quizXpClaim.findUnique({
        where: {
          userId_quizConfigId: {
            userId,
            quizConfigId: attempt.quizConfigId,
          },
        },
      });

      let awardedXp = 0;
      let isXpAwarded = false;
      let xpReason = "ALREADY_AWARDED_OR_RETAKE";

      if (!existingClaim) {
        // LẦN ĐẦU TIÊN: Quyền nhận XP được sử dụng tại lần submit này
        if (calculatedXp > 0) {
          awardedXp = calculatedXp;
          isXpAwarded = true;
          xpReason = "FIRST_QUIZ_SUBMISSION";

          const idempotencyKey = `quiz:first-submit:${userId}:${attempt.quizConfigId}`;
          await tx.xpLedger.create({
            data: {
              userId,
              ticketCode: null,
              attendeeName:
                attempt.user.fullName || attempt.user.username || "Sinh viên",
              amountXp: awardedXp,
              source: "QUIZ_CONFIG_FIRST_SUBMIT",
              referenceId: attempt.quizConfigId,
              idempotencyKey,
              metadataJson: {
                attemptId: attempt.id,
                quizConfigId: attempt.quizConfigId,
                attemptNumber: attempt.attemptNumber,
                totalQuestions,
                correctCount,
                scorePercent,
                passed,
                baseXp,
                bonusXp,
                awardedXp,
              },
            },
          });
        } else {
          // Lần đầu đạt 0 điểm -> 0 XP nhưng quyền đã tiêu thụ
          awardedXp = 0;
          isXpAwarded = false;
          xpReason = "FIRST_SUBMIT_ZERO_XP";
        }

        // Đánh dấu quyền nhận XP đã tiêu thụ vĩnh viễn cho user + quiz này bằng Unique Constraint ở PostgreSQL
        await tx.quizXpClaim.create({
          data: {
            userId,
            quizConfigId: attempt.quizConfigId,
            attemptId: attempt.id,
            awardedXp,
          },
        });
      }

      // 7. Cập nhật attempt sang SUBMITTED kèm toàn bộ dữ liệu kết quả chấm
      const updatedAttempt = await tx.quizConfigAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          submittedAt: now,
          totalQuestions,
          answeredCount,
          correctCount,
          scorePercent,
          passed,
          baseXp,
          bonusXp,
          awardedXp,
        },
      });

      return {
        expired: false,
        isRepeat: false,
        data: {
          attemptId: updatedAttempt.id,
          status: updatedAttempt.status,
          submittedAt: updatedAttempt.submittedAt!.toISOString(),
          summary: {
            totalQuestions,
            answeredCount,
            correctCount,
            scorePercent,
            passingScore: attempt.quizConfig.passingScore,
            passed,
          },
          xp: {
            baseXp,
            bonusXp,
            awardedXp,
            isXpAwarded,
            reason: xpReason,
          },
          results,
        },
      };
    });

    if (result.expired) {
      throw new BadRequestException({
        code: "ATTEMPT_EXPIRED",
        message: "Lượt thi đã hết thời gian hoặc không còn hiệu lực làm bài.",
      });
    }

    return {
      data: result.data!,
      isRepeat: result.isRepeat ?? false,
    };
  }

  /**
   * Helper định dạng kết quả nộp bài đã lưu (Idempotent / Cached View)
   */
  private formatSubmittedResult(attempt: {
    id: string;
    status: QuizAttemptStatus;
    submittedAt: Date | null;
    totalQuestions?: number | null;
    answeredCount?: number | null;
    correctCount?: number | null;
    scorePercent?: number | null;
    passed?: boolean | null;
    baseXp?: number | null;
    bonusXp?: number | null;
    awardedXp?: number | null;
    quizConfig?: { passingScore: number };
    answers?: Array<{
      selectedOptionIndex: number | null;
      optionOrderJson: unknown;
      quizConfigQuestion: {
        id: string;
        correctIndex: number;
        explanation?: string | null;
      };
    }>;
  }): SubmitQuizAttemptResponseDto {
    const results: QuizAttemptQuestionResultDto[] = (attempt.answers || []).map(
      (ans) => {
        const q = ans.quizConfigQuestion;
        const optionOrder = Array.isArray(ans.optionOrderJson)
          ? (ans.optionOrderJson as number[])
          : typeof ans.optionOrderJson === "string"
            ? (JSON.parse(ans.optionOrderJson) as number[])
            : [];

        const correctDisplayedIndex = optionOrder.indexOf(q.correctIndex);
        const selectedIdx = ans.selectedOptionIndex;
        const isCorrect =
          selectedIdx !== null &&
          selectedIdx !== undefined &&
          selectedIdx === correctDisplayedIndex;

        return {
          questionId: q.id,
          selectedOptionIndex: selectedIdx,
          correctOptionIndex: correctDisplayedIndex,
          isCorrect,
          explanation: q.explanation || null,
        };
      },
    );

    const isXpAwarded = (attempt.awardedXp ?? 0) > 0;
    const xpReason = isXpAwarded
      ? "FIRST_QUIZ_SUBMISSION"
      : "ALREADY_AWARDED_OR_RETAKE";

    return {
      attemptId: attempt.id,
      status: attempt.status,
      submittedAt: attempt.submittedAt
        ? attempt.submittedAt.toISOString()
        : new Date().toISOString(),
      summary: {
        totalQuestions: attempt.totalQuestions ?? (attempt.answers?.length ?? 0),
        answeredCount: attempt.answeredCount ?? 0,
        correctCount: attempt.correctCount ?? 0,
        scorePercent: attempt.scorePercent ?? 0,
        passingScore: attempt.quizConfig?.passingScore ?? 70,
        passed: attempt.passed ?? false,
      },
      xp: {
        baseXp: attempt.baseXp ?? 0,
        bonusXp: attempt.bonusXp ?? 0,
        awardedXp: attempt.awardedXp ?? 0,
        isXpAwarded,
        reason: xpReason,
      },
      results,
    };
  }

  /**
   * Helper định dạng dữ liệu lượt thi an toàn (Allowlist / Zero Leak)
   */
  private async formatAttemptDto(
    attemptId: string,
    userId: string,
  ): Promise<PortalQuizAttemptDto> {
    const attempt = await this.prisma.quizConfigAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizConfig: {
          select: {
            id: true,
            title: true,
            timeLimitMinutes: true,
            maxAttempts: true,
          },
        },
        answers: {
          orderBy: { displayedOrder: "asc" },
          include: {
            quizConfigQuestion: {
              select: {
                id: true,
                questionText: true,
                optionsJson: true,
                topic: true,
                difficulty: true,
                // TUYỆT ĐỐI KHÔNG SELECT: correctIndex, explanation, questionBankItemId
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException({
        code: "ATTEMPT_NOT_FOUND",
        message: "Lượt thi không tồn tại.",
      });
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException({
        code: "FORBIDDEN_ATTEMPT_OWNERSHIP",
        message: "Bạn không có quyền truy cập lượt thi của sinh viên khác.",
      });
    }

    const now = new Date();
    let currentStatus = attempt.status;
    if (attempt.status === "IN_PROGRESS" && now >= attempt.expiresAt) {
      currentStatus = "EXPIRED";
      await this.prisma.quizConfigAttempt.update({
        where: { id: attempt.id },
        data: { status: "EXPIRED" },
      });
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((attempt.expiresAt.getTime() - now.getTime()) / 1000),
    );

    let answeredCount = 0;
    const questions: PortalAttemptQuestionDto[] = attempt.answers.map((ans) => {
      if (ans.selectedOptionIndex !== null) {
        answeredCount++;
      }

      const q = ans.quizConfigQuestion;
      const rawOptions = Array.isArray(q.optionsJson)
        ? (q.optionsJson as string[])
        : typeof q.optionsJson === "string"
          ? JSON.parse(q.optionsJson)
          : [];

      const optionOrder = Array.isArray(ans.optionOrderJson)
        ? (ans.optionOrderJson as number[])
        : [];

      // Sắp xếp các lựa chọn theo đúng thứ tự hiển thị đã được chốt cho attempt
      const displayedOptions =
        optionOrder.length === rawOptions.length
          ? optionOrder.map((origIdx) => rawOptions[origIdx])
          : rawOptions;

      return {
        id: q.id,
        displayedOrder: ans.displayedOrder,
        questionText: q.questionText,
        options: displayedOptions,
        topic: q.topic,
        difficulty: q.difficulty,
        selectedOptionIndex: ans.selectedOptionIndex,
      };
    });

    return {
      id: attempt.id,
      quizConfigId: attempt.quizConfigId,
      quizTitle: attempt.quizConfig.title,
      attemptNumber: attempt.attemptNumber,
      maxAttempts: attempt.quizConfig.maxAttempts,
      status: currentStatus,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      serverTime: now.toISOString(),
      timeLimitMinutes: attempt.quizConfig.timeLimitMinutes,
      remainingSeconds: currentStatus === "IN_PROGRESS" ? remainingSeconds : 0,
      totalQuestions: questions.length,
      answeredQuestions: answeredCount,
      questions,
    };
  }

  /**
   * Helper xáo trộn mảng thuật toán Fisher-Yates
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * M7.5-A: Lấy lịch sử các lượt thi của sinh viên hiện tại
   * - Phân trang server-side, lọc theo bài thi, trạng thái hoặc kết quả PASS/FAIL.
   * - Phân biệt lượt thi đầu tiên và lượt thi lại (isRetake: attemptNumber > 1).
   * - Không làm lộ dữ liệu của sinh viên khác (lọc cứng theo userId từ token).
   * - Không biến đổi attempt chưa submit thành đã hoàn tất.
   */
  async getStudentQuizHistory(
    userId: string,
    query: StudentQuizHistoryQueryDto,
  ): Promise<StudentQuizHistoryListResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(Math.max(1, query.limit || 10), 50);
    const skip = (page - 1) * limit;

    // Tự động chuẩn hóa các attempt quá hạn của chính sinh viên này
    const now = new Date();
    await this.prisma.quizConfigAttempt.updateMany({
      where: {
        userId,
        status: "IN_PROGRESS",
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    const where: Prisma.QuizConfigAttemptWhereInput = { userId };

    if (query.quizConfigId) {
      where.quizConfigId = query.quizConfigId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.passed !== undefined) {
      where.passed = query.passed;
    }

    const [total, attempts] = await Promise.all([
      this.prisma.quizConfigAttempt.count({ where }),
      this.prisma.quizConfigAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
        include: {
          quizConfig: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              maxAttempts: true,
            },
          },
        },
      }),
    ]);

    const items: StudentQuizHistoryItemDto[] = attempts.map((att) => {
      const isRetake = att.attemptNumber > 1;
      const isXpAwarded = (att.awardedXp ?? 0) > 0;
      let xpReason: string | null = null;
      if (att.status === "SUBMITTED" && att.awardedXp !== null) {
        if (att.awardedXp > 0) {
          xpReason = "FIRST_QUIZ_SUBMISSION";
        } else if (isRetake) {
          xpReason = "ALREADY_AWARDED_OR_RETAKE";
        } else {
          xpReason = "FIRST_SUBMIT_ZERO_XP";
        }
      }

      return {
        id: att.id,
        quizConfigId: att.quizConfigId,
        quizTitle: att.quizConfig.title,
        attemptNumber: att.attemptNumber,
        maxAttempts: att.quizConfig.maxAttempts,
        isRetake,
        status: att.status,
        startedAt: att.startedAt.toISOString(),
        expiresAt: att.expiresAt.toISOString(),
        submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
        totalQuestions: att.totalQuestions ?? 0,
        answeredCount: att.answeredCount ?? 0,
        correctCount: att.correctCount,
        scorePercent: att.scorePercent,
        passingScore: att.quizConfig.passingScore,
        passed: att.passed,
        baseXp: att.baseXp,
        bonusXp: att.bonusXp,
        awardedXp: att.awardedXp,
        isXpAwarded,
        xpReason,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * M7.5-B: Xem chi tiết kết quả lượt thi của sinh viên
   * - Bảo vệ quyền sở hữu tuyệt đối chống IDOR (chỉ sinh viên sở hữu mới được xem).
   * - Không phát sinh tính điểm hoặc cấp thêm XP khi đọc dữ liệu.
   * - Zero-leak: Nếu attempt chưa SUBMITTED (VD: EXPIRED), tuyệt đối KHÔNG trả về đáp án đúng/explanation.
   * - Nếu attempt đã SUBMITTED, trả về chi tiết đáp án sinh viên đã chọn kèm đáp án đúng và giải thích.
   */
  async getStudentQuizHistoryDetail(
    userId: string,
    attemptId: string,
  ): Promise<StudentQuizHistoryDetailDto> {
    const attempt = await this.prisma.quizConfigAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quizConfig: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            maxAttempts: true,
          },
        },
        answers: {
          orderBy: { displayedOrder: "asc" },
          include: {
            quizConfigQuestion: {
              select: {
                id: true,
                questionText: true,
                optionsJson: true,
                correctIndex: true,
                explanation: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException({
        code: "ATTEMPT_NOT_FOUND",
        message: "Lượt thi không tồn tại.",
      });
    }

    // IDOR Protection
    if (attempt.userId !== userId) {
      throw new ForbiddenException({
        code: "FORBIDDEN_ATTEMPT_OWNERSHIP",
        message: "Bạn không có quyền xem kết quả lượt thi của sinh viên khác.",
      });
    }

    const isRetake = attempt.attemptNumber > 1;
    const isXpAwarded = (attempt.awardedXp ?? 0) > 0;
    let xpReason: string | null = null;
    if (attempt.status === "SUBMITTED" && attempt.awardedXp !== null) {
      if (attempt.awardedXp > 0) {
        xpReason = "FIRST_QUIZ_SUBMISSION";
      } else if (isRetake) {
        xpReason = "ALREADY_AWARDED_OR_RETAKE";
      } else {
        xpReason = "FIRST_SUBMIT_ZERO_XP";
      }
    }

    const baseDto: StudentQuizHistoryItemDto = {
      id: attempt.id,
      quizConfigId: attempt.quizConfigId,
      quizTitle: attempt.quizConfig.title,
      attemptNumber: attempt.attemptNumber,
      maxAttempts: attempt.quizConfig.maxAttempts,
      isRetake,
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
      totalQuestions: attempt.totalQuestions ?? attempt.answers.length,
      answeredCount:
        attempt.answeredCount ??
        attempt.answers.filter((a) => a.selectedOptionIndex !== null).length,
      correctCount: attempt.correctCount,
      scorePercent: attempt.scorePercent,
      passingScore: attempt.quizConfig.passingScore,
      passed: attempt.passed,
      baseXp: attempt.baseXp,
      bonusXp: attempt.bonusXp,
      awardedXp: attempt.awardedXp,
      isXpAwarded,
      xpReason,
    };

    // Nếu bài thi chưa nộp (IN_PROGRESS hoặc EXPIRED) -> không trả về đáp án đúng
    if (attempt.status !== "SUBMITTED") {
      return {
        ...baseDto,
        summary: {
          totalQuestions: baseDto.totalQuestions,
          answeredCount: baseDto.answeredCount,
          correctCount: baseDto.correctCount ?? 0,
          scorePercent: baseDto.scorePercent ?? 0,
          passingScore: baseDto.passingScore,
          passed: baseDto.passed ?? false,
        },
        xp: {
          baseXp: baseDto.baseXp ?? 0,
          bonusXp: baseDto.bonusXp ?? 0,
          awardedXp: baseDto.awardedXp ?? 0,
          isXpAwarded: false,
          reason: "ATTEMPT_NOT_SUBMITTED",
        },
        results: [],
      };
    }

    // Đã SUBMITTED: Trả về kết quả câu hỏi chi tiết
    const results: StudentQuizQuestionReviewDto[] = attempt.answers.map((ans) => {
      const q = ans.quizConfigQuestion;
      const rawOptions = Array.isArray(q.optionsJson)
        ? (q.optionsJson as string[])
        : typeof q.optionsJson === "string"
          ? JSON.parse(q.optionsJson)
          : [];

      const optionOrder = Array.isArray(ans.optionOrderJson)
        ? (ans.optionOrderJson as number[])
        : [];

      const displayedOptions =
        optionOrder.length === rawOptions.length
          ? optionOrder.map((origIdx) => rawOptions[origIdx])
          : rawOptions;

      const correctDisplayedIndex = optionOrder.indexOf(q.correctIndex);
      const selectedIdx = ans.selectedOptionIndex;
      const isCorrect =
        selectedIdx !== null && selectedIdx === correctDisplayedIndex;

      return {
        questionId: q.id,
        displayedOrder: ans.displayedOrder,
        questionText: q.questionText,
        options: displayedOptions,
        selectedOptionIndex: selectedIdx,
        correctOptionIndex: correctDisplayedIndex,
        isCorrect,
        explanation: q.explanation || null,
      };
    });

    return {
      ...baseDto,
      summary: {
        totalQuestions: baseDto.totalQuestions,
        answeredCount: baseDto.answeredCount,
        correctCount: baseDto.correctCount ?? 0,
        scorePercent: baseDto.scorePercent ?? 0,
        passingScore: baseDto.passingScore,
        passed: baseDto.passed ?? false,
      },
      xp: {
        baseXp: baseDto.baseXp ?? 0,
        bonusXp: baseDto.bonusXp ?? 0,
        awardedXp: baseDto.awardedXp ?? 0,
        isXpAwarded,
        reason: xpReason ?? "QUIZ_SUBMITTED",
      },
      results,
    };
  }
}

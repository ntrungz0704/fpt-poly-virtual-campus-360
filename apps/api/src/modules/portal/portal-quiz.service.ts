import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  PortalQuizDetailDeliveryDto,
  PortalQuizQuestionDeliveryDto,
  PortalQuizSummaryDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";

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
}

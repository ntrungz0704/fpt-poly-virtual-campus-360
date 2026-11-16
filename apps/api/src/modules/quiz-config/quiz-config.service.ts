import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  AdminQuizAttemptListResponseDto,
  AdminQuizAttemptMonitoringDto,
  AdminQuizResultDetailDto,
  AdminQuizResultItemDto,
  AdminQuizResultListResponseDto,
  AdminQuizResultSummaryDto,
  QuestionDifficulty,
  QuizAttemptStatus,
  QuizConfigListResponseDto,
  QuizConfigurationDto,
  QuizConfigQuestionDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import type {
  AdminQuizAttemptQueryDto,
  AdminQuizResultQueryDto,
  CreateQuizConfigDto,
  ManageQuizQuestionsDto,
  QuizConfigQueryDto,
  UpdateQuizConfigDto,
} from "./dto/quiz-config.dto";

@Injectable()
export class QuizConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private mapQuestionDto(q: {
    id: string;
    quizConfigId: string;
    questionBankItemId: string | null;
    sortOrder: number;
    questionText: string;
    optionsJson: unknown;
    correctIndex: number;
    explanation: string | null;
    topic: string;
    difficulty: QuestionDifficulty;
    createdAt: Date;
    updatedAt: Date;
  }): QuizConfigQuestionDto {
    return {
      id: q.id,
      quizConfigId: q.quizConfigId,
      questionBankItemId: q.questionBankItemId,
      sortOrder: q.sortOrder,
      questionText: q.questionText,
      options: Array.isArray(q.optionsJson) ? (q.optionsJson as string[]) : [],
      correctIndex: q.correctIndex,
      explanation: q.explanation || "",
      topic: q.topic,
      difficulty: q.difficulty,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    };
  }

  private mapConfigDto(
    c: {
      id: string;
      title: string;
      description: string | null;
      eventId: string | null;
      timeLimitMinutes: number;
      passingScore: number;
      maxAttempts: number;
      isShuffleQuestions: boolean;
      isShuffleOptions: boolean;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      createdById: string | null;
      updatedById: string | null;
      publishedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      event?: { title: string } | null;
      createdBy?: { fullName: string; username: string | null } | null;
      updatedBy?: { fullName: string; username: string | null } | null;
      questions?: Array<{
        id: string;
        quizConfigId: string;
        questionBankItemId: string | null;
        sortOrder: number;
        questionText: string;
        optionsJson: unknown;
        correctIndex: number;
        explanation: string | null;
        topic: string;
        difficulty: QuestionDifficulty;
        createdAt: Date;
        updatedAt: Date;
      }>;
      _count?: { questions: number };
    },
    includeQuestions = true,
  ): QuizConfigurationDto {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      eventId: c.eventId,
      eventTitle: c.event?.title ?? null,
      timeLimitMinutes: c.timeLimitMinutes,
      passingScore: c.passingScore,
      maxAttempts: c.maxAttempts,
      isShuffleQuestions: c.isShuffleQuestions,
      isShuffleOptions: c.isShuffleOptions,
      status: c.status,
      questionsCount: c._count?.questions ?? (c.questions?.length || 0),
      questions: includeQuestions && c.questions
        ? c.questions.map((q) => this.mapQuestionDto(q))
        : undefined,
      createdById: c.createdById,
      creatorName: c.createdBy ? c.createdBy.fullName || c.createdBy.username : null,
      updatedById: c.updatedById,
      updaterName: c.updatedBy ? c.updatedBy.fullName || c.updatedBy.username : null,
      publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async listConfigurations(query: QuizConfigQueryDto): Promise<QuizConfigListResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { deletedAt: null };

    if (query.status) {
      where.status = query.status;
    }

    if (query.eventId) {
      where.eventId = query.eventId;
    }

    if (query.q) {
      const kw = query.q.trim();
      where.OR = [
        { title: { contains: kw, mode: "insensitive" } },
        { description: { contains: kw, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.quizConfiguration.count({ where }),
      this.prisma.quizConfiguration.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          event: { select: { title: true } },
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
          _count: { select: { questions: true } },
        },
      }),
    ]);

    return {
      items: items.map((item) => this.mapConfigDto(item, false)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getConfigurationById(id: string): Promise<QuizConfigurationDto> {
    const item = await this.prisma.quizConfiguration.findFirst({
      where: { id, deletedAt: null },
      include: {
        event: { select: { title: true } },
        createdBy: { select: { fullName: true, username: true } },
        updatedBy: { select: { fullName: true, username: true } },
        questions: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
    }

    return this.mapConfigDto(item, true);
  }

  async createConfiguration(
    dto: CreateQuizConfigDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuizConfigurationDto> {
    // 1. Validate event if provided
    if (dto.eventId) {
      const event = await this.prisma.openDayEvent.findFirst({
        where: { id: dto.eventId, deletedAt: null },
      });
      if (!event) {
        throw new BadRequestException("Sự kiện liên kết không tồn tại hoặc đã bị xóa.");
      }
    }

    // 2. Validate Question Bank items if provided
    const questionIds = dto.questionIds || [];
    let validatedQuestions: Array<{
      id: string;
      questionText: string;
      optionsJson: unknown;
      correctIndex: number;
      explanation: string | null;
      topic: string;
      difficulty: QuestionDifficulty;
    }> = [];

    if (questionIds.length > 0) {
      const foundQuestions = await this.prisma.questionBankItem.findMany({
        where: {
          id: { in: questionIds },
          deletedAt: null,
          status: "APPROVED",
        },
      });

      if (foundQuestions.length !== questionIds.length) {
        throw new BadRequestException(
          "Một hoặc nhiều câu hỏi không tồn tại, đã bị xóa hoặc chưa được phê duyệt.",
        );
      }

      const qMap = new Map(foundQuestions.map((q) => [q.id, q]));
      validatedQuestions = questionIds.map((qId) => qMap.get(qId)!);
    }

    // 3. Create inside transaction
    const createdConfig = await this.prisma.$transaction(async (tx) => {
      const config = await tx.quizConfiguration.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          eventId: dto.eventId || null,
          timeLimitMinutes: dto.timeLimitMinutes ?? 15,
          passingScore: dto.passingScore ?? 70,
          maxAttempts: dto.maxAttempts ?? 3,
          isShuffleQuestions: dto.isShuffleQuestions ?? true,
          isShuffleOptions: dto.isShuffleOptions ?? true,
          status: "DRAFT",
          createdById: user.id,
          questions: {
            create: validatedQuestions.map((q, idx) => ({
              questionBankItemId: q.id,
              sortOrder: idx,
              questionText: q.questionText,
              optionsJson: q.optionsJson as never,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              topic: q.topic,
              difficulty: q.difficulty,
            })),
          },
        },
        include: {
          event: { select: { title: true } },
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
          questions: { orderBy: { sortOrder: "asc" } },
        },
      });

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "CREATE_QUIZ_CONFIG",
        resourceType: "QUIZ_CONFIGURATION",
        resourceId: config.id,
        diffJson: {
          title: config.title,
          status: config.status,
          questionsCount: validatedQuestions.length,
        },
        ipAddress,
        tx,
      });

      return config;
    });

    return this.mapConfigDto(createdConfig, true);
  }

  async updateConfiguration(
    id: string,
    dto: UpdateQuizConfigDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuizConfigurationDto> {
    const existing = await this.prisma.quizConfiguration.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
    }

    if (existing.status !== "DRAFT") {
      throw new BadRequestException(
        `Không thể chỉnh sửa cấu hình bài thi ở trạng thái ${existing.status}. Cấu hình đã xuất bản (PUBLISHED) hoặc đã lưu trữ (ARCHIVED) là bất biến để đảm bảo tính toàn vẹn cho phòng thi và học viên.`,
      );
    }

    if (dto.eventId) {
      const event = await this.prisma.openDayEvent.findFirst({
        where: { id: dto.eventId, deletedAt: null },
      });
      if (!event) {
        throw new BadRequestException("Sự kiện liên kết không tồn tại hoặc đã bị xóa.");
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic conditional update: strictly requires status to be DRAFT and not deleted
      const updateResult = await tx.quizConfiguration.updateMany({
        where: { id, status: "DRAFT", deletedAt: null },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          description: dto.description !== undefined ? dto.description.trim() || null : undefined,
          eventId: dto.eventId !== undefined ? dto.eventId : undefined,
          timeLimitMinutes: dto.timeLimitMinutes,
          passingScore: dto.passingScore,
          maxAttempts: dto.maxAttempts,
          isShuffleQuestions: dto.isShuffleQuestions,
          isShuffleOptions: dto.isShuffleOptions,
          updatedById: user.id,
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.quizConfiguration.findFirst({
          where: { id, deletedAt: null },
        });
        if (!current) {
          throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
        }
        throw new BadRequestException(
          `Không thể chỉnh sửa cấu hình bài thi ở trạng thái ${current.status}. Cấu hình đã xuất bản (PUBLISHED) hoặc đã lưu trữ (ARCHIVED) là bất biến để đảm bảo tính toàn vẹn cho phòng thi và học viên.`,
        );
      }

      const config = await tx.quizConfiguration.findUniqueOrThrow({
        where: { id },
        include: {
          event: { select: { title: true } },
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
          questions: { orderBy: { sortOrder: "asc" } },
        },
      });

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "UPDATE_QUIZ_CONFIG",
        resourceType: "QUIZ_CONFIGURATION",
        resourceId: id,
        diffJson: dto as Record<string, unknown>,
        ipAddress,
        tx,
      });

      return config;
    });

    return this.mapConfigDto(updated, true);
  }

  async manageQuestions(
    id: string,
    dto: ManageQuizQuestionsDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuizConfigurationDto> {
    const quiz = await this.prisma.quizConfiguration.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
    }

    if (quiz.status !== "DRAFT") {
      throw new BadRequestException(
        `Không thể chỉnh sửa danh sách câu hỏi khi bài thi ở trạng thái ${quiz.status}. Chỉ có thể cập nhật câu hỏi khi bài thi ở trạng thái BẢN NHÁP (DRAFT).`,
      );
    }

    // Validate that every questionId exists, is not deleted, and is APPROVED
    const foundQuestions = await this.prisma.questionBankItem.findMany({
      where: {
        id: { in: dto.questionIds },
        deletedAt: null,
        status: "APPROVED",
      },
    });

    if (foundQuestions.length !== dto.questionIds.length) {
      throw new BadRequestException(
        "Một hoặc nhiều câu hỏi không tồn tại, đã bị xóa hoặc chưa được phê duyệt.",
      );
    }

    const qMap = new Map(foundQuestions.map((q) => [q.id, q]));
    const orderedQuestions = dto.questionIds.map((qId) => qMap.get(qId)!);

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic lock: verify status is DRAFT and touch config in a single atomic conditional statement
      const touchResult = await tx.quizConfiguration.updateMany({
        where: { id, status: "DRAFT", deletedAt: null },
        data: { updatedById: user.id },
      });

      if (touchResult.count === 0) {
        const current = await tx.quizConfiguration.findFirst({
          where: { id, deletedAt: null },
        });
        if (!current) {
          throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
        }
        throw new BadRequestException(
          `Không thể chỉnh sửa danh sách câu hỏi khi bài thi ở trạng thái ${current.status}. Chỉ có thể cập nhật câu hỏi khi bài thi ở trạng thái BẢN NHÁP (DRAFT).`,
        );
      }

      // 2. Remove existing questions
      await tx.quizConfigQuestion.deleteMany({
        where: { quizConfigId: id },
      });

      // 3. Create new snapshots in exact ordered sequence
      await tx.quizConfigQuestion.createMany({
        data: orderedQuestions.map((q, idx) => ({
          quizConfigId: id,
          questionBankItemId: q.id,
          sortOrder: idx,
          questionText: q.questionText,
          optionsJson: q.optionsJson as never,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.topic,
          difficulty: q.difficulty,
        })),
      });

      // 4. Fetch updated config
      const config = await tx.quizConfiguration.findUniqueOrThrow({
        where: { id },
        include: {
          event: { select: { title: true } },
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
          questions: { orderBy: { sortOrder: "asc" } },
        },
      });

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "MANAGE_QUIZ_QUESTIONS",
        resourceType: "QUIZ_CONFIGURATION",
        resourceId: id,
        diffJson: {
          questionsCount: orderedQuestions.length,
          questionIds: dto.questionIds,
        },
        ipAddress,
        tx,
      });

      return config;
    });

    return this.mapConfigDto(updated, true);
  }

  async publishConfiguration(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuizConfigurationDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Check questions count first inside transaction
      const questionsCount = await tx.quizConfigQuestion.count({
        where: { quizConfigId: id },
      });

      if (questionsCount === 0) {
        throw new BadRequestException("Không thể xuất bản bài thi chưa có câu hỏi nào.");
      }

      // 2. Atomic publish: conditional update strictly requiring status DRAFT
      const publishResult = await tx.quizConfiguration.updateMany({
        where: { id, status: "DRAFT", deletedAt: null },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          updatedById: user.id,
        },
      });

      if (publishResult.count === 0) {
        const current = await tx.quizConfiguration.findFirst({
          where: { id, deletedAt: null },
        });
        if (!current) {
          throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
        }
        throw new BadRequestException(
          `Không thể xuất bản bài thi ở trạng thái ${current.status}. Chỉ có thể xuất bản bài thi ở trạng thái BẢN NHÁP (DRAFT).`,
        );
      }

      const config = await tx.quizConfiguration.findUniqueOrThrow({
        where: { id },
        include: {
          event: { select: { title: true } },
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
          questions: { orderBy: { sortOrder: "asc" } },
        },
      });

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "PUBLISH_QUIZ_CONFIG",
        resourceType: "QUIZ_CONFIGURATION",
        resourceId: id,
        diffJson: {
          status: "PUBLISHED",
          publishedAt: config.publishedAt,
          questionsCount,
        },
        ipAddress,
        tx,
      });

      return config;
    });

    return this.mapConfigDto(updated, true);
  }

  async archiveConfiguration(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuizConfigurationDto> {
    const quiz = await this.prisma.quizConfiguration.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const config = await tx.quizConfiguration.update({
        where: { id },
        data: {
          status: "ARCHIVED",
          updatedById: user.id,
        },
        include: {
          event: { select: { title: true } },
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
          questions: { orderBy: { sortOrder: "asc" } },
        },
      });

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "ARCHIVE_QUIZ_CONFIG",
        resourceType: "QUIZ_CONFIGURATION",
        resourceId: id,
        diffJson: { status: "ARCHIVED" },
        ipAddress,
        tx,
      });

      return config;
    });

    return this.mapConfigDto(updated, true);
  }

  async deleteConfiguration(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const quiz = await this.prisma.quizConfiguration.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy cấu hình bài thi với ID: ${id}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.quizConfiguration.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedById: user.id,
        },
      });

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "DELETE_QUIZ_CONFIG",
        resourceType: "QUIZ_CONFIGURATION",
        resourceId: id,
        diffJson: { deletedAt: new Date() },
        ipAddress,
        tx,
      });
    });

    return {
      success: true,
      message: `Đã xóa cấu hình bài thi "${quiz.title}" thành công.`,
    };
  }

  /**
   * Giám sát phòng thi (Exam Room Monitoring) - M7.3 (B03)
   * Chế độ Read-only: Xem danh sách lượt thi của sinh viên, tiến độ câu hỏi, trạng thái và thời gian.
   */
  async getAttemptsMonitoring(
    query: AdminQuizAttemptQueryDto,
  ): Promise<AdminQuizAttemptListResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const now = new Date();

    // B03.1 Remediation: Chuẩn hóa toàn bộ các attempt IN_PROGRESS đã quá hạn (expiresAt <= now)
    // sang EXPIRED trên PostgreSQL trước khi truy vấn, đảm bảo bộ lọc status và pagination luôn nhất quán 100%!
    await this.prisma.quizConfigAttempt.updateMany({
      where: {
        status: "IN_PROGRESS",
        expiresAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    const where: Prisma.QuizConfigAttemptWhereInput = {};

    if (query.quizConfigId) {
      where.quizConfigId = query.quizConfigId;
    }

    // B03.1 Remediation: Lọc trạng thái kết hợp mốc thời gian now, bảo đảm 100% nhất quán
    // kể cả khi attempt vừa chạm mốc hết hạn giữa lúc updateMany và truy vấn findMany.
    if (query.status === "IN_PROGRESS") {
      where.status = "IN_PROGRESS";
      where.expiresAt = { gt: now };
    } else if (query.status === "EXPIRED") {
      where.OR = [
        { status: "EXPIRED" },
        {
          status: "IN_PROGRESS",
          expiresAt: { lte: now },
        },
      ];
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.user = {
        OR: [
          { fullName: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { studentCode: { contains: s, mode: "insensitive" } },
        ],
      };
    }

    const [total, attempts] = await Promise.all([
      this.prisma.quizConfigAttempt.count({ where }),
      this.prisma.quizConfigAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              studentCode: true,
              avatarUrl: true,
            },
          },
          quizConfig: {
            select: {
              id: true,
              title: true,
            },
          },
          answers: {
            select: {
              selectedOptionIndex: true,
            },
          },
        },
      }),
    ]);

    const items: AdminQuizAttemptMonitoringDto[] = attempts.map((att) => {
      const answeredCount = att.answers.filter(
        (a) => a.selectedOptionIndex !== null,
      ).length;
      const totalQuestions = att.answers.length;
      const isExpired = att.status === "EXPIRED" || (att.status === "IN_PROGRESS" && now >= att.expiresAt);
      const effectiveStatus: QuizAttemptStatus = isExpired ? "EXPIRED" : att.status;
      const remainingSeconds =
        effectiveStatus === "IN_PROGRESS"
          ? Math.max(0, Math.floor((att.expiresAt.getTime() - now.getTime()) / 1000))
          : 0;

      return {
        id: att.id,
        quizConfigId: att.quizConfigId,
        quizTitle: att.quizConfig.title,
        student: {
          id: att.user.id,
          fullName: att.user.fullName,
          email: att.user.email ?? "",
          studentCode: att.user.studentCode ?? null,
          avatarUrl: att.user.avatarUrl ?? null,
        },
        attemptNumber: att.attemptNumber,
        status: effectiveStatus,
        startedAt: att.startedAt.toISOString(),
        expiresAt: att.expiresAt.toISOString(),
        submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
        totalQuestions,
        answeredCount,
        remainingSeconds,
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

  // ============================================================================
  // M7.5: Admin Quiz Results & Attempt Review Dashboard
  // ============================================================================

  async getQuizResults(
    query: AdminQuizResultQueryDto,
  ): Promise<AdminQuizResultListResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    // Read-only semantics: Tuyệt đối không INSERT/UPDATE/DELETE trong API GET
    const now = new Date();
    const where: Prisma.QuizConfigAttemptWhereInput = {};

    if (query.quizConfigId) {
      where.quizConfigId = query.quizConfigId;
    }

    if (query.status === "EXPIRED") {
      where.OR = [
        { status: "EXPIRED" },
        { status: "IN_PROGRESS", expiresAt: { lte: now } },
      ];
    } else if (query.status === "IN_PROGRESS") {
      where.status = "IN_PROGRESS";
      where.expiresAt = { gt: now };
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.passed !== undefined) {
      where.passed = query.passed;
    }

    if (query.from || query.to) {
      where.startedAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.user = {
        OR: [
          { fullName: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { studentCode: { contains: s, mode: "insensitive" } },
          { username: { contains: s, mode: "insensitive" } },
        ],
      };
    }

    const sortField = query.sortBy || "submittedAt";
    const sortDirection = query.sortOrder || "desc";
    const orderBy: Prisma.QuizConfigAttemptOrderByWithRelationInput = {
      [sortField]: sortDirection,
    };

    const [total, attempts] = await Promise.all([
      this.prisma.quizConfigAttempt.count({ where }),
      this.prisma.quizConfigAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              studentCode: true,
              avatarUrl: true,
            },
          },
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

    const items: AdminQuizResultItemDto[] = attempts.map((att) => {
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

      const isExpiredInProgress =
        att.status === "IN_PROGRESS" && now >= att.expiresAt;
      const effectiveStatus = isExpiredInProgress ? "EXPIRED" : att.status;

      return {
        id: att.id,
        quizConfigId: att.quizConfigId,
        quizTitle: att.quizConfig.title,
        student: {
          id: att.user.id,
          fullName: att.user.fullName,
          email: att.user.email ?? "",
          studentCode: att.user.studentCode ?? null,
          avatarUrl: att.user.avatarUrl ?? null,
        },
        attemptNumber: att.attemptNumber,
        maxAttempts: att.quizConfig.maxAttempts,
        isRetake,
        status: effectiveStatus,
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

  async getQuizResultsSummary(
    quizConfigId?: string,
  ): Promise<AdminQuizResultSummaryDto> {
    const where: Prisma.QuizConfigAttemptWhereInput = {};
    if (quizConfigId) {
      where.quizConfigId = quizConfigId;
    }

    const [
      totalAttempts,
      totalSubmitted,
      totalPassed,
      totalFailed,
      scoreAgg,
      distinctUsers,
      xpAgg,
    ] = await Promise.all([
      this.prisma.quizConfigAttempt.count({ where }),
      this.prisma.quizConfigAttempt.count({
        where: { ...where, status: "SUBMITTED" },
      }),
      this.prisma.quizConfigAttempt.count({
        where: { ...where, status: "SUBMITTED", passed: true },
      }),
      this.prisma.quizConfigAttempt.count({
        where: { ...where, status: "SUBMITTED", passed: false },
      }),
      this.prisma.quizConfigAttempt.aggregate({
        where: { ...where, status: "SUBMITTED" },
        _avg: { scorePercent: true },
      }),
      this.prisma.quizConfigAttempt.findMany({
        where,
        select: { userId: true },
        distinct: ["userId"],
      }),
      this.prisma.quizConfigAttempt.aggregate({
        where,
        _sum: { awardedXp: true },
      }),
    ]);

    const passRatePercent =
      totalSubmitted > 0 ? Math.round((totalPassed / totalSubmitted) * 100) : 0;
    const avgScorePercent = Math.round(scoreAgg._avg.scorePercent ?? 0);
    const uniqueStudentsCount = distinctUsers.length;
    const totalAwardedXp = xpAgg._sum.awardedXp ?? 0;

    return {
      totalAttempts,
      totalSubmitted,
      totalPassed,
      totalFailed,
      passRatePercent,
      avgScorePercent,
      uniqueStudentsCount,
      totalAwardedXp,
    };
  }

  async getQuizResultDetail(
    attemptId: string,
  ): Promise<AdminQuizResultDetailDto> {
    const attempt = await this.prisma.quizConfigAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentCode: true,
            avatarUrl: true,
          },
        },
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
        message: `Không tìm thấy lượt thi với ID: ${attemptId}`,
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

    const results = attempt.answers.map((ans) => {
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

    const now = new Date();
    const isExpiredInProgress =
      attempt.status === "IN_PROGRESS" && now >= attempt.expiresAt;
    const effectiveStatus = isExpiredInProgress ? "EXPIRED" : attempt.status;

    return {
      id: attempt.id,
      quizConfigId: attempt.quizConfigId,
      quizTitle: attempt.quizConfig.title,
      student: {
        id: attempt.user.id,
        fullName: attempt.user.fullName,
        email: attempt.user.email ?? "",
        studentCode: attempt.user.studentCode ?? null,
        avatarUrl: attempt.user.avatarUrl ?? null,
      },
      attemptNumber: attempt.attemptNumber,
      maxAttempts: attempt.quizConfig.maxAttempts,
      isRetake,
      status: effectiveStatus,
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
      summary: {
        totalQuestions: attempt.totalQuestions ?? attempt.answers.length,
        answeredCount:
          attempt.answeredCount ??
          attempt.answers.filter((a) => a.selectedOptionIndex !== null).length,
        correctCount: attempt.correctCount ?? 0,
        scorePercent: attempt.scorePercent ?? 0,
        passingScore: attempt.quizConfig.passingScore,
        passed: attempt.passed ?? false,
      },
      xp: {
        baseXp: attempt.baseXp ?? 0,
        bonusXp: attempt.bonusXp ?? 0,
        awardedXp: attempt.awardedXp ?? 0,
        isXpAwarded,
        reason: xpReason ?? "QUIZ_SUBMITTED",
      },
      results,
    };
  }

  async getStudentQuizAttemptHistory(
    userId: string,
    quizConfigId: string,
  ): Promise<AdminQuizResultItemDto[]> {
    const attempts = await this.prisma.quizConfigAttempt.findMany({
      where: {
        userId,
        quizConfigId,
      },
      orderBy: { attemptNumber: "asc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentCode: true,
            avatarUrl: true,
          },
        },
        quizConfig: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            maxAttempts: true,
          },
        },
      },
    });

    const now = new Date();
    return attempts.map((att) => {
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

      const isExpiredInProgress =
        att.status === "IN_PROGRESS" && now >= att.expiresAt;
      const effectiveStatus = isExpiredInProgress ? "EXPIRED" : att.status;

      return {
        id: att.id,
        quizConfigId: att.quizConfigId,
        quizTitle: att.quizConfig.title,
        student: {
          id: att.user.id,
          fullName: att.user.fullName,
          email: att.user.email ?? "",
          studentCode: att.user.studentCode ?? null,
          avatarUrl: att.user.avatarUrl ?? null,
        },
        attemptNumber: att.attemptNumber,
        maxAttempts: att.quizConfig.maxAttempts,
        isRetake,
        status: effectiveStatus,
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
  }
}

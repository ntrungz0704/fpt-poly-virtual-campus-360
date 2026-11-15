import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  QuestionBankItemDto,
  QuestionDifficulty,
  QuestionListResponseDto,
  QuestionReviewStatus,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import type {
  CreateQuestionDto,
  QuestionQueryDto,
  UpdateQuestionDto,
  UpdateQuestionStatusDto,
} from "./dto/questions.dto";

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private mapToDto(
    item: {
      id: string;
      questionText: string;
      optionsJson: Prisma.JsonValue;
      correctIndex: number;
      explanation: string | null;
      topic: string;
      difficulty: QuestionDifficulty;
      status: QuestionReviewStatus;
      tags: Prisma.JsonValue;
      createdById: string | null;
      updatedById: string | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
      createdBy?: { fullName: string; username: string | null } | null;
      updatedBy?: { fullName: string; username: string | null } | null;
    },
  ): QuestionBankItemDto {
    const rawOptions = item.optionsJson;
    let options: string[] = [];
    if (Array.isArray(rawOptions)) {
      options = rawOptions.map((opt) => String(opt));
    }

    const rawTags = item.tags;
    let tags: string[] = [];
    if (Array.isArray(rawTags)) {
      tags = rawTags.map((t) => String(t));
    }

    return {
      id: item.id,
      questionText: item.questionText,
      options,
      correctIndex: item.correctIndex,
      explanation: item.explanation || "",
      topic: item.topic,
      difficulty: item.difficulty,
      status: item.status,
      tags,
      createdById: item.createdById,
      updatedById: item.updatedById,
      creatorName: item.createdBy?.fullName || item.createdBy?.username || null,
      updaterName: item.updatedBy?.fullName || item.updatedBy?.username || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listQuestions(query: QuestionQueryDto): Promise<QuestionListResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionBankItemWhereInput = {
      deletedAt: null,
    };

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      where.OR = [
        { questionText: { contains: q, mode: "insensitive" } },
        { explanation: { contains: q, mode: "insensitive" } },
        { topic: { contains: q, mode: "insensitive" } },
      ];
    }

    if (query.topic && query.topic.trim()) {
      where.topic = { equals: query.topic.trim(), mode: "insensitive" };
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.tag && query.tag.trim()) {
      const tag = query.tag.trim();
      where.tags = {
        array_contains: [tag],
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.questionBankItem.count({ where }),
      this.prisma.questionBankItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { fullName: true, username: true } },
          updatedBy: { select: { fullName: true, username: true } },
        },
      }),
    ]);

    const mappedItems = items.map((item) => this.mapToDto(item));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getQuestionById(id: string): Promise<QuestionBankItemDto> {
    const item = await this.prisma.questionBankItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { fullName: true, username: true } },
        updatedBy: { select: { fullName: true, username: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Câu hỏi ID ${id} không tồn tại hoặc đã bị xóa.`);
    }

    return this.mapToDto(item);
  }

  async createQuestion(
    dto: CreateQuestionDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuestionBankItemDto> {
    if (!dto.options || dto.options.length !== 4) {
      throw new BadRequestException("Câu hỏi trắc nghiệm phải có đúng 4 phương án.");
    }

    if (dto.correctIndex < 0 || dto.correctIndex > 3) {
      throw new BadRequestException("Chỉ số đáp án đúng phải nằm trong khoảng từ 0 đến 3 (A, B, C, D).");
    }

    const cleanedText = dto.questionText.trim();
    if (cleanedText.length < 5) {
      throw new BadRequestException("Nội dung câu hỏi phải có ít nhất 5 ký tự.");
    }

    const cleanedOptions = dto.options.map((opt, idx) => {
      const trimmed = opt.trim();
      if (!trimmed) {
        throw new BadRequestException(`Phương án thứ ${idx + 1} không được để trống.`);
      }
      return trimmed;
    });

    const item = await this.prisma.questionBankItem.create({
      data: {
        questionText: cleanedText,
        optionsJson: cleanedOptions,
        correctIndex: dto.correctIndex,
        explanation: dto.explanation?.trim() || "",
        topic: dto.topic?.trim() || "Chung",
        difficulty: dto.difficulty || "MEDIUM",
        status: dto.status || "DRAFT",
        tags: dto.tags || [],
        createdById: user.id,
      },
      include: {
        createdBy: { select: { fullName: true, username: true } },
        updatedBy: { select: { fullName: true, username: true } },
      },
    });

    await this.auditLog.record({
      actorUserId: user.id,
      actorUsername: user.username || user.fullName,
      action: "CREATE_QUESTION",
      resourceType: "QUESTION_BANK",
      resourceId: item.id,
      diffJson: {
        questionText: item.questionText,
        topic: item.topic,
        difficulty: item.difficulty,
        status: item.status,
      },
      ipAddress,
    });

    return this.mapToDto(item);
  }

  async updateQuestion(
    id: string,
    dto: UpdateQuestionDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuestionBankItemDto> {
    const existing = await this.prisma.questionBankItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Câu hỏi ID ${id} không tồn tại hoặc đã bị xóa.`);
    }

    if (dto.options !== undefined) {
      if (dto.options.length !== 4) {
        throw new BadRequestException("Câu hỏi trắc nghiệm phải có đúng 4 phương án.");
      }
      for (let i = 0; i < dto.options.length; i++) {
        if (!dto.options[i].trim()) {
          throw new BadRequestException(`Phương án thứ ${i + 1} không được để trống.`);
        }
      }
    }

    if (dto.correctIndex !== undefined) {
      if (dto.correctIndex < 0 || dto.correctIndex > 3) {
        throw new BadRequestException("Chỉ số đáp án đúng phải nằm trong khoảng từ 0 đến 3 (A, B, C, D).");
      }
    }

    const updated = await this.prisma.questionBankItem.update({
      where: { id },
      data: {
        ...(dto.questionText !== undefined ? { questionText: dto.questionText.trim() } : {}),
        ...(dto.options !== undefined ? { optionsJson: dto.options.map((o) => o.trim()) } : {}),
        ...(dto.correctIndex !== undefined ? { correctIndex: dto.correctIndex } : {}),
        ...(dto.explanation !== undefined ? { explanation: dto.explanation.trim() } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic.trim() } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        updatedById: user.id,
      },
      include: {
        createdBy: { select: { fullName: true, username: true } },
        updatedBy: { select: { fullName: true, username: true } },
      },
    });

    await this.auditLog.record({
      actorUserId: user.id,
      actorUsername: user.username || user.fullName,
      action: "UPDATE_QUESTION",
      resourceType: "QUESTION_BANK",
      resourceId: id,
      diffJson: {
        old: {
          questionText: existing.questionText,
          difficulty: existing.difficulty,
          status: existing.status,
        },
        new: {
          questionText: updated.questionText,
          difficulty: updated.difficulty,
          status: updated.status,
        },
      },
      ipAddress,
    });

    return this.mapToDto(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateQuestionStatusDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuestionBankItemDto> {
    const existing = await this.prisma.questionBankItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Câu hỏi ID ${id} không tồn tại hoặc đã bị xóa.`);
    }

    const updated = await this.prisma.questionBankItem.update({
      where: { id },
      data: {
        status: dto.status,
        updatedById: user.id,
      },
      include: {
        createdBy: { select: { fullName: true, username: true } },
        updatedBy: { select: { fullName: true, username: true } },
      },
    });

    await this.auditLog.record({
      actorUserId: user.id,
      actorUsername: user.username || user.fullName,
      action: "CHANGE_QUESTION_STATUS",
      resourceType: "QUESTION_BANK",
      resourceId: id,
      diffJson: {
        oldStatus: existing.status,
        newStatus: dto.status,
        note: dto.note || null,
      },
      ipAddress,
    });

    return this.mapToDto(updated);
  }

  async deleteQuestion(
    id: string,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.questionBankItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Câu hỏi ID ${id} không tồn tại hoặc đã bị xóa.`);
    }

    await this.prisma.questionBankItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: user.id,
      },
    });

    await this.auditLog.record({
      actorUserId: user.id,
      actorUsername: user.username || user.fullName,
      action: "DELETE_QUESTION",
      resourceType: "QUESTION_BANK",
      resourceId: id,
      diffJson: {
        questionText: existing.questionText,
        deletedAt: new Date().toISOString(),
      },
      ipAddress,
    });

    return {
      success: true,
      message: "Đã xóa mềm câu hỏi thành công.",
    };
  }
}

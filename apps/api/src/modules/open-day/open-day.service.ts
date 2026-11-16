import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  DEFAULT_QTSC_CAMPUS_CODE,
  type AdminEventParticipationDto,
  type AdminOpenDayEventDto,
  type AdminOpenDayFaqDto,
  type AdminOpenDayQuizItemDto,
  type AdminOpenDaySessionDto,
  type AdminParticipationsListResponseDto,
  type AdminQuizResultsSummaryDto,
  type BuildingCode,
  type CheckInResultDto,
  type CheckInXpRewardDto,
  type OpenDayAttendanceStatsDto,
  type OpenDayEventMetadataDto,
  type ParticipationStatus,
} from "@fpt-campus/shared";
import { Prisma, PublishStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../common/adapters/prisma.service";
import {
  createPaginatedPayload,
  type PaginatedPayload,
} from "../../common/interceptors/response-envelope.interceptor";
import { AuditLogService } from "../audit-log/audit-log.service";
import {
  normalizeTicketCodeInput,
  type AdminEventParticipationsQueryDto,
  type AdminEventsQueryDto,
  type CheckInTicketDto,
  type OpenDayLookupBuildingDto,
  type OpenDayLookupTourNodeDto,
  type PatchOpenDayEventDto,
  type PatchOpenDayFaqDto,
  type PatchOpenDayQuizItemDto,
  type PatchOpenDaySessionDto,
  type UpsertOpenDayEventDto,
  type UpsertOpenDayFaqDto,
  type UpsertOpenDayQuizItemDto,
  type UpsertOpenDaySessionDto,
} from "./dto/open-day.dto";

const OPEN_DAY_CHECKIN_XP_REWARD = 50;
const OPEN_DAY_CHECKIN_XP_SOURCE = "CHECK_IN";

const ADMIN_EVENT_INCLUDE = {
  _count: {
    select: {
      sessions: { where: { deletedAt: null } },
      faqs: { where: { deletedAt: null } },
      quizItems: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.OpenDayEventInclude;

type AdminEventRecord = Prisma.OpenDayEventGetPayload<{
  include: typeof ADMIN_EVENT_INCLUDE;
}>;

const ADMIN_SESSION_INCLUDE = {
  building: {
    select: {
      id: true,
      code: true,
    },
  },
  tourNode: {
    select: {
      id: true,
      slug: true,
    },
  },
} satisfies Prisma.OpenDaySessionInclude;

type AdminSessionRecord = Prisma.OpenDaySessionGetPayload<{
  include: typeof ADMIN_SESSION_INCLUDE;
}>;

const ADMIN_QUIZ_INCLUDE = {
  tourNode: {
    select: {
      id: true,
      slug: true,
    },
  },
} satisfies Prisma.OpenDayQuizItemInclude;

type AdminQuizRecord = Prisma.OpenDayQuizItemGetPayload<{
  include: typeof ADMIN_QUIZ_INCLUDE;
}>;

export function assertQuizIndexWithinOptions(
  options: readonly string[],
  correctIndex: number,
): void {
  if (!Array.isArray(options) || options.length < 2) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Câu hỏi quiz phải có ít nhất 2 lựa chọn hợp lệ.",
    });
  }
  if (
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    throw new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "correctIndex phải nằm trong phạm vi chỉ số của mảng options.",
    });
  }
}

@Injectable()
export class OpenDayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * DEC-M2-B: Server-resolved active campus authority (never trust caller campusId).
   */
  private async resolveAuthorizedCampusId(): Promise<string> {
    const campus = await this.prisma.campus.findFirst({
      where: {
        code: DEFAULT_QTSC_CAMPUS_CODE,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!campus) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy khuôn viên mặc định của hệ thống.",
      });
    }
    return campus.id;
  }

  private async requireEventInCampus(
    eventId: string,
    campusId: string,
  ): Promise<AdminEventRecord> {
    const event = await this.prisma.openDayEvent.findFirst({
      where: { id: eventId, deletedAt: null },
      include: ADMIN_EVENT_INCLUDE,
    });
    if (!event) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy sự kiện Open Day.",
      });
    }
    if (event.campusId !== campusId) {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Sự kiện không thuộc khuôn viên được phép quản lý.",
      });
    }
    return event;
  }

  private async validateEntityCampusRefs(
    campusId: string,
    refs: {
      buildingId?: string | null;
      locationId?: string | null;
      tourNodeId?: string | null;
    },
  ): Promise<void> {
    let resolvedBuildingId: string | null = null;

    if (refs.buildingId) {
      const building = await this.prisma.building.findFirst({
        where: { id: refs.buildingId, deletedAt: null },
        select: { id: true, campusId: true },
      });
      if (!building) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Tòa nhà tham chiếu không tồn tại hoặc đã bị xóa.",
        });
      }
      if (building.campusId !== campusId) {
        throw new UnprocessableEntityException({
          code: "UNPROCESSABLE_ENTITY",
          message: "buildingId không thuộc khuôn viên hiện hành.",
        });
      }
      resolvedBuildingId = building.id;
    }

    if (refs.locationId) {
      const location = await this.prisma.location.findFirst({
        where: { id: refs.locationId, deletedAt: null },
        select: {
          id: true,
          buildingId: true,
          building: { select: { campusId: true, deletedAt: true } },
        },
      });
      if (!location || location.building.deletedAt !== null) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Địa điểm tham chiếu không tồn tại hoặc đã bị xóa.",
        });
      }
      if (location.building.campusId !== campusId) {
        throw new UnprocessableEntityException({
          code: "UNPROCESSABLE_ENTITY",
          message: "locationId không thuộc khuôn viên hiện hành.",
        });
      }
      if (resolvedBuildingId && location.buildingId !== resolvedBuildingId) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "locationId không khớp với buildingId đã chọn.",
        });
      }
    }

    if (refs.tourNodeId) {
      const node = await this.prisma.tourNode.findFirst({
        where: { id: refs.tourNodeId, deletedAt: null },
        select: {
          id: true,
          location: {
            select: {
              deletedAt: true,
              building: { select: { campusId: true, deletedAt: true } },
            },
          },
        },
      });
      if (
        !node ||
        node.location.deletedAt !== null ||
        node.location.building.deletedAt !== null
      ) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "TourNode tham chiếu không tồn tại hoặc đã bị xóa.",
        });
      }
      if (node.location.building.campusId !== campusId) {
        throw new UnprocessableEntityException({
          code: "UNPROCESSABLE_ENTITY",
          message: "tourNodeId không thuộc khuôn viên hiện hành.",
        });
      }
    }
  }

  private parseOptionalEventDate(
    raw: string | null | undefined,
  ): Date | null | undefined {
    if (raw === undefined) {
      return undefined;
    }
    if (raw === null) {
      return null;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "eventDate không đúng định dạng ngày ISO hợp lệ.",
      });
    }
    return parsed;
  }

  private mapAdminEvent(event: AdminEventRecord): AdminOpenDayEventDto {
    return {
      id: event.id,
      campusId: event.campusId,
      eventKey: event.eventKey,
      title: event.title,
      subtitle: event.subtitle,
      dateLabel: event.dateLabel,
      timeLabel: event.timeLabel,
      eventDate: event.eventDate ? event.eventDate.toISOString() : null,
      isDefault: event.isDefault,
      status: event.status,
      sessionCount: event._count.sessions,
      faqCount: event._count.faqs,
      quizItemCount: event._count.quizItems,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  private mapEventMetadata(event: AdminEventRecord): OpenDayEventMetadataDto {
    return {
      id: event.id,
      eventKey: event.eventKey,
      title: event.title,
      dateLabel: event.dateLabel,
      timeLabel: event.timeLabel,
      eventDate: event.eventDate ? event.eventDate.toISOString() : null,
      isDefault: event.isDefault,
      status: event.status,
    };
  }

  private mapAdminSession(session: AdminSessionRecord): AdminOpenDaySessionDto {
    return {
      id: session.id,
      eventId: session.eventId,
      campusId: session.campusId,
      buildingId: session.buildingId,
      locationId: session.locationId,
      tourNodeId: session.tourNodeId,
      period: session.sessionPeriod,
      sessionPeriod: session.sessionPeriod,
      startTimeLabel: session.startTimeLabel,
      endTimeLabel: session.endTimeLabel,
      timeRange: session.timeRangeLabel,
      title: session.title,
      description: session.description,
      buildingCode: (session.building?.code ?? "INNOVATION") as BuildingCode,
      locationLabel: session.customLocationLabel,
      customLocationLabel: session.customLocationLabel,
      nodeSlug: session.tourNode?.slug ?? null,
      accessType: session.isPublic ? "public" : "invited",
      isPublic: session.isPublic,
      hostUnit: session.hostUnit,
      sortOrder: session.sortOrder,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private mapAdminFaq(faq: {
    id: string;
    eventId: string | null;
    campusId: string;
    question: string;
    answer: string;
    sortOrder: number;
    status: PublishStatus;
    createdAt: Date;
    updatedAt: Date;
  }): AdminOpenDayFaqDto {
    return {
      id: faq.id,
      eventId: faq.eventId,
      campusId: faq.campusId,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      status: faq.status,
      createdAt: faq.createdAt.toISOString(),
      updatedAt: faq.updatedAt.toISOString(),
    };
  }

  private extractOptions(optionsJson: Prisma.JsonValue): string[] {
    if (!Array.isArray(optionsJson)) {
      return [];
    }
    return optionsJson.filter(
      (opt): opt is string => typeof opt === "string",
    );
  }

  private mapAdminQuizItem(item: AdminQuizRecord): AdminOpenDayQuizItemDto {
    return {
      id: item.id,
      eventId: item.eventId,
      tourNodeId: item.tourNodeId,
      tourNodeSlug: item.tourNode?.slug ?? null,
      questionText: item.questionText,
      options: this.extractOptions(item.optionsJson),
      correctIndex: item.correctIndex,
      explanation: item.explanation,
      sortOrder: item.sortOrder,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Read-only Minimal Lookups (M2-D / DEC-M2-B)
  // ---------------------------------------------------------------------------

  async listLookupBuildings(): Promise<OpenDayLookupBuildingDto[]> {
    const campusId = await this.resolveAuthorizedCampusId();
    const buildings = await this.prisma.building.findMany({
      where: {
        campusId,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        shortName: true,
        status: true,
      },
    });
    return buildings.map((b) => ({
      id: b.id,
      code: b.code as BuildingCode,
      name: b.name,
      shortName: b.shortName,
      status: b.status,
    }));
  }

  async listLookupTourNodes(): Promise<OpenDayLookupTourNodeDto[]> {
    const campusId = await this.resolveAuthorizedCampusId();
    const nodes = await this.prisma.tourNode.findMany({
      where: {
        deletedAt: null,
        location: {
          deletedAt: null,
          building: {
            campusId,
            deletedAt: null,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        location: {
          select: {
            floor: { select: { name: true } },
            building: { select: { code: true } },
          },
        },
      },
    });
    return nodes.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      buildingCode: n.location.building.code as BuildingCode,
      floorName: n.location.floor?.name ?? null,
      status: n.status,
    }));
  }

  // ---------------------------------------------------------------------------
  // Open Day Events CRUD (M2-C)
  // ---------------------------------------------------------------------------

  async listEvents(
    query: AdminEventsQueryDto,
  ): Promise<PaginatedPayload<AdminOpenDayEventDto>> {
    const campusId = await this.resolveAuthorizedCampusId();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const trimmedQ = query.q?.trim();

    const where: Prisma.OpenDayEventWhereInput = {
      campusId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(trimmedQ
        ? {
            OR: [
              { eventKey: { contains: trimmedQ, mode: "insensitive" } },
              { title: { contains: trimmedQ, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, events] = await Promise.all([
      this.prisma.openDayEvent.count({ where }),
      this.prisma.openDayEvent.findMany({
        where,
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: ADMIN_EVENT_INCLUDE,
      }),
    ]);

    return createPaginatedPayload(
      events.map((e) => this.mapAdminEvent(e)),
      page,
      limit,
      total,
    );
  }

  async getEventMetadata(id: string): Promise<OpenDayEventMetadataDto> {
    const campusId = await this.resolveAuthorizedCampusId();
    const event = await this.requireEventInCampus(id, campusId);
    return this.mapEventMetadata(event);
  }

  async getEventById(id: string): Promise<AdminOpenDayEventDto> {
    const campusId = await this.resolveAuthorizedCampusId();
    const event = await this.requireEventInCampus(id, campusId);
    return this.mapAdminEvent(event);
  }

  async createEvent(
    dto: UpsertOpenDayEventDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDayEventDto> {
    const campusId = await this.resolveAuthorizedCampusId();
    const existing = await this.prisma.openDayEvent.findFirst({
      where: { eventKey: dto.eventKey, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: "CONFLICT",
        message: `Sự kiện với eventKey '${dto.eventKey}' đã tồn tại.`,
      });
    }

    const parsedDate = this.parseOptionalEventDate(dto.eventDate);
    const makeDefault = dto.isDefault ?? false;

    const created = await this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.openDayEvent.updateMany({
          where: { campusId, deletedAt: null, isDefault: true },
          data: { isDefault: false },
        });
      }

      const row = await tx.openDayEvent.create({
        data: {
          campusId,
          eventKey: dto.eventKey,
          title: dto.title,
          subtitle: dto.subtitle ?? null,
          dateLabel: dto.dateLabel,
          timeLabel: dto.timeLabel,
          eventDate: parsedDate ?? null,
          isDefault: makeDefault,
          status: dto.status ?? PublishStatus.DRAFT,
        },
        include: ADMIN_EVENT_INCLUDE,
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_EVENT_CREATE",
        resourceType: "open_day_event",
        resourceId: row.id,
        diffJson: {
          eventKey: row.eventKey,
          isDefault: row.isDefault,
          status: row.status,
        },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminEvent(created);
  }

  async updateEvent(
    id: string,
    dto: PatchOpenDayEventDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDayEventDto> {
    const campusId = await this.resolveAuthorizedCampusId();
    const existing = await this.requireEventInCampus(id, campusId);

    if (dto.eventKey && dto.eventKey !== existing.eventKey) {
      const collision = await this.prisma.openDayEvent.findFirst({
        where: { eventKey: dto.eventKey, deletedAt: null, id: { not: id } },
        select: { id: true },
      });
      if (collision) {
        throw new ConflictException({
          code: "CONFLICT",
          message: `Sự kiện với eventKey '${dto.eventKey}' đã tồn tại.`,
        });
      }
    }

    const parsedDate = this.parseOptionalEventDate(dto.eventDate);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.openDayEvent.updateMany({
          where: {
            campusId,
            deletedAt: null,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      const row = await tx.openDayEvent.update({
        where: { id },
        data: {
          ...(dto.eventKey !== undefined ? { eventKey: dto.eventKey } : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
          ...(dto.dateLabel !== undefined ? { dateLabel: dto.dateLabel } : {}),
          ...(dto.timeLabel !== undefined ? { timeLabel: dto.timeLabel } : {}),
          ...(parsedDate !== undefined ? { eventDate: parsedDate } : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: ADMIN_EVENT_INCLUDE,
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_EVENT_UPDATE",
        resourceType: "open_day_event",
        resourceId: row.id,
        diffJson: {
          eventKey: row.eventKey,
          isDefault: row.isDefault,
          status: row.status,
        },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminEvent(updated);
  }

  async deleteEvent(
    id: string,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<{ id: string; deleted: true }> {
    const campusId = await this.resolveAuthorizedCampusId();
    const existing = await this.requireEventInCampus(id, campusId);

    await this.prisma.$transaction(async (tx) => {
      await tx.openDayEvent.update({
        where: { id: existing.id },
        data: {
          deletedAt: new Date(),
          isDefault: false,
        },
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_EVENT_DELETE",
        resourceType: "open_day_event",
        resourceId: existing.id,
        diffJson: { eventKey: existing.eventKey },
        ipAddress,
        tx,
      });
    });

    return { id: existing.id, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // Open Day Sessions CRUD (M2-C)
  // ---------------------------------------------------------------------------

  async listSessions(eventId: string): Promise<AdminOpenDaySessionDto[]> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const sessions = await this.prisma.openDaySession.findMany({
      where: { eventId, campusId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { startTimeLabel: "asc" }],
      include: ADMIN_SESSION_INCLUDE,
    });

    return sessions.map((s) => this.mapAdminSession(s));
  }

  async createSession(
    eventId: string,
    dto: UpsertOpenDaySessionDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDaySessionDto> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);
    await this.validateEntityCampusRefs(campusId, {
      buildingId: dto.buildingId,
      locationId: dto.locationId,
      tourNodeId: dto.tourNodeId,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.openDaySession.create({
        data: {
          eventId,
          campusId,
          buildingId: dto.buildingId ?? null,
          locationId: dto.locationId ?? null,
          tourNodeId: dto.tourNodeId ?? null,
          title: dto.title,
          sessionPeriod: dto.sessionPeriod,
          startTimeLabel: dto.startTimeLabel,
          endTimeLabel: dto.endTimeLabel,
          timeRangeLabel: `${dto.startTimeLabel} - ${dto.endTimeLabel}`,
          customLocationLabel: dto.customLocationLabel,
          hostUnit: dto.hostUnit,
          isPublic: dto.isPublic ?? true,
          description: dto.description,
          sortOrder: dto.sortOrder ?? 0,
          status: dto.status ?? PublishStatus.DRAFT,
        },
        include: ADMIN_SESSION_INCLUDE,
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_SESSION_CREATE",
        resourceType: "open_day_session",
        resourceId: row.id,
        diffJson: {
          eventId,
          isPublic: row.isPublic,
          status: row.status,
          sortOrder: row.sortOrder,
        },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminSession(created);
  }

  async updateSession(
    eventId: string,
    sessionId: string,
    dto: PatchOpenDaySessionDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDaySessionDto> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const existing = await this.prisma.openDaySession.findFirst({
      where: { id: sessionId, eventId, campusId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy phiên lịch trình Open Day trong sự kiện này.",
      });
    }

    const nextBuildingId =
      dto.buildingId !== undefined ? dto.buildingId : existing.buildingId;
    const nextLocationId =
      dto.locationId !== undefined ? dto.locationId : existing.locationId;
    const nextTourNodeId =
      dto.tourNodeId !== undefined ? dto.tourNodeId : existing.tourNodeId;

    await this.validateEntityCampusRefs(campusId, {
      buildingId: nextBuildingId,
      locationId: nextLocationId,
      tourNodeId: nextTourNodeId,
    });

    const nextStart = dto.startTimeLabel ?? existing.startTimeLabel;
    const nextEnd = dto.endTimeLabel ?? existing.endTimeLabel;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.openDaySession.update({
        where: { id: existing.id },
        data: {
          ...(dto.buildingId !== undefined
            ? { buildingId: dto.buildingId }
            : {}),
          ...(dto.locationId !== undefined
            ? { locationId: dto.locationId }
            : {}),
          ...(dto.tourNodeId !== undefined
            ? { tourNodeId: dto.tourNodeId }
            : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.sessionPeriod !== undefined
            ? { sessionPeriod: dto.sessionPeriod }
            : {}),
          ...(dto.startTimeLabel !== undefined
            ? { startTimeLabel: dto.startTimeLabel }
            : {}),
          ...(dto.endTimeLabel !== undefined
            ? { endTimeLabel: dto.endTimeLabel }
            : {}),
          ...(dto.startTimeLabel !== undefined || dto.endTimeLabel !== undefined
            ? { timeRangeLabel: `${nextStart} - ${nextEnd}` }
            : {}),
          ...(dto.customLocationLabel !== undefined
            ? { customLocationLabel: dto.customLocationLabel }
            : {}),
          ...(dto.hostUnit !== undefined ? { hostUnit: dto.hostUnit } : {}),
          ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: ADMIN_SESSION_INCLUDE,
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_SESSION_UPDATE",
        resourceType: "open_day_session",
        resourceId: row.id,
        diffJson: {
          eventId,
          isPublic: row.isPublic,
          status: row.status,
          sortOrder: row.sortOrder,
        },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminSession(updated);
  }

  async deleteSession(
    eventId: string,
    sessionId: string,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<{ id: string; deleted: true }> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const existing = await this.prisma.openDaySession.findFirst({
      where: { id: sessionId, eventId, campusId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy phiên lịch trình Open Day trong sự kiện này.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.openDaySession.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_SESSION_DELETE",
        resourceType: "open_day_session",
        resourceId: existing.id,
        diffJson: { eventId },
        ipAddress,
        tx,
      });
    });

    return { id: existing.id, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // Open Day FAQs CRUD (M2-C)
  // ---------------------------------------------------------------------------

  async listFaqs(eventId: string): Promise<AdminOpenDayFaqDto[]> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const faqs = await this.prisma.openDayFaq.findMany({
      where: { eventId, campusId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return faqs.map((faq) => this.mapAdminFaq(faq));
  }

  async createFaq(
    eventId: string,
    dto: UpsertOpenDayFaqDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDayFaqDto> {
    if (dto.eventId && dto.eventId !== eventId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "eventId trong payload không khớp với eventId trên đường dẫn.",
      });
    }
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.openDayFaq.create({
        data: {
          eventId,
          campusId,
          question: dto.question,
          answer: dto.answer,
          sortOrder: dto.sortOrder ?? 0,
          status: dto.status ?? PublishStatus.DRAFT,
        },
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_FAQ_CREATE",
        resourceType: "open_day_faq",
        resourceId: row.id,
        diffJson: { eventId, status: row.status, sortOrder: row.sortOrder },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminFaq(created);
  }

  async updateFaq(
    eventId: string,
    faqId: string,
    dto: PatchOpenDayFaqDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDayFaqDto> {
    if (dto.eventId && dto.eventId !== eventId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "eventId trong payload không khớp với eventId trên đường dẫn.",
      });
    }
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const existing = await this.prisma.openDayFaq.findFirst({
      where: { id: faqId, eventId, campusId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy FAQ trong sự kiện này.",
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.openDayFaq.update({
        where: { id: existing.id },
        data: {
          ...(dto.question !== undefined ? { question: dto.question } : {}),
          ...(dto.answer !== undefined ? { answer: dto.answer } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_FAQ_UPDATE",
        resourceType: "open_day_faq",
        resourceId: row.id,
        diffJson: { eventId, status: row.status, sortOrder: row.sortOrder },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminFaq(updated);
  }

  async deleteFaq(
    eventId: string,
    faqId: string,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<{ id: string; deleted: true }> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const existing = await this.prisma.openDayFaq.findFirst({
      where: { id: faqId, eventId, campusId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy FAQ trong sự kiện này.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.openDayFaq.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_FAQ_DELETE",
        resourceType: "open_day_faq",
        resourceId: existing.id,
        diffJson: { eventId },
        ipAddress,
        tx,
      });
    });

    return { id: existing.id, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // Open Day Quiz Items CRUD (M2-C)
  // ---------------------------------------------------------------------------

  async listQuizItems(eventId: string): Promise<AdminOpenDayQuizItemDto[]> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const items = await this.prisma.openDayQuizItem.findMany({
      where: { eventId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: ADMIN_QUIZ_INCLUDE,
    });
    return items.map((item) => this.mapAdminQuizItem(item));
  }

  async createQuizItem(
    eventId: string,
    dto: UpsertOpenDayQuizItemDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDayQuizItemDto> {
    if (dto.eventId && dto.eventId !== eventId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "eventId trong payload không khớp với eventId trên đường dẫn.",
      });
    }
    assertQuizIndexWithinOptions(dto.options, dto.correctIndex);

    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);
    await this.validateEntityCampusRefs(campusId, {
      tourNodeId: dto.tourNodeId,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.openDayQuizItem.create({
        data: {
          eventId,
          tourNodeId: dto.tourNodeId ?? null,
          questionText: dto.questionText,
          optionsJson: dto.options,
          correctIndex: dto.correctIndex,
          explanation: dto.explanation,
          sortOrder: dto.sortOrder ?? 0,
          status: dto.status ?? PublishStatus.DRAFT,
        },
        include: ADMIN_QUIZ_INCLUDE,
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_QUIZ_CREATE",
        resourceType: "open_day_quiz_item",
        resourceId: row.id,
        diffJson: {
          eventId,
          optionCount: dto.options.length,
          status: row.status,
          sortOrder: row.sortOrder,
        },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminQuizItem(created);
  }

  async updateQuizItem(
    eventId: string,
    quizItemId: string,
    dto: PatchOpenDayQuizItemDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminOpenDayQuizItemDto> {
    if (dto.eventId && dto.eventId !== eventId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "eventId trong payload không khớp với eventId trên đường dẫn.",
      });
    }
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const existing = await this.prisma.openDayQuizItem.findFirst({
      where: { id: quizItemId, eventId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy câu hỏi quiz trong sự kiện này.",
      });
    }

    const nextOptions = dto.options ?? this.extractOptions(existing.optionsJson);
    const nextCorrectIndex = dto.correctIndex ?? existing.correctIndex;
    assertQuizIndexWithinOptions(nextOptions, nextCorrectIndex);

    if (dto.tourNodeId !== undefined) {
      await this.validateEntityCampusRefs(campusId, {
        tourNodeId: dto.tourNodeId,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.openDayQuizItem.update({
        where: { id: existing.id },
        data: {
          ...(dto.tourNodeId !== undefined
            ? { tourNodeId: dto.tourNodeId }
            : {}),
          ...(dto.questionText !== undefined
            ? { questionText: dto.questionText }
            : {}),
          ...(dto.options !== undefined ? { optionsJson: dto.options } : {}),
          ...(dto.correctIndex !== undefined
            ? { correctIndex: dto.correctIndex }
            : {}),
          ...(dto.explanation !== undefined
            ? { explanation: dto.explanation }
            : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: ADMIN_QUIZ_INCLUDE,
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_QUIZ_UPDATE",
        resourceType: "open_day_quiz_item",
        resourceId: row.id,
        diffJson: {
          eventId,
          optionCount: nextOptions.length,
          status: row.status,
          sortOrder: row.sortOrder,
        },
        ipAddress,
        tx,
      });

      return row;
    });

    return this.mapAdminQuizItem(updated);
  }

  async deleteQuizItem(
    eventId: string,
    quizItemId: string,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<{ id: string; deleted: true }> {
    const campusId = await this.resolveAuthorizedCampusId();
    await this.requireEventInCampus(eventId, campusId);

    const existing = await this.prisma.openDayQuizItem.findFirst({
      where: { id: quizItemId, eventId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy câu hỏi quiz trong sự kiện này.",
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.openDayQuizItem.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      await this.auditLogService.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "OPEN_DAY_QUIZ_DELETE",
        resourceType: "open_day_quiz_item",
        resourceId: existing.id,
        diffJson: { eventId },
        ipAddress,
        tx,
      });
    });

    return { id: existing.id, deleted: true };
  }

  // ---------------------------------------------------------------------------
  // M3C / M8: Open Day Participations, Attendance Stats & Check-in Engine
  // ---------------------------------------------------------------------------

  private assertCheckInActorAuthorized(actor: AuthenticatedUser): void {
    if (actor.userType !== "ADMIN" && actor.userType !== "STAFF") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message:
          "Chỉ tài khoản Quản trị (ADMIN) hoặc Nhân sự (STAFF) mới có quyền thực hiện nghiệp vụ check-in.",
      });
    }
  }

  private async computeEventAttendanceStats(
    eventId: string,
    eventTitle: string,
  ): Promise<OpenDayAttendanceStatsDto> {
    const grouped = await this.prisma.eventParticipation.groupBy({
      by: ["participationStatus"],
      where: { eventId },
      _count: { _all: true },
    });

    let totalInvited = 0;
    let totalConfirmed = 0;
    let totalCheckedIn = 0;
    let totalCancelled = 0;

    for (const row of grouped) {
      if (row.participationStatus === "INVITED") {
        totalInvited = row._count._all;
      } else if (row.participationStatus === "CONFIRMED") {
        totalConfirmed = row._count._all;
      } else if (row.participationStatus === "CHECKED_IN") {
        totalCheckedIn = row._count._all;
      } else if (row.participationStatus === "CANCELLED") {
        totalCancelled = row._count._all;
      }
    }

    const totalAllTickets =
      totalInvited + totalConfirmed + totalCheckedIn + totalCancelled;
    const totalValidTickets = totalInvited + totalConfirmed + totalCheckedIn;
    const totalNotCheckedIn = totalInvited + totalConfirmed;
    const attendanceRate =
      totalValidTickets > 0
        ? Number(((totalCheckedIn / totalValidTickets) * 100).toFixed(2))
        : 0;

    return {
      eventId,
      eventTitle,
      totalAllTickets,
      totalValidTickets,
      totalInvited,
      totalConfirmed,
      totalCheckedIn,
      totalNotCheckedIn,
      totalCancelled,
      attendanceRate,
    };
  }

  async getEventAttendanceStats(
    eventId: string,
    actor?: AuthenticatedUser,
  ): Promise<OpenDayAttendanceStatsDto> {
    if (actor) {
      this.assertCheckInActorAuthorized(actor);
    }
    const campusId = await this.resolveAuthorizedCampusId();
    const event = await this.requireEventInCampus(eventId, campusId);
    return this.computeEventAttendanceStats(event.id, event.title);
  }

  async listParticipations(
    eventId: string,
    query: AdminEventParticipationsQueryDto,
    actor?: AuthenticatedUser,
  ): Promise<AdminParticipationsListResponseDto> {
    if (actor) {
      this.assertCheckInActorAuthorized(actor);
    }
    const campusId = await this.resolveAuthorizedCampusId();
    const event = await this.requireEventInCampus(eventId, campusId);

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.EventParticipationWhereInput = {
      eventId,
    };

    if (query.status) {
      where.participationStatus = query.status as ParticipationStatus;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { ticketCode: { contains: q, mode: "insensitive" } },
        { attendeeName: { contains: q, mode: "insensitive" } },
        { attendeeEmail: { contains: q, mode: "insensitive" } },
        { attendeePhone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [stats, filteredTotal, rows] = await Promise.all([
      this.computeEventAttendanceStats(event.id, event.title),
      this.prisma.eventParticipation.count({ where }),
      this.prisma.eventParticipation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          checkedInByUser: {
            select: { id: true, fullName: true, username: true },
          },
        },
      }),
    ]);

    const items: AdminEventParticipationDto[] = rows.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      ticketCode: r.ticketCode,
      attendeeName: r.attendeeName ?? "",
      attendeeEmail: r.attendeeEmail ?? "",
      attendeePhone: r.attendeePhone ?? "",
      participationStatus: r.participationStatus,
      checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
      checkedInBy: r.checkedInBy,
      checkedInByName:
        r.checkedInByUser?.fullName ?? r.checkedInByUser?.username ?? null,
      userId: r.userId,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      items,
      total: filteredTotal,
      totalInvited: stats.totalInvited,
      totalConfirmed: stats.totalConfirmed,
      totalCheckedIn: stats.totalCheckedIn,
      totalCancelled: stats.totalCancelled,
      totalValidTickets: stats.totalValidTickets,
      totalNotCheckedIn: stats.totalNotCheckedIn,
      attendanceRate: stats.attendanceRate,
      stats,
      page,
      pageSize,
    };
  }

  async checkInTicket(
    dto: CheckInTicketDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
    options?: { requireEventId?: boolean },
  ): Promise<CheckInResultDto> {
    this.assertCheckInActorAuthorized(actor);

    const normalizedRaw = normalizeTicketCodeInput(dto.ticketCode);
    const code = typeof normalizedRaw === "string" ? normalizedRaw : "";
    if (!code || code.length > 32) {
      throw new NotFoundException({
        code: "INVALID_TICKET",
        message: `Mã vé "${code || ""}" không hợp lệ hoặc không tồn tại trên hệ thống.`,
        details: [{ rule: "INVALID_TICKET", ticketCode: code }],
      });
    }

    const campusId = await this.resolveAuthorizedCampusId();
    const requireEventId = options?.requireEventId ?? true;

    let resolvedTargetEventId: string;
    if (dto.eventId) {
      const targetEvent = await this.requireEventInCampus(
        dto.eventId,
        campusId,
      );
      if (targetEvent.status !== PublishStatus.PUBLISHED) {
        throw new UnprocessableEntityException({
          code: "INVALID_EVENT_STATUS",
          message: `Sự kiện "${targetEvent.title}" hiện không ở trạng thái cho phép check-in.`,
          details: [
            {
              rule: "INVALID_EVENT_STATUS",
              eventId: targetEvent.id,
              eventTitle: targetEvent.title,
              eventStatus: targetEvent.status,
            },
          ],
        });
      }
      resolvedTargetEventId = targetEvent.id;
    } else {
      if (requireEventId) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Bắt buộc phải truyền eventId của sự kiện đang check-in.",
        });
      }
      // Legacy /admin/events/check-in compatibility is permitted ONLY when strictly one PUBLISHED event exists in the campus.
      const publishedEvents = await this.prisma.openDayEvent.findMany({
        where: {
          campusId,
          deletedAt: null,
          status: PublishStatus.PUBLISHED,
        },
        select: { id: true },
        take: 2,
      });
      if (publishedEvents.length !== 1) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message:
            publishedEvents.length === 0
              ? "Không có sự kiện Open Day nào ở trạng thái PUBLISHED; bắt buộc phải truyền eventId."
              : "Hệ thống đang có nhiều sự kiện Open Day công khai; bắt buộc phải truyền eventId để tránh check-in nhầm sự kiện.",
        });
      }
      resolvedTargetEventId = publishedEvents[0].id;
    }

    const now = new Date();

    const { updatedTicket, xpReward } = await this.prisma.$transaction(
      async (tx) => {
        // Lock participation row in PostgreSQL to serialize concurrent check-ins for the same ticketCode
        const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM event_participations
          WHERE ticket_code = ${code}
          FOR UPDATE
        `;

        if (lockedRows.length === 0) {
          throw new NotFoundException({
            code: "INVALID_TICKET",
            message: `Mã vé "${code}" không tồn tại trên hệ thống.`,
            details: [{ rule: "INVALID_TICKET", ticketCode: code }],
          });
        }

        const participation = await tx.eventParticipation.findUnique({
          where: { id: lockedRows[0].id },
          include: {
            event: true,
            user: {
              select: { id: true, fullName: true },
            },
          },
        });

        if (
          !participation ||
          participation.event.deletedAt !== null ||
          participation.event.campusId !== campusId
        ) {
          throw new NotFoundException({
            code: "INVALID_TICKET",
            message: `Mã vé "${code}" không tồn tại hoặc không thuộc khuôn viên được phép check-in.`,
            details: [{ rule: "INVALID_TICKET", ticketCode: code }],
          });
        }

        if (participation.eventId !== resolvedTargetEventId) {
          throw new UnprocessableEntityException({
            code: "EVENT_MISMATCH",
            message: `Vé "${code}" thuộc sự kiện "${participation.event.title}", không khớp với sự kiện đang check-in.`,
            details: [
              {
                rule: "EVENT_MISMATCH",
                ticketCode: code,
                attendeeName: participation.attendeeName ?? null,
                ticketEventId: participation.eventId,
                ticketEventTitle: participation.event.title,
                expectedEventId: resolvedTargetEventId,
              },
            ],
          });
        }

        if (participation.event.status !== PublishStatus.PUBLISHED) {
          throw new UnprocessableEntityException({
            code: "INVALID_EVENT_STATUS",
            message: `Sự kiện "${participation.event.title}" chưa được công khai (PUBLISHED) để thực hiện check-in.`,
            details: [
              {
                rule: "INVALID_EVENT_STATUS",
                ticketCode: code,
                attendeeName: participation.attendeeName ?? null,
                eventId: participation.eventId,
                eventTitle: participation.event.title,
                eventStatus: participation.event.status,
              },
            ],
          });
        }

        if (participation.participationStatus === "CANCELLED") {
          throw new BadRequestException({
            code: "CANCELLED_TICKET",
            message: `Vé "${code}" đã bị hủy, không thể thực hiện check-in.`,
            details: [
              {
                rule: "CANCELLED_TICKET",
                ticketCode: code,
                attendeeName: participation.attendeeName ?? null,
                eventId: participation.eventId,
                eventTitle: participation.event.title,
              },
            ],
          });
        }

        if (participation.participationStatus === "CHECKED_IN") {
          const timeStr = participation.checkedInAt
            ? new Date(participation.checkedInAt).toLocaleString("vi-VN")
            : "";
          throw new ConflictException({
            code: "ALREADY_CHECKED_IN",
            message: `Vé "${code}" đã được check-in vào lúc ${timeStr}. Không thể check-in lại!`,
            details: [
              {
                rule: "ALREADY_CHECKED_IN",
                ticketCode: code,
                attendeeName: participation.attendeeName ?? null,
                eventId: participation.eventId,
                eventTitle: participation.event.title,
                checkedInAt: participation.checkedInAt
                  ? participation.checkedInAt.toISOString()
                  : null,
              },
            ],
          });
        }

        if (
          participation.participationStatus !== "INVITED" &&
          participation.participationStatus !== "CONFIRMED"
        ) {
          throw new UnprocessableEntityException({
            code: "INVALID_TICKET_STATUS",
            message: `Trạng thái vé "${participation.participationStatus}" không hợp lệ để check-in.`,
            details: [
              {
                rule: "INVALID_TICKET_STATUS",
                ticketCode: code,
                status: participation.participationStatus,
              },
            ],
          });
        }

        // Conditional atomic update ensuring single check-in transition
        const conditionalUpdate = await tx.eventParticipation.updateMany({
          where: {
            id: participation.id,
            participationStatus: { in: ["INVITED", "CONFIRMED"] },
          },
          data: {
            participationStatus: "CHECKED_IN",
            checkedInAt: now,
            checkedInBy: actor.id,
          },
        });

        if (conditionalUpdate.count !== 1) {
          throw new ConflictException({
            code: "ALREADY_CHECKED_IN",
            message: `Vé "${code}" đã được check-in trước đó.`,
            details: [{ rule: "ALREADY_CHECKED_IN", ticketCode: code }],
          });
        }

        const updatedRow = await tx.eventParticipation.findUniqueOrThrow({
          where: { id: participation.id },
          include: { event: true },
        });

        // XP Award inside the same atomic transaction:
        // Only credit XP when participation.userId is linked to a user account; never assign XP to actor or another user.
        const linkedUserId = participation.userId ?? null;
        let resolvedXpReward: CheckInXpRewardDto;

        if (linkedUserId) {
          const idempotencyKey = `open-day:check-in:${participation.eventId}:${participation.ticketCode}`;
          const existingLedger = await tx.xpLedger.findUnique({
            where: { idempotencyKey },
            select: { id: true },
          });

          if (existingLedger) {
            resolvedXpReward = {
              awarded: false,
              amountXp: 0,
              userId: linkedUserId,
              reason: "ALREADY_AWARDED",
              ledgerId: existingLedger.id,
              idempotencyKey,
            };
          } else {
            const resolvedName =
              participation.attendeeName?.trim() ||
              participation.user?.fullName?.trim() ||
              participation.ticketCode;

            const createdLedger = await tx.xpLedger.create({
              data: {
                userId: linkedUserId,
                ticketCode: participation.ticketCode,
                attendeeName: resolvedName.slice(0, 160),
                amountXp: OPEN_DAY_CHECKIN_XP_REWARD,
                source: OPEN_DAY_CHECKIN_XP_SOURCE,
                referenceId: participation.id,
                idempotencyKey,
                metadataJson: {
                  eventId: participation.eventId,
                  eventKey: participation.event.eventKey,
                  participationId: participation.id,
                  ticketCode: participation.ticketCode,
                  checkedInBy: actor.id,
                  checkedInAt: now.toISOString(),
                },
              },
              select: { id: true },
            });

            resolvedXpReward = {
              awarded: true,
              amountXp: OPEN_DAY_CHECKIN_XP_REWARD,
              userId: linkedUserId,
              reason: "CHECKED_IN_REWARD",
              ledgerId: createdLedger.id,
              idempotencyKey,
            };
          }
        } else {
          resolvedXpReward = {
            awarded: false,
            amountXp: 0,
            userId: null,
            reason: "NO_LINKED_USER",
            ledgerId: null,
            idempotencyKey: null,
          };
        }

        await this.auditLogService.record({
          actorUserId: actor.id,
          actorUsername: actor.username,
          action: "OPEN_DAY_CHECK_IN",
          resourceType: "event_participation",
          resourceId: updatedRow.id,
          diffJson: {
            ticketCode: updatedRow.ticketCode,
            eventId: updatedRow.eventId,
            eventKey: updatedRow.event.eventKey,
            previousStatus: participation.participationStatus,
            newStatus: "CHECKED_IN",
            checkedInAt: now.toISOString(),
            checkedInBy: actor.id,
            xpAwarded: resolvedXpReward.awarded,
            xpAmount: resolvedXpReward.amountXp,
            xpRecipientUserId: resolvedXpReward.userId,
            xpReason: resolvedXpReward.reason,
            xpLedgerId: resolvedXpReward.ledgerId,
            xpIdempotencyKey: resolvedXpReward.idempotencyKey,
          },
          ipAddress,
          tx,
        });

        return { updatedTicket: updatedRow, xpReward: resolvedXpReward };
      },
    );

    const attendeeDisplay = updatedTicket.attendeeName || code;
    const message = xpReward.awarded
      ? `Check-in thành công cho ${attendeeDisplay} (+${xpReward.amountXp} XP)!`
      : `Check-in thành công cho ${attendeeDisplay}! (Vé chưa liên kết tài khoản sinh viên — không cộng XP)`;

    return {
      success: true,
      status: "CHECKED_IN_SUCCESS",
      code: "CHECKED_IN_SUCCESS",
      message,
      ticket: {
        id: updatedTicket.id,
        ticketCode: updatedTicket.ticketCode,
        eventId: updatedTicket.eventId,
        eventTitle: updatedTicket.event.title,
        eventDateLabel: updatedTicket.event.dateLabel,
        eventTimeLabel: updatedTicket.event.timeLabel,
        attendeeName: updatedTicket.attendeeName ?? "",
        attendeeEmail: updatedTicket.attendeeEmail ?? "",
        attendeePhone: updatedTicket.attendeePhone ?? "",
        participationStatus: updatedTicket.participationStatus,
        checkedInAt: updatedTicket.checkedInAt
          ? updatedTicket.checkedInAt.toISOString()
          : null,
        createdAt: updatedTicket.createdAt.toISOString(),
        qrPayload: `TICKET:${updatedTicket.ticketCode}`,
      },
      checkedInAt: now.toISOString(),
      checkedInBy: actor.id,
      xpReward,
    };
  }

  async listQuizResults(eventId: string): Promise<AdminQuizResultsSummaryDto> {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const totalAttempts = attempts.length;
    const passedCount = attempts.filter((a) => a.scorePercent >= 60).length;
    const totalXpAwarded = attempts.reduce((acc, a) => acc + a.scoreXp, 0);
    const averageScorePercent =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce((acc, a) => acc + a.scorePercent, 0) / totalAttempts,
          )
        : 0;

    return {
      items: attempts.map((a) => ({
        id: a.id,
        eventId: a.eventId,
        userId: a.userId,
        ticketCode: a.ticketCode,
        attendeeName: a.attendeeName,
        totalQuestions: a.totalQuestions,
        correctCount: a.correctCount,
        scorePercent: a.scorePercent,
        scoreXp: a.scoreXp,
        createdAt: a.createdAt.toISOString(),
      })),
      totalAttempts,
      averageScorePercent,
      passedCount,
      totalXpAwarded,
    };
  }
}

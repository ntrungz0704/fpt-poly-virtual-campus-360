import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PublishStatus } from "@prisma/client";
import type {
  LinkStatus,
  ParentStudentDetailDto,
  ParentStudentSummaryDto,
  PortalProgressDto,
  PortalScheduleItemDto,
  PortalTicketDto,
  StudentLinkRequestItemDto,
  StudentProfileDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { CreateLinkRequestDto, UpdateProfileDto } from "./dto/portal.dto";

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // Helper: Claim unassigned tickets by verified email (Single Source of Truth)
  // ==========================================================================
  private async claimUnassignedTickets(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const normalizedEmail = user?.email?.trim().toLowerCase();
    if (normalizedEmail) {
      await this.prisma.eventParticipation.updateMany({
        where: {
          userId: null,
          attendeeEmail: normalizedEmail,
        },
        data: {
          userId,
        },
      });
    }
  }

  // ==========================================================================
  // 1. Student Profile
  // ==========================================================================

  async getProfile(userId: string): Promise<StudentProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        studentCode: true,
        major: true,
        avatarUrl: true,
        bio: true,
        userType: true,
        accountStatus: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Không tìm thấy thông tin tài khoản người dùng.",
      });
    }

    // Auto-claim any unassigned tickets matching verified email
    await this.claimUnassignedTickets(userId);

    const userTickets = await this.prisma.eventParticipation.findMany({
      where: { userId },
      select: { ticketCode: true },
    });
    const ticketCodes = userTickets.map((t) => t.ticketCode);

    const [xpAgg, ticketCount, parentCount] = await Promise.all([
      this.prisma.xpLedger.aggregate({
        where: {
          OR: [
            { userId },
            ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
          ],
        },
        _sum: { amountXp: true },
      }),
      userTickets.length,
      this.prisma.parentStudentLink.count({
        where: { studentId: userId, status: "APPROVED" },
      }),
    ]);

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      studentCode: user.studentCode,
      major: user.major,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      userType: user.userType,
      accountStatus: user.accountStatus,
      totalXp: xpAgg._sum.amountXp ?? 0,
      ticketCount,
      approvedParentCount: parentCount,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<StudentProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "Không tìm thấy thông tin tài khoản người dùng.",
      });
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim() || null;
    if (dto.major !== undefined) updateData.major = dto.major?.trim() || null;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl?.trim() || null;
    if (dto.bio !== undefined) updateData.bio = dto.bio?.trim() || null;

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.getProfile(userId);
  }

  // ==========================================================================
  // 2. Student Tickets & Schedule
  // ==========================================================================

  async getTickets(
    userId: string,
    _userEmail: string | null,
  ): Promise<PortalTicketDto[]> {
    await this.claimUnassignedTickets(userId);

    const participations = await this.prisma.eventParticipation.findMany({
      where: {
        userId,
        event: { deletedAt: null },
      },
      include: {
        event: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const allSessionIds = new Set<string>();
    const ticketSessionIds = participations.map((p) => {
      const meta = (p.metadataJson ?? {}) as Record<string, unknown>;
      const sessionIds = Array.isArray(meta.sessionIds)
        ? meta.sessionIds.filter((id): id is string => typeof id === "string")
        : [];
      for (const sid of sessionIds) allSessionIds.add(sid);
      return sessionIds;
    });

    const sessionsById = new Map<
      string,
      { id: string; title: string; timeRange: string; location: string }
    >();

    if (allSessionIds.size > 0) {
      const dbSessions = await this.prisma.openDaySession.findMany({
        where: {
          id: { in: Array.from(allSessionIds) },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          timeRangeLabel: true,
          customLocationLabel: true,
        },
      });
      for (const s of dbSessions) {
        sessionsById.set(s.id, {
          id: s.id,
          title: s.title,
          timeRange: s.timeRangeLabel,
          location: s.customLocationLabel,
        });
      }
    }

    return participations.map((p, index) => {
      const sessionsList = ticketSessionIds[index]
        .map((sid) => sessionsById.get(sid))
        .filter(
          (item): item is { id: string; title: string; timeRange: string; location: string } =>
            Boolean(item),
        );

      return {
        id: p.id,
        ticketCode: p.ticketCode,
        eventId: p.eventId,
        eventTitle: p.event.title,
        eventDateLabel: p.event.dateLabel,
        eventTimeLabel: p.event.timeLabel,
        attendeeName: p.attendeeName || "Khách mời Open Day",
        attendeeEmail: p.attendeeEmail || "",
        attendeePhone: p.attendeePhone || "",
        participationStatus: p.participationStatus,
        registeredAt: p.createdAt.toISOString(),
        checkedInAt: p.checkedInAt ? p.checkedInAt.toISOString() : null,
        qrPayload: `TICKET:${p.ticketCode}`,
        sessions: sessionsList,
      };
    });
  }

  async getSchedule(
    userId: string,
    _userEmail: string | null,
  ): Promise<PortalScheduleItemDto[]> {
    await this.claimUnassignedTickets(userId);

    const [allSessions, userTickets] = await Promise.all([
      this.prisma.openDaySession.findMany({
        where: {
          deletedAt: null,
          isPublic: true,
          status: PublishStatus.PUBLISHED,
          event: {
            deletedAt: null,
            status: PublishStatus.PUBLISHED,
          },
        },
        include: { event: true },
        orderBy: [{ sortOrder: "asc" }, { startTimeLabel: "asc" }],
      }),
      this.prisma.eventParticipation.findMany({
        where: {
          userId,
          participationStatus: { not: "CANCELLED" },
          event: { deletedAt: null },
        },
        select: { metadataJson: true },
      }),
    ]);

    const registeredSessionIds = new Set<string>();
    for (const ticket of userTickets) {
      const meta = (ticket.metadataJson ?? {}) as Record<string, unknown>;
      if (Array.isArray(meta.sessionIds)) {
        for (const sid of meta.sessionIds) {
          if (typeof sid === "string") registeredSessionIds.add(sid);
        }
      }
    }

    return allSessions.map((s) => ({
      id: s.id,
      title: s.title,
      eventTitle: s.event.title,
      dateLabel: s.event.dateLabel,
      timeRangeLabel: s.timeRangeLabel,
      customLocationLabel: s.customLocationLabel,
      hostUnit: s.hostUnit,
      period: s.sessionPeriod,
      description: s.description,
      isRegistered: registeredSessionIds.has(s.id),
    }));
  }

  // ==========================================================================
  // 3. Student Gamification & Progress (Full DB Aggregation across all history)
  // ==========================================================================

  async getGamification(
    userId: string,
    _userEmail: string | null,
  ): Promise<PortalProgressDto> {
    await this.claimUnassignedTickets(userId);

    const tickets = await this.prisma.eventParticipation.findMany({
      where: { userId },
      select: { ticketCode: true },
    });
    const ticketCodes = tickets.map((t) => t.ticketCode);

    const filter: Prisma.XpLedgerWhereInput = {
      OR: [
        { userId },
        ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
      ],
    };

    const spinFilter: Prisma.UserSpinHistoryWhereInput = {
      OR: [
        { userId },
        ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
      ],
    };

    const quizFilter: Prisma.QuizAttemptWhereInput = {
      OR: [
        { userId },
        ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
      ],
    };

    const [
      xpAggregate,
      totalSpinsUsed,
      quizAttemptsCount,
      recentXpLedgers,
      recentSpins,
      checkedInTicket,
      passedQuiz,
    ] = await Promise.all([
      // 1. Full aggregation across ALL history (Task 2 / B2)
      this.prisma.xpLedger.aggregate({
        where: filter,
        _sum: { amountXp: true },
      }),
      // 2. Full count of spins used across ALL history
      this.prisma.userSpinHistory.count({
        where: spinFilter,
      }),
      // 3. Full count of quiz attempts
      this.prisma.quizAttempt.count({
        where: quizFilter,
      }),
      // 4. Recent XP activity (capped at 10)
      this.prisma.xpLedger.findMany({
        where: filter,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // 5. Recent spins activity (capped at 10)
      this.prisma.userSpinHistory.findMany({
        where: spinFilter,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // 6. Check-in status for bonus spin
      this.prisma.eventParticipation.findFirst({
        where: { userId, checkedInAt: { not: null } },
      }),
      // 7. Quiz passing status for bonus spin
      this.prisma.quizAttempt.findFirst({
        where: { ...quizFilter, scorePercent: { gte: 60 } },
      }),
    ]);

    const totalXp = xpAggregate._sum.amountXp ?? 0;

    // Gamification rule alignment with M3D:
    // Base: 1 spin for having a valid ticket OR at least 1 quiz attempt
    // Bonus +2 spins if checked in at event
    // Bonus +1 spin if passed quiz (>= 60%)
    // Bonus +1 spin per 100 XP
    let earnedSpins = 0;
    if (tickets.length > 0 || quizAttemptsCount > 0) {
      earnedSpins += 1;
    }
    if (checkedInTicket) {
      earnedSpins += 2;
    }
    if (passedQuiz) {
      earnedSpins += 1;
    }
    earnedSpins += Math.floor(Math.max(0, totalXp) / 100);

    const availableSpins = Math.max(0, earnedSpins - totalSpinsUsed);
    const level = Math.floor(Math.max(0, totalXp) / 100) + 1;
    const rank = totalXp > 0 ? await this.computeRealParticipantRank(userId, totalXp) : null;

    return {
      totalXp,
      level,
      rank,
      availableSpins,
      quizAttemptsCount,
      recentXpLedgers: recentXpLedgers.map((l) => ({
        id: l.id,
        amountXp: l.amountXp,
        source: l.source,
        createdAt: l.createdAt.toISOString(),
      })),
      recentSpins: recentSpins.map((s) => ({
        id: s.id,
        rewardLabel: s.rewardLabel,
        awardedXp: s.awardedXp,
        rewardType: s.rewardType,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  private async computeRealParticipantRank(
    userId: string,
    userTotalXp: number,
  ): Promise<number> {
    const ledgerBuckets = await this.prisma.xpLedger.groupBy({
      by: ["userId", "ticketCode", "guestSessionId", "attendeeName"],
      _sum: { amountXp: true },
    });

    const totalsByIdentity = new Map<string, number>();
    for (const row of ledgerBuckets) {
      const key = row.userId
        ? `u:${row.userId}`
        : row.ticketCode
          ? `t:${row.ticketCode.trim().toUpperCase()}`
          : row.guestSessionId
            ? `gs:${row.guestSessionId}`
            : `legacy_g:${row.attendeeName.trim().toLowerCase()}`;
      totalsByIdentity.set(
        key,
        (totalsByIdentity.get(key) ?? 0) + (row._sum.amountXp ?? 0),
      );
    }

    const selfKey = `u:${userId}`;
    let higherCount = 0;
    for (const [key, xp] of totalsByIdentity.entries()) {
      if (key !== selfKey && xp > userTotalXp) {
        higherCount += 1;
      }
    }

    return higherCount + 1;
  }

  // ==========================================================================
  // 4. Student Link Requests (Incoming from parents)
  // ==========================================================================

  async getStudentLinkRequests(
    studentId: string,
  ): Promise<StudentLinkRequestItemDto[]> {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { studentId },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return links.map((l) => ({
      linkId: l.id,
      parentId: l.parent.id,
      parentName: l.parent.fullName,
      parentEmail: l.parent.email,
      parentPhone: l.parent.phone,
      relationship: l.relationship,
      status: l.status as LinkStatus,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async respondLinkRequest(
    studentId: string,
    linkId: string,
    action: "APPROVE" | "REJECT",
  ): Promise<{ success: boolean; status: LinkStatus }> {
    const link = await this.prisma.parentStudentLink.findFirst({
      where: { id: linkId, studentId },
    });

    if (!link) {
      throw new NotFoundException({
        code: "LINK_REQUEST_NOT_FOUND",
        message: "Không tìm thấy yêu cầu liên kết phụ huynh tương ứng.",
      });
    }

    if (link.status !== "PENDING") {
      throw new BadRequestException({
        code: "LINK_ALREADY_RESOLVED",
        message: "Yêu cầu liên kết này đã được xử lý (APPROVED hoặc REJECTED), không thể sửa đổi.",
      });
    }

    const nextStatus: LinkStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Concurrency-safe atomic update
    const updateResult = await this.prisma.parentStudentLink.updateMany({
      where: { id: linkId, studentId, status: "PENDING" },
      data: { status: nextStatus },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException({
        code: "LINK_ALREADY_RESOLVED",
        message: "Yêu cầu liên kết đã được xử lý trước đó hoặc không hợp lệ.",
      });
    }

    return { success: true, status: nextStatus };
  }

  // ==========================================================================
  // 5. Parent Portal Operations
  // ==========================================================================

  async getLinkedStudents(parentId: string): Promise<ParentStudentSummaryDto[]> {
    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentCode: true,
            major: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const approvedStudentIds = Array.from(
      new Set(
        links
          .filter((l) => l.status === "APPROVED")
          .map((l) => l.student.id),
      ),
    );

    const xpByStudentId = new Map<string, number>();
    const ticketCountByStudentId = new Map<string, number>();

    if (approvedStudentIds.length > 0) {
      const [xpGroups, ticketGroups] = await Promise.all([
        this.prisma.xpLedger.groupBy({
          by: ["userId"],
          where: { userId: { in: approvedStudentIds } },
          _sum: { amountXp: true },
        }),
        this.prisma.eventParticipation.groupBy({
          by: ["userId"],
          where: {
            userId: { in: approvedStudentIds },
            participationStatus: { not: "CANCELLED" },
            event: { deletedAt: null },
          },
          _count: { id: true },
        }),
      ]);

      for (const g of xpGroups) {
        if (g.userId) xpByStudentId.set(g.userId, g._sum.amountXp ?? 0);
      }
      for (const g of ticketGroups) {
        if (g.userId) ticketCountByStudentId.set(g.userId, g._count.id);
      }
    }

    return links.map((l) => {
      const isApproved = l.status === "APPROVED";
      return {
        linkId: l.id,
        studentId: l.student.id,
        studentName: l.student.fullName,
        studentEmail: l.student.email,
        studentCode: l.student.studentCode,
        major: l.student.major,
        status: l.status as LinkStatus,
        relationship: l.relationship,
        totalXp: isApproved ? (xpByStudentId.get(l.student.id) ?? 0) : 0,
        ticketsCount: isApproved
          ? (ticketCountByStudentId.get(l.student.id) ?? 0)
          : 0,
        lastActive:
          isApproved && l.student.lastLoginAt
            ? l.student.lastLoginAt.toISOString()
            : null,
      };
    });
  }

  async getLinkedStudentDetail(
    parentId: string,
    studentId: string,
  ): Promise<ParentStudentDetailDto> {
    const link = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: { parentId, studentId },
      },
    });

    if (!link || link.status !== "APPROVED") {
      throw new ForbiddenException({
        code: "UNAUTHORIZED_STUDENT_ACCESS",
        message: "Bạn chưa có liên kết được duyệt để xem thông tin của sinh viên này.",
      });
    }

    const [profile, tickets, gamification] = await Promise.all([
      this.getProfile(studentId),
      this.getTickets(studentId, null),
      this.getGamification(studentId, null),
    ]);

    return {
      student: profile,
      linkStatus: link.status as LinkStatus,
      relationship: link.relationship,
      tickets,
      gamification,
    };
  }

  async createLinkRequest(
    parentId: string,
    dto: CreateLinkRequestDto,
  ): Promise<{ linkId: string; status: LinkStatus }> {
    const trimmed = dto.studentIdentifier.trim().toLowerCase();

    const student = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmed },
          { username: trimmed },
          { studentCode: trimmed },
        ],
        deletedAt: null,
      },
    });

    if (!student) {
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Không tìm thấy sinh viên có email hoặc mã số tương ứng.",
      });
    }

    if (student.id === parentId) {
      throw new BadRequestException({
        code: "CANNOT_LINK_SELF",
        message: "Tài khoản không thể tự liên kết với chính mình.",
      });
    }

    // B1: Server-side validation of target user type
    if (student.userType !== "STUDENT") {
      throw new BadRequestException({
        code: "INVALID_TARGET_USER_TYPE",
        message: "Chỉ có thể gửi yêu cầu liên kết tới tài khoản sinh viên (STUDENT). Không được liên kết tới Quản trị viên, Cán bộ hoặc Phụ huynh.",
      });
    }

    // B1: Server-side validation of target account status
    if (student.accountStatus !== "ACTIVE") {
      throw new BadRequestException({
        code: "STUDENT_ACCOUNT_INACTIVE",
        message: "Tài khoản sinh viên chưa được kích hoạt hoặc đã bị khóa.",
      });
    }

    const link = await this.prisma.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId, studentId: student.id },
      },
      update: {
        status: "PENDING",
        relationship: dto.relationship?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
      create: {
        parentId,
        studentId: student.id,
        status: "PENDING",
        relationship: dto.relationship?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    return {
      linkId: link.id,
      status: link.status as LinkStatus,
    };
  }
}

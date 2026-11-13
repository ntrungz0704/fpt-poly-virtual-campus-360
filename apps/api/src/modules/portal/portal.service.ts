import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  LinkStatus,
  ParentStudentDetailDto,
  ParentStudentSummaryDto,
  PortalProgressDto,
  PortalScheduleItemDto,
  PortalTicketDto,
  StudentLinkRequestItemDto,
  StudentProfileDto,
  UpdateStudentProfileRequest,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { CreateLinkRequestDto, UpdateProfileDto } from "./dto/portal.dto";

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [xpAgg, ticketCount, parentCount] = await Promise.all([
      this.prisma.xpLedger.aggregate({
        where: {
          OR: [
            { userId },
            ...(user.email ? [{ attendeeName: user.fullName }] : []),
          ],
        },
        _sum: { amountXp: true },
      }),
      this.prisma.eventParticipation.count({
        where: {
          OR: [
            { userId },
            ...(user.email ? [{ attendeeEmail: user.email.toLowerCase() }] : []),
          ],
        },
      }),
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
    userEmail: string | null,
  ): Promise<PortalTicketDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const effectiveEmail = (userEmail || user?.email)?.toLowerCase();

    const participations = await this.prisma.eventParticipation.findMany({
      where: {
        OR: [
          { userId },
          ...(effectiveEmail ? [{ attendeeEmail: effectiveEmail }] : []),
        ],
      },
      include: {
        event: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const results: PortalTicketDto[] = [];
    for (const p of participations) {
      const meta = (p.metadataJson ?? {}) as Record<string, unknown>;
      const sessionIds = Array.isArray(meta.sessionIds)
        ? (meta.sessionIds as string[])
        : [];

      let sessionsList: Array<{
        id: string;
        title: string;
        timeRange: string;
        location: string;
      }> = [];

      if (sessionIds.length > 0) {
        const dbSessions = await this.prisma.openDaySession.findMany({
          where: { id: { in: sessionIds }, deletedAt: null },
          select: {
            id: true,
            title: true,
            timeRangeLabel: true,
            customLocationLabel: true,
          },
        });
        sessionsList = dbSessions.map((s) => ({
          id: s.id,
          title: s.title,
          timeRange: s.timeRangeLabel,
          location: s.customLocationLabel,
        }));
      }

      results.push({
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
      });
    }

    return results;
  }

  async getSchedule(
    userId: string,
    userEmail: string | null,
  ): Promise<PortalScheduleItemDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const effectiveEmail = (userEmail || user?.email)?.toLowerCase();

    const [allSessions, userTickets] = await Promise.all([
      this.prisma.openDaySession.findMany({
        where: { deletedAt: null, isPublic: true },
        include: { event: true },
        orderBy: [{ sortOrder: "asc" }, { startTimeLabel: "asc" }],
      }),
      this.prisma.eventParticipation.findMany({
        where: {
          OR: [
            { userId },
            ...(effectiveEmail ? [{ attendeeEmail: effectiveEmail }] : []),
          ],
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
  // 3. Student Gamification & Progress
  // ==========================================================================

  async getGamification(
    userId: string,
    userEmail: string | null,
  ): Promise<PortalProgressDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });
    const effectiveEmail = (userEmail || user?.email)?.toLowerCase();

    const tickets = await this.prisma.eventParticipation.findMany({
      where: {
        OR: [
          { userId },
          ...(effectiveEmail ? [{ attendeeEmail: effectiveEmail }] : []),
        ],
      },
      select: { ticketCode: true },
    });
    const ticketCodes = tickets.map((t) => t.ticketCode);

    const [xpLedgers, quizAttemptsCount, spinHistories] = await Promise.all([
      this.prisma.xpLedger.findMany({
        where: {
          OR: [
            { userId },
            ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      this.prisma.quizAttempt.count({
        where: {
          OR: [
            { userId },
            ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
          ],
        },
      }),
      this.prisma.userSpinHistory.findMany({
        where: {
          OR: [
            { userId },
            ...(ticketCodes.length > 0 ? [{ ticketCode: { in: ticketCodes } }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const totalXp = xpLedgers.reduce((acc, curr) => acc + curr.amountXp, 0);
    const totalSpinsUsed = spinHistories.length;
    // 1 base spin + 1 spin per 50 XP (max 5)
    const totalEarnedSpins = Math.min(5, 1 + Math.floor(totalXp / 50));
    const availableSpins = Math.max(0, totalEarnedSpins - totalSpinsUsed);

    return {
      totalXp,
      level: Math.floor(totalXp / 100) + 1,
      rank: 1, // dynamically computed or top tier
      availableSpins,
      quizAttemptsCount,
      recentXpLedgers: xpLedgers.map((l) => ({
        id: l.id,
        amountXp: l.amountXp,
        source: l.source,
        createdAt: l.createdAt.toISOString(),
      })),
      recentSpins: spinHistories.map((s) => ({
        id: s.id,
        rewardLabel: s.rewardLabel,
        awardedXp: s.awardedXp,
        rewardType: s.rewardType,
        createdAt: s.createdAt.toISOString(),
      })),
    };
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

    const nextStatus: LinkStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    await this.prisma.parentStudentLink.update({
      where: { id: link.id },
      data: { status: nextStatus },
    });

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

    const results: ParentStudentSummaryDto[] = [];
    for (const l of links) {
      const [xpAgg, ticketCount] = await Promise.all([
        this.prisma.xpLedger.aggregate({
          where: { userId: l.student.id },
          _sum: { amountXp: true },
        }),
        this.prisma.eventParticipation.count({
          where: { userId: l.student.id },
        }),
      ]);

      results.push({
        linkId: l.id,
        studentId: l.student.id,
        studentName: l.student.fullName,
        studentEmail: l.student.email,
        studentCode: l.student.studentCode,
        major: l.student.major,
        status: l.status as LinkStatus,
        relationship: l.relationship,
        totalXp: xpAgg._sum.amountXp ?? 0,
        ticketsCount: ticketCount,
        lastActive: l.student.lastLoginAt ? l.student.lastLoginAt.toISOString() : null,
      });
    }

    return results;
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

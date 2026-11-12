import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  AdminCreateUserResponse,
  AdminInvitationSummaryDto,
  AdminUserListItemDto,
  EventParticipationSummaryDto,
  InvitationChannel,
  PermissionCode,
  RoleCode,
} from "@fpt-campus/shared";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../common/adapters/prisma.service";
import {
  createPaginatedPayload,
  type PaginatedPayload,
} from "../../common/interceptors/response-envelope.interceptor";
import {
  normalizeEmailLower,
  tryNormalizePhoneToE164,
} from "../../common/utils/phone-normalizer";
import {
  generateActivationToken,
  sha256Hex,
} from "../../common/utils/token-crypto";
import { AuditLogService } from "../audit-log/audit-log.service";
import type {
  AdminCreateUserDto,
  AdminResendInvitationDto,
  AdminUpdateUserStatusDto,
  AdminUsersQueryDto,
} from "./dto/users.dto";
import {
  INVITATION_DELIVERY_ADAPTER,
  type InvitationDeliveryAdapter,
} from "./invitation-delivery.adapter";

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

const USER_WITH_RELATIONS = {
  userRoles: {
    include: {
      role: true,
    },
  },
  eventParticipations: {
    include: {
      event: true,
    },
  },
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_WITH_RELATIONS;
}>;

@Injectable()
export class UsersRbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    @Inject(INVITATION_DELIVERY_ADAPTER)
    private readonly deliveryAdapter: InvitationDeliveryAdapter,
  ) {}

  async listUsers(
    query: AdminUsersQueryDto,
  ): Promise<PaginatedPayload<AdminUserListItemDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (query.userType) {
      where.userType = query.userType;
    }
    if (query.accountStatus) {
      where.accountStatus = query.accountStatus;
    }
    if (query.activationStatus) {
      where.activationStatus = query.activationStatus;
    }
    if (query.provisioningMethod) {
      where.provisioningMethod = query.provisioningMethod;
    }
    if (query.openDayEventKey) {
      where.eventParticipations = {
        some: {
          event: {
            eventKey: query.openDayEventKey,
            deletedAt: null,
          },
        },
      };
    }
    if (query.q) {
      where.OR = [
        { fullName: { contains: query.q, mode: "insensitive" } },
        { username: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
        { phone: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: USER_WITH_RELATIONS,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedPayload(
      rows.map((u) => this.mapUserListItem(u)),
      page,
      limit,
      total,
    );
  }

  async createUser(
    dto: AdminCreateUserDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminCreateUserResponse> {
    const canManageAll = this.hasManagePermission(actor);

    // D-2A2-01 Rules 2 & 3: provision_openday without users:manage is strictly scoped
    if (!canManageAll) {
      if (dto.userType !== "STUDENT" && dto.userType !== "PARENT") {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message:
            "Quyền users:provision_openday chỉ được phép tạo tài khoản STUDENT hoặc PARENT.",
        });
      }
      if (dto.roleCodes && dto.roleCodes.length > 0) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message:
            "Không được truyền roleCodes hoặc gán quyền quản trị khi thiếu quyền users:manage.",
        });
      }
    }

    // Open Day external accounts never carry admin roles or internal username
    if (
      (dto.userType === "STUDENT" || dto.userType === "PARENT") &&
      dto.roleCodes &&
      dto.roleCodes.length > 0
    ) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Tài khoản STUDENT/PARENT không được gán role quản trị.",
      });
    }

    if (
      (dto.userType === "STUDENT" || dto.userType === "PARENT") &&
      dto.username
    ) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Tài khoản STUDENT/PARENT đăng nhập bằng email hoặc SĐT.",
      });
    }

    const normalizedEmail = normalizeEmailLower(dto.email);
    let normalizedPhone: string | null = null;
    if (dto.phone !== undefined && dto.phone !== null && dto.phone.trim() !== "") {
      normalizedPhone = tryNormalizePhoneToE164(dto.phone);
      if (!normalizedPhone) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Số điện thoại không đúng chuẩn E.164 / Việt Nam.",
        });
      }
    }
    const normalizedUsername = dto.username?.trim() || null;

    if (!normalizedUsername && !normalizedEmail && !normalizedPhone) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Cần ít nhất một thông tin định danh (email, phone hoặc username).",
      });
    }

    if (dto.userType !== "STAFF" && !normalizedEmail && !normalizedPhone) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Tài khoản STUDENT/PARENT bắt buộc có email hoặc số điện thoại.",
      });
    }

    this.assertChannelCompatible(
      dto.provisioningMethod,
      dto.channel,
      normalizedEmail,
      normalizedPhone,
    );

    // Pre-verify requested roles exist in approved RBAC catalog (D-2A2-01 Rule 6)
    const uniqueRoleCodes = Array.from(new Set(dto.roleCodes ?? []));
    const matchedRoles =
      uniqueRoleCodes.length > 0
        ? await this.prisma.role.findMany({
            where: { code: { in: uniqueRoleCodes } },
          })
        : [];
    if (matchedRoles.length !== uniqueRoleCodes.length) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Một hoặc nhiều roleCode không tồn tại trong hệ thống RBAC.",
      });
    }

    // Resolve requested Open Day events
    const uniqueEventKeys = Array.from(
      new Set((dto.eventKeys ?? []).map((k) => k.trim()).filter(Boolean)),
    );
    const matchedEvents =
      uniqueEventKeys.length > 0
        ? await this.prisma.openDayEvent.findMany({
            where: { eventKey: { in: uniqueEventKeys }, deletedAt: null },
          })
        : [];
    if (matchedEvents.length !== uniqueEventKeys.length) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Một hoặc nhiều eventKey không tồn tại hoặc đã bị xóa.",
      });
    }

    // Active uniqueness check BEFORE insert using normalized values (OD-04)
    await this.assertUniqueActiveContact({
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    const rawToken = generateActivationToken();
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    let deliverySentAt: Date | null = null;
    let initialInvitationStatus: "INVITATION_PENDING" | "SENT" | "FAILED" =
      "INVITATION_PENDING";
    let initialActivationStatus: "PENDING_ACTIVATION" | "INVITATION_SENT" =
      "PENDING_ACTIVATION";
    let failureReason: string | null = null;

    if (dto.provisioningMethod === "EMAIL_SMS_INVITATION") {
      const delivery = await this.deliveryAdapter.deliver({
        userId: "pending-create",
        channel: dto.channel as "EMAIL" | "SMS",
        recipientEmail: normalizedEmail,
        recipientPhone: normalizedPhone,
        activationToken: rawToken,
        expiresAt,
      });
      deliverySentAt = delivery.sentAt;
      initialInvitationStatus = delivery.delivered ? "SENT" : "FAILED";
      initialActivationStatus = delivery.delivered
        ? "INVITATION_SENT"
        : "PENDING_ACTIVATION";
      failureReason = delivery.failureReason;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: normalizedUsername,
          fullName: dto.fullName,
          email: normalizedEmail,
          phone: normalizedPhone,
          userType: dto.userType,
          accountStatus: "ACTIVE",
          activationStatus: initialActivationStatus,
          provisioningMethod: dto.provisioningMethod,
          passwordHash: null,
          mustChangePassword: false,
        },
      });

      if (matchedRoles.length > 0) {
        await tx.userRole.createMany({
          data: matchedRoles.map((role) => ({
            userId: user.id,
            roleId: role.id,
          })),
        });
      }

      if (matchedEvents.length > 0) {
        await tx.eventParticipation.createMany({
          data: matchedEvents.map((event) => ({
            userId: user.id,
            eventId: event.id,
            participationStatus: "INVITED",
            provisionedBy: actor.id,
          })),
        });
      }

      const invitation = await tx.accountInvitation.create({
        data: {
          userId: user.id,
          channel: dto.channel,
          tokenHash,
          status: initialInvitationStatus,
          expiresAt,
          sentAt: deliverySentAt,
          resendCount: 0,
          failureReason,
          createdBy: actor.id,
        },
      });

      await this.auditLogService.record({
        tx,
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "USER_PROVISIONED",
        resourceType: "USER",
        resourceId: user.id,
        diffJson: {
          userType: dto.userType,
          provisioningMethod: dto.provisioningMethod,
          channel: dto.channel,
          roleCodes: uniqueRoleCodes,
          eventKeys: uniqueEventKeys,
        },
        ipAddress,
      });

      const reloadedUser = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: USER_WITH_RELATIONS,
      });

      return { user: reloadedUser, invitation };
    });

    const invitationSummary: AdminInvitationSummaryDto = {
      id: created.invitation.id,
      channel: created.invitation.channel,
      status: created.invitation.status,
      expiresAt: created.invitation.expiresAt.toISOString(),
      sentAt: created.invitation.sentAt
        ? created.invitation.sentAt.toISOString()
        : null,
      resendCount: created.invitation.resendCount,
      // D-2A2-01: return raw activationToken strictly ONCE only for ADMIN_DIRECT
      activationToken:
        dto.provisioningMethod === "ADMIN_DIRECT" ? rawToken : null,
    };

    return {
      user: this.mapUserListItem(created.user),
      invitation: invitationSummary,
    };
  }

  async updateUserStatus(
    targetUserId: string,
    dto: AdminUpdateUserStatusDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminUserListItemDto> {
    if (!dto.accountStatus && dto.resetActivation !== true) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Cần cung cấp accountStatus hoặc resetActivation=true.",
      });
    }

    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      include: USER_WITH_RELATIONS,
    });
    if (!target) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy tài khoản mục tiêu.",
      });
    }

    // D-2A2-01 Rule 4: object-level RBAC check against target userType
    this.assertActorCanManageTarget(actor, target.userType);

    if (dto.accountStatus && dto.accountStatus !== "ACTIVE") {
      if (target.id === actor.id || target.username === "admin") {
        throw new UnprocessableEntityException({
          code: "UNPROCESSABLE_ENTITY",
          message:
            "Không thể tự khóa tài khoản đang đăng nhập hoặc khóa tài khoản admin gốc.",
        });
      }
    }

    if (dto.resetActivation && target.username === "admin") {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Không thể reset luồng kích hoạt cho tài khoản admin gốc.",
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const shouldRevokeSessions =
        (dto.accountStatus !== undefined && dto.accountStatus !== "ACTIVE") ||
        dto.resetActivation === true;

      if (shouldRevokeSessions) {
        await tx.refreshToken.updateMany({
          where: { userId: target.id, revokedAt: null },
          data: { revokedAt: now },
        });
      }

      if (dto.resetActivation) {
        await tx.accountInvitation.updateMany({
          where: {
            userId: target.id,
            status: { in: ["INVITATION_PENDING", "SENT"] },
          },
          data: { status: "EXPIRED" },
        });
      }

      const saved = await tx.user.update({
        where: { id: target.id },
        data: {
          ...(dto.accountStatus ? { accountStatus: dto.accountStatus } : {}),
          ...(dto.resetActivation
            ? {
                passwordHash: null,
                activationStatus: "PENDING_ACTIVATION",
                mustChangePassword: false,
                failedLoginAttempts: 0,
                lockedUntil: null,
              }
            : {}),
        },
        include: USER_WITH_RELATIONS,
      });

      await this.auditLogService.record({
        tx,
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "USER_STATUS_UPDATED",
        resourceType: "USER",
        resourceId: target.id,
        diffJson: {
          previousAccountStatus: target.accountStatus,
          newAccountStatus: saved.accountStatus,
          resetActivation: Boolean(dto.resetActivation),
          sessionsRevoked: shouldRevokeSessions,
        },
        ipAddress,
      });

      return saved;
    });

    return this.mapUserListItem(updated);
  }

  async resendInvitation(
    targetUserId: string,
    dto: AdminResendInvitationDto,
    actor: AuthenticatedUser,
    ipAddress: string | null,
  ): Promise<AdminInvitationSummaryDto> {
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      include: {
        invitationsReceived: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!target) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy tài khoản cần gửi lại lời mời.",
      });
    }

    // D-2A2-01 Rule 4: object-level RBAC check against target userType
    this.assertActorCanManageTarget(actor, target.userType);

    if (target.accountStatus !== "ACTIVE") {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Không thể gửi lại lời mời cho tài khoản đang bị khóa hoặc lưu trữ.",
      });
    }
    if (target.activationStatus === "ACTIVATED") {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Tài khoản đã hoàn tất kích hoạt trước đó.",
      });
    }
    if (target.provisioningMethod === "BOOTSTRAP") {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Tài khoản bootstrap không sử dụng luồng lời mời kích hoạt.",
      });
    }

    const previousInvitation = target.invitationsReceived[0];
    const channel: InvitationChannel =
      dto.channel ??
      previousInvitation?.channel ??
      (target.provisioningMethod === "ADMIN_DIRECT" ? "DIRECT_LINK" : "EMAIL");

    this.assertChannelCompatible(
      target.provisioningMethod,
      channel,
      target.email,
      target.phone,
    );

    const rawToken = generateActivationToken();
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    const nextResendCount = (previousInvitation?.resendCount ?? 0) + 1;

    let sentAt: Date | null = null;
    let invStatus: "INVITATION_PENDING" | "SENT" | "FAILED" =
      "INVITATION_PENDING";
    let userActStatus: "PENDING_ACTIVATION" | "INVITATION_SENT" =
      "PENDING_ACTIVATION";
    let failureReason: string | null = null;

    if (target.provisioningMethod === "EMAIL_SMS_INVITATION") {
      const delivery = await this.deliveryAdapter.deliver({
        userId: target.id,
        channel: channel as "EMAIL" | "SMS",
        recipientEmail: target.email,
        recipientPhone: target.phone,
        activationToken: rawToken,
        expiresAt,
      });
      sentAt = delivery.sentAt;
      invStatus = delivery.delivered ? "SENT" : "FAILED";
      userActStatus = delivery.delivered
        ? "INVITATION_SENT"
        : "PENDING_ACTIVATION";
      failureReason = delivery.failureReason;
    }

    const createdInvitation = await this.prisma.$transaction(async (tx) => {
      await tx.accountInvitation.updateMany({
        where: {
          userId: target.id,
          status: { in: ["INVITATION_PENDING", "SENT"] },
        },
        data: { status: "EXPIRED" },
      });

      const inv = await tx.accountInvitation.create({
        data: {
          userId: target.id,
          channel,
          tokenHash,
          status: invStatus,
          expiresAt,
          sentAt,
          resendCount: nextResendCount,
          failureReason,
          createdBy: actor.id,
        },
      });

      await tx.user.update({
        where: { id: target.id },
        data: { activationStatus: userActStatus },
      });

      await this.auditLogService.record({
        tx,
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "INVITATION_RESENT",
        resourceType: "USER",
        resourceId: target.id,
        diffJson: {
          channel,
          resendCount: nextResendCount,
          invitationId: inv.id,
        },
        ipAddress,
      });

      return inv;
    });

    return {
      id: createdInvitation.id,
      channel: createdInvitation.channel,
      status: createdInvitation.status,
      expiresAt: createdInvitation.expiresAt.toISOString(),
      sentAt: createdInvitation.sentAt
        ? createdInvitation.sentAt.toISOString()
        : null,
      resendCount: createdInvitation.resendCount,
      activationToken:
        target.provisioningMethod === "ADMIN_DIRECT" ? rawToken : null,
    };
  }

  private hasManagePermission(actor: AuthenticatedUser): boolean {
    return actor.permissions.includes("users:manage" as PermissionCode);
  }

  private assertActorCanManageTarget(
    actor: AuthenticatedUser,
    targetUserType: UserWithRelations["userType"],
  ): void {
    if (this.hasManagePermission(actor)) {
      return;
    }
    if (targetUserType !== "STUDENT" && targetUserType !== "PARENT") {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message:
          "Quyền users:provision_openday chỉ được phép thao tác trên tài khoản STUDENT hoặc PARENT.",
      });
    }
  }

  private assertChannelCompatible(
    method: "BOOTSTRAP" | "ADMIN_DIRECT" | "EMAIL_SMS_INVITATION",
    channel: InvitationChannel,
    email: string | null,
    phone: string | null,
  ): void {
    if (method === "ADMIN_DIRECT" && channel !== "DIRECT_LINK") {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Phương thức ADMIN_DIRECT phải sử dụng channel DIRECT_LINK.",
      });
    }
    if (method === "EMAIL_SMS_INVITATION" && channel === "DIRECT_LINK") {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Phương thức EMAIL_SMS_INVITATION yêu cầu channel EMAIL hoặc SMS.",
      });
    }
    if (channel === "EMAIL" && !email) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Channel EMAIL yêu cầu địa chỉ email hợp lệ.",
      });
    }
    if (channel === "SMS" && !phone) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Channel SMS yêu cầu số điện thoại hợp lệ.",
      });
    }
  }

  private async assertUniqueActiveContact(input: {
    username: string | null;
    email: string | null;
    phone: string | null;
  }): Promise<void> {
    const orClauses: Prisma.UserWhereInput[] = [];
    if (input.username) orClauses.push({ username: input.username });
    if (input.email) orClauses.push({ email: input.email });
    if (input.phone) orClauses.push({ phone: input.phone });

    if (orClauses.length === 0) return;

    const existing = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: orClauses,
      },
      select: { id: true, username: true, email: true, phone: true },
    });

    if (existing) {
      throw new ConflictException({
        code: "CONFLICT",
        message:
          "Tài khoản với username, email hoặc số điện thoại này đã tồn tại.",
      });
    }
  }

  private mapUserListItem(user: UserWithRelations): AdminUserListItemDto {
    const eventParticipations: EventParticipationSummaryDto[] =
      user.eventParticipations
        .filter((ep) => ep.event.deletedAt === null)
        .map((ep) => ({
          id: ep.id,
          eventId: ep.eventId,
          eventKey: ep.event.eventKey,
          eventTitle: ep.event.title,
          eventDate: ep.event.eventDate
            ? ep.event.eventDate.toISOString().slice(0, 10)
            : null,
          participationStatus: ep.participationStatus,
        }));

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      accountStatus: user.accountStatus,
      activationStatus: user.activationStatus,
      provisioningMethod: user.provisioningMethod,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      roles: user.userRoles.map((ur) => ur.role.code as RoleCode),
      eventParticipations,
    };
  }
}

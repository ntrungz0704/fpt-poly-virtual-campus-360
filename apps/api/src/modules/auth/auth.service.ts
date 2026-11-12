import crypto from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Prisma } from "@prisma/client";
import type {
  ActivateValidateResponse,
  AuthUserProfileDto,
  EventParticipationSummaryDto,
  LoginResponse,
  PermissionCode,
  RoleCode,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { JwtAccessPayload } from "../../common/guards/jwt-auth.guard";
import { tryNormalizePhoneToE164 } from "../../common/utils/phone-normalizer";
import {
  generateOpaqueRefreshToken,
  hashPasswordArgon2id,
  sha256Hex,
  validatePasswordStrength,
  verifyPasswordArgon2id,
} from "../../common/utils/token-crypto";
import type { AppConfigValues } from "../../config/env.schema";
import { AuditLogService } from "../audit-log/audit-log.service";
import type {
  ActivateCompleteDto,
  ActivateValidateDto,
  ChangePasswordDto,
  LoginDto,
} from "./dto/auth.dto";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const BRUTE_FORCE_LOCK_MS = 15 * 60 * 1000;
const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$Y29uc3RhbnRkdW1teXNhbHQ$r6e0k6n3y9b9M3g5Y2x3aG9zdG1hY2hpbmVkdW1teQ";

const AUTH_USER_INCLUDE = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
  eventParticipations: {
    include: {
      event: true,
    },
  },
} satisfies Prisma.UserInclude;

type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof AUTH_USER_INCLUDE;
}>;

export interface SessionIssueResult {
  loginResponse: LoginResponse;
  rawRefreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfigValues, true>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(
    dto: LoginDto,
    meta: { ipAddress: string | null; userAgent: string | null },
  ): Promise<SessionIssueResult> {
    const user = await this.findActiveUserByIdentifier(dto.identifier);
    const now = new Date();

    if (
      !user ||
      user.accountStatus !== "ACTIVE" ||
      user.activationStatus !== "ACTIVATED" ||
      !user.passwordHash
    ) {
      // Mitigate timing variance when account is not found or has no hash
      await verifyPasswordArgon2id(DUMMY_ARGON2_HASH, dto.password);
      await this.auditLogService.record({
        actorUserId: user?.id ?? null,
        actorUsername: user?.username ?? null,
        action: "LOGIN_FAILED",
        resourceType: "AUTH_SESSION",
        resourceId: user?.id ?? null,
        diffJson: { reason: "INVALID_CREDENTIALS_OR_UNACTIVATED" },
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Thông tin đăng nhập không hợp lệ hoặc tài khoản đang bị khóa.",
      });
    }

    if (user.lockedUntil && user.lockedUntil > now) {
      await this.auditLogService.record({
        actorUserId: user.id,
        actorUsername: user.username,
        action: "LOGIN_LOCKED_ATTEMPT",
        resourceType: "USER",
        resourceId: user.id,
        diffJson: { lockedUntil: user.lockedUntil.toISOString() },
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Thông tin đăng nhập không hợp lệ hoặc tài khoản đang bị khóa.",
      });
    }

    const passwordValid = await verifyPasswordArgon2id(
      user.passwordHash,
      dto.password,
    );
    if (!passwordValid) {
      const priorFailures =
        user.lockedUntil && user.lockedUntil <= now
          ? 0
          : user.failedLoginAttempts;
      const nextFailures = priorFailures + 1;
      const lockedUntil =
        nextFailures >= MAX_FAILED_LOGIN_ATTEMPTS
          ? new Date(now.getTime() + BRUTE_FORCE_LOCK_MS)
          : null;

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: nextFailures,
            lockedUntil,
          },
        });
        await this.auditLogService.record({
          tx,
          actorUserId: user.id,
          actorUsername: user.username,
          action:
            lockedUntil !== null
              ? "ACCOUNT_LOCKED_BRUTE_FORCE"
              : "LOGIN_FAILED",
          resourceType: "USER",
          resourceId: user.id,
          diffJson: {
            failedLoginAttempts: nextFailures,
            ...(lockedUntil ? { lockedUntil: lockedUntil.toISOString() } : {}),
          },
          ipAddress: meta.ipAddress,
        });
      });

      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Thông tin đăng nhập không hợp lệ hoặc tài khoản đang bị khóa.",
      });
    }

    const rawRefreshToken = generateOpaqueRefreshToken();
    const tokenHash = sha256Hex(rawRefreshToken);
    const familyId = crypto.randomUUID();
    const refreshTtlMs = this.configService.get("refreshTokenTtlMs", {
      infer: true,
    });
    const refreshExpiresAt = new Date(now.getTime() + refreshTtlMs);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const savedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: now,
        },
        include: AUTH_USER_INCLUDE,
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          familyId,
          expiresAt: refreshExpiresAt,
          userAgent: meta.userAgent ? meta.userAgent.slice(0, 512) : null,
          ipAddress: meta.ipAddress,
        },
      });

      await this.auditLogService.record({
        tx,
        actorUserId: user.id,
        actorUsername: user.username,
        action: "LOGIN_SUCCESS",
        resourceType: "USER",
        resourceId: user.id,
        diffJson: { familyId },
        ipAddress: meta.ipAddress,
      });

      return savedUser;
    });

    const profile = this.mapAuthUserProfile(updatedUser);
    const accessToken = await this.signAccessJwt(profile);

    return {
      loginResponse: { accessToken, user: profile },
      rawRefreshToken,
    };
  }

  async refresh(
    rawCookieToken: string | undefined,
    meta: { ipAddress: string | null; userAgent: string | null },
  ): Promise<SessionIssueResult> {
    if (!rawCookieToken || rawCookieToken.trim().length < 16) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên làm việc không hợp lệ hoặc đã hết hạn.",
      });
    }

    const tokenHash = sha256Hex(rawCookieToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: AUTH_USER_INCLUDE,
        },
      },
    });

    if (!existing) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên làm việc không hợp lệ hoặc đã hết hạn.",
      });
    }

    const now = new Date();

    // Reuse Attack Detection: revoked token presented again -> revoke ENTIRE family_id
    if (existing.revokedAt !== null) {
      await this.prisma.$transaction(async (tx) => {
        await tx.refreshToken.updateMany({
          where: { familyId: existing.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        await this.auditLogService.record({
          tx,
          actorUserId: existing.userId,
          actorUsername: existing.user.username,
          action: "REFRESH_TOKEN_REUSE_DETECTED",
          resourceType: "REFRESH_FAMILY",
          resourceId: existing.familyId,
          diffJson: { compromisedTokenId: existing.id },
          ipAddress: meta.ipAddress,
        });
      });

      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên làm việc đã bị thu hồi do phát hiện dấu hiệu dùng lại token.",
      });
    }

    const user = existing.user;
    if (
      existing.expiresAt <= now ||
      user.deletedAt !== null ||
      user.accountStatus !== "ACTIVE" ||
      user.activationStatus !== "ACTIVATED"
    ) {
      await this.prisma.$transaction(async (tx) => {
        await tx.refreshToken.updateMany({
          where: { id: existing.id, revokedAt: null },
          data: { revokedAt: now },
        });
        await this.auditLogService.record({
          tx,
          actorUserId: existing.userId,
          actorUsername: user.username,
          action: "REFRESH_TOKEN_EXPIRED_OR_INVALID_USER",
          resourceType: "REFRESH_TOKEN",
          resourceId: existing.id,
          ipAddress: meta.ipAddress,
        });
      });

      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên làm việc đã hết hạn hoặc tài khoản bị vô hiệu hóa.",
      });
    }

    const nextRawToken = generateOpaqueRefreshToken();
    const nextTokenHash = sha256Hex(nextRawToken);
    const refreshTtlMs = this.configService.get("refreshTokenTtlMs", {
      infer: true,
    });
    const nextExpiresAt = new Date(now.getTime() + refreshTtlMs);

    const rotationOutcome = await this.prisma.$transaction(async (tx) => {
      // Atomic CAS update guards against concurrent replay races
      const updatedCount = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: now },
      });

      if (updatedCount.count === 0) {
        await tx.refreshToken.updateMany({
          where: { familyId: existing.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        await this.auditLogService.record({
          tx,
          actorUserId: existing.userId,
          actorUsername: user.username,
          action: "REFRESH_TOKEN_REUSE_DETECTED",
          resourceType: "REFRESH_FAMILY",
          resourceId: existing.familyId,
          diffJson: { concurrentRaceTokenId: existing.id },
          ipAddress: meta.ipAddress,
        });
        return { rotated: false as const };
      }

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: nextTokenHash,
          familyId: existing.familyId,
          expiresAt: nextExpiresAt,
          userAgent: meta.userAgent ? meta.userAgent.slice(0, 512) : null,
          ipAddress: meta.ipAddress,
        },
      });

      return { rotated: true as const };
    });

    if (!rotationOutcome.rotated) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Phiên làm việc đã bị thu hồi do phát hiện dùng lại token.",
      });
    }

    const profile = this.mapAuthUserProfile(user);
    const accessToken = await this.signAccessJwt(profile);

    return {
      loginResponse: { accessToken, user: profile },
      rawRefreshToken: nextRawToken,
    };
  }

  async logout(
    rawCookieToken: string | undefined,
    meta: { ipAddress: string | null },
  ): Promise<{ loggedOut: true }> {
    if (rawCookieToken && rawCookieToken.trim().length > 0) {
      const tokenHash = sha256Hex(rawCookieToken);
      const tokenRow = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: { select: { id: true, username: true } } },
      });

      if (tokenRow) {
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
          await tx.refreshToken.updateMany({
            where: { id: tokenRow.id, revokedAt: null },
            data: { revokedAt: now },
          });
          await this.auditLogService.record({
            tx,
            actorUserId: tokenRow.user.id,
            actorUsername: tokenRow.user.username,
            action: "LOGOUT",
            resourceType: "AUTH_SESSION",
            resourceId: tokenRow.familyId,
            ipAddress: meta.ipAddress,
          });
        });
      }
    }

    return { loggedOut: true };
  }

  async getMe(userId: string): Promise<AuthUserProfileDto> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: AUTH_USER_INCLUDE,
    });
    if (!user || user.accountStatus !== "ACTIVE") {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Không thể xác thực thông tin tài khoản hiện tại.",
      });
    }
    return this.mapAuthUserProfile(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    rawCookieToken: string | undefined,
    meta: { ipAddress: string | null },
  ): Promise<{ updated: true; mustChangePassword: false }> {
    const strength = validatePasswordStrength(dto.newPassword);
    if (!strength.valid) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: strength.reason ?? "Mật khẩu mới không đạt chuẩn bảo mật.",
      });
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
      });
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user || user.accountStatus !== "ACTIVE" || !user.passwordHash) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Tài khoản không hợp lệ.",
      });
    }

    const currentMatches = await verifyPasswordArgon2id(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!currentMatches) {
      await this.auditLogService.record({
        actorUserId: user.id,
        actorUsername: user.username,
        action: "PASSWORD_CHANGE_FAILED",
        resourceType: "USER",
        resourceId: user.id,
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Mật khẩu hiện tại không chính xác.",
      });
    }

    const newHash = await hashPasswordArgon2id(dto.newPassword);
    const currentCookieHash = rawCookieToken ? sha256Hex(rawCookieToken) : null;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
        },
      });

      const currentSession = currentCookieHash
        ? await tx.refreshToken.findFirst({
            where: {
              tokenHash: currentCookieHash,
              userId: user.id,
              revokedAt: null,
            },
            select: { id: true },
          })
        : null;

      await tx.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
          ...(currentSession ? { id: { not: currentSession.id } } : {}),
        },
        data: { revokedAt: now },
      });

      await this.auditLogService.record({
        tx,
        actorUserId: user.id,
        actorUsername: user.username,
        action: "PASSWORD_CHANGED",
        resourceType: "USER",
        resourceId: user.id,
        diffJson: {
          preservedCurrentSession: Boolean(currentSession),
        },
        ipAddress: meta.ipAddress,
      });
    });

    return { updated: true, mustChangePassword: false };
  }

  async validateActivationToken(
    dto: ActivateValidateDto,
  ): Promise<ActivateValidateResponse> {
    const tokenHash = sha256Hex(dto.token);
    const now = new Date();

    const invitation = await this.prisma.accountInvitation.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            fullName: true,
            accountStatus: true,
            activationStatus: true,
            deletedAt: true,
          },
        },
      },
    });

    const isValid =
      invitation !== null &&
      (invitation.status === "INVITATION_PENDING" ||
        invitation.status === "SENT") &&
      invitation.activatedAt === null &&
      invitation.expiresAt > now &&
      invitation.user.deletedAt === null &&
      invitation.user.accountStatus === "ACTIVE" &&
      (invitation.user.activationStatus === "PENDING_ACTIVATION" ||
        invitation.user.activationStatus === "INVITATION_SENT");

    if (!isValid || !invitation) {
      return {
        valid: false,
        fullName: null,
        channel: null,
        expiresAt: null,
      };
    }

    return {
      valid: true,
      fullName: invitation.user.fullName,
      channel: invitation.channel,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async completeActivation(
    dto: ActivateCompleteDto,
    meta: { ipAddress: string | null },
  ): Promise<{ activated: true }> {
    const strength = validatePasswordStrength(dto.newPassword);
    if (!strength.valid) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: strength.reason ?? "Mật khẩu không đạt chuẩn bảo mật.",
      });
    }

    const tokenHash = sha256Hex(dto.token);
    const passwordHash = await hashPasswordArgon2id(dto.newPassword);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.accountInvitation.updateMany({
        where: {
          tokenHash,
          status: { in: ["INVITATION_PENDING", "SENT"] },
          activatedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          status: "ACTIVATED",
          activatedAt: now,
        },
      });

      if (claimed.count === 0) {
        const existing = await tx.accountInvitation.findUnique({
          where: { tokenHash },
          select: { status: true, activatedAt: true, expiresAt: true },
        });
        if (existing?.activatedAt || existing?.status === "ACTIVATED") {
          return { ok: false as const, conflict: true as const };
        }
        return { ok: false as const, conflict: false as const };
      }

      const invitation = await tx.accountInvitation.findUniqueOrThrow({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        invitation.user.deletedAt !== null ||
        invitation.user.accountStatus !== "ACTIVE"
      ) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Tài khoản không đủ điều kiện để kích hoạt.",
        });
      }

      await tx.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash,
          activationStatus: "ACTIVATED",
          mustChangePassword: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      await tx.accountInvitation.updateMany({
        where: {
          userId: invitation.userId,
          id: { not: invitation.id },
          status: { in: ["INVITATION_PENDING", "SENT"] },
        },
        data: { status: "EXPIRED" },
      });

      await this.auditLogService.record({
        tx,
        actorUserId: invitation.userId,
        actorUsername: invitation.user.username,
        action: "ACCOUNT_ACTIVATED",
        resourceType: "USER",
        resourceId: invitation.userId,
        diffJson: { channel: invitation.channel, invitationId: invitation.id },
        ipAddress: meta.ipAddress,
      });

      return { ok: true as const };
    });

    if (!result.ok) {
      if (result.conflict) {
        throw new ConflictException({
          code: "CONFLICT",
          message: "Mã kích hoạt này đã được sử dụng trước đó.",
        });
      }
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Mã kích hoạt không hợp lệ hoặc đã hết hạn.",
      });
    }

    return { activated: true };
  }

  private async findActiveUserByIdentifier(
    rawIdentifier: string,
  ): Promise<AuthUserRecord | null> {
    const trimmed = rawIdentifier.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.includes("@")) {
      return this.prisma.user.findFirst({
        where: { email: trimmed.toLowerCase(), deletedAt: null },
        include: AUTH_USER_INCLUDE,
      });
    }

    const normalizedPhone = tryNormalizePhoneToE164(trimmed);
    if (normalizedPhone) {
      const byPhone = await this.prisma.user.findFirst({
        where: { phone: normalizedPhone, deletedAt: null },
        include: AUTH_USER_INCLUDE,
      });
      if (byPhone) {
        return byPhone;
      }
    }

    return this.prisma.user.findFirst({
      where: { username: trimmed, deletedAt: null },
      include: AUTH_USER_INCLUDE,
    });
  }

  private async signAccessJwt(profile: AuthUserProfileDto): Promise<string> {
    const payload: JwtAccessPayload = {
      sub: profile.id,
      username: profile.username,
      roles: profile.roles,
      pwdRequired: profile.mustChangePassword,
      jti: crypto.randomUUID(),
    };
    return this.jwtService.signAsync(payload);
  }

  private mapAuthUserProfile(user: AuthUserRecord): AuthUserProfileDto {
    const rolesSet = new Set<RoleCode>();
    const permissionsSet = new Set<PermissionCode>();
    for (const ur of user.userRoles) {
      rolesSet.add(ur.role.code as RoleCode);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code as PermissionCode);
      }
    }

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
      roles: Array.from(rolesSet),
      permissions: Array.from(permissionsSet),
      eventParticipations,
    };
  }
}

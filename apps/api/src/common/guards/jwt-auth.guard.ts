import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { PermissionCode, RoleCode } from "@fpt-campus/shared";
import { PrismaService } from "../adapters/prisma.service";
import {
  IS_PUBLIC_KEY,
  type AuthenticatedUser,
  type RequestWithAuth,
} from "../decorators/auth.decorators";
import type { AppConfigValues } from "../../config/env.schema";

export interface JwtAccessPayload {
  sub: string;
  username: string | null;
  roles: RoleCode[];
  pwdRequired: boolean;
  jti: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfigValues, true>,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Xác thực không hợp lệ hoặc phiên đã hết hạn.",
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Xác thực không hợp lệ hoặc phiên đã hết hạn.",
      });
    }

    let payload: JwtAccessPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.configService.get("JWT_SECRET", { infer: true }),
      });
    } catch {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Xác thực không hợp lệ hoặc phiên đã hết hạn.",
      });
    }

    if (!payload.sub) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Xác thực không hợp lệ hoặc phiên đã hết hạn.",
      });
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        deletedAt: null,
      },
      include: {
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
      },
    });

    if (
      !user ||
      user.accountStatus !== "ACTIVE" ||
      user.activationStatus !== "ACTIVATED"
    ) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Tài khoản không khả dụng hoặc phiên đã bị thu hồi.",
      });
    }

    const rolesSet = new Set<RoleCode>();
    const permissionsSet = new Set<PermissionCode>();
    for (const ur of user.userRoles) {
      rolesSet.add(ur.role.code as RoleCode);
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code as PermissionCode);
      }
    }

    const authUser: AuthenticatedUser = {
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
    };

    req.user = authUser;
    return true;
  }
}

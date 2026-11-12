import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PermissionCode } from "@fpt-campus/shared";
import {
  IS_PUBLIC_KEY,
  REQUIRED_ANY_PERMISSION_KEY,
  REQUIRED_PERMISSIONS_KEY,
  type RequestWithAuth,
} from "../decorators/auth.decorators";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredAll =
      this.reflector.getAllAndOverride<PermissionCode[]>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    const requiredAny =
      this.reflector.getAllAndOverride<PermissionCode[]>(
        REQUIRED_ANY_PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredAll.length === 0 && requiredAny.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const userPermissions = new Set<PermissionCode>(req.user?.permissions ?? []);

    if (requiredAll.length > 0) {
      const hasAll = requiredAll.every((perm) => userPermissions.has(perm));
      if (!hasAll) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Bạn không có quyền thực hiện thao tác quản trị này.",
        });
      }
    }

    if (requiredAny.length > 0) {
      const hasAny = requiredAny.some((perm) => userPermissions.has(perm));
      if (!hasAny) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Bạn không có quyền thực hiện thao tác quản trị này.",
        });
      }
    }

    return true;
  }
}

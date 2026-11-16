import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type {
  AccountStatus,
  ActivationStatus,
  PermissionCode,
  ProvisioningMethod,
  RoleCode,
  UserType,
} from "@fpt-campus/shared";
import type { Request } from "express";

export const IS_PUBLIC_KEY = "isPublic";
export const IS_OPTIONAL_AUTH_KEY = "isOptionalAuth";
export const ALLOW_MUST_CHANGE_PASSWORD_KEY = "allowMustChangePassword";
export const REQUIRED_PERMISSIONS_KEY = "requiredPermissions";
export const REQUIRED_ANY_PERMISSION_KEY = "requiredAnyPermission";

export interface AuthenticatedUser {
  id: string;
  username: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  userType: UserType;
  accountStatus: AccountStatus;
  activationStatus: ActivationStatus;
  provisioningMethod: ProvisioningMethod;
  mustChangePassword: boolean;
  roles: RoleCode[];
  permissions: PermissionCode[];
}

export interface RequestWithAuth extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Use alongside `@Public()` when an endpoint serves both anonymous guests and
 * authenticated users, populating `@CurrentUser()` if a valid active Bearer JWT
 * is supplied without rejecting missing/expired tokens.
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

export const AllowMustChangePassword = () =>
  SetMetadata(ALLOW_MUST_CHANGE_PASSWORD_KEY, true);

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

export const RequireAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_ANY_PERMISSION_KEY, permissions);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const req = ctx.switchToHttp().getRequest<RequestWithAuth>();
    return req.user;
  },
);

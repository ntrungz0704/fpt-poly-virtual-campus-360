import type { AuthUserProfileDto, PermissionCode, RoleCode, UserType } from "@fpt-campus/shared";

const ADMIN_ROUTE_PERMISSIONS: ReadonlyArray<{
  prefix: string;
  anyOf: readonly PermissionCode[];
}> = [
  {
    prefix: "/admin/locations",
    anyOf: ["campus:write", "location:write", "floorplan:write"],
  },
  {
    prefix: "/admin/virtual-tour",
    anyOf: ["tour:write", "tour:publish", "floorplan:write"],
  },
  {
    prefix: "/admin/events",
    anyOf: ["events:write"],
  },
  {
    prefix: "/admin/media",
    anyOf: ["media:upload"],
  },
  {
    prefix: "/admin/users",
    anyOf: ["users:manage", "users:provision_openday"],
  },
];

const DISALLOWED_NEXT_PREFIXES = ["/login", "/change-password", "/logout", "/api"];

export function isProtectedAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/portal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/change-password" ||
    pathname.startsWith("/change-password/")
  );
}

/**
 * Accepts strictly relative in-app paths (`/portal`, `/admin/events?tab=1`)
 * and rejects protocol-relative (`//`), external URLs, or auth-loop targets.
 */
export function sanitizeInternalNextPath(
  rawNext: string | null | undefined,
): string | null {
  if (!rawNext || typeof rawNext !== "string") {
    return null;
  }
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return null;
  }
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return null;
  }
  if (
    DISALLOWED_NEXT_PREFIXES.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}?`) || trimmed.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }
  return trimmed;
}

export function canAccessAdmin(user: AuthUserProfileDto | null | undefined): boolean {
  if (!user) return false;
  if (user.accountStatus !== "ACTIVE" || user.activationStatus !== "ACTIVATED") {
    return false;
  }
  if (user.userType !== "ADMIN" && user.userType !== "STAFF") {
    return false;
  }
  return user.roles.length > 0 || user.permissions.length > 0;
}

export function getRequiredPermissionsForAdminPath(pathname: string): readonly PermissionCode[] {
  const match = ADMIN_ROUTE_PERMISSIONS.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
  return match ? match.anyOf : [];
}

export function hasRequiredAdminPathPermission(
  user: AuthUserProfileDto | null | undefined,
  pathname: string,
): boolean {
  if (!user || !canAccessAdmin(user)) {
    return false;
  }
  const requiredAny = getRequiredPermissionsForAdminPath(pathname);
  if (requiredAny.length === 0) {
    return true;
  }
  return requiredAny.some((perm) => user.permissions.includes(perm));
}

export function resolvePostAuthRoute(
  user: AuthUserProfileDto,
  nextPath?: string | null,
): string {
  const safeNext = sanitizeInternalNextPath(nextPath);

  if (user.mustChangePassword) {
    return safeNext
      ? `/change-password?next=${encodeURIComponent(safeNext)}`
      : "/change-password";
  }

  if (safeNext) {
    if (
      (safeNext === "/admin" || safeNext.startsWith("/admin/")) &&
      !canAccessAdmin(user)
    ) {
      return "/portal";
    }
    return safeNext;
  }

  return canAccessAdmin(user) ? "/admin" : "/portal";
}

const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: "Quản trị viên Hệ thống",
  TOUR_EDITOR: "Biên tập viên Tour 360°",
  EVENT_OPERATOR: "Điều phối viên Open Day",
};

const USER_TYPE_LABELS: Record<UserType, string> = {
  ADMIN: "Quản trị viên",
  STAFF: "Cán bộ / Nhân sự",
  STUDENT: "Sinh viên / Học sinh",
  PARENT: "Phụ huynh",
};

export function getPrimaryRoleLabel(user: AuthUserProfileDto): string {
  if (user.roles.length > 0) {
    return ROLE_LABELS[user.roles[0]] ?? user.roles[0];
  }
  return USER_TYPE_LABELS[user.userType] ?? user.userType;
}

export function getUserTypeLabel(userType: UserType): string {
  return USER_TYPE_LABELS[userType] ?? userType;
}

export function getUserInitials(fullName: string | null | undefined): string {
  const parts = (fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "VC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export interface PasswordValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function validateNewPasswordClient(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): { valid: boolean; fieldErrors: PasswordValidationErrors } {
  const fieldErrors: PasswordValidationErrors = {};

  if (!currentPassword) {
    fieldErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!newPassword) {
    fieldErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (newPassword.length < 12) {
    fieldErrors.newPassword = "Mật khẩu mới phải có tối thiểu 12 ký tự.";
  } else if (newPassword.length > 128) {
    fieldErrors.newPassword = "Mật khẩu mới không được vượt quá 128 ký tự.";
  } else if (!newPassword.trim()) {
    fieldErrors.newPassword = "Mật khẩu mới không được chỉ chứa khoảng trắng.";
  } else if (currentPassword && newPassword === currentPassword) {
    fieldErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Vui lòng xác nhận lại mật khẩu mới.";
  } else if (confirmPassword !== newPassword) {
    fieldErrors.confirmPassword = "Xác nhận mật khẩu mới chưa khớp.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge, Button, LoadingState } from "@/components/ui";
import {
  canAccessAdmin,
  getPrimaryRoleLabel,
  getRequiredPermissionsForAdminPath,
  hasRequiredAdminPathPermission,
} from "@/lib/auth/auth-routing";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  checkModulePermissions?: boolean;
  allowMustChangePassword?: boolean;
}

export function AdminModulePermissionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/admin";
  const { user } = useAuth();

  if (!user || !hasRequiredAdminPathPermission(user, pathname)) {
    const requiredPerms = getRequiredPermissionsForAdminPath(pathname);
    return (
      <div className="min-h-[55vh] flex items-center justify-center px-4 py-10">
        <div
          role="alert"
          data-testid="forbidden-module-state"
          className="ui-card max-w-lg w-full p-6 sm:p-8 text-center space-y-4"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-warning-container text-on-warning-container flex items-center justify-center">
            <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
              lock
            </span>
          </div>
          <Badge variant="warning">403 · Thiếu quyền phân khu</Badge>
          <h1 className="type-h3 text-on-surface">
            Vai trò hiện tại không có quyền mở phân khu này
          </h1>
          <p className="type-body-sm text-secondary">
            Phân khu yêu cầu một trong các quyền:{" "}
            <code className="font-mono text-xs">{requiredPerms.join(", ")}</code>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/admin"
              className="ui-btn ui-btn-primary min-h-[42px] px-4 py-2 text-sm"
            >
              Quay lại Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  checkModulePermissions = true,
  allowMustChangePassword = false,
}: ProtectedRouteProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const {
    status,
    user,
    hasVerifiedWithBackend,
    ensureSessionChecked,
    logout,
  } = useAuth();

  // If the user navigated from a public page without a session hint cookie,
  // still probe the backend once before concluding unauthenticated.
  useEffect(() => {
    if (status === "unauthenticated" && !hasVerifiedWithBackend) {
      void ensureSessionChecked();
    }
  }, [status, hasVerifiedWithBackend, ensureSessionChecked]);

  useEffect(() => {
    if (status === "loading" || !hasVerifiedWithBackend) return;

    if (status === "unauthenticated") {
      const target =
        pathname && pathname !== "/"
          ? `/login?next=${encodeURIComponent(pathname)}&reason=auth_required`
          : "/login";
      router.replace(target);
      return;
    }

    if (
      status === "authenticated" &&
      user?.mustChangePassword &&
      !allowMustChangePassword
    ) {
      const target =
        pathname && pathname !== "/change-password"
          ? `/change-password?next=${encodeURIComponent(pathname)}`
          : "/change-password";
      router.replace(target);
    }
  }, [
    status,
    hasVerifiedWithBackend,
    user,
    allowMustChangePassword,
    pathname,
    router,
  ]);

  if (status === "loading" || (status === "unauthenticated" && !hasVerifiedWithBackend)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <LoadingState label="Đang xác thực phiên đăng nhập..." className="w-full max-w-md" />
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <LoadingState
          label="Đang chuyển hướng tới trang Đăng nhập..."
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (user.mustChangePassword && !allowMustChangePassword) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <LoadingState
          label="Tài khoản cần đổi mật khẩu lần đầu. Đang chuyển hướng..."
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (requireAdmin && !canAccessAdmin(user)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
        <div
          role="alert"
          data-testid="forbidden-admin-state"
          className="ui-card max-w-lg w-full p-6 sm:p-8 text-center space-y-5"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-error-container text-error flex items-center justify-center">
            <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
              gpp_maybe
            </span>
          </div>
          <div className="space-y-2">
            <Badge variant="error">403 · Không có quyền truy cập</Badge>
            <h1 className="type-h2 text-on-surface">
              Tài khoản của bạn không có quyền vào khu vực Quản trị
            </h1>
            <p className="type-body-sm text-secondary leading-relaxed">
              Phiên hiện tại thuộc tài khoản{" "}
              <strong className="text-on-surface">{user.fullName}</strong> (
              {getPrimaryRoleLabel(user)}). Khu vực <code className="font-mono">/admin</code>{" "}
              chỉ dành cho Quản trị viên hoặc Nhân sự được phân quyền.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/portal"
              className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2.5 text-sm"
            >
              Về Cổng Open Day
            </Link>
            <Link
              href="/"
              className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2.5 text-sm"
            >
              Về Trang chủ
            </Link>
            <Button
              variant="ghost"
              size="md"
              icon="logout"
              onClick={() => {
                void logout().then(() => router.replace("/login"));
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && checkModulePermissions && !hasRequiredAdminPathPermission(user, pathname)) {
    return <AdminModulePermissionGuard>{children}</AdminModulePermissionGuard>;
  }

  return <>{children}</>;
}

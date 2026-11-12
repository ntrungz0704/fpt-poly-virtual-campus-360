"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AdminModulePermissionGuard,
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  getPrimaryRoleLabel,
  getUserInitials,
  hasRequiredAdminPathPermission,
} from "@/lib/auth/auth-routing";

const ADMIN_MODULES = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/locations", label: "Địa điểm & GIS", icon: "apartment" },
  { href: "/admin/virtual-tour", label: "Tour 360° & Hotspot", icon: "view_in_ar" },
  { href: "/admin/events", label: "Sự kiện Open Day", icon: "event" },
  { href: "/admin/media", label: "Thư viện Media", icon: "perm_media" },
  { href: "/admin/users", label: "Tài khoản & Import", icon: "group" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleModules = ADMIN_MODULES.filter((item) =>
    hasRequiredAdminPathPermission(user, item.href),
  );

  const activeModule =
    ADMIN_MODULES.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
    ) || ADMIN_MODULES[0];

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileDrawerOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex overflow-x-clip" data-testid="admin-shell">
      {/* Mobile & Tablet (< 1024px) Slide-over Backdrop */}
      {mobileDrawerOpen && (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng quản trị"
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Admin P0 Sidebar */}
      <aside
        aria-label="Thanh điều hướng Admin P0"
        className={`fixed inset-y-0 left-0 z-50 lg:static bg-surface-container-lowest border-r border-surface-container transition-all duration-300 flex flex-col justify-between shrink-0 lg:translate-x-0 ${
          mobileDrawerOpen ? "translate-x-0 shadow-elevation-3" : "-translate-x-full lg:translate-x-0"
        } ${sidebarCollapsed ? "w-64 lg:w-20" : "w-64"}`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-surface-container shrink-0">
            {(!sidebarCollapsed || mobileDrawerOpen) && (
              <Link
                href="/admin"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                <img
                  src="/images/fpt-logo-official.png"
                  alt="FPT Polytechnic"
                  className="h-7 w-auto object-contain shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-sm text-on-surface font-bold leading-tight truncate">
                    Admin Console
                  </span>
                  <span className="text-[10px] text-primary font-bold tracking-wider uppercase truncate">
                    Virtual Campus
                  </span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && !mobileDrawerOpen && (
              <img
                src="/images/fpt-logo-official.png"
                alt="FPT"
                className="h-6 w-auto mx-auto object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              className="w-9 h-9 rounded-lg text-secondary hover:bg-surface-container transition-colors hidden lg:flex items-center justify-center cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                {sidebarCollapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Đóng menu"
              className="w-11 h-11 rounded-lg text-secondary hover:bg-surface-container transition-colors lg:hidden flex items-center justify-center cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>

          {/* Navigation List (filtered by real RBAC permissions) */}
          <nav aria-label="Module quản trị" className="p-2.5 flex flex-col gap-1 overflow-y-auto flex-1">
            {visibleModules.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={item.href === "/admin"}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                    isActive
                      ? "bg-primary-fixed text-primary font-bold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
                  }`}
                  title={item.label}
                >
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-[20px] transition-colors shrink-0 ${
                      isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {(!sidebarCollapsed || mobileDrawerOpen) && (
                    <span className="font-label-md text-label-md truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-surface-container flex items-center justify-between shrink-0 gap-2">
          <Link
            href="/"
            className="min-h-[40px] px-2 rounded-lg flex items-center gap-2 text-secondary hover:text-primary hover:bg-surface-container-low transition-colors text-xs font-semibold min-w-0"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] shrink-0">
              public
            </span>
            {(!sidebarCollapsed || mobileDrawerOpen) && (
              <span className="truncate">Trang công khai</span>
            )}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            data-testid="admin-sidebar-logout-btn"
            aria-label="Đăng xuất"
            title="Đăng xuất khỏi hệ thống"
            className="w-10 h-10 rounded-lg text-secondary hover:text-error hover:bg-error-container/60 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface-container-lowest border-b border-surface-container px-4 lg:px-space-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-secondary min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Mở menu quản trị"
              className="lg:hidden w-11 h-11 -ml-1 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface shrink-0 cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                menu
              </span>
            </button>
            <span className="hidden sm:inline truncate">Quản trị nội bộ</span>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <span className="text-on-surface font-bold text-sm truncate">
              {activeModule.label}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {user && (
              <>
                <span className="ui-badge ui-badge-info hidden md:inline-flex">
                  {getPrimaryRoleLabel(user)}
                </span>
                <span
                  data-testid="admin-user-fullname"
                  className="hidden sm:inline text-xs font-semibold text-on-surface max-w-[160px] truncate"
                >
                  {user.fullName}
                </span>
                <div
                  aria-label={`Tài khoản ${user.fullName}`}
                  className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0"
                >
                  {getUserInitials(user.fullName)}
                </div>
              </>
            )}
            <Link
              href="/change-password"
              className="ui-btn ui-btn-outline min-h-[38px] px-3 py-1.5 text-xs hidden sm:inline-flex"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                password
              </span>
              <span>Đổi mật khẩu</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              data-testid="admin-logout-btn"
              className="ui-btn ui-btn-outline min-h-[38px] px-3 py-1.5 text-xs cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                logout
              </span>
              <span className="hidden xs:inline">
                {loggingOut ? "Đang thoát..." : "Đăng xuất"}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-space-xl overflow-y-auto">
          <div
            role="status"
            className="mb-6 rounded-xl border border-primary/25 bg-primary-fixed/40 px-4 py-3 text-on-surface shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined mt-0.5 text-primary shrink-0"
                aria-hidden="true"
              >
                verified_user
              </span>
              <div className="space-y-1 text-xs md:text-sm leading-relaxed">
                <p className="font-bold text-on-surface">
                  Xác thực &amp; Phân quyền RBAC đã kích hoạt · Phiên đồng bộ từ Backend API
                </p>
                <p className="text-secondary">
                  Quyền truy cập <code className="font-mono font-semibold">/admin/*</code> đang được bảo vệ bởi
                  JWT Bearer + HttpOnly Refresh Cookie + RBAC. Các màn hình biên tập CMS chi tiết (Media,
                  Địa điểm, Tour 360°, Tài khoản/Import) đang ở chế độ Preview và sẽ được nối API ở các
                  milestone tiếp theo.
                </p>
              </div>
            </div>
          </div>
          <AdminModulePermissionGuard>{children}</AdminModulePermissionGuard>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireAdmin checkModulePermissions={false}>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}

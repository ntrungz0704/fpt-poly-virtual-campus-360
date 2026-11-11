"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clearPrototypeSession } from "@/lib/prototype-auth";

const ADMIN_MODULES = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/locations", label: "Địa điểm & GIS", icon: "apartment" },
  { href: "/admin/virtual-tour", label: "Tour 360° & Hotspot", icon: "view_in_ar" },
  { href: "/admin/events", label: "Sự kiện Open Day", icon: "event" },
  { href: "/admin/media", label: "Thư viện Media", icon: "perm_media" },
  { href: "/admin/users", label: "Tài khoản & Import", icon: "group" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeModule =
    ADMIN_MODULES.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
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

  return (
    <div className="min-h-screen bg-surface-container-low flex overflow-x-clip">
      {/* Mobile & Tablet (< 1024px) Slide-over Backdrop */}
      {mobileDrawerOpen && (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng quản trị"
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Admin P0 6-Module Sidebar (Slide-over drawer <1024px, docked rail >=1024px) */}
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
                    Admin P0
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

          {/* 6-Item P0 Navigation List */}
          <nav aria-label="Module quản trị" className="p-2.5 flex flex-col gap-1 overflow-y-auto flex-1">
            {ADMIN_MODULES.map((item) => {
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
              <span className="truncate">Xem trang công khai</span>
            )}
          </Link>
          <Link
            href="/login"
            onClick={() => clearPrototypeSession()}
            aria-label="Về màn hình đăng nhập"
            title="Về màn hình đăng nhập"
            className="w-10 h-10 rounded-lg text-secondary hover:text-error hover:bg-error-container/60 transition-colors flex items-center justify-center shrink-0"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              logout
            </span>
          </Link>
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
            <span className="ui-badge ui-badge-info hidden sm:inline-flex">
              Điều phối viên QTSC
            </span>
            <div
              aria-label="Tài khoản quản trị"
              className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0"
            >
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-space-xl overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

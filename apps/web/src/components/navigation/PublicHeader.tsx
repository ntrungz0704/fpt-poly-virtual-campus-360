"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessAdmin, getUserInitials } from "@/lib/auth/auth-routing";

const NAV_ITEMS = [
  { href: "/campus", label: "Tham quan 360°", icon: "360" },
  { href: "/map", label: "Bản đồ GIS", icon: "map" },
  { href: "/locations", label: "Địa điểm", icon: "apartment" },
  { href: "/events", label: "Open Day", icon: "event" },
  { href: "/games", label: "Thử thách & Quà", icon: "casino" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : prevOverflow;
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  const isLoginActive = pathname.startsWith("/login");
  const isAuthenticated = status === "authenticated" && user !== null;
  const workspaceHref = !user
    ? "/login"
    : user.mustChangePassword
      ? "/change-password"
      : canAccessAdmin(user)
        ? "/admin"
        : "/portal";
  const workspaceLabel = !user
    ? "Đăng nhập"
    : user.mustChangePassword
      ? "Đổi mật khẩu"
      : canAccessAdmin(user)
        ? "Quản trị"
        : "Cổng Open Day";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setMobileMenuOpen(false);
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-container shadow-elevation-1">
        <div className="ui-container h-full flex items-center justify-between gap-3">
          {/* Official Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group min-w-0 shrink-0 rounded-lg focus-visible:outline-2"
          >
            <img
              src="/images/fpt-logo-official.png"
              alt="FPT Polytechnic"
              className="h-8 w-auto object-contain shrink-0"
              loading="eager"
            />
            <div className="h-5 w-[1px] bg-surface-variant hidden sm:block shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-headline-sm text-sm sm:text-[15px] font-bold text-on-surface tracking-tight truncate hidden xs:inline">
                Virtual Campus
              </span>
              <span className="ui-badge ui-badge-primary hidden xl:inline-flex">
                QTSC Quận 12
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= 1024px) */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-1.5 shrink-0"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl type-label flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                    isActive
                      ? "bg-primary-fixed text-primary font-bold border-primary-container/45 shadow-2xs"
                      : "border-transparent text-on-surface hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-[18px] ${
                      isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-5 w-[1px] bg-surface-container mx-1" aria-hidden="true" />

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={workspaceHref}
                  className="ui-btn ui-btn-primary min-h-[40px] px-3.5 py-2 text-xs whitespace-nowrap"
                >
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold inline-flex items-center justify-center"
                  >
                    {getUserInitials(user.fullName)}
                  </span>
                  <span className="max-w-[130px] truncate">{workspaceLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Đăng xuất"
                  title="Đăng xuất"
                  className="ui-btn ui-btn-outline min-h-[40px] px-3 py-2 text-xs whitespace-nowrap cursor-pointer"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                    logout
                  </span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`ui-btn min-h-[40px] px-4 py-2 text-xs whitespace-nowrap ${
                  isLoginActive ? "ui-btn-secondary" : "ui-btn-primary"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                  login
                </span>
                <span>Đăng nhập</span>
              </Link>
            )}
          </nav>

          {/* Tablet & Mobile Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {isAuthenticated && user ? (
              <Link
                href={workspaceHref}
                className="hidden sm:inline-flex ui-btn ui-btn-primary min-h-[40px] px-3.5 py-2 text-xs whitespace-nowrap"
              >
                <span>{workspaceLabel}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`hidden sm:inline-flex ui-btn min-h-[40px] px-3.5 py-2 text-xs whitespace-nowrap ${
                  isLoginActive ? "ui-btn-secondary" : "ui-btn-primary"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                  login
                </span>
                <span>Đăng nhập</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
              className="w-11 h-11 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden pt-16 bg-on-surface/55 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-full max-w-xs ml-auto h-full bg-surface-container-lowest border-l border-surface-container p-5 shadow-elevation-3 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <span className="type-caption uppercase text-secondary">
                  {isAuthenticated && user ? user.fullName : "CVPM Quang Trung · Q.12"}
                </span>
                <span className="ui-badge ui-badge-primary">360°</span>
              </div>

              <nav aria-label="Menu di động" className="flex flex-col gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 type-label text-sm transition-colors border ${
                        isActive
                          ? "bg-primary-fixed text-primary font-bold border-primary-container/45 shadow-2xs"
                          : "border-transparent text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {isAuthenticated && user ? (
                  <>
                    <Link
                      href={workspaceHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-2 ui-btn ui-btn-primary min-h-[44px] w-full justify-center"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        account_circle
                      </span>
                      <span>{workspaceLabel}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="ui-btn ui-btn-outline min-h-[44px] w-full justify-center cursor-pointer"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 ui-btn ui-btn-primary min-h-[44px] w-full justify-center"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                      login
                    </span>
                    <span>Đăng nhập</span>
                  </Link>
                )}
              </nav>
            </div>

            <div className="pt-4 border-t border-surface-container space-y-3">
              <p className="text-xs text-secondary leading-relaxed">
                Tòa Innovation, Lô 24, CVPM Quang Trung, P. Trung Mỹ Tây, Quận 12, TP.HCM.
              </p>
              <a
                href="https://caodang.fpt.edu.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="ui-btn ui-btn-outline min-h-[44px] w-full justify-center text-xs"
              >
                <span>Website chính thức trường</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

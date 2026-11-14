"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessAdmin, getUserInitials } from "@/lib/auth/auth-routing";

const PRIMARY_NAV_ITEMS = [
  { href: "/campus", label: "Tham quan 360°", icon: "360" },
  { href: "/map", label: "Bản đồ GIS", icon: "map" },
  { href: "/locations", label: "Địa điểm", icon: "apartment" },
  { href: "/events", label: "Open Day", icon: "event" },
  { href: "/games", label: "Thử thách & Quà", icon: "casino" },
];

const SECONDARY_NAV_ITEMS = [
  { href: "/news", label: "Tin tức", icon: "newspaper" },
  { href: "/about", label: "Giới thiệu", icon: "info" },
  { href: "/contact", label: "Liên hệ", icon: "support_agent" },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setMoreMenuOpen(false);
      }
    }
    function handleClickOutside(event: MouseEvent) {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const isSecondaryActive = SECONDARY_NAV_ITEMS.some((item) =>
    pathname.startsWith(item.href),
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-container shadow-elevation-1">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Official Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-2 group min-w-0 shrink-0 rounded-lg focus-visible:outline-2"
          >
            <img
              src="/images/fpt-logo-official.png"
              alt="FPT Polytechnic"
              className="h-8 sm:h-8.5 w-auto object-contain shrink-0"
              loading="eager"
            />
            <div className="h-5 w-[1px] bg-surface-variant hidden md:block shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-headline-sm text-sm sm:text-[15px] font-bold text-on-surface tracking-tight truncate hidden sm:inline">
                Virtual Campus
              </span>
              <span className="ui-badge ui-badge-primary hidden 2xl:inline-flex text-[11px] py-0.5 px-2">
                QTSC Quận 12
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= 1024px) */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0"
          >
            {/* Primary Nav Items */}
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-[38px] px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                    isActive
                      ? "bg-primary-fixed text-primary font-bold border-primary-container/45 shadow-2xs"
                      : "border-transparent text-on-surface hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-[17px] ${
                      isActive ? "text-primary" : "text-secondary group-hover:text-primary"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Khám phá Dropdown for Secondary Nav Items */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
                className={`min-h-[38px] px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap border cursor-pointer ${
                  isSecondaryActive
                    ? "bg-primary-fixed text-primary font-bold border-primary-container/45 shadow-2xs"
                    : "border-transparent text-on-surface hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <span>Khám phá</span>
                <span
                  aria-hidden="true"
                  className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                    moreMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-elevation-3 py-2 z-50 animate-fadeIn">
                  {SECONDARY_NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-primary-fixed text-primary font-bold"
                            : "text-on-surface hover:bg-surface-container-low hover:text-primary"
                        }`}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Right Actions (ALWAYS visible & shrink-0) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 z-10 min-w-max">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href={workspaceHref}
                  className="ui-btn ui-btn-primary min-h-[38px] px-3 py-1.5 text-xs whitespace-nowrap"
                >
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold inline-flex items-center justify-center"
                  >
                    {getUserInitials(user.fullName)}
                  </span>
                  <span className="max-w-[120px] truncate">{workspaceLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-label="Đăng xuất"
                  title="Đăng xuất"
                  className="ui-btn ui-btn-outline min-h-[38px] px-2.5 py-1.5 text-xs whitespace-nowrap cursor-pointer"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                    logout
                  </span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`ui-btn min-h-[38px] px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shadow-xs ${
                  isLoginActive ? "ui-btn-secondary" : "ui-btn-primary"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  login
                </span>
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>

          {/* Tablet & Mobile Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {isAuthenticated && user ? (
              <Link
                href={workspaceHref}
                className="ui-btn ui-btn-primary min-h-[38px] px-3 py-1.5 text-xs whitespace-nowrap"
              >
                <span>{workspaceLabel}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`ui-btn min-h-[38px] px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                  isLoginActive ? "ui-btn-secondary" : "ui-btn-primary"
                }`}
              >
                <span>Đăng nhập</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
              className="w-10 h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <span className="type-caption uppercase text-secondary">
                  {isAuthenticated && user ? user.fullName : "CVPM Quang Trung · Q.12"}
                </span>
                <span className="ui-badge ui-badge-primary">360°</span>
              </div>

              <nav aria-label="Menu di động" className="flex flex-col gap-1">
                {ALL_NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`min-h-[42px] px-3 py-2 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-colors border ${
                        isActive
                          ? "bg-primary-fixed text-primary font-bold border-primary-container/45 shadow-2xs"
                          : "border-transparent text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer Auth Section */}
            <div className="pt-4 border-t border-surface-container flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href={workspaceHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="ui-btn ui-btn-primary min-h-[44px] w-full text-xs font-bold"
                  >
                    <span>Mở {workspaceLabel}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="ui-btn ui-btn-outline min-h-[44px] w-full text-xs font-semibold cursor-pointer"
                  >
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ui-btn ui-btn-primary min-h-[44px] w-full text-xs font-bold"
                >
                  <span>Đăng nhập hệ thống</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

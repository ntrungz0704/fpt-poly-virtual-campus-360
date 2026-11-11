"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSignOut = () => {
    router.push("/events");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-x-clip">
      {/* Open Day Participant Workspace Header */}
      <header className="sticky top-0 z-40 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-container">
        <div className="ui-container h-full flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <img
              src="/images/fpt-logo-official.png"
              alt="FPT Polytechnic"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="h-5 w-[1px] bg-surface-variant hidden sm:block shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-sm font-bold text-on-surface leading-tight truncate">
                <span className="sm:hidden">Open Day</span>
                <span className="hidden sm:inline">Không gian Open Day</span>
              </span>
              <span className="type-caption text-[10px] text-primary uppercase truncate">
                <span className="sm:hidden">QTSC Q.12</span>
                <span className="hidden sm:inline">Tài khoản tham dự · QTSC Q.12</span>
              </span>
            </div>
          </Link>

          <nav aria-label="Điều hướng Không gian Tham dự" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/campus"
              className="min-h-[40px] px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface type-label text-xs flex items-center gap-1.5 transition-colors"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[17px] text-primary">
                360
              </span>
              <span className="hidden sm:inline">Tour 360°</span>
            </Link>
            <Link
              href="/events"
              className="min-h-[40px] px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface type-label text-xs flex items-center gap-1.5 transition-colors"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[17px] text-primary">
                event
              </span>
              <span className="hidden md:inline">Lịch công khai</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="ui-btn ui-btn-outline min-h-[40px] px-3 py-1.5 text-xs"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
                logout
              </span>
              <span className="hidden xs:inline">Lịch Open Day</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full ui-container py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabItem {
  href: string;
  label: string;
  icon: string;
}

const PORTAL_TABS: TabItem[] = [
  { href: "/portal", label: "Tổng quan", icon: "dashboard" },
  { href: "/portal/profile", label: "Hồ sơ cá nhân", icon: "person" },
  { href: "/portal/tickets", label: "Vé Open Day của tôi", icon: "confirmation_number" },
  { href: "/portal/schedule", label: "Lịch trình sự kiện", icon: "calendar_month" },
  { href: "/portal/progress", label: "Tiến trình & Quà", icon: "military_tech" },
  { href: "/parent", label: "Cổng Phụ huynh", icon: "family_restroom" },
];

export function PortalNavTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng cổng thông tin"
      className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-outline-variant/30"
    >
      {PORTAL_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-secondary hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

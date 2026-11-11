"use client";

import React from "react";
import { PrototypeParticipantSession } from "@/lib/prototype-auth";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type PortalTabKey = "program" | "activity" | "password";

interface StudentProfileHeaderProps {
  session: PrototypeParticipantSession;
  activeTab: PortalTabKey;
  onTabChange: (tab: PortalTabKey) => void;
}

const PORTAL_TABS: { key: PortalTabKey; label: string; icon: string }[] = [
  { key: "program", label: "Chương trình của tôi", icon: "event_note" },
  { key: "activity", label: "Thử thách Open Day", icon: "quiz" },
  { key: "password", label: "Bảo mật & Mật khẩu", icon: "lock_reset" },
];

export function StudentProfileHeader({
  session,
  activeTab,
  onTabChange,
}: StudentProfileHeaderProps) {
  return (
    <section className="ui-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{session.eventBatch}</Badge>
            <Badge variant="success">Tài khoản hợp lệ</Badge>
            <span className="text-xs font-mono font-semibold text-secondary">
              {session.accountCode}
            </span>
          </div>
          <h1 className="type-h1 text-on-surface">
            Xin chào, {session.fullName}
          </h1>
          <p className="type-body-sm text-secondary">
            Quản lý lịch trình tham gia tại khuôn viên CVPM Quang Trung và xuất trình mã QR tại quầy check-in Sảnh Innovation.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-low border border-surface-container px-4 py-3 text-xs space-y-1 shrink-0">
          <p className="font-semibold text-secondary">Trạng thái mật khẩu</p>
          <p className="font-bold text-on-surface">
            {session.updatedPasswordAt
              ? `Đã cập nhật lúc ${session.updatedPasswordAt}`
              : session.mustChangePassword
              ? "Cần đổi mật khẩu tạm"
              : "Đã kích hoạt cá nhân"}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Phân khu Không gian Open Day"
        className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-surface-container-low"
      >
        {PORTAL_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-colors cursor-pointer",
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              )}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

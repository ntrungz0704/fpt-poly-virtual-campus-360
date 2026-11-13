"use client";

import React from "react";
import type { GamificationProfileDto } from "@fpt-campus/shared";

interface GamificationProfileHeaderProps {
  profile: GamificationProfileDto | null;
  activeTab: "quiz" | "spin";
  onTabChange: (tab: "quiz" | "spin") => void;
}

export function GamificationProfileHeader({
  profile,
  activeTab,
  onTabChange,
}: GamificationProfileHeaderProps) {
  const totalXp = profile?.totalXp ?? 0;
  const spinsAvailable = profile?.spinsAvailable ?? 0;

  let levelLabel = "Level 1 - Tân binh";
  if (totalXp >= 400) levelLabel = "Level 5 - Huyền thoại QTSC";
  else if (totalXp >= 250) levelLabel = "Level 4 - Chuyên gia Campus";
  else if (totalXp >= 150) levelLabel = "Level 3 - Nhà Thám hiểm";
  else if (totalXp >= 50) levelLabel = "Level 2 - Sinh viên Tiên phong";

  return (
    <div className="ui-card p-4 sm:p-6 bg-gradient-to-r from-surface to-surface-container-low border border-surface-container space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-secondary">
              Tài khoản tham dự:
            </span>
            <span className="text-xs font-bold text-on-surface">
              {profile?.attendeeName || "Khách tham quan"}
            </span>
            {profile?.ticketCode && (
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold">
                {profile.ticketCode}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-primary">{levelLabel}</p>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-surface border border-surface-container shadow-sm flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-500 text-[22px]">
              stars
            </span>
            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">
                Tổng điểm XP
              </span>
              <span className="text-sm font-black text-on-surface">
                {totalXp} XP
              </span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-surface border border-surface-container shadow-sm flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">
              casino
            </span>
            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">
                Vòng quay
              </span>
              <span
                className={`text-sm font-black ${
                  spinsAvailable > 0 ? "text-primary" : "text-secondary"
                }`}
              >
                {spinsAvailable} lượt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-t border-surface-container pt-3 gap-2">
        <button
          type="button"
          onClick={() => onTabChange("quiz")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "quiz"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">quiz</span>
          <span>Thử Thách Trắc Nghiệm QTSC</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("spin")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
            activeTab === "spin"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">casino</span>
          <span>Vòng Quay May Mắn</span>
          {spinsAvailable > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
              {spinsAvailable}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

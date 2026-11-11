"use client";

import React, { useState } from "react";
import Link from "next/link";
import { OPEN_DAY_SESSIONS, OpenDaySessionItem } from "@/data/campus-data";
import { Badge } from "@/components/ui";
import { AnimatedContent, SpotlightCard } from "@/components/animations";
import { cn } from "@/lib/utils";

type PeriodFilter = "all" | OpenDaySessionItem["period"];

const PERIOD_TABS: { key: PeriodFilter; label: string }[] = [
  { key: "all", label: "Toàn ngày (08:00 – 16:30)" },
  { key: "morning", label: "Buổi Sáng" },
  { key: "noon", label: "Buổi Trưa" },
  { key: "afternoon", label: "Buổi Chiều" },
];

export function OpenDayScheduleTimeline() {
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const visibleSessions =
    period === "all"
      ? OPEN_DAY_SESSIONS
      : OPEN_DAY_SESSIONS.filter((s) => s.period === period);

  return (
    <div className="space-y-6">
      {/* Period Switcher */}
      <div
        role="tablist"
        aria-label="Lọc lịch trình theo buổi"
        className="flex flex-wrap items-center gap-2"
      >
        {PERIOD_TABS.map((tab) => {
          const active = period === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPeriod(tab.key)}
              className={cn(
                "min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer",
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Session List (stable min-height prevents EventPillarGrid & footer jump on period filter) */}
      <div className="space-y-4 min-h-[520px] sm:min-h-[740px] lg:min-h-[1190px]">
        {visibleSessions.map((session, index) => {
          const isInvited = session.accessType === "invited";
          return (
            <AnimatedContent
              key={session.id}
              delay={Math.min(index * 0.05, 0.25)}
              distance={24}
            >
              <SpotlightCard className="rounded-2xl">
                <article className="ui-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                <div className="shrink-0 sm:w-36">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container font-mono text-xs sm:text-sm font-bold text-on-surface">
                    {session.timeRange}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isInvited ? "brand" : "success"}>
                      {isInvited ? "Tài khoản được cấp" : "Tham quan công khai"}
                    </Badge>
                    <span className="text-xs font-medium text-secondary">
                      {session.hostUnit}
                    </span>
                  </div>

                  <h3 className="type-h3 text-on-surface">{session.title}</h3>
                  <p className="type-body-sm text-secondary leading-relaxed">
                    {session.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-secondary">
                    <span className="inline-flex items-center gap-1.5 font-medium text-on-surface-variant">
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">
                        location_on
                      </span>
                      {session.locationLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-container-low">
                {session.sceneId && (
                  <Link
                    href={`/campus?scene=${encodeURIComponent(session.sceneId)}`}
                    className="ui-btn ui-btn-outline min-h-[40px] px-3.5 py-2 text-xs font-semibold"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                      360
                    </span>
                    <span>Xem không gian</span>
                  </Link>
                )}

                <Link
                  href={`/map?building=${encodeURIComponent(session.buildingCode)}`}
                  className={cn(
                    "ui-btn min-h-[40px] px-3.5 py-2 text-xs font-semibold",
                    isInvited ? "ui-btn-primary font-bold" : "ui-btn-ghost"
                  )}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                    map
                  </span>
                  <span>{isInvited ? "Định vị khu đón tiếp" : "Định vị GIS"}</span>
                </Link>
              </div>
                </article>
              </SpotlightCard>
            </AnimatedContent>
          );
        })}
      </div>
    </div>
  );
}

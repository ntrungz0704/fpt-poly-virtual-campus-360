"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { OPEN_DAY_SESSIONS } from "@/data/campus-data";
import { Badge, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PersonalItineraryTimeline() {
  const [viewTab, setViewTab] = useState<"scheduled" | "all">("scheduled");
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "od-01",
    "od-02",
    "od-03",
    "od-05",
  ]);

  const displayedSessions = useMemo(() => {
    if (viewTab === "all") return OPEN_DAY_SESSIONS;
    return OPEN_DAY_SESSIONS.filter((s) => selectedIds.includes(s.id));
  }, [viewTab, selectedIds]);

  const toggleSession = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="ui-card p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-low pb-4">
        <div>
          <h2 className="type-h2 text-on-surface">Lịch trình cá nhân (My program)</h2>
          <p className="type-body-sm text-secondary mt-0.5">
            Đánh dấu các phiên bạn ưu tiên tham gia trong ngày hội Open Day QTSC.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chế độ xem lịch"
          className="inline-flex p-1 rounded-xl bg-surface-container-low border border-surface-container self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === "scheduled"}
            onClick={() => setViewTab("scheduled")}
            className={cn(
              "min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              viewTab === "scheduled"
                ? "bg-white text-on-surface shadow-xs"
                : "text-secondary hover:text-on-surface"
            )}
          >
            Đã chọn ({selectedIds.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewTab === "all"}
            onClick={() => setViewTab("all")}
            className={cn(
              "min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              viewTab === "all"
                ? "bg-white text-on-surface shadow-xs"
                : "text-secondary hover:text-on-surface"
            )}
          >
            Toàn ngày ({OPEN_DAY_SESSIONS.length})
          </button>
        </div>
      </div>

      <div className="min-h-[460px] sm:min-h-[560px] flex flex-col">
        {displayedSessions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <EmptyState
              icon="event_busy"
              title="Chưa có phiên nào được chọn"
              description="Chuyển sang thẻ Toàn ngày để thêm các phiên phù hợp vào lịch trình cá nhân của bạn."
              actionLabel="Xem lịch Toàn ngày"
              onAction={() => setViewTab("all")}
              className="w-full max-w-md"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSessions.map((session) => {
              const isAdded = selectedIds.includes(session.id);
              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-surface-container bg-surface p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-outline-variant transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-on-surface">
                        {session.timeRange}
                      </span>
                      <Badge variant={session.accessType === "invited" ? "brand" : "success"}>
                        {session.accessType === "invited" ? "Tài khoản mời" : "Công khai"}
                      </Badge>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {session.title}
                    </h3>
                    <p className="text-xs text-secondary">{session.locationLabel}</p>

                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-semibold">
                      {session.sceneId && (
                        <Link
                          href={`/campus?scene=${encodeURIComponent(session.sceneId)}`}
                          className="text-primary hover:underline inline-flex items-center gap-1 min-h-[32px]"
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                            360
                          </span>
                          <span>Xem 360°</span>
                        </Link>
                      )}
                      <Link
                        href={`/map?building=${encodeURIComponent(session.buildingCode)}`}
                        className="text-secondary hover:text-on-surface inline-flex items-center gap-1 min-h-[32px]"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                          map
                        </span>
                        <span>Định vị GIS</span>
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSession(session.id)}
                    aria-pressed={isAdded}
                    className={cn(
                      "min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer self-start",
                      isAdded
                        ? "bg-primary-fixed border-primary/30 text-primary hover:bg-primary-fixed/80"
                        : "bg-surface-container-low border-surface-container text-on-surface-variant hover:border-primary"
                    )}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                      {isAdded ? "bookmark_added" : "bookmark_add"}
                    </span>
                    <span>{isAdded ? "Trong lịch" : "Thêm lịch"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import type { LeaderboardEntryDto } from "@fpt-campus/shared";
import { fetchLeaderboard } from "@/lib/public/gamification-api";
import { cn } from "@/lib/utils";

interface QuizLeaderboardProps {
  attendeeName?: string;
  ticketCode?: string;
  refreshTrigger?: number;
}

export function QuizLeaderboard({
  attendeeName,
  ticketCode,
  refreshTrigger = 0,
}: QuizLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualTrigger, setManualTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetchLeaderboard(ticketCode, attendeeName, 10)
      .then((res) => {
        if (isMounted) {
          setEntries(res.topEntries);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (isMounted) setErrorMessage("Không thể tải bảng xếp hạng.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ticketCode, attendeeName, refreshTrigger, manualTrigger]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-sm">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-sm">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-sm">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-surface-container text-secondary font-bold text-xs flex items-center justify-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="ui-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 border-b border-surface-container pb-4">
        <div>
          <span className="type-label text-primary">Vinh danh Người Dẫn Đầu</span>
          <h3 className="type-h3 text-on-surface">Bảng Xếp Hạng XP QTSC</h3>
        </div>
        <button
          type="button"
          onClick={() => setManualTrigger((k) => k + 1)}
          disabled={loading}
          aria-label="Làm mới bảng xếp hạng"
          className="w-8 h-8 rounded-lg border border-surface-container flex items-center justify-center text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <span
            className={cn(
              "material-symbols-outlined text-[18px]",
              loading && "animate-spin",
            )}
          >
            refresh
          </span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-secondary">Đang cập nhật xếp hạng...</p>
        </div>
      ) : errorMessage ? (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-300">
          {errorMessage}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-secondary text-center py-6">
          Chưa có người tham gia thử thách. Hãy là người đầu tiên!
        </p>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => {
            return (
              <div
                key={entry.rank + entry.attendeeName}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors",
                  entry.isCurrentAttendee
                    ? "bg-primary/10 border-primary/40 shadow-sm"
                    : "bg-surface-container-low border-surface-container hover:bg-surface-container",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(entry.rank)}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {entry.attendeeName}
                      {entry.isCurrentAttendee && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-primary text-white text-[10px] font-bold">
                          Bạn
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      {entry.badge}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-primary block">
                    {entry.totalXp} XP
                  </span>
                  <span className="text-[10px] text-secondary">
                    {entry.totalSpins} lượt quay
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl bg-surface-container-low border border-surface-container p-3 text-xs text-secondary space-y-1">
        <p className="font-semibold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">
            info
          </span>
          Cách nhận thêm điểm XP:
        </p>
        <p>• Hoàn thành bài thi trắc nghiệm khuôn viên (+20 XP / câu đúng, +40 XP điểm tuyệt đối).</p>
        <p>• Quay thưởng may mắn tại Vòng quay QTSC (lên đến 200 XP).</p>
      </div>
    </div>
  );
}

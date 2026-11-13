"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { PortalScheduleItemDto } from "@fpt-campus/shared";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState<PortalScheduleItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<string>("ALL");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await portalApi.getSchedule();
        if (!active) return;
        setSchedule(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải lịch trình.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Đang tải lịch trình sự kiện..." className="max-w-2xl mx-auto py-12" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Lỗi tải lịch trình"
        description={error}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
        className="max-w-xl mx-auto py-12"
      />
    );
  }

  const filtered = schedule.filter((s) => {
    if (filterPeriod === "ALL") return true;
    if (filterPeriod === "REGISTERED") return s.isRegistered;
    return s.period === filterPeriod;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="student-schedule-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h2 text-on-surface">Lịch trình sự kiện của tôi</h1>
          <p className="type-body-sm text-secondary mt-0.5">
            Các phiên hoạt động, hội thảo chuyên đề và workshop trải nghiệm tại khuôn viên QTSC.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "REGISTERED", label: "Đã đăng ký" },
            { id: "MORNING", label: "Buổi sáng" },
            { id: "AFTERNOON", label: "Buổi chiều" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterPeriod(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterPeriod === f.id
                  ? "bg-primary text-white"
                  : "bg-surface-container hover:bg-surface-container-high text-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="calendar_today"
          title="Không có phiên sự kiện nào theo bộ lọc"
          description="Hãy chọn bộ lọc khác hoặc đăng ký thêm phiên trải nghiệm Open Day."
          actionLabel="Đặt lại bộ lọc"
          onAction={() => setFilterPeriod("ALL")}
          className="ui-card p-10"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`ui-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
                item.isRegistered ? "border-primary/40 bg-primary-fixed/5" : "border-surface-container"
              }`}
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">
                    {item.timeRangeLabel}
                  </span>
                  <Badge variant={item.period === "MORNING" ? "brand" : "neutral"}>
                    {item.period === "MORNING" ? "Sáng" : "Chiều"}
                  </Badge>
                  {item.isRegistered ? (
                    <Badge variant="success">Đã có trong vé</Badge>
                  ) : (
                    <Badge variant="neutral">Mở tự do</Badge>
                  )}
                </div>

                <h3 className="type-h3 text-on-surface">{item.title}</h3>

                <p className="type-body-sm text-secondary line-clamp-2">{item.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-secondary pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                      location_on
                    </span>
                    <span>{item.customLocationLabel}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                      corporate_fare
                    </span>
                    <span>{item.hostUnit}</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link href="/campus" className="ui-btn ui-btn-outline min-h-[38px] px-3.5 py-1.5 text-xs">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    360
                  </span>
                  <span>Xem địa điểm 360°</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { PortalProgressDto } from "@fpt-campus/shared";
import { Badge, ErrorState, LoadingState } from "@/components/ui";
import { portalApi } from "@/lib/portal/portal-api";

export default function StudentProgressPage() {
  const [progress, setProgress] = useState<PortalProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await portalApi.getGamification();
        if (!active) return;
        setProgress(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải tiến trình gamification.");
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
    return <LoadingState label="Đang tải tiến trình điểm thưởng..." className="max-w-2xl mx-auto py-12" />;
  }

  if (error || !progress) {
    return (
      <ErrorState
        title="Lỗi tải tiến trình"
        description={error || "Không thể tải dữ liệu."}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
        className="max-w-xl mx-auto py-12"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="student-progress-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h2 text-on-surface">Tiến trình & Quà tặng</h1>
          <p className="type-body-sm text-secondary mt-0.5">
            Theo dõi điểm kinh nghiệm (XP), cấp bậc và lịch sử nhận quà từ Vòng quay may mắn.
          </p>
        </div>
        <Link href="/games" className="ui-btn ui-btn-primary min-h-[42px] px-4 py-2 text-xs">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            casino
          </span>
          <span>Đến Đấu trường Quiz & Vòng quay</span>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="ui-card p-5 space-y-2 border-l-4 border-l-primary">
          <span className="text-xs text-secondary font-semibold">Tổng điểm kinh nghiệm</span>
          <p className="text-2xl sm:text-3xl font-bold text-primary font-mono">{progress.totalXp} XP</p>
          <span className="text-[11px] text-secondary">Cập nhật thời gian thực</span>
        </div>

        <div className="ui-card p-5 space-y-2 border-l-4 border-l-indigo-500">
          <span className="text-xs text-secondary font-semibold">Cấp bậc hiện tại</span>
          <p className="text-2xl sm:text-3xl font-bold text-on-surface">Cấp {progress.level}</p>
          <span className="text-[11px] text-secondary">{100 - (progress.totalXp % 100)} XP lên cấp tiếp</span>
        </div>

        <div className="ui-card p-5 space-y-2 border-l-4 border-l-amber-500">
          <span className="text-xs text-secondary font-semibold">Lượt quay còn lại</span>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 font-mono">{progress.availableSpins} lượt</p>
          <span className="text-[11px] text-secondary">Vòng quay may mắn</span>
        </div>

        <div className="ui-card p-5 space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-xs text-secondary font-semibold">Lần thi Quiz</span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">{progress.quizAttemptsCount} lần</p>
          <span className="text-[11px] text-secondary">Kiểm tra kiến thức</span>
        </div>
      </div>

      {/* 2-Column Ledger & Spin Histories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent XP History */}
        <section className="ui-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="type-h3 text-on-surface">Lịch sử tích lũy XP</h2>
            <Badge variant="brand">{progress.recentXpLedgers.length} giao dịch</Badge>
          </div>

          {progress.recentXpLedgers.length === 0 ? (
            <p className="text-xs text-secondary py-4 text-center">Chưa có giao dịch XP nào. Hãy tham gia Quiz để nhận điểm thưởng!</p>
          ) : (
            <ul className="space-y-2.5">
              {progress.recentXpLedgers.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-on-surface">{l.source}</p>
                    <p className="text-[11px] text-secondary">{new Date(l.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 text-sm">+{l.amountXp} XP</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Spin Wheel History */}
        <section className="ui-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="type-h3 text-on-surface">Quà tặng từ Vòng quay</h2>
            <Badge variant="brand">{progress.recentSpins.length} phần thưởng</Badge>
          </div>

          {progress.recentSpins.length === 0 ? (
            <p className="text-xs text-secondary py-4 text-center">Chưa có quà nào từ Vòng quay. Hãy quay thưởng tại khu vực Games!</p>
          ) : (
            <ul className="space-y-2.5">
              {progress.recentSpins.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-on-surface">{s.rewardLabel}</p>
                    <p className="text-[11px] text-secondary">{new Date(s.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                  {s.awardedXp > 0 ? (
                    <span className="font-mono font-bold text-primary">+{s.awardedXp} XP</span>
                  ) : (
                    <Badge variant="success">Hiện vật</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

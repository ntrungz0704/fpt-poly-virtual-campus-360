"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdminOverviewMetricsDto } from "@fpt-campus/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { ErrorState, LoadingState } from "@/components/ui";
import { fetchAdminOverviewMetrics } from "@/lib/admin/overview-admin-api";
import {
  areAllOverviewMetricsZero,
  mapOverviewMetricsToCards,
} from "@/lib/admin/overview-mappers";

interface AdminDashboardMetricsProps {
  refreshSignal?: number;
  onSynced?: (generatedAt: string) => void;
}

export function AdminDashboardMetrics({
  refreshSignal = 0,
  onSynced,
}: AdminDashboardMetricsProps) {
  const { user, status: authStatus } = useAuth();
  const authLoading = authStatus === "loading";
  const [metrics, setMetrics] = useState<AdminOverviewMetricsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const onSyncedRef = useRef(onSynced);

  useEffect(() => {
    onSyncedRef.current = onSynced;
  }, [onSynced]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    fetchAdminOverviewMetrics()
      .then((data) => {
        if (cancelled) return;
        setMetrics(data);
        setError(null);
        onSyncedRef.current?.(data.generatedAt);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải số liệu tổng quan từ cơ sở dữ liệu PostgreSQL.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, refreshSignal, retryTick]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryTick((n) => n + 1);
  };

  if (authLoading || (loading && !metrics && !error)) {
    return (
      <div
        data-testid="dashboard-metrics-loading"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5"
      >
        {[0, 1, 2, 3].map((slot) => (
          <LoadingState
            key={slot}
            variant="skeleton"
            rows={3}
            label="Đang tải chỉ số vận hành từ PostgreSQL"
            className="rounded-3xl"
          />
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div data-testid="dashboard-metrics-error">
        <ErrorState
          title="Không thể tải số liệu tổng quan từ PostgreSQL"
          description={error}
          actionLabel="Tải lại số liệu"
          onAction={handleRetry}
        />
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = mapOverviewMetricsToCards(metrics);
  const allZero = areAllOverviewMetricsZero(metrics);

  return (
    <div className="space-y-3" data-testid="dashboard-metrics-ready">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900"
        >
          <span>Làm mới số liệu thất bại: {error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="font-bold underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {allZero && (
        <div
          data-testid="dashboard-metrics-empty"
          className="rounded-2xl border border-surface-container bg-surface-container-lowest px-4 py-3 text-xs text-secondary flex items-center gap-2"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-secondary">
            database
          </span>
          <span>
            Cơ sở dữ liệu hiện chưa có dữ liệu vận hành — các bộ đếm hiển thị{" "}
            <strong className="text-on-surface">0</strong> và tỷ lệ chưa phát sinh hiển thị{" "}
            <strong className="text-on-surface">N/A</strong>.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card) => {
          const noteClass =
            card.tone === "positive"
              ? "text-emerald-600"
              : card.tone === "neutral"
                ? "text-amber-700"
                : "text-secondary";
          const noteIcon =
            card.tone === "positive"
              ? "trending_up"
              : card.tone === "neutral"
                ? "pending_actions"
                : "info";

          return (
            <Link
              key={card.id}
              href={card.href}
              data-testid={`metric-card-${card.id}`}
              className="ui-card ui-card-hover p-6 rounded-3xl border border-surface-container flex flex-col justify-between gap-4 transition-all hover:shadow-elevation-1 bg-surface-container-lowest min-w-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                    {card.icon}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-baseline flex-wrap gap-1.5">
                  <span
                    data-testid={`metric-value-${card.id}`}
                    className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight"
                  >
                    {card.value}
                  </span>
                  <span className="text-xs font-semibold text-secondary">
                    {card.unit}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 mt-2 text-xs font-semibold ${noteClass}`}>
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] shrink-0">
                    {noteIcon}
                  </span>
                  <span className="min-w-0 break-words">{card.note}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import type { AuditLogEntryDto } from "@fpt-campus/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import {
  fetchAdminAuditLogs,
  isForbiddenApiError,
} from "@/lib/admin/overview-admin-api";
import {
  formatAuditLogActivityRow,
  hasAuditReadPermission,
} from "@/lib/admin/overview-mappers";

interface AdminRecentActivityLogProps {
  refreshSignal?: number;
}

export function AdminRecentActivityLog({
  refreshSignal = 0,
}: AdminRecentActivityLogProps) {
  const { user, status: authStatus } = useAuth();
  const authLoading = authStatus === "loading";
  const canReadAudit = hasAuditReadPermission(user);
  const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (authLoading || !user || !canReadAudit) return;
    let cancelled = false;

    fetchAdminAuditLogs({ page: 1, limit: 8 })
      .then((res) => {
        if (cancelled) return;
        setLogs(res.items);
        setTotal(res.total);
        setForbidden(false);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isForbiddenApiError(err)) {
          setForbidden(true);
          setError(null);
          setLogs([]);
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải nhật ký kiểm toán từ máy chủ.",
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
  }, [authLoading, user, canReadAudit, refreshSignal, retryTick]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryTick((n) => n + 1);
  };

  const formattedRows = logs.map(formatAuditLogActivityRow);

  return (
    <div className="ui-card overflow-hidden" data-testid="admin-recent-activity-card">
      <div className="px-5 py-4 border-b border-surface-container bg-surface-container-low/40 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="type-h3 text-on-surface">Nhật ký thao tác gần đây</h2>
          <p className="text-xs text-secondary mt-0.5">
            Dữ liệu Audit Logs trực tiếp từ PostgreSQL (yêu cầu quyền{" "}
            <code className="font-mono text-[11px]">audit:read</code>).
          </p>
        </div>

        {canReadAudit && !forbidden && !error && !loading && (
          <Badge variant="neutral">
            {total.toLocaleString("vi-VN")} bản ghi
          </Badge>
        )}
      </div>

      {authLoading || (canReadAudit && loading && logs.length === 0 && !error && !forbidden) ? (
        <div className="p-5" data-testid="audit-log-loading">
          <LoadingState
            variant="skeleton"
            rows={4}
            label="Đang tải nhật ký thao tác từ PostgreSQL"
          />
        </div>
      ) : !canReadAudit || forbidden ? (
        <div
          data-testid="audit-log-forbidden"
          className="px-5 py-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-surface-container-low/20"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
              lock
            </span>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-on-surface">
                Tài khoản hiện tại không có quyền xem nhật ký hệ thống
              </p>
              <Badge variant="warning">403 · audit:read</Badge>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Endpoint <code className="font-mono">/api/v1/admin/audit-logs</code> chỉ cấp phép cho vai trò sở hữu quyền{" "}
              <strong className="text-on-surface">audit:read</strong> (Quản trị viên Hệ thống). Hệ thống không hiển thị dữ liệu nhật ký mô phỏng khi thiếu quyền.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="p-5" data-testid="audit-log-error">
          <ErrorState
            title="Không thể tải nhật ký thao tác"
            description={error}
            actionLabel="Thử lại"
            onAction={handleRetry}
          />
        </div>
      ) : formattedRows.length === 0 ? (
        <div className="p-5" data-testid="audit-log-empty">
          <EmptyState
            icon="history"
            title="Chưa có nhật ký thao tác nào"
            description="Hệ thống chưa ghi nhận sự kiện kiểm toán trong PostgreSQL. Các thay đổi quản trị sẽ xuất hiện tự động tại đây."
          />
        </div>
      ) : (
        <div className="divide-y divide-surface-container" data-testid="audit-log-list">
          {formattedRows.map((item) => (
            <div
              key={item.id}
              data-testid={`audit-log-row-${item.id}`}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-on-surface break-words">
                    {item.title}
                  </p>
                  <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                    {item.actionCode}
                  </code>
                </div>
                <p className="text-xs text-secondary">
                  {item.actorLabel} · {item.timestampLabel}
                </p>
              </div>
              <Badge
                variant={item.badgeVariant}
                className="self-start sm:self-center shrink-0"
              >
                {item.badgeLabel}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

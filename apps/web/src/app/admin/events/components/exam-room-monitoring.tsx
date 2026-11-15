"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  AdminQuizAttemptMonitoringDto,
  QuizAttemptStatus,
} from "@fpt-campus/shared";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  EmptyState,
  LoadingState,
  SearchInput,
} from "@/components/ui";
import { quizConfigApi } from "@/lib/auth/api-client";

interface ExamRoomMonitoringProps {
  selectedEventId?: string | null;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

export function ExamRoomMonitoring({
  onShowToast,
}: ExamRoomMonitoringProps) {
  const [attempts, setAttempts] = useState<AdminQuizAttemptMonitoringDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await quizConfigApi.getAttemptsMonitoring({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as QuizAttemptStatus) : undefined,
      });
      setAttempts(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Không thể tải danh sách giám sát phòng thi",
        "error",
      );
    }
  }, [page, pageSize, search, statusFilter, onShowToast]);

  useEffect(() => {
    let active = true;
    quizConfigApi
      .getAttemptsMonitoring({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as QuizAttemptStatus) : undefined,
      })
      .then((res) => {
        if (!active) return;
        setAttempts(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        onShowToast(
          err instanceof Error ? err.message : "Không thể tải danh sách giám sát phòng thi",
          "error",
        );
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, search, statusFilter, onShowToast]);

  // Auto-refresh interval (10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      void fetchAttempts();
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchAttempts]);

  // Format seconds to mm:ss
  const formatTimer = (totalSec: number) => {
    if (totalSec <= 0) return "00:00";
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const columns: DataTableColumn<AdminQuizAttemptMonitoringDto>[] = [
    {
      key: "student",
      header: "Sinh viên",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
            {row.student.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{row.student.fullName}</p>
            <p className="text-xs text-secondary truncate">{row.student.email}</p>
            {row.student.studentCode && (
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container text-secondary">
                {row.student.studentCode}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "quiz",
      header: "Bài thi & Lượt",
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-on-surface">{row.quizTitle}</p>
          <span className="text-xs font-medium text-secondary">
            Lượt thi số #{row.attemptNumber}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        let variant: "info" | "success" | "warning" = "info";
        let label = "Đang làm bài";
        if (row.status === "SUBMITTED") {
          variant = "success";
          label = "Đã nộp bài";
        } else if (row.status === "EXPIRED") {
          variant = "warning";
          label = "Hết giờ";
        }
        return (
          <div className="space-y-1">
            <Badge variant={variant}>{label}</Badge>
            {row.status === "IN_PROGRESS" && row.remainingSeconds > 0 && (
              <p className="text-xs font-mono font-bold text-primary">
                Còn: {formatTimer(row.remainingSeconds)}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "progress",
      header: "Tiến độ trả lời",
      render: (row) => {
        const percent = row.totalQuestions > 0 ? Math.round((row.answeredCount / row.totalQuestions) * 100) : 0;
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-on-surface">
                {row.answeredCount} / {row.totalQuestions} câu
              </span>
              <span className="text-secondary">{percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "time",
      header: "Bắt đầu / Hết hạn",
      render: (row) => (
        <div className="text-xs space-y-0.5 text-secondary">
          <p>Bắt đầu: {new Date(row.startedAt).toLocaleTimeString("vi-VN")}</p>
          <p>Hết hạn: {new Date(row.expiresAt).toLocaleTimeString("vi-VN")}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-xl border border-surface-container">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Tìm theo tên, email, MSSV..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-high text-xs font-bold text-on-surface cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="IN_PROGRESS">Đang làm bài (IN_PROGRESS)</option>
            <option value="SUBMITTED">Đã nộp (SUBMITTED)</option>
            <option value="EXPIRED">Đã hết giờ (EXPIRED)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-surface-container text-primary focus:ring-primary cursor-pointer"
            />
            Tự động làm mới (10s)
          </label>
          <Button
            size="sm"
            variant="outline"
            icon="refresh"
            onClick={() => void fetchAttempts()}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Monitoring Table */}
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <LoadingState label="Đang tải dữ liệu giám sát phòng thi..." />
        </div>
      ) : attempts.length === 0 ? (
        <EmptyState
          title="Chưa có lượt thi nào"
          description="Hiện chưa có sinh viên nào bắt đầu làm bài thi theo bộ lọc hiện tại."
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            data={attempts}
            columns={columns}
            rowKey={(r) => r.id}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 text-xs text-secondary">
            <span>
              Hiển thị {attempts.length} / {total} lượt thi
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trang trước
              </Button>
              <span className="font-bold text-on-surface">
                Trang {page} / {totalPages || 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

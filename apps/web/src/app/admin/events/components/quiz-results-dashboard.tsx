"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  AdminQuizResultDetailDto,
  AdminQuizResultItemDto,
  AdminQuizResultSummaryDto,
  QuizAttemptStatus,
  QuizConfigurationDto,
} from "@fpt-campus/shared";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  EmptyState,
  LoadingState,
  Modal,
  SearchInput,
} from "@/components/ui";
import { quizConfigApi } from "@/lib/auth/api-client";

interface QuizResultsDashboardProps {
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

export function QuizResultsDashboard({ onShowToast }: QuizResultsDashboardProps) {
  // Results list state
  const [items, setItems] = useState<AdminQuizResultItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Summary KPI metrics
  const [summary, setSummary] = useState<AdminQuizResultSummaryDto | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [quizFilter, setQuizFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [passedFilter, setPassedFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<"submittedAt" | "startedAt" | "scorePercent" | "awardedXp" | "attemptNumber">("submittedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Available quizzes for filter dropdown
  const [quizzes, setQuizzes] = useState<QuizConfigurationDto[]>([]);

  // Detail Modal state
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<AdminQuizResultDetailDto | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Student Retake History Modal state
  const [historyTarget, setHistoryTarget] = useState<{ userId: string; quizConfigId: string; studentName: string; quizTitle: string } | null>(null);
  const [studentHistory, setStudentHistory] = useState<AdminQuizResultItemDto[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load available quizzes on mount
  useEffect(() => {
    let active = true;
    quizConfigApi
      .list({ limit: 100 })
      .then((res) => {
        if (active) setQuizzes(res.items);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  // Fetch summary metrics
  const fetchSummary = useCallback(async () => {
    try {
      const res = await quizConfigApi.getResultsSummary(
        quizFilter !== "ALL" ? quizFilter : undefined,
      );
      setSummary(res);
    } catch {
      // ignore
    }
  }, [quizFilter]);

  // Fetch paginated results list
  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await quizConfigApi.getResults({
        page,
        limit: pageSize,
        quizConfigId: quizFilter !== "ALL" ? quizFilter : undefined,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as QuizAttemptStatus) : undefined,
        passed:
          passedFilter === "PASSED"
            ? true
            : passedFilter === "FAILED"
              ? false
              : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sortBy,
        sortOrder,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Không thể tải danh sách kết quả bài thi",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, quizFilter, search, statusFilter, passedFilter, fromDate, toDate, sortBy, sortOrder, onShowToast]);

  // Automatic subscription effect for summary
  useEffect(() => {
    let active = true;
    quizConfigApi
      .getResultsSummary(quizFilter !== "ALL" ? quizFilter : undefined)
      .then((res) => {
        if (!active) return;
        setSummary(res);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [quizFilter]);

  // Automatic subscription effect for paginated results
  useEffect(() => {
    let active = true;
    quizConfigApi
      .getResults({
        page,
        limit: pageSize,
        quizConfigId: quizFilter !== "ALL" ? quizFilter : undefined,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as QuizAttemptStatus) : undefined,
        passed:
          passedFilter === "PASSED"
            ? true
            : passedFilter === "FAILED"
              ? false
              : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sortBy,
        sortOrder,
      })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        onShowToast(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách kết quả bài thi",
          "error",
        );
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, quizFilter, search, statusFilter, passedFilter, fromDate, toDate, sortBy, sortOrder, onShowToast]);

  // Open attempt review detail
  const handleOpenDetail = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setIsLoadingDetail(true);
    try {
      const detail = await quizConfigApi.getResultDetail(attemptId);
      setAttemptDetail(detail);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Không thể tải chi tiết bài làm",
        "error",
      );
      setSelectedAttemptId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Open student retake history modal
  const handleOpenRetakeHistory = async (item: AdminQuizResultItemDto) => {
    setHistoryTarget({
      userId: item.student.id,
      quizConfigId: item.quizConfigId,
      studentName: item.student.fullName,
      quizTitle: item.quizTitle,
    });
    setIsLoadingHistory(true);
    try {
      const history = await quizConfigApi.getStudentAttemptHistory(
        item.student.id,
        item.quizConfigId,
      );
      setStudentHistory(history);
    } catch (err) {
      onShowToast(
        err instanceof Error ? err.message : "Không thể tải lịch sử thi lại của sinh viên",
        "error",
      );
      setHistoryTarget(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Columns for DataTable
  const columns: DataTableColumn<AdminQuizResultItemDto>[] = [
    {
      key: "student",
      header: "Sinh viên",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {row.student.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">
              {row.student.fullName}
            </p>
            <p className="text-[11px] text-secondary truncate">
              {row.student.studentCode ? `${row.student.studentCode} • ` : ""}
              {row.student.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "quiz",
      header: "Bài thi & Lượt",
      render: (row) => (
        <div className="space-y-1">
          <p className="text-xs font-bold text-on-surface line-clamp-1">{row.quizTitle}</p>
          <div className="flex items-center gap-1.5">
            {row.isRetake ? (
              <Badge variant="warning" className="text-[10px]">
                Thi lại (#{row.attemptNumber}/{row.maxAttempts})
              </Badge>
            ) : (
              <Badge variant="primary" className="text-[10px]">
                Lượt 1/{row.maxAttempts}
              </Badge>
            )}
            <span className="text-[11px] text-secondary">
              Sàn: {row.passingScore}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "time",
      header: "Thời gian làm bài",
      render: (row) => (
        <div className="text-[11px] space-y-0.5 text-secondary">
          <p>Bắt đầu: {new Date(row.startedAt).toLocaleString("vi-VN")}</p>
          {row.submittedAt ? (
            <p className="text-on-surface font-medium">
              Nộp bài: {new Date(row.submittedAt).toLocaleString("vi-VN")}
            </p>
          ) : (
            <p className="italic">Chưa nộp bài</p>
          )}
        </div>
      ),
    },
    {
      key: "score",
      header: "Điểm & Kết quả",
      render: (row) => {
        if (row.status !== "SUBMITTED") {
          return (
            <Badge variant="neutral" className="text-[10px]">
              {row.status === "IN_PROGRESS" ? "Đang làm" : "Quá hạn"}
            </Badge>
          );
        }

        const isPassed = row.passed === true;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-on-surface">
                {row.scorePercent}%
              </span>
              <Badge variant={isPassed ? "success" : "error"} className="text-[10px] font-bold">
                {isPassed ? "ĐẠT" : "CHƯA ĐẠT"}
              </Badge>
            </div>
            <p className="text-[11px] text-secondary">
              {row.correctCount}/{row.totalQuestions} câu đúng
            </p>
          </div>
        );
      },
    },
    {
      key: "xp",
      header: "XP tích lũy",
      render: (row) => {
        if (row.awardedXp !== null && row.awardedXp > 0) {
          return (
            <Badge variant="warning" className="text-xs font-mono font-bold">
              +{row.awardedXp} XP
            </Badge>
          );
        }
        if (row.isRetake) {
          return (
            <span className="text-[11px] text-secondary" title="Quy tắc: Mỗi sinh viên chỉ nhận XP một lần">
              0 XP (Lượt thi lại)
            </span>
          );
        }
        if (row.status === "SUBMITTED") {
          return <span className="text-[11px] text-secondary">0 XP</span>;
        }
        return <span className="text-[11px] text-secondary">--</span>;
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs py-1 px-2.5 h-auto flex items-center gap-1"
            onClick={() => handleOpenDetail(row.id)}
            title="Xem chi tiết câu hỏi & đáp án của thí sinh"
            data-testid={`btn-review-${row.id}`}
          >
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            <span>Chi tiết</span>
          </Button>

          {row.isRetake && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs py-1 px-2.5 h-auto flex items-center gap-1"
              onClick={() => handleOpenRetakeHistory(row)}
              title="Xem tất cả các lần thi của sinh viên này đối với bài thi"
              data-testid={`btn-retake-history-${row.id}`}
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              <span>Lịch sử thi lại</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5" data-testid="admin-quiz-results-dashboard">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="ui-card p-3.5 space-y-1 border-l-4 border-l-primary">
          <span className="text-[11px] text-secondary font-semibold">Tổng lượt thi</span>
          <p className="text-xl font-bold font-mono text-on-surface">
            {summary?.totalAttempts ?? 0}
          </p>
        </div>

        <div className="ui-card p-3.5 space-y-1 border-l-4 border-l-blue-500">
          <span className="text-[11px] text-secondary font-semibold">Đã hoàn thành</span>
          <p className="text-xl font-bold font-mono text-blue-600">
            {summary?.totalSubmitted ?? 0}
          </p>
        </div>

        <div className="ui-card p-3.5 space-y-1 border-l-4 border-l-emerald-500">
          <span className="text-[11px] text-secondary font-semibold">Tỷ lệ đạt (Pass)</span>
          <p className="text-xl font-bold font-mono text-emerald-600">
            {summary?.passRatePercent ?? 0}%
          </p>
          <span className="text-[10px] text-secondary block">
            {summary?.totalPassed ?? 0} / {summary?.totalSubmitted ?? 0} lượt
          </span>
        </div>

        <div className="ui-card p-3.5 space-y-1 border-l-4 border-l-indigo-500">
          <span className="text-[11px] text-secondary font-semibold">Điểm TB</span>
          <p className="text-xl font-bold font-mono text-indigo-600">
            {summary?.avgScorePercent ?? 0}%
          </p>
        </div>

        <div className="ui-card p-3.5 space-y-1 border-l-4 border-l-teal-500">
          <span className="text-[11px] text-secondary font-semibold">Thí sinh tham gia</span>
          <p className="text-xl font-bold font-mono text-teal-600">
            {summary?.uniqueStudentsCount ?? 0}
          </p>
        </div>

        <div className="ui-card p-3.5 space-y-1 border-l-4 border-l-amber-500">
          <span className="text-[11px] text-secondary font-semibold">Tổng XP đã cấp</span>
          <p className="text-xl font-bold font-mono text-amber-600">
            +{summary?.totalAwardedXp ?? 0} XP
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="ui-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              placeholder="Tìm tên, email, MSSV..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56"
            />

            <select
              aria-label="Lọc theo bài thi"
              value={quizFilter}
              onChange={(e) => {
                setQuizFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              data-testid="admin-filter-quiz"
            >
              <option value="ALL">Tất cả bài thi</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo kết quả đạt"
              value={passedFilter}
              onChange={(e) => {
                setPassedFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              data-testid="admin-filter-passed"
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="PASSED">Đạt yêu cầu (PASS)</option>
              <option value="FAILED">Chưa đạt (FAIL)</option>
            </select>

            <select
              aria-label="Lọc theo trạng thái lượt thi"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              data-testid="admin-filter-status"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUBMITTED">Đã nộp bài (SUBMITTED)</option>
              <option value="IN_PROGRESS">Đang làm bài (IN_PROGRESS)</option>
              <option value="EXPIRED">Hết giờ (EXPIRED)</option>
            </select>

            <select
              aria-label="Sắp xếp kết quả"
              value={sortBy}
              onChange={(e) => {
                setSortBy(
                  e.target.value as
                    | "submittedAt"
                    | "startedAt"
                    | "scorePercent"
                    | "awardedXp"
                    | "attemptNumber",
                );
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="submittedAt">Sắp xếp: Mới nộp nhất</option>
              <option value="scorePercent">Sắp xếp: Điểm cao nhất</option>
              <option value="awardedXp">Sắp xếp: XP cao nhất</option>
              <option value="startedAt">Sắp xếp: Giờ bắt đầu</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span>Từ:</span>
              <input
                type="date"
                aria-label="Từ ngày"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <span>Đến:</span>
              <input
                type="date"
                aria-label="Đến ngày"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
              className="p-1.5 rounded-lg border border-outline-variant/50 bg-surface text-secondary hover:text-on-surface text-xs flex items-center gap-1 cursor-pointer"
              title={sortOrder === "desc" ? "Đang sắp xếp giảm dần" : "Đang sắp xếp tăng dần"}
            >
              <span className="material-symbols-outlined text-[16px]">
                {sortOrder === "desc" ? "south" : "north"}
              </span>
              <span>{sortOrder === "desc" ? "Giảm dần" : "Tăng dần"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                void fetchResults();
                void fetchSummary();
              }}
              className="flex items-center gap-1.5"
            >
              <span className={`material-symbols-outlined text-[16px] ${isLoading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {isLoading ? (
        <div className="p-12 flex justify-center ui-card">
          <LoadingState label="Đang tải danh sách kết quả bài thi..." />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Không tìm thấy bài làm nào"
          description="Chưa có lượt nộp bài nào phù hợp với bộ lọc hiện tại."
        />
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={items}
            rowKey={(r) => r.id}
            emptyTitle="Chưa có kết quả"
            emptyDescription="Không tìm thấy dữ liệu kết quả nào"
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-secondary">
              <span>
                Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng {total} bài nộp)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attempt Review Modal */}
      <Modal
        open={Boolean(selectedAttemptId)}
        onClose={() => {
          setSelectedAttemptId(null);
          setAttemptDetail(null);
        }}
        title="Chi tiết bài làm thí sinh"
        size="xl"
      >
        {isLoadingDetail ? (
          <div className="p-8 flex justify-center">
            <LoadingState label="Đang tải chi tiết bài làm..." />
          </div>
        ) : attemptDetail ? (
          <div className="space-y-5 pt-1" data-testid="admin-attempt-detail-modal">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-on-surface">
                      {attemptDetail.student.fullName}
                    </h3>
                    <span className="text-xs text-secondary font-mono">
                      ({attemptDetail.student.studentCode || attemptDetail.student.email})
                    </span>
                  </div>
                  <p className="text-xs text-secondary">
                    Bài thi: <strong>{attemptDetail.quizTitle}</strong> • {attemptDetail.isRetake ? `Lượt thi lại #${attemptDetail.attemptNumber}` : "Lượt thi đầu tiên"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={attemptDetail.passed ? "success" : "error"}
                    className="text-xs font-bold"
                  >
                    {attemptDetail.passed ? "ĐẠT YÊU CẦU" : "CHƯA ĐẠT"}
                  </Badge>
                  <Badge variant="warning" className="text-xs font-mono font-bold">
                    +{attemptDetail.awardedXp ?? 0} XP
                  </Badge>
                </div>
              </div>

              {/* KPI metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/20 text-center">
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Điểm số</span>
                  <span className="text-lg font-bold font-mono text-on-surface">
                    {attemptDetail.scorePercent !== null ? `${attemptDetail.scorePercent}%` : "--"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Số câu đúng</span>
                  <span className="text-lg font-bold font-mono text-on-surface">
                    {attemptDetail.correctCount ?? 0} / {attemptDetail.totalQuestions}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Điểm sàn</span>
                  <span className="text-lg font-bold font-mono text-on-surface">
                    {attemptDetail.passingScore}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface">
                  <span className="text-[11px] text-secondary block">Lý do cấp XP</span>
                  <span className="text-xs font-bold text-secondary block truncate mt-1">
                    {attemptDetail.xpReason ?? "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  quiz
                </span>
                <span>Chi tiết các câu hỏi & câu trả lời</span>
              </h4>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {attemptDetail.results.map((q, idx) => {
                  const isCorrect = q.isCorrect;
                  return (
                    <div
                      key={q.questionId}
                      className={`p-4 rounded-xl border transition-all ${
                        isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-red-500/40 bg-red-500/5"
                      }`}
                      data-testid={`admin-review-question-${q.displayedOrder}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-surface text-secondary">
                          Câu {idx + 1}
                        </span>
                        {isCorrect ? (
                          <Badge variant="success" className="text-[10px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                            <span>Đúng</span>
                          </Badge>
                        ) : (
                          <Badge variant="error" className="text-[10px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">close</span>
                            <span>Sai</span>
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm font-medium text-on-surface mb-3 whitespace-pre-wrap">
                        {q.questionText}
                      </p>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = q.selectedOptionIndex === optIdx;
                          const isCorrectOpt = q.correctOptionIndex === optIdx;

                          let style = "border-outline-variant/30 bg-surface text-secondary";
                          if (isSelected && isCorrect) {
                            style = "border-emerald-500 bg-emerald-500/15 text-emerald-700 font-semibold";
                          } else if (isSelected && !isCorrect) {
                            style = "border-red-500 bg-red-500/15 text-red-700 font-semibold";
                          } else if (isCorrectOpt) {
                            style = "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 font-medium";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${style}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold uppercase w-5 text-center">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{opt}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                                {isSelected && (
                                  <span className="italic font-medium">
                                    (Thí sinh chọn)
                                  </span>
                                )}
                                {isCorrectOpt && (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                                    <span className="material-symbols-outlined text-[14px]">
                                      check_circle
                                    </span>
                                    <span>Đáp án đúng</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-secondary">
                          <strong className="text-primary block mb-0.5">Lời giải:</strong>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAttemptId(null);
                  setAttemptDetail(null);
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Student Retake History Modal */}
      <Modal
        open={Boolean(historyTarget)}
        onClose={() => setHistoryTarget(null)}
        title="Lịch sử các lượt thi của thí sinh"
        size="lg"
      >
        {historyTarget && (
          <div className="space-y-4 pt-1" data-testid="student-retake-history-modal">
            <div className="p-3.5 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-xs space-y-1">
              <p>
                Thí sinh: <strong>{historyTarget.studentName}</strong>
              </p>
              <p>
                Bài thi: <strong>{historyTarget.quizTitle}</strong>
              </p>
              <p className="text-secondary text-[11px]">
                Theo chính sách Gamification: Chỉ lượt nộp bài đầu tiên được cấp điểm thưởng XP. Các lượt thi lại được ghi nhận điểm số nhưng nhận 0 XP.
              </p>
            </div>

            {isLoadingHistory ? (
              <div className="p-8 flex justify-center">
                <LoadingState label="Đang tải lịch sử thi lại..." />
              </div>
            ) : studentHistory.length === 0 ? (
              <EmptyState title="Không có lượt thi nào" description="Chưa ghi nhận lượt thi nào của sinh viên này." />
            ) : (
              <div className="space-y-2.5">
                {studentHistory.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-outline-variant/30 bg-surface flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">
                          Lượt thi #{att.attemptNumber}
                        </span>
                        {att.isRetake ? (
                          <Badge variant="warning" className="text-[10px]">
                            Thi lại
                          </Badge>
                        ) : (
                          <Badge variant="primary" className="text-[10px]">
                            Lượt đầu
                          </Badge>
                        )}
                        <Badge variant={att.status === "SUBMITTED" ? "success" : "neutral"} className="text-[10px]">
                          {att.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-secondary">
                        Bắt đầu: {new Date(att.startedAt).toLocaleString("vi-VN")}
                        {att.submittedAt && ` • Nộp: ${new Date(att.submittedAt).toLocaleString("vi-VN")}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {att.status === "SUBMITTED" ? (
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm block">
                            {att.scorePercent}%
                          </span>
                          <span className={`text-[10px] font-bold ${att.passed ? "text-emerald-600" : "text-red-600"}`}>
                            {att.passed ? "ĐẠT" : "CHƯA ĐẠT"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-secondary text-xs">--</span>
                      )}

                      <div className="text-right min-w-[70px]">
                        {att.awardedXp !== null && att.awardedXp > 0 ? (
                          <Badge variant="warning" className="text-xs font-mono font-bold">
                            +{att.awardedXp} XP
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-secondary">
                            0 XP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-outline-variant/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryTarget(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

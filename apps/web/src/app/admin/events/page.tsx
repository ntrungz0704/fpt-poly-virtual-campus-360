"use client";

import React, { useEffect, useState, useCallback } from "react";
import type {
  AdminEventParticipationDto,
  AdminOpenDayEventDto,
  AdminOpenDayQuizItemDto,
  AdminOpenDaySessionDto,
} from "@fpt-campus/shared";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  Input,
  LoadingState,
  Modal,
  SearchInput,
  StatusToast,
  Textarea,
} from "@/components/ui";
import {
  checkInAttendeeTicket,
  createAdminQuizItem,
  deleteAdminQuizItem,
  fetchAdminEvents,
  fetchAdminEventSessions,
  fetchAdminParticipations,
  fetchAdminQuizItems,
} from "@/lib/admin/events-admin-api";
import { ApiClientError } from "@/lib/auth/api-client";
import { cn } from "@/lib/utils";
import { ExamRoomMonitoring } from "./components/exam-room-monitoring";
import { QuizConfigManager } from "./components/quiz-config-manager";
import { QuizResultsDashboard } from "./components/quiz-results-dashboard";

export default function AdminEventsPage() {
  const [tab, setTab] = useState<"schedule" | "checkin" | "quiz-config" | "exam-monitoring" | "quiz" | "results">("schedule");
  const [events, setEvents] = useState<AdminOpenDayEventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Schedule state
  const [sessions, setSessions] = useState<AdminOpenDaySessionDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Check-in roster state
  const [participations, setParticipations] = useState<AdminEventParticipationDto[]>([]);
  const [totalRoster, setTotalRoster] = useState(0);
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [rosterQuery, setRosterQuery] = useState("");

  // Quiz items state
  const [quizItems, setQuizItems] = useState<AdminOpenDayQuizItemDto[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [createQuizOpen, setCreateQuizOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState<{
    questionText: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  }>({
    questionText: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });

  // Quick check-in input state
  const [quickTicketCode, setQuickTicketCode] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type?: "success" | "error" | "info";
  }>({ open: false, message: "" });

  // Load admin events on mount
  useEffect(() => {
    fetchAdminEvents()
      .then((items) => {
        setEvents(items);
        if (items.length > 0) {
          const defaultEv = items.find((e) => e.isDefault) ?? items[0];
          setSelectedEventId(defaultEv.id);
        }
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err instanceof Error ? err.message : "Không thể tải danh sách sự kiện",
          type: "error",
        });
      });
  }, []);

  // Load sessions when selected event changes
  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    fetchAdminEventSessions(selectedEventId)
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
          setIsLoadingSessions(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({
            open: true,
            message: err instanceof Error ? err.message : "Lỗi tải lịch trình",
            type: "error",
          });
          setIsLoadingSessions(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  // Load participations when tab is 'checkin', event changes, or query changes
  const loadParticipations = useCallback((eventId: string, query: string) => {
    setIsLoadingRoster(true);
    fetchAdminParticipations(eventId, { search: query.trim() || undefined, pageSize: 50 })
      .then((res) => {
        setParticipations(res.items);
        setTotalRoster(res.total);
        setTotalCheckedIn(res.totalCheckedIn);
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err instanceof Error ? err.message : "Lỗi tải danh sách khách",
          type: "error",
        });
      })
      .finally(() => {
        setIsLoadingRoster(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId || tab !== "checkin") return;
    const timer = setTimeout(() => {
      loadParticipations(selectedEventId, rosterQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedEventId, tab, rosterQuery, loadParticipations]);

  // Load quiz items when tab is 'quiz' or event changes
  const loadQuizItems = useCallback((eventId: string) => {
    fetchAdminQuizItems(eventId)
      .then((items) => {
        setQuizItems(items);
      })
      .catch((err) => {
        setToast({
          open: true,
          message: err instanceof Error ? err.message : "Lỗi tải ngân hàng câu hỏi",
          type: "error",
        });
      })
      .finally(() => {
        setIsLoadingQuiz(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId || tab !== "quiz") return;
    loadQuizItems(selectedEventId);
  }, [selectedEventId, tab, loadQuizItems]);

  // Handle Check-in Action
  const handleCheckIn = async (codeToSubmit: string) => {
    const code = codeToSubmit.trim().toUpperCase();
    if (!code) {
      setToast({ open: true, message: "Vui lòng nhập mã vé hợp lệ", type: "error" });
      return;
    }

    setIsCheckingIn(true);
    try {
      const res = await checkInAttendeeTicket({ ticketCode: code });
      setToast({
        open: true,
        message: res.message || `Check-in thành công mã vé ${code}!`,
        type: "success",
      });
      setQuickTicketCode("");
      if (selectedEventId) {
        loadParticipations(selectedEventId, rosterQuery);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setToast({ open: true, message: err.message, type: "error" });
      } else {
        setToast({ open: true, message: "Lỗi kết nối khi check-in vé", type: "error" });
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleQuickCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleCheckIn(quickTicketCode);
  };

  // Handle Create Quiz Item
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !quizForm.questionText.trim()) return;

    const validOptions = quizForm.options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setToast({ open: true, message: "Vui lòng nhập ít nhất 2 đáp án lựa chọn", type: "error" });
      return;
    }

    setIsCreatingQuiz(true);
    try {
      await createAdminQuizItem(selectedEventId, {
        questionText: quizForm.questionText.trim(),
        options: quizForm.options.map((o) => o.trim()),
        correctIndex: quizForm.correctIndex,
        explanation: quizForm.explanation.trim() || "Đáp án chính xác theo quy chuẩn đào tạo FPT Polytechnic.",
      });

      setToast({ open: true, message: "Tạo câu hỏi Quiz mới thành công!", type: "success" });
      setCreateQuizOpen(false);
      setQuizForm({
        questionText: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      });
      loadQuizItems(selectedEventId);
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi tạo câu hỏi: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Handle Delete Quiz Item
  const handleDeleteQuiz = async (quizItemId: string) => {
    if (!selectedEventId) return;
    try {
      await deleteAdminQuizItem(selectedEventId, quizItemId);
      setToast({ open: true, message: "Đã xóa câu hỏi khỏi ngân hàng", type: "success" });
      loadQuizItems(selectedEventId);
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi xóa câu hỏi: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    }
  };

  // Columns for Sessions Table
  const sessionColumns: DataTableColumn<AdminOpenDaySessionDto>[] = [
    {
      key: "time",
      header: "Khung giờ",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-on-surface">
          {row.startTimeLabel} – {row.endTimeLabel}
        </span>
      ),
    },
    {
      key: "title",
      header: "Phiên hoạt động",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-on-surface">{row.title}</p>
          <p className="text-xs text-secondary">{row.description}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Địa điểm đón tiếp",
      render: (row) => (
        <span className="text-xs text-on-surface font-medium">
          {row.locationLabel || "Toàn khuôn viên"}
        </span>
      ),
    },
    {
      key: "period",
      header: "Buổi hoạt động",
      render: (row) => (
        <span className="text-xs text-secondary font-medium">
          {row.sessionPeriod === "MORNING"
            ? "Buổi sáng"
            : row.sessionPeriod === "AFTERNOON"
              ? "Buổi chiều"
              : "Cả ngày"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => (
        <Badge variant={row.status === "PUBLISHED" ? "success" : "neutral"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  // Columns for Check-in Roster Table
  const rosterColumns: DataTableColumn<AdminEventParticipationDto>[] = [
    {
      key: "ticket",
      header: "Mã vé",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-bold text-primary">{row.ticketCode}</p>
          <p className="text-[11px] text-secondary">
            {new Date(row.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      ),
    },
    {
      key: "name",
      header: "Khách mời",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-on-surface">{row.attendeeName || "Khách tham quan"}</p>
          <p className="text-xs text-secondary">{row.attendeeEmail}</p>
          <p className="text-xs font-mono text-secondary">{row.attendeePhone}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => {
        const isChecked = row.participationStatus === "CHECKED_IN";
        return (
          <div className="space-y-1">
            <Badge variant={isChecked ? "success" : "neutral"}>
              {isChecked ? "Đã check-in" : "Chưa check-in"}
            </Badge>
            {row.checkedInAt && (
              <p className="text-[11px] text-emerald-600 font-medium">
                {new Date(row.checkedInAt).toLocaleTimeString("vi-VN")}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác quầy",
      align: "right",
      render: (row) => {
        const isChecked = row.participationStatus === "CHECKED_IN";
        return isChecked ? (
          <span className="text-xs text-secondary font-medium">Hoàn tất</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            icon="how_to_reg"
            onClick={() => handleCheckIn(row.ticketCode)}
          >
            Điểm danh
          </Button>
        );
      },
    },
  ];

  // Columns for Quiz Items Table
  const quizColumns: DataTableColumn<AdminOpenDayQuizItemDto>[] = [
    {
      key: "question",
      header: "Câu hỏi & Các phương án",
      render: (row) => (
        <div className="space-y-2 max-w-xl">
          <p className="text-sm font-bold text-on-surface">{row.questionText}</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {row.options.map((opt, idx) => {
              const isCorrect = idx === row.correctIndex;
              return (
                <div
                  key={idx}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border",
                    isCorrect
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                      : "bg-surface-container-low border-surface-container text-secondary",
                  )}
                >
                  <span className="mr-1.5 font-bold">{String.fromCharCode(65 + idx)}.</span>
                  <span>{opt}</span>
                  {isCorrect && (
                    <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">(Đúng)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      key: "explanation",
      header: "Giải thích kiến thức",
      render: (row) => (
        <span className="text-xs text-secondary max-w-xs line-clamp-2">
          {row.explanation || "Không có giải thích"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => (
        <Badge variant={row.status === "PUBLISHED" ? "success" : "neutral"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          icon="delete"
          onClick={() => handleDeleteQuiz(row.id)}
        >
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Open Day &amp; Điểm danh Check-in</h1>
          <p className="type-body-sm text-secondary mt-1">
            Quản lý lịch trình công khai, ngân hàng câu hỏi Quiz và điểm danh vé QR thực tế tại quầy đón tiếp QTSC.
          </p>
        </div>

        {events.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-secondary whitespace-nowrap">Sự kiện:</label>
            <select
              value={selectedEventId ?? ""}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-high text-xs font-bold text-on-surface"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mode Switch Tabs */}
      <div
        role="tablist"
        aria-label="Phân khu điều phối Open Day"
        className="inline-flex p-1 rounded-xl bg-surface-container-lowest border border-surface-container"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "schedule"}
          onClick={() => setTab("schedule")}
          className={cn(
            "min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
            tab === "schedule"
              ? "bg-primary text-white shadow-xs"
              : "text-secondary hover:text-on-surface",
          )}
        >
          Lịch trình ({sessions.length} phiên)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "checkin"}
          onClick={() => setTab("checkin")}
          className={cn(
            "min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
            tab === "checkin"
              ? "bg-primary text-white shadow-xs"
              : "text-secondary hover:text-on-surface",
          )}
        >
          Điểm danh ({totalCheckedIn}/{totalRoster} vé)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "quiz-config"}
          onClick={() => setTab("quiz-config")}
          className={cn(
            "min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
            tab === "quiz-config"
              ? "bg-primary text-white shadow-xs"
              : "text-secondary hover:text-on-surface",
          )}
        >
          Cấu hình Bài thi (M7.1)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "exam-monitoring"}
          onClick={() => setTab("exam-monitoring")}
          className={cn(
            "min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
            tab === "exam-monitoring"
              ? "bg-primary text-white shadow-xs"
              : "text-secondary hover:text-on-surface",
          )}
        >
          Giám sát phòng thi (M7.3)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "quiz"}
          onClick={() => setTab("quiz")}
          className={cn(
            "min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
            tab === "quiz"
              ? "bg-primary text-white shadow-xs"
              : "text-secondary hover:text-on-surface",
          )}
        >
          Ngân hàng Quiz ({quizItems.length} câu)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "results"}
          onClick={() => setTab("results")}
          className={cn(
            "min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
            tab === "results"
              ? "bg-primary text-white shadow-xs"
              : "text-secondary hover:text-on-surface",
          )}
        >
          Kết quả thi Quiz
        </button>
      </div>

      {/* Tab Panel: Schedule */}
      {tab === "schedule" && (
        <div className="space-y-4">
          {isLoadingSessions ? (
            <div className="p-8 flex justify-center">
              <LoadingState label="Đang tải lịch trình..." />
            </div>
          ) : (
            <DataTable
              columns={sessionColumns}
              data={sessions}
              rowKey={(s) => s.id}
            />
          )}
        </div>
      )}

      {/* Tab Panel: Check-in Roster */}
      {tab === "checkin" && (
        <div className="space-y-5">
          {/* Quick Check-in Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-surface-container space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
                  qr_code_scanner
                </span>
                <span>Quét mã QR hoặc Nhập mã vé Check-in nhanh</span>
              </h2>
              <span className="text-xs font-semibold text-secondary">
                Tiến độ: <strong className="text-primary">{totalCheckedIn}</strong> / {totalRoster} đã đến sảnh
              </span>
            </div>

            <form onSubmit={handleQuickCheckInSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={quickTicketCode}
                onChange={(e) => setQuickTicketCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã vé ví dụ: OD26-A1B2-C3D4..."
                disabled={isCheckingIn}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-surface-container font-mono text-sm uppercase placeholder:font-sans placeholder:normal-case focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={isCheckingIn ? "hourglass_empty" : "check"}
                disabled={isCheckingIn || !quickTicketCode.trim()}
              >
                {isCheckingIn ? "Đang điểm danh..." : "Xác nhận Check-in"}
              </Button>
            </form>
          </div>

          {/* Roster DataTable */}
          {isLoadingRoster ? (
            <div className="p-8 flex justify-center">
              <LoadingState label="Đang tải danh sách điểm danh..." />
            </div>
          ) : (
            <DataTable
              columns={rosterColumns}
              data={participations}
              rowKey={(r) => r.id}
              toolbar={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <SearchInput
                    value={rosterQuery}
                    onChange={(e) => setRosterQuery(e.target.value)}
                    onClear={() => setRosterQuery("")}
                    placeholder="Tìm theo mã vé OD26..., họ tên, email hoặc SĐT..."
                    containerClassName="w-full sm:max-w-md"
                  />
                  <Badge variant="brand">
                    Đã có mặt: {totalCheckedIn}/{totalRoster} khách đăng ký
                  </Badge>
                </div>
              }
            />
          )}
        </div>
      )}

      {/* Tab Panel: Quiz Config (M7.1) */}
      {tab === "quiz-config" && (
        <QuizConfigManager
          selectedEventId={selectedEventId}
          events={events}
          onShowToast={(message, type) =>
            setToast({ open: true, message, type: type ?? "info" })
          }
        />
      )}

      {/* Tab Panel: Exam Room Monitoring (M7.3) */}
      {tab === "exam-monitoring" && (
        <ExamRoomMonitoring
          selectedEventId={selectedEventId}
          onShowToast={(message, type) =>
            setToast({ open: true, message, type: type ?? "info" })
          }
        />
      )}

      {/* Tab Panel: Quiz Bank */}
      {tab === "quiz" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-on-surface">Bộ câu hỏi Minigame &amp; Trạm dừng 360°</h2>
              <p className="text-xs text-secondary mt-0.5">
                Các câu hỏi này xuất hiện trong thử thách khám phá Virtual Campus và Minigame Open Day để tích điểm quay số.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon="add_circle"
              onClick={() => setCreateQuizOpen(true)}
            >
              Thêm câu hỏi mới
            </Button>
          </div>

          {isLoadingQuiz ? (
            <div className="p-8 flex justify-center">
              <LoadingState label="Đang tải ngân hàng câu hỏi..." />
            </div>
          ) : (
            <DataTable
              columns={quizColumns}
              data={quizItems}
              rowKey={(q) => q.id}
              emptyTitle="Chưa có câu hỏi nào"
              emptyDescription="Bấm nút 'Thêm câu hỏi mới' để bổ sung câu hỏi cho sự kiện."
            />
          )}
        </div>
      )}

      {/* Tab Panel: Quiz Results (M7.5) */}
      {tab === "results" && (
        <QuizResultsDashboard
          onShowToast={(message, type) =>
            setToast({ open: true, message, type })
          }
        />
      )}

      {/* Create Quiz Modal */}
      <Modal
        open={createQuizOpen}
        onClose={() => setCreateQuizOpen(false)}
        title="Thêm câu hỏi Quiz mới"
      >
        <form onSubmit={handleCreateQuiz} className="space-y-4 pt-2">
          <Textarea
            id="quiz-question"
            label="Nội dung câu hỏi"
            placeholder="Ví dụ: Cơ sở FPT Polytechnic TP.HCM tọa lạc tại công viên phần mềm nào?"
            required
            rows={2}
            value={quizForm.questionText}
            onChange={(e) => setQuizForm({ ...quizForm, questionText: e.target.value })}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface block">
              Các phương án trả lời (chọn phương án đúng)
            </label>
            {quizForm.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={quizForm.correctIndex === idx}
                  onChange={() => setQuizForm({ ...quizForm, correctIndex: idx })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                  title="Đánh dấu là đáp án đúng"
                />
                <span className="text-xs font-bold text-secondary w-5">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <input
                  type="text"
                  placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                  required
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...quizForm.options] as [string, string, string, string];
                    newOpts[idx] = e.target.value;
                    setQuizForm({ ...quizForm, options: newOpts });
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-surface-container text-xs bg-white text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            ))}
          </div>

          <Input
            id="quiz-explanation"
            label="Giải thích / Dẫn chứng câu trả lời"
            placeholder="Ví dụ: Công viên phần mềm Quang Trung (QTSC), Quận 12..."
            value={quizForm.explanation}
            onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="ghost" type="button" onClick={() => setCreateQuizOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={isCreatingQuiz}>
              Lưu câu hỏi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Global Action Status Toast */}
      <StatusToast
        open={toast.open}
        message={toast.message}
        type={toast.type ?? "info"}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

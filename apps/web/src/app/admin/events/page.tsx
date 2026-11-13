"use client";

import React, { useEffect, useState } from "react";
import type {
  AdminEventParticipationDto,
  AdminOpenDayEventDto,
  AdminOpenDaySessionDto,
} from "@fpt-campus/shared";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  LoadingState,
  SearchInput,
  StatusToast,
} from "@/components/ui";
import {
  checkInAttendeeTicket,
  fetchAdminEvents,
  fetchAdminEventSessions,
  fetchAdminParticipations,
} from "@/lib/admin/events-admin-api";
import { ApiClientError } from "@/lib/auth/api-client";
import { cn } from "@/lib/utils";

export default function AdminEventsPage() {
  const [tab, setTab] = useState<"schedule" | "checkin">("schedule");
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
  const loadParticipations = (eventId: string, query: string) => {
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
  };

  useEffect(() => {
    if (!selectedEventId || tab !== "checkin") return;
    const timer = setTimeout(() => {
      loadParticipations(selectedEventId, rosterQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedEventId, tab, rosterQuery]);

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
    handleCheckIn(quickTicketCode);
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
          <p className="text-xs text-secondary line-clamp-1">{row.customLocationLabel}</p>
        </div>
      ),
    },
    {
      key: "access",
      header: "Quyền tham gia",
      render: (row) => (
        <Badge variant={row.isPublic ? "success" : "brand"}>
          {row.isPublic ? "Công khai" : "Tài khoản mời"}
        </Badge>
      ),
    },
    {
      key: "host",
      header: "Đơn vị phụ trách",
      render: (row) => <span className="text-xs text-secondary">{row.hostUnit}</span>,
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
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold px-3 py-1.5 rounded-lg bg-emerald-50">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              check_circle
            </span>
            <span>Đã điểm danh</span>
          </span>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon="qr_code_scanner"
            disabled={isCheckingIn}
            onClick={() => handleCheckIn(row.ticketCode)}
          >
            Check-in
          </Button>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Open Day &amp; Điểm danh Check-in</h1>
          <p className="type-body-sm text-secondary mt-1">
            Quản lý lịch trình công khai trên /events và xác nhận check-in vé QR thực tế tại quầy đón tiếp QTSC.
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
          Danh sách Check-in ({totalCheckedIn}/{totalRoster} khách)
        </button>
      </div>

      {tab === "schedule" ? (
        isLoadingSessions ? (
          <div className="p-12 flex justify-center">
            <LoadingState label="Đang tải lịch trình từ hệ thống..." />
          </div>
        ) : (
          <DataTable
            columns={sessionColumns}
            data={sessions}
            rowKey={(r) => r.id}
          />
        )
      ) : (
        <div className="space-y-6">
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

"use client";

import React, { useMemo, useState } from "react";
import {
  AdminParticipantUser,
  BuildingCode,
  CAMPUS_BUILDINGS,
  INITIAL_ADMIN_USERS,
  OPEN_DAY_SESSIONS,
  OpenDaySessionItem,
} from "@/data/campus-data";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  Input,
  Modal,
  SearchInput,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export default function AdminEventsPage() {
  const [tab, setTab] = useState<"schedule" | "checkin">("schedule");
  const [sessions, setSessions] = useState<OpenDaySessionItem[]>(OPEN_DAY_SESSIONS);
  const [roster, setRoster] = useState<AdminParticipantUser[]>(
    INITIAL_ADMIN_USERS.filter((u) => u.role === "participant")
  );
  const [rosterQuery, setRosterQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<OpenDaySessionItem | null>(null);
  const [form, setForm] = useState<{
    timeRange: string;
    period: OpenDaySessionItem["period"];
    title: string;
    description: string;
    buildingCode: BuildingCode;
    locationLabel: string;
    accessType: OpenDaySessionItem["accessType"];
    hostUnit: string;
  }>({
    timeRange: "09:30 – 10:15",
    period: "morning",
    title: "",
    description: "",
    buildingCode: "INNOVATION",
    locationLabel: "Hội trường Đa năng — Tòa Innovation",
    accessType: "public",
    hostUnit: "Ban Tổ Chức Open Day",
  });
  const [toast, setToast] = useState({ open: false, message: "" });

  const filteredRoster = useMemo(() => {
    const q = rosterQuery.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.accountCode.toLowerCase().includes(q) ||
        u.ticketCode.toLowerCase().includes(q)
    );
  }, [roster, rosterQuery]);

  const checkedInCount = roster.filter((u) => u.checkedIn).length;

  const openCreateModal = () => {
    setEditingSession(null);
    setForm({
      timeRange: "09:30 – 10:15",
      period: "morning",
      title: "",
      description: "",
      buildingCode: "INNOVATION",
      locationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
      accessType: "public",
      hostUnit: "Ban Tổ Chức Open Day",
    });
    setModalOpen(true);
  };

  const openEditModal = (session: OpenDaySessionItem) => {
    setEditingSession(session);
    setForm({
      timeRange: session.timeRange,
      period: session.period,
      title: session.title,
      description: session.description,
      buildingCode: session.buildingCode,
      locationLabel: session.locationLabel,
      accessType: session.accessType,
      hostUnit: session.hostUnit,
    });
    setModalOpen(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingSession) {
      setSessions((prev) =>
        prev.map((item) =>
          item.id === editingSession.id
            ? {
                ...item,
                ...form,
                title: form.title.trim(),
                description: form.description.trim(),
              }
            : item
        )
      );
      setToast({ open: true, message: `Đã cập nhật phiên "${form.title}".` });
    } else {
      const created: OpenDaySessionItem = {
        id: `od-${Date.now()}`,
        ...form,
        title: form.title.trim(),
        description: form.description.trim() || "Hoạt động trải nghiệm Open Day tại QTSC.",
      };
      setSessions((prev) => [...prev, created]);
      setToast({ open: true, message: `Đã thêm phiên mới "${created.title}".` });
    }
    setModalOpen(false);
  };

  const toggleCheckIn = (userId: string) => {
    setRoster((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, checkedIn: !u.checkedIn } : u))
    );
    setToast({ open: true, message: "Đã cập nhật trạng thái check-in tại quầy." });
  };

  const sessionColumns: DataTableColumn<OpenDaySessionItem>[] = [
    {
      key: "time",
      header: "Khung giờ",
      render: (row) => <span className="font-mono text-xs font-bold whitespace-nowrap">{row.timeRange}</span>,
    },
    {
      key: "title",
      header: "Nội dung phiên",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-on-surface">{row.title}</p>
          <p className="text-xs text-secondary">{row.locationLabel}</p>
        </div>
      ),
    },
    {
      key: "access",
      header: "Quyền tham gia",
      render: (row) => (
        <Badge variant={row.accessType === "invited" ? "brand" : "success"}>
          {row.accessType === "invited" ? "Tài khoản mời" : "Công khai"}
        </Badge>
      ),
    },
    {
      key: "host",
      header: "Đơn vị phụ trách",
      render: (row) => <span className="text-xs text-secondary">{row.hostUnit}</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <Button variant="ghost" size="sm" icon="edit" onClick={() => openEditModal(row)}>
          Sửa
        </Button>
      ),
    },
  ];

  const rosterColumns: DataTableColumn<AdminParticipantUser>[] = [
    {
      key: "ticket",
      header: "Mã vé / Tài khoản",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-bold text-on-surface">{row.ticketCode}</p>
          <p className="text-[11px] text-secondary">{row.accountCode}</p>
        </div>
      ),
    },
    {
      key: "name",
      header: "Khách mời",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-on-surface">{row.fullName}</p>
          <p className="text-xs text-secondary">{row.contactChannel}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái (Preview)",
      render: (row) => (
        <Badge variant={row.checkedIn ? "success" : "neutral"}>
          {row.checkedIn ? "Đã check-in" : "Chưa đến sảnh"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Xác nhận tại quầy",
      align: "right",
      render: (row) => (
        <Button
          variant={row.checkedIn ? "outline" : "primary"}
          size="sm"
          icon={row.checkedIn ? "undo" : "qr_code_scanner"}
          onClick={() => toggleCheckIn(row.id)}
        >
          {row.checkedIn ? "Hoàn tác" : "Xác nhận check-in"}
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Open Day &amp; Điểm danh Check-in</h1>
          <p className="type-body-sm text-secondary mt-1">
            Quản lý lịch trình công khai trên /events và xác nhận check-in tại quầy Innovation.
          </p>
        </div>

        <Button variant="primary" size="md" icon="add" onClick={openCreateModal}>
          Thêm phiên Open Day
        </Button>
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
              : "text-secondary hover:text-on-surface"
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
              : "text-secondary hover:text-on-surface"
          )}
        >
          Danh sách Check-in ({checkedInCount}/{roster.length})
        </button>
      </div>

      {tab === "schedule" ? (
        <DataTable columns={sessionColumns} data={sessions} rowKey={(r) => r.id} />
      ) : (
        <DataTable
          columns={rosterColumns}
          data={filteredRoster}
          rowKey={(r) => r.id}
          toolbar={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <SearchInput
                value={rosterQuery}
                onChange={(e) => setRosterQuery(e.target.value)}
                onClear={() => setRosterQuery("")}
                placeholder="Quét/nhập mã vé QTSC-OD..., mã tài khoản hoặc họ tên..."
                containerClassName="w-full sm:max-w-md"
              />
              <Badge variant="brand">
                Đã có mặt: {checkedInCount}/{roster.length} khách mời
              </Badge>
            </div>
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSession ? "Chỉnh sửa phiên Open Day" : "Thêm phiên Open Day mới"}
        size="md"
      >
        <form onSubmit={handleSaveSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Khung giờ"
              value={form.timeRange}
              onChange={(e) => setForm((f) => ({ ...f, timeRange: e.target.value }))}
              required
            />
            <Select
              label="Buổi"
              value={form.period}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  period: e.target.value as OpenDaySessionItem["period"],
                }))
              }
            >
              <option value="morning">Buổi Sáng</option>
              <option value="noon">Buổi Trưa</option>
              <option value="afternoon">Buổi Chiều</option>
            </Select>
          </div>
          <Input
            label="Tên phiên hoạt động"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Select
            label="Quyền truy cập"
            value={form.accessType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                accessType: e.target.value as OpenDaySessionItem["accessType"],
              }))
            }
          >
            <option value="public">Tham quan công khai</option>
            <option value="invited">Chỉ tài khoản được cấp</option>
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Khu vực tòa nhà"
              value={form.buildingCode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  buildingCode: e.target.value as BuildingCode,
                }))
              }
            >
              {CAMPUS_BUILDINGS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.shortName}
                </option>
              ))}
            </Select>
            <Input
              label="Đơn vị phụ trách"
              value={form.hostUnit}
              onChange={(e) => setForm((f) => ({ ...f, hostUnit: e.target.value }))}
            />
          </div>
          <Input
            label="Địa điểm cụ thể"
            value={form.locationLabel}
            onChange={(e) => setForm((f) => ({ ...f, locationLabel: e.target.value }))}
          />
          <Textarea
            label="Mô tả ngắn"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="pt-2 flex justify-end gap-2.5">
            <Button type="button" variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Đóng
            </Button>
            <Button type="submit" variant="primary" size="md" icon="save">
              Lưu phiên
            </Button>
          </div>
        </form>
      </Modal>

      <StatusToast
        open={toast.open}
        type="success"
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

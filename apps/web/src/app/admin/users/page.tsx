"use client";

import React, { useMemo, useState } from "react";
import {
  AdminParticipantUser,
  INITIAL_ADMIN_USERS,
  OFFICIAL_CAMPUS_INFO,
} from "@/data/campus-data";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  FileDropzone,
  Input,
  Modal,
  SearchInput,
  Select,
  StatusToast,
} from "@/components/ui";

interface ImportPreviewRow {
  line: number;
  accountCode: string;
  fullName: string;
  contactChannel: string;
  valid: boolean;
  note: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminParticipantUser[]>(INITIAL_ADMIN_USERS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [createOpen, setCreateOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    accountCode: "",
    fullName: "",
    contactChannel: "",
  });

  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const [toast, setToast] = useState({ open: false, message: "" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== "ALL" && u.passwordStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        u.accountCode.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.contactChannel.toLowerCase().includes(q)
      );
    });
  }, [users, query, statusFilter]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.fullName.trim() || !newForm.accountCode.trim()) return;
    const code = newForm.accountCode.trim().toUpperCase();
    const created: AdminParticipantUser = {
      id: `usr-${Date.now()}`,
      accountCode: code,
      fullName: newForm.fullName.trim(),
      contactChannel: newForm.contactChannel.trim() || "Chưa gắn liên hệ",
      role: "participant",
      eventBatch: "Open Day 24/05/2026",
      passwordStatus: "must_change",
      checkedIn: false,
      ticketCode: `QTSC-${code}`,
    };
    setUsers((prev) => [created, ...prev]);
    setCreateOpen(false);
    setNewForm({ accountCode: "", fullName: "", contactChannel: "" });
    setToast({
      open: true,
      message: `Đã tạo tài khoản ${created.accountCode} ở trạng thái chờ đổi mật khẩu lần đầu.`,
    });
  };

  const handleToggleLock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              passwordStatus: u.passwordStatus === "locked" ? "must_change" : "locked",
            }
          : u
      )
    );
    setToast({ open: true, message: "Đã cập nhật trạng thái truy cập tài khoản." });
  };

  const handleCopyZaloMessage = async (user: AdminParticipantUser) => {
    const msg = `[FPT Polytechnic QTSC] Thư mời Open Day (${OFFICIAL_CAMPUS_INFO.openDayDateLabel}): Tài khoản của ${user.fullName} là ${user.accountCode}. Đăng nhập và đổi mật khẩu lần đầu tại /login.`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(msg);
      }
      setToast({
        open: true,
        message: `Đã sao chép tin nhắn hướng dẫn cho ${user.accountCode} để gửi qua Zalo.`,
      });
    } catch {
      setToast({
        open: true,
        message: `Sẵn sàng tin nhắn hướng dẫn cho ${user.accountCode}.`,
      });
    }
  };

  const parseCsvFiles = async (files: FileList | File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const parsed: ImportPreviewRow[] = lines.slice(0, 20).map((line, i) => {
        const [rawCode = "", rawName = "", rawContact = ""] = line
          .split(",")
          .map((c) => c.trim());
        const code = rawCode.toUpperCase();
        const duplicate = users.some((u) => u.accountCode === code);
        const valid = Boolean(code && rawName && !duplicate);
        return {
          line: i + 1,
          accountCode: code || `THIẾU-MÃ-${i + 1}`,
          fullName: rawName || "Chưa có họ tên",
          contactChannel: rawContact || "Zalo / SMS",
          valid,
          note: duplicate
            ? "Trùng mã tài khoản"
            : valid
            ? "Hợp lệ"
            : "Thiếu mã hoặc họ tên",
        };
      });
      setPreviewRows(parsed);
      setImportStep(2);
    } catch {
      setPreviewRows([]);
      setToast({
        open: true,
        message: "Không thể đọc tệp CSV. Vui lòng kiểm tra định dạng UTF-8.",
      });
    }
  };

  const commitImport = () => {
    const validRows = previewRows.filter((r) => r.valid);
    const additions: AdminParticipantUser[] = validRows.map((row) => ({
      id: `usr-${Date.now()}-${row.line}`,
      accountCode: row.accountCode,
      fullName: row.fullName,
      contactChannel: row.contactChannel,
      role: "participant",
      eventBatch: "Open Day 24/05/2026",
      passwordStatus: "must_change",
      checkedIn: false,
      ticketCode: `QTSC-${row.accountCode}`,
    }));
    setUsers((prev) => [...additions, ...prev]);
    setImportedCount(additions.length);
    setImportStep(3);
  };

  const columns: DataTableColumn<AdminParticipantUser>[] = [
    {
      key: "code",
      header: "Mã tài khoản",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-bold text-on-surface">{row.accountCode}</p>
          <p className="text-[11px] text-secondary">
            {row.role === "admin"
              ? "Quản trị viên"
              : row.role === "operator"
              ? "Điều phối viên"
              : "Khách mời"}
          </p>
        </div>
      ),
    },
    {
      key: "name",
      header: "Họ tên & Kênh gửi",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-on-surface">{row.fullName}</p>
          <p className="text-xs text-secondary">{row.contactChannel}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái mật khẩu",
      render: (row) => {
        if (row.passwordStatus === "locked") {
          return <Badge variant="error">Đang khóa</Badge>;
        }
        if (row.passwordStatus === "must_change") {
          return <Badge variant="warning">Chờ đổi lần đầu</Badge>;
        }
        return <Badge variant="success">Đã kích hoạt</Badge>;
      },
    },
    {
      key: "actions",
      header: "Thao tác điều phối",
      align: "right",
      render: (row) =>
        row.role === "admin" ? (
          <div className="flex justify-end">
            <Badge variant="info">Tài khoản gốc</Badge>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              icon="content_copy"
              onClick={() => handleCopyZaloMessage(row)}
            >
              Copy tin Zalo
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={row.passwordStatus === "locked" ? "lock_open" : "lock"}
              onClick={() => handleToggleLock(row.id)}
            >
              {row.passwordStatus === "locked" ? "Mở khóa" : "Khóa"}
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Tài khoản Tham dự &amp; Import CSV</h1>
          <p className="type-body-sm text-secondary mt-1">
            Admin cấp tài khoản mời Open Day và gửi hướng dẫn đăng nhập qua Zalo, SMS hoặc Email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon="upload_file"
            onClick={() => {
              setImportStep(1);
              setPreviewRows([]);
              setImportOpen(true);
            }}
          >
            Import danh sách CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="person_add"
            onClick={() => setCreateOpen(true)}
          >
            Cấp tài khoản lẻ
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        toolbar={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
              placeholder="Tìm mã tài khoản, họ tên hoặc SĐT Zalo..."
              containerClassName="w-full sm:max-w-sm"
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc trạng thái mật khẩu"
              containerClassName="w-full sm:w-56"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="must_change">Chờ đổi mật khẩu lần đầu</option>
              <option value="updated">Đã kích hoạt</option>
              <option value="locked">Đang tạm khóa</option>
            </Select>
          </div>
        }
      />

      {/* Create Single Account Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Cấp tài khoản mời Open Day"
        size="sm"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Mã tài khoản"
            placeholder="VD: NV-QTSC-02"
            value={newForm.accountCode}
            onChange={(e) => setNewForm((f) => ({ ...f, accountCode: e.target.value }))}
            required
          />
          <Input
            label="Họ và tên khách mời"
            placeholder="Nhập họ tên"
            value={newForm.fullName}
            onChange={(e) => setNewForm((f) => ({ ...f, fullName: e.target.value }))}
            required
          />
          <Input
            label="Kênh gửi thông tin (Zalo / Email)"
            placeholder="VD: 09xx xxx xxx (Zalo)"
            value={newForm.contactChannel}
            onChange={(e) => setNewForm((f) => ({ ...f, contactChannel: e.target.value }))}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="md" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="md" icon="check">
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3-Step CSV Import Wizard Modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={`Import danh sách Open Day (Bước ${importStep}/3)`}
        description="Tải file CSV cột: Mã tài khoản, Họ tên, SĐT/Email."
        size="lg"
      >
        {importStep === 1 && (
          <div className="space-y-4">
            <FileDropzone
              label="Chọn tệp danh sách khách mời (.csv)"
              accept=".csv,text/csv"
              helperText="Mỗi dòng gồm: accountCode, fullName, contactChannel"
              onFilesSelected={parseCsvFiles}
            />
          </div>
        )}

        {importStep === 2 && (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto border border-surface-container rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container">
                    <th className="p-2.5 font-semibold">Dòng</th>
                    <th className="p-2.5 font-semibold">Mã TK</th>
                    <th className="p-2.5 font-semibold">Họ tên</th>
                    <th className="p-2.5 font-semibold">Kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {previewRows.map((row) => (
                    <tr key={row.line}>
                      <td className="p-2.5 font-mono">{row.line}</td>
                      <td className="p-2.5 font-mono font-bold">{row.accountCode}</td>
                      <td className="p-2.5">{row.fullName}</td>
                      <td className="p-2.5">
                        <Badge variant={row.valid ? "success" : "error"}>
                          {row.note}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center gap-3">
              <Button variant="outline" size="md" onClick={() => setImportStep(1)}>
                Quay lại
              </Button>
              <Button
                variant="primary"
                size="md"
                icon="done_all"
                onClick={commitImport}
                disabled={previewRows.filter((r) => r.valid).length === 0}
              >
                Nhập {previewRows.filter((r) => r.valid).length} dòng hợp lệ
              </Button>
            </div>
          </div>
        )}

        {importStep === 3 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-xl bg-success-container text-on-success-container mx-auto flex items-center justify-center">
              <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
                check_circle
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="type-h3 text-on-surface">
                Đã thêm {importedCount} tài khoản vào danh sách
              </h3>
              <p className="type-body-sm text-secondary">
                Các tài khoản mới được đặt trạng thái yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setImportOpen(false)}>
              Hoàn tất
            </Button>
          </div>
        )}
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

"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import type {
  AdminUserListItemDto,
  AdminUsersFilterQuery,
  UserImportConfirmResultDto,
  UserImportPreviewResponse,
  UserImportPreviewRowDto,
} from "@fpt-campus/shared";
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUserStatus,
  resendAdminInvitation,
  downloadUserImportTemplate,
  parseExcelFile,
  previewUserImport,
  confirmUserImport,
  downloadErrorReportExcel,
} from "@/lib/admin/users-admin-api";
import {
  Badge,
  BadgeVariant,
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

export default function AdminUsersPage() {
  // --- Data State ---
  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const limit = 20;

  // --- Create User Modal State ---
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    userType: "STAFF" | "STUDENT" | "PARENT";
    channel: "DIRECT_LINK" | "EMAIL" | "SMS";
  }>({
    fullName: "",
    email: "",
    phone: "",
    userType: "STUDENT",
    channel: "EMAIL",
  });

  // --- Bulk Excel Import Modal State ---
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [parsedRows, setParsedRows] = useState<
    Array<{
      rowNumber: number;
      fullName: string;
      email?: string;
      phone?: string;
      username?: string;
      userType?: "STUDENT" | "PARENT";
      notes?: string;
    }>
  >([]);
  const [previewResult, setPreviewResult] = useState<UserImportPreviewResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<UserImportConfirmResultDto | null>(null);
  const [isImportLoading, setIsImportLoading] = useState(false);

  // --- Refresh State Trigger ---
  const [refreshKey, setRefreshKey] = useState(0);
  const reloadUsers = () => setRefreshKey((k) => k + 1);

  // --- Toast State ---
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: "info" | "success" | "error" }>({
    open: false,
    message: "",
  });

  // --- Load Users from Backend ---
  useEffect(() => {
    let mounted = true;

    const filterParams: AdminUsersFilterQuery = {
      page,
      limit,
      q: query.trim() || undefined,
      userType: userTypeFilter === "ALL" ? undefined : (userTypeFilter as "ADMIN" | "STAFF" | "STUDENT" | "PARENT"),
      accountStatus: statusFilter === "ALL" ? undefined : (statusFilter as "ACTIVE" | "LOCKED" | "SUSPENDED" | "ARCHIVED"),
    };

    fetchAdminUsers(filterParams)
      .then((response) => {
        if (mounted) {
          setUsers(response.items);
          setTotalCount(response.total);
        }
      })
      .catch(() => {
        if (mounted) {
          setToast({
            open: true,
            message: "Không thể kết nối máy chủ quản trị người dùng. Đang hiển thị bộ đệm cục bộ.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [page, query, userTypeFilter, statusFilter, refreshKey]);

  // --- Handle Quick Status Toggle (Lock / Unlock) ---
  const handleToggleLock = useCallback(async (user: AdminUserListItemDto) => {
    const isLocked = user.accountStatus === "LOCKED";
    try {
      await updateAdminUserStatus(user.id, {
        accountStatus: isLocked ? "ACTIVE" : "LOCKED",
      });
      setToast({
        open: true,
        message: isLocked ? `Đã mở khóa tài khoản ${user.username || user.fullName}` : `Đã khóa tài khoản ${user.username || user.fullName}`,
        type: "success",
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi thao tác: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    }
  }, []);

  // --- Handle Resend Invitation ---
  const handleResendInvite = useCallback(async (user: AdminUserListItemDto) => {
    try {
      const res = await resendAdminInvitation(user.id);
      setToast({
        open: true,
        message: `Đã tạo lại thư mời (${res.channel}). Trạng thái: ${res.status}`,
        type: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi gửi thư mời: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    }
  }, []);

  // --- Handle Create Single User ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.fullName.trim()) return;

    setIsCreating(true);
    try {
      await createAdminUser({
        fullName: newForm.fullName.trim(),
        email: newForm.email.trim() || undefined,
        phone: newForm.phone.trim() || undefined,
        userType: newForm.userType,
        provisioningMethod: "EMAIL_SMS_INVITATION",
        channel: newForm.channel,
      });

      setToast({
        open: true,
        message: `Tạo tài khoản thành công cho ${newForm.fullName}!`,
        type: "success",
      });
      setCreateOpen(false);
      setNewForm({ fullName: "", email: "", phone: "", userType: "STUDENT", channel: "EMAIL" });
      reloadUsers();
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi tạo tài khoản: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // --- Excel Bulk Import Handlers ---
  const handleDownloadTemplate = async () => {
    try {
      await downloadUserImportTemplate();
      setToast({ open: true, message: "Đã tải file mẫu Mau_Import_Tai_Khoan_FPT_Poly.xlsx thành công!", type: "success" });
    } catch (err) {
      setToast({ open: true, message: `Lỗi tải file mẫu: ${err instanceof Error ? err.message : "Thất bại"}`, type: "error" });
    }
  };

  const handleSelectFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    const file = fileList[0];
    setIsImportLoading(true);

    try {
      const rows = await parseExcelFile(file);
      setParsedRows(rows);

      // Call API preview
      const preview = await previewUserImport(rows, "STUDENT");
      setPreviewResult(preview);
      setImportStep(2);
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi đọc file Excel: ${err instanceof Error ? err.message : "File không hợp lệ"}`,
        type: "error",
      });
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult || parsedRows.length === 0) return;
    setIsImportLoading(true);

    try {
      const result = await confirmUserImport({
        defaultUserType: "STUDENT",
        provisioningMethod: "EMAIL_SMS_INVITATION",
        channel: "EMAIL",
        eventKey: "IMPORT_ADMIN_EXCEL",
        rows: parsedRows.map((r) => ({
          rowNumber: r.rowNumber,
          fullName: r.fullName,
          email: r.email,
          phone: r.phone,
          userType: r.userType,
        })),
      });

      setConfirmResult(result);
      setImportStep(3);
      reloadUsers();
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi nhập dữ liệu: ${err instanceof Error ? err.message : "Không thể hoàn tất"}`,
        type: "error",
      });
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!previewResult) return;
    const failedRows = previewResult.rows
      .filter((r) => r.status === "INVALID" || r.status === "SKIPPED")
      .map((r) => ({
        rowNumber: r.rowNumber,
        fullName: r.fullName,
        email: r.normalizedEmail,
        phone: r.normalizedPhone,
        errorCode: r.errorCode,
        note: r.note,
      }));

    downloadErrorReportExcel(failedRows);
    setToast({ open: true, message: "Đã tải báo cáo lỗi Excel thành công!", type: "success" });
  };

  const resetImport = () => {
    setImportOpen(false);
    setImportStep(1);
    setParsedRows([]);
    setPreviewResult(null);
    setConfirmResult(null);
  };

  // --- Table Columns ---
  const columns: DataTableColumn<AdminUserListItemDto>[] = useMemo(
    () => [
      {
        key: "user",
        header: "Người dùng / Tài khoản",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-on-surface text-sm">{row.fullName}</span>
            <span className="text-xs text-secondary font-mono">{row.username || "Chưa có mã"}</span>
            <span className="text-xs text-secondary-light/80">{row.email || row.phone || "Chưa có liên hệ"}</span>
          </div>
        ),
      },
      {
        key: "userType",
        header: "Vai trò",
        render: (row) => {
          const roleLabels: Record<string, { label: string; variant: BadgeVariant }> = {
            ADMIN: { label: "Quản trị viên", variant: "primary" },
            STAFF: { label: "Cán bộ / GV", variant: "secondary" },
            STUDENT: { label: "Sinh viên", variant: "neutral" },
            PARENT: { label: "Phụ huynh", variant: "warning" },
          };
          const meta = roleLabels[row.userType] || { label: row.userType, variant: "neutral" };
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
      },
      {
        key: "status",
        header: "Trạng thái tài khoản",
        render: (row) => {
          const isLocked = row.accountStatus === "LOCKED";
          const isPending = row.activationStatus === "PENDING_ACTIVATION" || row.activationStatus === "INVITATION_SENT";
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant={isLocked ? "error" : "success"}>
                {isLocked ? "Đã khóa" : "Hoạt động"}
              </Badge>
              {isPending && <Badge variant="warning">Chờ kích hoạt</Badge>}
            </div>
          );
        },
      },
      {
        key: "activity",
        header: "Hoạt động gần nhất",
        render: (row) => (
          <span className="text-xs text-secondary">
            {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString("vi-VN") : "Chưa đăng nhập"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        align: "right",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {(row.activationStatus === "PENDING_ACTIVATION" || row.activationStatus === "INVITATION_SENT") && (
              <Button
                variant="ghost"
                size="sm"
                icon="forward_to_inbox"
                onClick={() => handleResendInvite(row)}
                title="Gửi lại thư mời"
              >
                Gửi lại
              </Button>
            )}
            <Button
              variant={row.accountStatus === "LOCKED" ? "primary" : "outline"}
              size="sm"
              icon={row.accountStatus === "LOCKED" ? "lock_open" : "lock"}
              onClick={() => handleToggleLock(row)}
            >
              {row.accountStatus === "LOCKED" ? "Mở khóa" : "Khóa"}
            </Button>
          </div>
        ),
      },
    ],
    [handleToggleLock, handleResendInvite],
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Quản lý Người dùng &amp; Tài khoản</h1>
          <p className="text-sm text-secondary mt-1">
            Tổng cộng: <strong className="text-primary">{totalCount}</strong> tài khoản trong hệ thống CSDL Virtual Campus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            icon="file_download"
            onClick={handleDownloadTemplate}
          >
            File mẫu Excel
          </Button>
          <Button
            variant="outline"
            icon="upload_file"
            onClick={() => {
              setImportStep(1);
              setImportOpen(true);
            }}
          >
            Nhập Excel (.xlsx)
          </Button>
          <Button
            variant="primary"
            icon="person_add"
            onClick={() => setCreateOpen(true)}
          >
            Tạo tài khoản
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <SearchInput
            placeholder="Tìm theo họ tên, username, email hoặc SĐT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Select
            label=""
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="STUDENT">Sinh viên</option>
            <option value="STAFF">Cán bộ / GV</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="PARENT">Phụ huynh</option>
          </Select>

          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
            <option value="SUSPENDED">Tạm đình chỉ</option>
          </Select>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={users}
        rowKey={(row) => row.id}
        loading={isLoading}
        emptyTitle="Không tìm thấy người dùng"
        emptyDescription="Không có tài khoản nào phù hợp với bộ lọc hiện tại."
      />

      {/* Pagination Controls */}
      {totalCount > limit && (
        <div className="flex items-center justify-between text-sm text-secondary px-2">
          <span>
            Hiển thị trang {page} / {Math.ceil(totalCount / limit)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(totalCount / limit)}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo tài khoản người dùng mới"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <Input
            id="create-fullname"
            label="Họ và tên"
            placeholder="Ví dụ: Nguyễn Văn An"
            required
            value={newForm.fullName}
            onChange={(e) => setNewForm({ ...newForm, fullName: e.target.value })}
          />

          <Input
            id="create-email"
            label="Địa chỉ Email"
            type="email"
            placeholder="an.nv@fpt.edu.vn"
            value={newForm.email}
            onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
          />

          <Input
            id="create-phone"
            label="Số điện thoại"
            placeholder="0912345678"
            value={newForm.phone}
            onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Vai trò"
              value={newForm.userType}
              onChange={(e) =>
                setNewForm({
                  ...newForm,
                  userType: e.target.value as "STAFF" | "STUDENT" | "PARENT",
                })
              }
            >
              <option value="STUDENT">Sinh viên</option>
              <option value="STAFF">Cán bộ / GV</option>
              <option value="PARENT">Phụ huynh</option>
            </Select>

            <Select
              label="Kênh gửi thư mời"
              value={newForm.channel}
              onChange={(e) =>
                setNewForm({
                  ...newForm,
                  channel: e.target.value as "DIRECT_LINK" | "EMAIL" | "SMS",
                })
              }
            >
              <option value="EMAIL">Email kích hoạt</option>
              <option value="SMS">Tin nhắn SMS</option>
              <option value="DIRECT_LINK">Tạo link trực tiếp</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" loading={isCreating}>
              Lưu tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Excel Import Modal */}
      <Modal
        open={importOpen}
        onClose={resetImport}
        title="Nhập danh sách người dùng từ Excel (.xlsx)"
      >
        <div className="space-y-4 pt-2">
          {/* Step 1: Upload */}
          {importStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-secondary">
                Tải lên tệp Excel chứa danh sách người dùng theo đúng cấu trúc mẫu.
              </p>
              <FileDropzone
                accept=".xlsx, .xls"
                multiple={false}
                onFilesSelected={handleSelectFiles}
                label="Kéo thả file .xlsx vào đây hoặc bấm để chọn"
              />
              <div className="flex items-center justify-between text-xs text-secondary pt-2">
                <span>Chưa có mẫu chuẩn?</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Tải file mẫu Excel (.xlsx)
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Validation */}
          {importStep === 2 && previewResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-surface-container-low border border-surface-container text-center">
                <div>
                  <div className="text-xs text-secondary">Tổng số dòng</div>
                  <div className="text-lg font-bold text-on-surface">{previewResult.totalRows}</div>
                </div>
                <div>
                  <div className="text-xs text-success">Hợp lệ (Thêm mới)</div>
                  <div className="text-lg font-bold text-success">{previewResult.validCount}</div>
                </div>
                <div>
                  <div className="text-xs text-warning">Trùng / Bỏ qua</div>
                  <div className="text-lg font-bold text-warning">{previewResult.duplicateUpdateCount + previewResult.skippedCount}</div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-surface-container rounded-xl divide-y divide-surface-container text-xs">
                {previewResult.rows.map((row: UserImportPreviewRowDto) => (
                  <div key={row.rowNumber} className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-on-surface">Dòng {row.rowNumber}: {row.fullName}</span>
                      <span className="text-secondary ml-2">({row.normalizedEmail || row.normalizedPhone || "Không có liên hệ"})</span>
                    </div>
                    <Badge variant={row.status === "VALID" ? "success" : row.status === "DUPLICATE_UPDATE" ? "warning" : "error"}>
                      {row.status === "VALID" ? "Hợp lệ" : row.status === "DUPLICATE_UPDATE" ? "Trùng SĐT/Email" : "Lỗi dữ liệu"}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button variant="ghost" onClick={resetImport} disabled={isImportLoading}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmImport}
                  loading={isImportLoading}
                  disabled={previewResult.validCount === 0 && previewResult.duplicateUpdateCount === 0}
                >
                  Xác nhận nhập ({previewResult.validCount + previewResult.duplicateUpdateCount} tài khoản)
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Result Summary */}
          {importStep === 3 && confirmResult && (
            <div className="space-y-4 text-center py-2">
              <span className="material-symbols-outlined text-success text-5xl">check_circle</span>
              <h3 className="text-lg font-bold text-on-surface">Nhập dữ liệu thành công!</h3>
              <p className="text-sm text-secondary">
                Đã xử lý <strong>{confirmResult.totalRows}</strong> dòng: thành công <strong>{confirmResult.successCount}</strong> tài khoản.
              </p>

              {confirmResult.failedCount > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-error mb-2">
                    Có {confirmResult.failedCount} dòng bị lỗi định dạng hoặc trùng lặp bị bỏ qua.
                  </p>
                  <Button variant="outline" size="sm" icon="download" onClick={handleDownloadErrors}>
                    Tải file báo cáo lỗi Excel (.xlsx)
                  </Button>
                </div>
              )}

              <div className="pt-4 flex justify-center">
                <Button variant="primary" onClick={resetImport}>
                  Đóng &amp; Làm mới danh sách
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Global Status Toast */}
      <StatusToast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
}

import type {
  AdminCreateUserResponse,
  AdminInvitationSummaryDto,
  AdminUpdateUserStatusRequest,
  AdminUserListItemDto,
  AdminUsersFilterQuery,
  AdminUsersListResponseDto,
  UserImportConfirmRequest,
  UserImportConfirmResultDto,
  UserImportPreviewResponse,
} from "@fpt-campus/shared";
import { apiRequest } from "../auth/api-client";
import * as XLSX from "xlsx";

export interface CreateAdminUserInput {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  userType: "STAFF" | "STUDENT" | "PARENT";
  provisioningMethod: "ADMIN_DIRECT" | "EMAIL_SMS_INVITATION";
  channel: "DIRECT_LINK" | "EMAIL" | "SMS";
}

/**
 * List users with pagination and filters.
 * GET /api/v1/admin/users
 */
export async function fetchAdminUsers(
  params: AdminUsersFilterQuery = {},
): Promise<AdminUsersListResponseDto> {
  const query = new URLSearchParams();
  if (params.userType) query.set("userType", params.userType);
  if (params.accountStatus) query.set("accountStatus", params.accountStatus);
  if (params.activationStatus) query.set("activationStatus", params.activationStatus);
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const path = qs ? `/admin/users?${qs}` : "/admin/users";

  return apiRequest<AdminUsersListResponseDto>(path, { auth: true });
}

/**
 * Create user account directly from Admin.
 * POST /api/v1/admin/users
 */
export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<AdminCreateUserResponse> {
  return apiRequest<AdminCreateUserResponse>("/admin/users", {
    method: "POST",
    body: input,
    auth: true,
  });
}

/**
 * Update user account status (e.g. lock/unlock).
 * PATCH /api/v1/admin/users/:id/status
 */
export async function updateAdminUserStatus(
  userId: string,
  dto: AdminUpdateUserStatusRequest,
): Promise<AdminUserListItemDto> {
  return apiRequest<AdminUserListItemDto>(
    `/admin/users/${encodeURIComponent(userId)}/status`,
    {
      method: "PATCH",
      body: dto,
      auth: true,
    },
  );
}

/**
 * Resend activation invitation link.
 * POST /api/v1/admin/users/:id/invitations/resend
 */
export async function resendAdminInvitation(
  userId: string,
): Promise<AdminInvitationSummaryDto> {
  return apiRequest<AdminInvitationSummaryDto>(
    `/admin/users/${encodeURIComponent(userId)}/invitations/resend`,
    {
      method: "POST",
      body: { channel: "DIRECT_LINK" },
      auth: true,
    },
  );
}

/**
 * Download official Excel template for bulk import.
 */
export async function downloadUserImportTemplate(): Promise<void> {
  const wb = XLSX.utils.book_new();
  const wsData = [
    [
      "STT",
      "Họ và tên (*)",
      "Email",
      "Số điện thoại",
      "Mã sinh viên / Username",
      "Vai trò (STUDENT/PARENT/STAFF)",
      "Ghi chú",
    ],
    [
      1,
      "Nguyễn Văn An",
      "an.nv@fpt.edu.vn",
      "0901234567",
      "PS12345",
      "STUDENT",
      "Sinh viên chuyên ngành Lập trình Web",
    ],
    [
      2,
      "Trần Thị Bích",
      "bich.tt@fpt.edu.vn",
      "0912345678",
      "PS12346",
      "STUDENT",
      "Sinh viên chuyên ngành Thiết kế Đồ họa",
    ],
    [
      3,
      "Lê Văn Cường",
      "cuong.parent@gmail.com",
      "0987654321",
      "PH_PS12345",
      "PARENT",
      "Phụ huynh em Nguyễn Văn An",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 28 },
    { wch: 16 },
    { wch: 25 },
    { wch: 30 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Import");
  XLSX.writeFile(wb, "Mau_Import_Tai_Khoan_FPT_Poly.xlsx");
}

/**
 * Parse an uploaded Excel file on the client into structured row objects.
 */
export async function parseExcelFile(file: File): Promise<Array<{
  rowNumber: number;
  fullName: string;
  email?: string;
  phone?: string;
  username?: string;
  userType?: "STUDENT" | "PARENT";
  notes?: string;
}>> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("File Excel không có bảng tính.");
  }
  const ws = wb.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  if (rawData.length < 2) {
    throw new Error("File Excel rỗng hoặc chỉ có dòng tiêu đề.");
  }

  const rows: Array<{
    rowNumber: number;
    fullName: string;
    email?: string;
    phone?: string;
    username?: string;
    userType?: "STUDENT" | "PARENT";
    notes?: string;
  }> = [];

  for (let i = 1; i < rawData.length; i++) {
    const line = rawData[i];
    if (!line || !Array.isArray(line) || line.length === 0) continue;

    const fullName = String(line[1] || "").trim();
    const email = String(line[2] || "").trim();
    const phone = String(line[3] || "").trim();
    const username = String(line[4] || "").trim();
    const userTypeStr = String(line[5] || "").trim().toUpperCase();
    const notes = String(line[6] || "").trim();

    if (!fullName && !email && !phone && !username) continue;

    rows.push({
      rowNumber: i,
      fullName,
      email: email || undefined,
      phone: phone || undefined,
      username: username || undefined,
      userType: userTypeStr === "PARENT" ? "PARENT" : "STUDENT",
      notes: notes || undefined,
    });
  }

  return rows;
}

/**
 * Validate and preview Excel rows against database.
 * POST /api/v1/admin/users/import/preview
 */
export async function previewUserImport(
  rows: Array<{
    rowNumber: number;
    fullName: string;
    email?: string;
    phone?: string;
    username?: string;
    userType?: "STUDENT" | "PARENT";
  }>,
  defaultUserType: "STUDENT" | "PARENT" = "STUDENT",
): Promise<UserImportPreviewResponse> {
  return apiRequest<UserImportPreviewResponse>("/admin/users/import/preview", {
    method: "POST",
    body: { rows, defaultUserType },
    auth: true,
  });
}

/**
 * Confirm batch import of validated rows.
 * POST /api/v1/admin/users/import/confirm
 */
export async function confirmUserImport(
  payload: UserImportConfirmRequest,
): Promise<UserImportConfirmResultDto> {
  return apiRequest<UserImportConfirmResultDto>("/admin/users/import/confirm", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

/**
 * Export and download error report Excel file for failed/skipped rows.
 */
export function downloadErrorReportExcel(
  rows: Array<{
    rowNumber: number;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    errorCode?: string | null;
    note?: string | null;
  }>,
): void {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["STT Dòng", "Họ và tên", "Email", "Số điện thoại", "Mã lỗi", "Chi tiết lý do"],
    ...rows.map((r) => [
      r.rowNumber,
      r.fullName,
      r.email || "—",
      r.phone || "—",
      r.errorCode || "LỖI",
      r.note || "Dữ liệu không đạt yêu cầu hệ thống.",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 28 },
    { wch: 16 },
    { wch: 20 },
    { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Loi_Import");
  XLSX.writeFile(wb, "Bao_Cao_Loi_Import.xlsx");
}

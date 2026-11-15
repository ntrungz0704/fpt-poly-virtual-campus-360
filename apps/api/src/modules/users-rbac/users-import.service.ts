import crypto from "node:crypto";
import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import * as XLSX from "xlsx";
import type {
  ImportReasonCode,
  ImportRowResolutionStatus,
  UserImportConfirmRequest,
  UserImportConfirmResultDto,
  UserImportPreviewResponse,
  UserImportPreviewRowDto,
  UserType,
} from "@fpt-campus/shared";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { PrismaService } from "../../common/adapters/prisma.service";
import {
  normalizeEmailLower,
  tryNormalizePhoneToE164,
} from "../../common/utils/phone-normalizer";
import { hashPasswordArgon2id } from "../../common/utils/token-crypto";
import { AuditLogService } from "../audit-log/audit-log.service";

export interface RawImportRow {
  rowNumber?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  username?: string;
  studentCode?: string;
  userType?: string;
  notes?: string;
}

@Injectable()
export class UsersImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Generate official Excel import template (.xlsx)
   */
  generateTemplate(): Buffer {
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

    // Set column widths
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
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Parse uploaded Excel buffer to raw row objects
   */
  parseExcelBuffer(buffer: Buffer): RawImportRow[] {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException("File Excel không chứa bất kỳ bảng tính nào.");
    }
    const ws = wb.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

    if (rawData.length < 2) {
      throw new BadRequestException("File Excel rỗng hoặc chỉ có dòng tiêu đề.");
    }

    const rows: RawImportRow[] = [];
    // Row 0 is header, rows 1..n are data
    for (let i = 1; i < rawData.length; i++) {
      const line = rawData[i];
      if (!line || !Array.isArray(line) || line.length === 0) continue;

      const fullName = String(line[1] || "").trim();
      const email = String(line[2] || "").trim();
      const phone = String(line[3] || "").trim();
      const username = String(line[4] || "").trim();
      const userType = String(line[5] || "").trim().toUpperCase();
      const notes = String(line[6] || "").trim();

      // Skip completely empty lines
      if (!fullName && !email && !phone && !username) continue;

      rows.push({
        rowNumber: i,
        fullName,
        email: email || undefined,
        phone: phone || undefined,
        username: username || undefined,
        studentCode: username || undefined,
        userType: userType || undefined,
        notes: notes || undefined,
      });
    }

    return rows;
  }

  /**
   * Validate and preview rows against business rules & current database
   */
  async previewImport(
    rawRows: RawImportRow[],
    defaultUserType: "STUDENT" | "PARENT" = "STUDENT",
  ): Promise<UserImportPreviewResponse> {
    if (rawRows.length === 0) {
      throw new BadRequestException("Không tìm thấy dòng dữ liệu hợp lệ trong file Excel.");
    }
    if (rawRows.length > 500) {
      throw new BadRequestException("Giới hạn mỗi lần import tối đa 500 tài khoản.");
    }

    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const seenUsernames = new Set<string>();

    const previewRows: UserImportPreviewRowDto[] = [];
    let validCount = 0;
    let duplicateUpdateCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;

    for (let idx = 0; idx < rawRows.length; idx++) {
      const raw = rawRows[idx];
      const rowNum = raw.rowNumber ?? idx + 1;
      const fullName = (raw.fullName || "").trim();

      // 1. Validate full name
      if (!fullName || fullName.length < 2) {
        previewRows.push({
          rowNumber: rowNum,
          fullName: fullName || "—",
          normalizedEmail: null,
          normalizedPhone: null,
          userType: defaultUserType,
          status: "INVALID",
          errorCode: "MISSING_NAME",
          reasonCode: "VALIDATION_ERROR",
          existingUserId: null,
          note: "Họ và tên là bắt buộc (tối thiểu 2 ký tự).",
        });
        invalidCount++;
        continue;
      }

      // 2. Normalize and validate email
      let normEmail: string | null = null;
      if (raw.email) {
        const cleaned = normalizeEmailLower(raw.email);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleaned || !emailRegex.test(cleaned)) {
          previewRows.push({
            rowNumber: rowNum,
            fullName,
            normalizedEmail: cleaned,
            normalizedPhone: null,
            userType: defaultUserType,
            status: "INVALID",
            errorCode: "INVALID_EMAIL",
            reasonCode: "INVALID_EMAIL",
            existingUserId: null,
            note: `Địa chỉ email không hợp lệ: "${raw.email}".`,
          });
          invalidCount++;
          continue;
        }
        normEmail = cleaned;
      }

      // 3. Normalize and validate phone
      let normPhone: string | null = null;
      if (raw.phone) {
        normPhone = tryNormalizePhoneToE164(raw.phone) ?? null;
        if (!normPhone) {
          previewRows.push({
            rowNumber: rowNum,
            fullName,
            normalizedEmail: normEmail,
            normalizedPhone: raw.phone,
            userType: defaultUserType,
            status: "INVALID",
            errorCode: "INVALID_PHONE",
            reasonCode: "INVALID_PHONE",
            existingUserId: null,
            note: `Số điện thoại không hợp lệ (yêu cầu chuẩn 10 số VN): "${raw.phone}".`,
          });
          invalidCount++;
          continue;
        }
      }

      // 4. Require at least one contact channel
      if (!normEmail && !normPhone) {
        previewRows.push({
          rowNumber: rowNum,
          fullName,
          normalizedEmail: null,
          normalizedPhone: null,
          userType: defaultUserType,
          status: "INVALID",
          errorCode: "MISSING_CONTACT",
          reasonCode: "MISSING_CONTACT",
          existingUserId: null,
          note: "Cần cung cấp ít nhất Email hoặc Số điện thoại để gửi kích hoạt.",
        });
        invalidCount++;
        continue;
      }

      // 5. Check duplicate within the same Excel file
      if (normEmail && seenEmails.has(normEmail)) {
        previewRows.push({
          rowNumber: rowNum,
          fullName,
          normalizedEmail: normEmail,
          normalizedPhone: normPhone,
          userType: defaultUserType,
          status: "SKIPPED",
          errorCode: "DUPLICATE_IN_FILE",
          reasonCode: "DUPLICATE_IN_FILE",
          existingUserId: null,
          note: `Email "${normEmail}" bị lặp lại nhiều lần trong file tải lên.`,
        });
        skippedCount++;
        continue;
      }
      if (normPhone && seenPhones.has(normPhone)) {
        previewRows.push({
          rowNumber: rowNum,
          fullName,
          normalizedEmail: normEmail,
          normalizedPhone: normPhone,
          userType: defaultUserType,
          status: "SKIPPED",
          errorCode: "DUPLICATE_IN_FILE",
          reasonCode: "DUPLICATE_IN_FILE",
          existingUserId: null,
          note: `Số điện thoại "${normPhone}" bị lặp lại nhiều lần trong file tải lên.`,
        });
        skippedCount++;
        continue;
      }
      if (normEmail) seenEmails.add(normEmail);
      if (normPhone) seenPhones.add(normPhone);

      // 6. Check existing user in Database
      const orConditions: Array<{ email?: string; phone?: string; username?: string }> = [];
      if (normEmail) orConditions.push({ email: normEmail });
      if (normPhone) orConditions.push({ phone: normPhone });
      if (raw.username) orConditions.push({ username: raw.username.trim() });

      const existing = await this.prisma.user.findFirst({
        where: {
          deletedAt: null,
          OR: orConditions,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          userType: true,
          accountStatus: true,
        },
      });

      const rowType: "STUDENT" | "PARENT" =
        raw.userType === "PARENT" ? "PARENT" : defaultUserType;

      if (existing) {
        previewRows.push({
          rowNumber: rowNum,
          fullName,
          normalizedEmail: normEmail,
          normalizedPhone: normPhone,
          userType: rowType,
          status: "DUPLICATE_UPDATE",
          errorCode: "ALREADY_EXISTS",
          reasonCode: "IDENTITY_CONFLICT",
          existingUserId: existing.id,
          note: `Tài khoản đã tồn tại trong hệ thống (${existing.fullName || existing.username}, trạng thái: ${existing.accountStatus}).`,
        });
        duplicateUpdateCount++;
      } else {
        previewRows.push({
          rowNumber: rowNum,
          fullName,
          normalizedEmail: normEmail,
          normalizedPhone: normPhone,
          userType: rowType,
          status: "VALID",
          errorCode: null,
          existingUserId: null,
          note: "Hợp lệ, sẵn sàng tạo tài khoản.",
        });
        validCount++;
      }
    }

    return {
      totalRows: rawRows.length,
      validCount,
      duplicateUpdateCount,
      skippedCount,
      invalidCount,
      rows: previewRows,
    };
  }

  /**
   * Commit confirmed rows to database in a safe transaction
   */
  async confirmImport(
    actor: AuthenticatedUser,
    req: UserImportConfirmRequest,
    ipAddress?: string,
  ): Promise<UserImportConfirmResultDto> {
    const { rows, defaultUserType, provisioningMethod, channel, eventKey } = req;

    if (!rows || rows.length === 0) {
      throw new BadRequestException("Danh sách hàng cần import rỗng.");
    }

    // Resolve target role
    const studentRole = await this.prisma.role.findUnique({
      where: { code: "STUDENT" },
    });
    const parentRole = await this.prisma.role.findUnique({
      where: { code: "PARENT" },
    });

    // Resolve optional Open Day event
    let targetEvent: { id: string; eventKey: string } | null = null;
    if (eventKey) {
      targetEvent = await this.prisma.openDayEvent.findFirst({
        where: { eventKey, deletedAt: null },
        select: { id: true, eventKey: true },
      });
    }

    const batchId = crypto.randomUUID();
    const rowResults: UserImportConfirmResultDto["rowResults"] = [];
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        try {
          const normEmail = row.email ? normalizeEmailLower(row.email) : null;
          const normPhone = row.phone ? tryNormalizePhoneToE164(row.phone) : null;
          const userType: UserType = row.userType === "PARENT" ? "PARENT" : defaultUserType;

          if (!row.fullName || (!normEmail && !normPhone)) {
            rowResults.push({
              rowNumber: row.rowNumber,
              outcome: "FAILED",
              reasonCode: "MISSING_CONTACT",
            });
            failedCount++;
            continue;
          }

          // Check if already exists in DB
          const orCond: Array<{ email?: string; phone?: string }> = [];
          if (normEmail) orCond.push({ email: normEmail });
          if (normPhone) orCond.push({ phone: normPhone });

          const existingUser = await tx.user.findFirst({
            where: { deletedAt: null, OR: orCond },
          });

          if (existingUser) {
            // Already exists -> skip safely
            rowResults.push({
              rowNumber: row.rowNumber,
              outcome: "SKIPPED",
              reasonCode: "ALREADY_INVITED_OR_PARTICIPATING",
            });
            skippedCount++;
            continue;
          }

          // Create new user account
          const tempPlainPassword = crypto.randomBytes(10).toString("hex") + "!Fp1";
          const passwordHash = await hashPasswordArgon2id(tempPlainPassword);
          const activationToken = crypto.randomBytes(24).toString("hex");
          const tokenHash = crypto.createHash("sha256").update(activationToken).digest("hex");

          const username =
            normEmail?.split("@")[0] ||
            `user_${normPhone?.replace(/\D/g, "").slice(-8)}_${crypto.randomBytes(2).toString("hex")}`;

          const createdUser = await tx.user.create({
            data: {
              fullName: row.fullName.trim(),
              email: normEmail,
              phone: normPhone,
              username,
              passwordHash,
              userType,
              accountStatus: "ACTIVE",
              activationStatus:
                provisioningMethod === "ADMIN_DIRECT" ? "ACTIVATED" : "INVITATION_SENT",
              provisioningMethod,
              mustChangePassword: true,
            },
          });

          // Assign Role
          const roleId = userType === "PARENT" ? parentRole?.id : studentRole?.id;
          if (roleId) {
            await tx.userRole.create({
              data: {
                userId: createdUser.id,
                roleId,
              },
            });
          }

          // Create Invitation record
          await tx.accountInvitation.create({
            data: {
              userId: createdUser.id,
              channel: channel || "DIRECT_LINK",
              tokenHash,
              status: "SENT",
              expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
              createdBy: actor.id,
            },
          });

          // If linked to event, create EventParticipation with ticketCode
          if (targetEvent) {
            const ticketCode = `OD26-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
            await tx.eventParticipation.create({
              data: {
                userId: createdUser.id,
                eventId: targetEvent.id,
                ticketCode,
                attendeeName: createdUser.fullName,
                attendeeEmail: createdUser.email,
                attendeePhone: createdUser.phone,
                participationStatus: "CONFIRMED",
                provisionedBy: actor.id,
              },
            });
          }

          rowResults.push({
            rowNumber: row.rowNumber,
            outcome: "CREATED",
            reasonCode: null,
            activationToken:
              provisioningMethod === "ADMIN_DIRECT" ? activationToken : null,
          });
          successCount++;
        } catch {
          rowResults.push({
            rowNumber: row.rowNumber,
            outcome: "FAILED",
            reasonCode: "VALIDATION_ERROR",
          });
          failedCount++;
        }
      }

      // Record batch log
      await tx.userImportBatch.create({
        data: {
          id: batchId,
          importedBy: actor.id,
          defaultUserType,
          provisioningMethod,
          totalRows: rows.length,
          successCount,
          skippedCount,
          failedCount,
          rowResultsSummaryJson: rowResults as unknown as object,
        },
      });

      // Audit log entry
      await this.auditLog.record({
        action: "USERS_BULK_IMPORT",
        resourceType: "user_import_batch",
        resourceId: batchId,
        actorUserId: actor.id,
        actorUsername: actor.username,
        diffJson: {
          totalRows: rows.length,
          successCount,
          skippedCount,
          failedCount,
          provisioningMethod,
        },
        ipAddress: ipAddress || null,
        tx,
      });
    });

    return {
      batchId,
      totalRows: rows.length,
      successCount,
      skippedCount,
      failedCount,
      rowResults,
    };
  }

  /**
   * Generate Excel Error Report for failed / skipped rows
   */
  generateErrorReport(
    rows: Array<{
      rowNumber: number;
      fullName: string;
      email?: string | null;
      phone?: string | null;
      note?: string | null;
      errorCode?: string | null;
    }>,
  ): Buffer {
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
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }
}

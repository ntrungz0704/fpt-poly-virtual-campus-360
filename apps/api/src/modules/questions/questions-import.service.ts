import { BadRequestException, Injectable } from "@nestjs/common";
import * as XLSX from "xlsx";
import type {
  QuestionDifficulty,
  QuestionImportConfirmResponse,
  QuestionImportPreviewResponse,
  QuestionImportPreviewRowDto,
  QuestionReviewStatus,
} from "@fpt-campus/shared";
import { PrismaService } from "../../common/adapters/prisma.service";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { AuditLogService } from "../audit-log/audit-log.service";
import type { QuestionImportConfirmDto } from "./dto/question-import.dto";

@Injectable()
export class QuestionsImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  generateTemplate(): Buffer {
    const wb = XLSX.utils.book_new();
    const wsData = [
      [
        "STT",
        "Nội dung câu hỏi (*)",
        "Phương án A (*)",
        "Phương án B (*)",
        "Phương án C (*)",
        "Phương án D (*)",
        "Đáp án đúng (*) (A/B/C/D)",
        "Chủ đề",
        "Độ khó (EASY/MEDIUM/HARD)",
        "Giải thích đáp án",
        "Tags (phân cách bằng dấu phẩy)",
      ],
      [
        1,
        "FPT Polytechnic được thành lập vào năm nào?",
        "2010",
        "2012",
        "2015",
        "2018",
        "A",
        "Lịch sử FPT",
        "EASY",
        "Trường Cao đẳng FPT Polytechnic được thành lập vào tháng 7/2010.",
        "lich_su, fpt, thanh_lap",
      ],
      [
        2,
        "Triết lý đào tạo cốt lõi của FPT Polytechnic là gì?",
        "Thực học - Thực nghiệp",
        "Học đi đôi với hành",
        "Vững lý thuyết - Sáng tương lai",
        "Học để làm giàu",
        "A",
        "Văn hóa FPT",
        "EASY",
        "Triết lý Thực học - Thực nghiệp gắn liền sinh viên với thực tế doanh nghiệp.",
        "triet_ly, van_hoa",
      ],
      [
        3,
        "Đâu là CSS Framework hiện đại được giảng dạy tại FPT Poly?",
        "Bootstrap",
        "Tailwind CSS",
        "Foundation",
        "Bulma",
        "B",
        "Công nghệ thông tin",
        "MEDIUM",
        "Tailwind CSS là Utility-first CSS framework phổ biến nhất hiện nay.",
        "cntt, frontend, css",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 40 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Mau_Cau_Hoi_Trac_Nghiem");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  private parseCorrectIndex(rawVal: unknown): number | null {
    if (rawVal === undefined || rawVal === null) return null;
    const str = String(rawVal).trim().toUpperCase();
    if (str === "A" || str === "1") return 0;
    if (str === "B" || str === "2") return 1;
    if (str === "C" || str === "3") return 2;
    if (str === "D" || str === "4") return 3;
    if (str === "0") return 0;
    return null;
  }

  private parseDifficulty(rawVal: unknown): QuestionDifficulty {
    if (!rawVal) return "MEDIUM";
    const str = String(rawVal).trim().toUpperCase();
    if (str === "EASY" || str === "DỄ" || str === "DE") return "EASY";
    if (str === "HARD" || str === "KHÓ" || str === "KHO") return "HARD";
    return "MEDIUM";
  }

  private parseTags(rawVal: unknown): string[] {
    if (!rawVal) return [];
    const str = String(rawVal).trim();
    if (!str) return [];
    return str
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  async previewImport(fileBuffer: Buffer): Promise<QuestionImportPreviewResponse> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException("Tệp Excel rỗng hoặc không hợp lệ.");
    }

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(fileBuffer, { type: "buffer" });
    } catch {
      throw new BadRequestException("Không thể phân tích tệp Excel. Vui lòng đảm bảo tệp định dạng .xlsx hợp lệ.");
    }

    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException("Tệp Excel không chứa bảng tính (sheet) nào.");
    }

    const ws = wb.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

    if (!rawRows || rawRows.length < 2) {
      throw new BadRequestException("Tệp Excel không có dữ liệu câu hỏi (tối thiểu 1 dòng tiêu đề và 1 dòng dữ liệu).");
    }

    // Load all active questions from DB to check duplicates
    const existingDbQuestions = await this.prisma.questionBankItem.findMany({
      where: { deletedAt: null },
      select: { questionText: true },
    });
    const existingTextSet = new Set(
      existingDbQuestions.map((q) => q.questionText.trim().toLowerCase()),
    );

    const inMemorySeenText = new Set<string>();
    const previewRows: QuestionImportPreviewRowDto[] = [];

    // Row 0 is header, start from index 1
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      // Check if row is completely empty
      const isCompletelyEmpty = row.every((val) => val === undefined || val === null || String(val).trim() === "");
      if (isCompletelyEmpty) continue;

      const rowNumber = i + 1; // 1-based line in Excel
      const questionText = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : "";
      const optA = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : "";
      const optB = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : "";
      const optC = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : "";
      const optD = row[5] !== undefined && row[5] !== null ? String(row[5]).trim() : "";
      const rawCorrect = row[6];
      const topic = row[7] !== undefined && row[7] !== null ? String(row[7]).trim() : "Chung";
      const rawDifficulty = row[8];
      const explanation = row[9] !== undefined && row[9] !== null ? String(row[9]).trim() : "";
      const rawTags = row[10];

      const validationErrors: string[] = [];
      const options = [optA, optB, optC, optD];

      // 1. Validate question text
      if (!questionText || questionText.length < 5) {
        validationErrors.push("Nội dung câu hỏi không được để trống (tối thiểu 5 ký tự).");
      }

      // 2. Validate options
      if (!optA || !optB || !optC || !optD) {
        validationErrors.push("Cần đủ 4 phương án trả lời A, B, C, D không được để trống.");
      }

      // 3. Validate correct index
      const correctIndex = this.parseCorrectIndex(rawCorrect);
      if (correctIndex === null) {
        validationErrors.push("Đáp án đúng không hợp lệ. Phải là A, B, C hoặc D (hoặc 1, 2, 3, 4).");
      }

      const difficulty = this.parseDifficulty(rawDifficulty);
      const tags = this.parseTags(rawTags);
      const status: QuestionReviewStatus = "APPROVED"; // Standard import sets to APPROVED for immediate readiness

      // 4. Duplicate detection
      const normalizedKey = questionText.toLowerCase();
      let validationStatus: "VALID" | "INVALID" | "DUPLICATE" = "VALID";

      if (normalizedKey && inMemorySeenText.has(normalizedKey)) {
        validationStatus = "DUPLICATE";
        validationErrors.push("Câu hỏi này bị trùng lặp nội dung với một dòng khác trong cùng file Excel.");
      } else if (normalizedKey && existingTextSet.has(normalizedKey)) {
        validationStatus = "DUPLICATE";
        validationErrors.push("Câu hỏi này đã tồn tại trong Ngân hàng câu hỏi của hệ thống.");
      } else if (validationErrors.length > 0) {
        validationStatus = "INVALID";
      }

      if (normalizedKey) {
        inMemorySeenText.add(normalizedKey);
      }

      previewRows.push({
        rowNumber,
        questionText,
        options,
        correctIndex: correctIndex ?? 0,
        explanation,
        topic: topic || "Chung",
        difficulty,
        status,
        tags,
        validationStatus,
        validationErrors,
      });
    }

    const validRows = previewRows.filter((r) => r.validationStatus === "VALID").length;
    const invalidRows = previewRows.filter((r) => r.validationStatus === "INVALID").length;
    const duplicateRows = previewRows.filter((r) => r.validationStatus === "DUPLICATE").length;

    return {
      totalRows: previewRows.length,
      validRows,
      invalidRows,
      duplicateRows,
      rows: previewRows,
    };
  }

  async confirmImport(
    dto: QuestionImportConfirmDto,
    user: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<QuestionImportConfirmResponse> {
    if (!dto.rows || dto.rows.length === 0) {
      throw new BadRequestException("Danh sách câu hỏi cần nhập trống.");
    }

    const validRows = dto.rows.filter((r) => r.validationStatus === "VALID");
    if (validRows.length === 0) {
      return {
        importedCount: 0,
        skippedCount: dto.rows.length,
        failedCount: 0,
        message: "Không có dòng hợp lệ nào để nhập vào hệ thống.",
      };
    }

    // Atomic transaction for data integrity
    await this.prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        await tx.questionBankItem.create({
          data: {
            questionText: row.questionText.trim(),
            optionsJson: row.options.map((o) => o.trim()),
            correctIndex: row.correctIndex,
            explanation: row.explanation?.trim() || "",
            topic: row.topic?.trim() || "Chung",
            difficulty: row.difficulty,
            status: row.status || "APPROVED",
            tags: row.tags || [],
            createdById: user.id,
          },
        });
      }

      await this.auditLog.record({
        actorUserId: user.id,
        actorUsername: user.username || user.fullName,
        action: "IMPORT_QUESTIONS",
        resourceType: "QUESTION_BANK",
        diffJson: {
          importedCount: validRows.length,
          totalReceived: dto.rows.length,
        },
        ipAddress,
        tx,
      });
    });

    const skippedCount = dto.rows.length - validRows.length;
    return {
      importedCount: validRows.length,
      skippedCount,
      failedCount: 0,
      message: `Nhập thành công ${validRows.length} câu hỏi vào Ngân hàng câu hỏi.${
        skippedCount > 0 ? ` Đã bỏ qua ${skippedCount} dòng lỗi/trùng lặp.` : ""
      }`,
    };
  }

  exportErrors(rows: QuestionImportPreviewRowDto[]): Buffer {
    const errorRows = rows.filter((r) => r.validationStatus !== "VALID");
    const wb = XLSX.utils.book_new();

    const wsData = [
      [
        "Dòng Excel",
        "Trạng thái",
        "Lý do lỗi",
        "Nội dung câu hỏi",
        "Phương án A",
        "Phương án B",
        "Phương án C",
        "Phương án D",
        "Đáp án đúng",
        "Chủ đề",
        "Độ khó",
      ],
      ...errorRows.map((r) => [
        r.rowNumber,
        r.validationStatus === "DUPLICATE" ? "Trùng lặp" : "Lỗi dữ liệu",
        r.validationErrors.join("; "),
        r.questionText,
        r.options[0] || "",
        r.options[1] || "",
        r.options[2] || "",
        r.options[3] || "",
        ["A", "B", "C", "D"][r.correctIndex] || r.correctIndex,
        r.topic,
        r.difficulty,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 45 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Loi_Cau_Hoi");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }
}

import request from "supertest";
import * as XLSX from "xlsx";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Question Bank Management Integration Suite (M6)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let adminToken = "";
  let studentToken = "";
  let tourEditorToken = "";
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("question_bank_m6");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-Question-M6-2026!";
    await request(server)
      .patch("/api/v1/auth/me/password")
      .set("Authorization", `Bearer ${adminBootstrap.body.data.accessToken}`)
      .send({
        currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
        newPassword: adminNewPw,
      })
      .expect(200);

    const adminLoginRes = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: adminNewPw })
      .expect(200);

    adminToken = adminLoginRes.body.data.accessToken;

    // 2. Create student user for RBAC negative checks
    const studentUser = await prisma.user.create({
      data: {
        username: "student_test_m6",
        fullName: "Sinh Viên Test M6",
        email: "student_m6@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash: adminLoginRes.body.data.user?.passwordHash || "some-hash",
      },
    });

    const jwtService = ctx.app.get(JwtService);
    studentToken = jwtService.sign({
      sub: studentUser.id,
      username: studentUser.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-student-m6-001",
    });

    // 3. Create staff user with TOUR_EDITOR role (has campus:write, but NO events:write)
    const tourEditorRole = await prisma.role.findUniqueOrThrow({
      where: { code: "TOUR_EDITOR" },
    });

    const tourEditorUser = await prisma.user.create({
      data: {
        username: "tour_editor_test_m6",
        fullName: "Biên Tập Viên Tour M6",
        email: "tour_editor_m6@poly.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        passwordHash: adminLoginRes.body.data.user?.passwordHash || "some-hash",
        userRoles: {
          create: [{ roleId: tourEditorRole.id }],
        },
      },
    });

    tourEditorToken = jwtService.sign({
      sub: tourEditorUser.id,
      username: tourEditorUser.username,
      roles: ["TOUR_EDITOR"],
      pwdRequired: false,
      jti: "test-jti-tour-editor-m6-001",
    });
  });

  afterAll(async () => {
    if (ctx?.app) {
      await ctx.app.close();
    }
    if (dbHandle) {
      await dbHandle.drop();
    }
  });

  // --------------------------------------------------------------------------
  // 1. RBAC Security Tests
  // --------------------------------------------------------------------------
  it("Test 1 [RBAC]: Student token and campus:write-only token cannot access Question Bank admin APIs (403 Forbidden)", async () => {
    // 1. Student token -> 403 Forbidden
    const listRes = await request(server)
      .get("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);

    expect(listRes.body.success).toBe(false);
    expect(listRes.body.error.code).toBe("FORBIDDEN");

    const createRes = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        questionText: "Hacker trying to add question?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
      })
      .expect(403);

    expect(createRes.body.success).toBe(false);

    // 2. M6 Remediation - Blocker 2: User with campus:write (TOUR_EDITOR) without events:write -> 403 Forbidden
    const tourEditorRes = await request(server)
      .get("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .expect(403);

    expect(tourEditorRes.body.success).toBe(false);
    expect(tourEditorRes.body.error.code).toBe("FORBIDDEN");

    const tourEditorCreateRes = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .send({
        questionText: "Tour editor trying to add question?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
      })
      .expect(403);

    expect(tourEditorCreateRes.body.success).toBe(false);
    expect(tourEditorCreateRes.body.error.code).toBe("FORBIDDEN");

    // 3. Unauthenticated request -> 401
    await request(server).get("/api/v1/admin/questions").expect(401);
  });

  // --------------------------------------------------------------------------
  // 2. Validation Failures
  // --------------------------------------------------------------------------
  it("Test 2 [Validation]: Rejects malformed question creation payloads (400 Bad Request)", async () => {
    // Missing question text (< 5 chars)
    const resShort = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        questionText: "Hi?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
      })
      .expect(400);

    expect(resShort.body.success).toBe(false);

    // Options count != 4 (only 3 options)
    const res3Opts = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        questionText: "Câu hỏi này có đủ 4 phương án không?",
        options: ["Phương án 1", "Phương án 2", "Phương án 3"],
        correctIndex: 0,
      })
      .expect(400);

    expect(res3Opts.body.success).toBe(false);

    // Empty option string
    const resEmptyOpt = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        questionText: "Câu hỏi này có phương án rỗng?",
        options: ["Phương án 1", "   ", "Phương án 3", "Phương án 4"],
        correctIndex: 0,
      })
      .expect(400);

    expect(resEmptyOpt.body.success).toBe(false);

    // Correct index out of bounds (> 3)
    const resOutOfBounds = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        questionText: "Câu hỏi này có đáp án đúng ngoài phạm vi?",
        options: ["Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4"],
        correctIndex: 5,
      })
      .expect(400);

    expect(resOutOfBounds.body.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 3. Create Question Success & PostgreSQL Persistence
  // --------------------------------------------------------------------------
  let createdQuestionId = "";

  it("Test 3 [CRUD]: Successfully creates question, persists in PostgreSQL & records AuditLog", async () => {
    const payload = {
      questionText: "FPT Polytechnic được thành lập vào năm nào?",
      options: ["2008", "2010", "2012", "2015"],
      correctIndex: 1, // '2010'
      explanation: "Trường Cao đẳng FPT Polytechnic chính thức thành lập vào tháng 7/2010.",
      topic: "Lịch sử FPT",
      difficulty: "EASY",
      status: "APPROVED",
      tags: ["lich_su", "fpt", "thanh_lap"],
    };

    const res = await request(server)
      .post("/api/v1/admin/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.id).toBeDefined();
    expect(data.questionText).toBe(payload.questionText);
    expect(data.options).toEqual(payload.options);
    expect(data.correctIndex).toBe(1);
    expect(data.topic).toBe("Lịch sử FPT");
    expect(data.difficulty).toBe("EASY");
    expect(data.status).toBe("APPROVED");
    expect(data.tags).toEqual(payload.tags);
    expect(data.creatorName).toBeDefined();

    createdQuestionId = data.id;

    // Verify directly in PostgreSQL
    const dbItem = await prisma.questionBankItem.findUnique({
      where: { id: createdQuestionId },
    });
    expect(dbItem).not.toBeNull();
    expect(dbItem?.questionText).toBe(payload.questionText);
    expect(dbItem?.correctIndex).toBe(1);
    expect(dbItem?.deletedAt).toBeNull();

    // Verify AuditLog record
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "CREATE_QUESTION",
        resourceId: createdQuestionId,
      },
    });
    expect(audit).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 4. Get Question By ID
  // --------------------------------------------------------------------------
  it("Test 4 [GetById]: Retrieves single question by ID and handles 404 cleanly", async () => {
    const res = await request(server)
      .get(`/api/v1/admin/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdQuestionId);

    // Non-existent UUID -> 404
    const fakeUuid = "00000000-0000-0000-0000-000000000099";
    const notFoundRes = await request(server)
      .get(`/api/v1/admin/questions/${fakeUuid}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);

    expect(notFoundRes.body.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 5. Update Question
  // --------------------------------------------------------------------------
  it("Test 5 [Update]: Updates question content, difficulty, and logs audit diff", async () => {
    const updatePayload = {
      questionText: "FPT Polytechnic được thành lập vào tháng mấy năm 2010?",
      options: ["Tháng 1", "Tháng 3", "Tháng 7", "Tháng 10"],
      correctIndex: 2,
      difficulty: "MEDIUM",
      topic: "Lịch sử FPT Nâng cao",
    };

    const res = await request(server)
      .patch(`/api/v1/admin/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updatePayload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.questionText).toBe(updatePayload.questionText);
    expect(res.body.data.correctIndex).toBe(2);
    expect(res.body.data.difficulty).toBe("MEDIUM");

    // Check DB
    const dbItem = await prisma.questionBankItem.findUnique({
      where: { id: createdQuestionId },
    });
    expect(dbItem?.questionText).toBe(updatePayload.questionText);
    expect(dbItem?.difficulty).toBe("MEDIUM");

    // Check audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "UPDATE_QUESTION",
        resourceId: createdQuestionId,
      },
    });
    expect(audit).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 6. Update Status (Review Workflow)
  // --------------------------------------------------------------------------
  it("Test 6 [Status]: Transitions question status and records audit history", async () => {
    const res = await request(server)
      .post(`/api/v1/admin/questions/${createdQuestionId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "IN_REVIEW", note: "Cần kiểm tra lại ngày chính xác" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("IN_REVIEW");

    const dbItem = await prisma.questionBankItem.findUnique({
      where: { id: createdQuestionId },
    });
    expect(dbItem?.status).toBe("IN_REVIEW");

    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "CHANGE_QUESTION_STATUS",
        resourceId: createdQuestionId,
      },
    });
    expect(audit).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 7. Soft Delete
  // --------------------------------------------------------------------------
  it("Test 7 [SoftDelete]: Soft deletes question, sets deletedAt and excludes from active list", async () => {
    const res = await request(server)
      .delete(`/api/v1/admin/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Verify deletedAt is set in DB
    const dbItem = await prisma.questionBankItem.findUnique({
      where: { id: createdQuestionId },
    });
    expect(dbItem?.deletedAt).not.toBeNull();

    // GET by ID should now 404
    await request(server)
      .get(`/api/v1/admin/questions/${createdQuestionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);

    // Verification of AuditLog
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "DELETE_QUESTION",
        resourceId: createdQuestionId,
      },
    });
    expect(audit).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 8. Search, Filtering and Server-Side Pagination
  // --------------------------------------------------------------------------
  it("Test 8 [Search & Filter]: Searches by keyword, filters by topic, difficulty & status", async () => {
    // Seed 3 active questions
    await prisma.questionBankItem.createMany({
      data: [
        {
          questionText: "React Server Components hoạt động như thế nào trên Next.js 15?",
          optionsJson: ["Chạy client", "Chạy server", "Chạy worker", "Chạy edge"],
          correctIndex: 1,
          topic: "Công nghệ thông tin",
          difficulty: "HARD",
          status: "APPROVED",
          tags: ["react", "nextjs"],
        },
        {
          questionText: "Thẻ HTML nào dùng để tạo siêu liên kết (hyperlink)?",
          optionsJson: ["<a>", "<link>", "<href>", "<url>"],
          correctIndex: 0,
          topic: "Công nghệ thông tin",
          difficulty: "EASY",
          status: "DRAFT",
          tags: ["html"],
        },
        {
          questionText: "Tinh thần STCo của FPT mang ý nghĩa văn hóa gì?",
          optionsJson: ["Sáng tạo", "Vui vẻ hài hước", "Kỷ luật thép", "Cạnh tranh"],
          correctIndex: 1,
          topic: "Văn hóa FPT",
          difficulty: "EASY",
          status: "APPROVED",
          tags: ["stco", "van_hoa"],
        },
      ],
    });

    // 1. Filter by topic
    const topicRes = await request(server)
      .get("/api/v1/admin/questions?topic=Công nghệ thông tin")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(topicRes.body.data.items.length).toBe(2);

    // 2. Filter by difficulty
    const diffRes = await request(server)
      .get("/api/v1/admin/questions?difficulty=HARD")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(diffRes.body.data.items.length).toBe(1);
    expect(diffRes.body.data.items[0].difficulty).toBe("HARD");

    // 3. Filter by status
    const statRes = await request(server)
      .get("/api/v1/admin/questions?status=APPROVED")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(statRes.body.data.items.length).toBe(2);

    // 4. Search keyword 'STCo'
    const searchRes = await request(server)
      .get("/api/v1/admin/questions?q=STCo")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(searchRes.body.data.items.length).toBe(1);
    expect(searchRes.body.data.items[0].questionText).toContain("STCo");

    // 5. Server-side Pagination
    const page1Res = await request(server)
      .get("/api/v1/admin/questions?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(page1Res.body.data.items.length).toBe(2);
    expect(page1Res.body.data.total).toBe(3);
    expect(page1Res.body.data.totalPages).toBe(2);

    const page2Res = await request(server)
      .get("/api/v1/admin/questions?page=2&limit=2")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(page2Res.body.data.items.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 9. Excel Template Download
  // --------------------------------------------------------------------------
  it("Test 9 [Excel Template]: Downloads official question import template (.xlsx)", async () => {
    const res = await request(server)
      .get("/api/v1/admin/questions/import/template")
      .set("Authorization", `Bearer ${adminToken}`)
      .buffer(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .parse((r: any, callback: any) => {
        const data: Buffer[] = [];
        r.on("data", (chunk: Buffer) => data.push(chunk));
        r.on("end", () => callback(null, Buffer.concat(data)));
      })
      .expect(200);

    expect(res.headers["content-type"]).toContain("spreadsheetml.sheet");
    expect(res.headers["content-disposition"]).toContain("Mau_Cau_Hoi_Trac_Nghiem.xlsx");

    const wb = XLSX.read(res.body, { type: "buffer" });
    expect(wb.SheetNames.length).toBeGreaterThan(0);
    expect(wb.SheetNames[0]).toBe("Mau_Cau_Hoi_Trac_Nghiem");
  });

  // --------------------------------------------------------------------------
  // 10. Excel Import Preview & Validation (Valid, Invalid, Duplicate)
  // --------------------------------------------------------------------------
  it("Test 10 [Excel Preview]: Parses Excel and detects valid, invalid, and duplicate rows", async () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      [
        "STT",
        "Nội dung câu hỏi (*)",
        "Phương án A (*)",
        "Phương án B (*)",
        "Phương án C (*)",
        "Phương án D (*)",
        "Đáp án đúng (*)",
        "Chủ đề",
        "Độ khó",
      ],
      // Row 1: Valid
      [
        1,
        "Đâu là ngôn ngữ lập trình phổ biến được dạy tại trường?",
        "TypeScript",
        "COBOL",
        "Fortran",
        "Pascal",
        "A",
        "CNTT",
        "EASY",
      ],
      // Row 2: Invalid (Missing options C and D)
      [
        2,
        "Câu hỏi này thiếu phương án?",
        "Phương án A",
        "Phương án B",
        "",
        "",
        "B",
        "CNTT",
        "EASY",
      ],
      // Row 3: Invalid (Invalid correct choice 'Z')
      [
        3,
        "Câu hỏi này có đáp án đúng sai ký tự?",
        "Opt 1",
        "Opt 2",
        "Opt 3",
        "Opt 4",
        "Z",
        "CNTT",
        "MEDIUM",
      ],
      // Row 4: Duplicate of Row 1 in same file
      [
        4,
        "Đâu là ngôn ngữ lập trình phổ biến được dạy tại trường?",
        "TypeScript",
        "COBOL",
        "Fortran",
        "Pascal",
        "A",
        "CNTT",
        "EASY",
      ],
      // Row 5: Duplicate of existing DB question (from Test 8)
      [
        5,
        "Thẻ HTML nào dùng để tạo siêu liên kết (hyperlink)?",
        "<a>",
        "<link>",
        "<href>",
        "<url>",
        "A",
        "CNTT",
        "EASY",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "ImportData");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const base64 = buffer.toString("base64");

    const res = await request(server)
      .post("/api/v1/admin/questions/import/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fileBase64: base64 })
      .expect(200);

    expect(res.body.success).toBe(true);
    const preview = res.body.data;
    expect(preview.totalRows).toBe(5);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(2);
    expect(preview.duplicateRows).toBe(2);

    expect(preview.rows[0].validationStatus).toBe("VALID");
    expect(preview.rows[1].validationStatus).toBe("INVALID");
    expect(preview.rows[2].validationStatus).toBe("INVALID");
    expect(preview.rows[3].validationStatus).toBe("DUPLICATE");
    expect(preview.rows[4].validationStatus).toBe("DUPLICATE");

    // ------------------------------------------------------------------------
    // 11. Excel Import Confirm & AuditLog
    // ------------------------------------------------------------------------
    const confirmRes = await request(server)
      .post("/api/v1/admin/questions/import/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rows: preview.rows })
      .expect(200);

    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.importedCount).toBe(1);
    expect(confirmRes.body.data.skippedCount).toBe(4);

    // Verify in PostgreSQL: only 1 new question was added
    const importedItem = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Đâu là ngôn ngữ lập trình phổ biến được dạy tại trường?",
        deletedAt: null,
      },
    });
    expect(importedItem).not.toBeNull();
    expect(importedItem?.status).toBe("APPROVED");

    // Verify AuditLog for import
    const importAudit = await prisma.auditLog.findFirst({
      where: {
        action: "IMPORT_QUESTIONS",
      },
    });
    expect(importAudit).not.toBeNull();

    // ------------------------------------------------------------------------
    // 12. Excel Export Errors
    // ------------------------------------------------------------------------
    const errorExportRes = await request(server)
      .post("/api/v1/admin/questions/import/export-errors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rows: preview.rows })
      .buffer(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .parse((r: any, callback: any) => {
        const data: Buffer[] = [];
        r.on("data", (chunk: Buffer) => data.push(chunk));
        r.on("end", () => callback(null, Buffer.concat(data)));
      })
      .expect(200);

    expect(errorExportRes.headers["content-type"]).toContain("spreadsheetml.sheet");
    expect(errorExportRes.headers["content-disposition"]).toContain("Bao_Cao_Loi_Cau_Hoi.xlsx");

    const errWb = XLSX.read(errorExportRes.body, { type: "buffer" });
    const errSheet = errWb.Sheets["Bao_Cao_Loi_Cau_Hoi"];
    const errRows = XLSX.utils.sheet_to_json<unknown[]>(errSheet, { header: 1 });
    // Header + 4 error/duplicate rows = 5 rows
    expect(errRows.length).toBe(5);
  });

  // --------------------------------------------------------------------------
  // 13. M6 Remediation - Blocker 1: Server-Side Import Validation & Trust Boundary
  // --------------------------------------------------------------------------
  it("Test 13 [M6 Remediation - Blocker 1]: Enforces server-side import trust boundary, ignoring client validationStatus, validating rows, detecting DB race-condition duplicates, and recording accurate AuditLog", async () => {
    // Scenario 1: Malicious client sends validationStatus: "VALID" on completely invalid / malformed items
    const maliciousPayload = {
      rows: [
        // Malicious 1: questionText < 5 chars but client says VALID
        {
          rowNumber: 1,
          questionText: "abc",
          options: ["A", "B", "C", "D"],
          correctIndex: 0,
          validationStatus: "VALID",
        },
        // Malicious 2: missing options (< 4 options) but client says VALID
        {
          rowNumber: 2,
          questionText: "Nội dung câu hỏi này dài hơn 5 ký tự",
          options: ["Phương án A", "Phương án B"],
          correctIndex: 0,
          validationStatus: "VALID",
        },
        // Malicious 3: correctIndex = 99 but client says VALID
        {
          rowNumber: 3,
          questionText: "Câu hỏi này có đáp án đúng ngoài phạm vi 0-3?",
          options: ["A", "B", "C", "D"],
          correctIndex: 99,
          validationStatus: "VALID",
        },
        // Malicious 4: empty option item
        {
          rowNumber: 4,
          questionText: "Câu hỏi này có phương án trả lời bị rỗng?",
          options: ["A", "", "C", "D"],
          correctIndex: 0,
          validationStatus: "VALID",
        },
        // Row 5: The ONE AND ONLY truly valid row
        {
          rowNumber: 5,
          questionText: "Câu hỏi duy nhất hợp lệ trong batch hỗn hợp này?",
          options: ["Op1", "Op2", "Op3", "Op4"],
          correctIndex: 1,
          topic: "Bảo Mật",
          difficulty: "HARD",
          validationStatus: "VALID",
        },
        // Malicious 6: in-batch duplicate of Row 5 (must be skipped by server duplicate detection)
        {
          rowNumber: 6,
          questionText: "Câu hỏi duy nhất hợp lệ trong batch hỗn hợp này?",
          options: ["Op1", "Op2", "Op3", "Op4"],
          correctIndex: 1,
          validationStatus: "VALID",
        },
      ],
    };

    const confirmRes = await request(server)
      .post("/api/v1/admin/questions/import/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(maliciousPayload)
      .expect(200);

    expect(confirmRes.body.success).toBe(true);
    // Out of 6 rows, exactly 1 valid was imported, 5 were skipped
    expect(confirmRes.body.data.importedCount).toBe(1);
    expect(confirmRes.body.data.skippedCount).toBe(5);

    // Direct PostgreSQL verification:
    // 1. "abc" must NOT exist
    const dbAbc = await prisma.questionBankItem.findFirst({
      where: { questionText: "abc", deletedAt: null },
    });
    expect(dbAbc).toBeNull();

    // 2. "Câu hỏi này có đáp án đúng ngoài phạm vi 0-3?" must NOT exist
    const dbIndex99 = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Câu hỏi này có đáp án đúng ngoài phạm vi 0-3?",
        deletedAt: null,
      },
    });
    expect(dbIndex99).toBeNull();

    // 3. The valid row MUST exist with exact properties
    const dbValidItem = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Câu hỏi duy nhất hợp lệ trong batch hỗn hợp này?",
        deletedAt: null,
      },
    });
    expect(dbValidItem).not.toBeNull();
    expect(dbValidItem?.difficulty).toBe("HARD");
    expect(dbValidItem?.topic).toBe("Bảo Mật");
    expect(dbValidItem?.correctIndex).toBe(1);

    // 4. AuditLog verification: importedCount must be 1
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: "IMPORT_QUESTIONS",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(auditRecord).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diff = auditRecord?.diffJson as any;
    expect(diff.importedCount).toBe(1);
    expect(diff.totalReceived).toBe(6);

    // Scenario 2: Race Condition — Question inserted into DB between preview and confirm
    const raceQuestionText = "Câu hỏi bị thêm vào DB giữa preview và confirm?";

    // Client prepared preview payload (simulating row was valid at preview time)
    const racePayload = {
      rows: [
        {
          rowNumber: 1,
          questionText: raceQuestionText,
          options: ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
          correctIndex: 0,
          topic: "Race Condition",
          difficulty: "MEDIUM",
          validationStatus: "VALID",
        },
      ],
    };

    // Another admin / process inserts this question directly into PostgreSQL right before confirm
    await prisma.questionBankItem.create({
      data: {
        questionText: raceQuestionText,
        optionsJson: ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
        correctIndex: 0,
        topic: "Race Condition",
      },
    });

    // Now client calls confirm with the preview row
    const raceConfirmRes = await request(server)
      .post("/api/v1/admin/questions/import/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(racePayload)
      .expect(200);

    // Backend must detect that it now exists in DB, and skip it!
    expect(raceConfirmRes.body.data.importedCount).toBe(0);
    expect(raceConfirmRes.body.data.skippedCount).toBe(1);

    // Verify in PostgreSQL: still exactly ONE record exists, no duplicates created
    const raceRecords = await prisma.questionBankItem.findMany({
      where: { questionText: raceQuestionText, deletedAt: null },
    });
    expect(raceRecords.length).toBe(1);

    // Scenario 3: Malicious payload with non-whitelisted properties rejected by DTO ValidationPipe (400)
    const forbiddenPropsPayload = {
      rows: [
        {
          questionText: "Câu hỏi chứa mã độc non-whitelisted?",
          options: ["A", "B", "C", "D"],
          correctIndex: 0,
          evilInjectedProperty: "malicious_script",
        },
      ],
    };

    const forbiddenRes = await request(server)
      .post("/api/v1/admin/questions/import/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(forbiddenPropsPayload)
      .expect(400);

    expect(forbiddenRes.body.success).toBe(false);
    expect(forbiddenRes.body.error.code).toBe("VALIDATION_ERROR");
  });

  // --------------------------------------------------------------------------
  // 14. M6 Final Closure: Strict Enum Validation (Reject invalid enum values)
  // --------------------------------------------------------------------------
  it("Test 14 [M6 Final Closure - Strict Enum Validation]: Rejects invalid difficulty and status values, applies defaults when omitted, and imports only valid rows from mixed batch", async () => {
    const mixedBatchPayload = {
      rows: [
        // Row 1: Valid row without difficulty/status -> applies default MEDIUM and APPROVED
        {
          rowNumber: 1,
          questionText: "Câu hỏi hợp lệ không gửi độ khó và trạng thái?",
          options: ["Opt A", "Opt B", "Opt C", "Opt D"],
          correctIndex: 0,
          topic: "Mặc định",
          validationStatus: "VALID",
        },
        // Row 2: Invalid difficulty "INVALID" -> MUST be rejected/skipped (NOT converted to default)
        {
          rowNumber: 2,
          questionText: "Câu hỏi chứa độ khó không hợp lệ INVALID?",
          options: ["Opt A", "Opt B", "Opt C", "Opt D"],
          correctIndex: 1,
          difficulty: "INVALID" as never,
          status: "APPROVED",
          validationStatus: "VALID",
        },
        // Row 3: Invalid status "SUPER_ADMIN" -> MUST be rejected/skipped (NOT converted to default)
        {
          rowNumber: 3,
          questionText: "Câu hỏi chứa trạng thái không hợp lệ SUPER_ADMIN?",
          options: ["Opt A", "Opt B", "Opt C", "Opt D"],
          correctIndex: 2,
          difficulty: "EASY",
          status: "SUPER_ADMIN" as never,
          validationStatus: "VALID",
        },
        // Row 4: Valid row with explicit valid difficulty and status
        {
          rowNumber: 4,
          questionText: "Câu hỏi hợp lệ có đầy đủ enum EASY và DRAFT?",
          options: ["Opt A", "Opt B", "Opt C", "Opt D"],
          correctIndex: 3,
          difficulty: "EASY",
          status: "DRAFT",
          validationStatus: "VALID",
        },
      ],
    };

    const confirmRes = await request(server)
      .post("/api/v1/admin/questions/import/confirm")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(mixedBatchPayload)
      .expect(200);

    expect(confirmRes.body.success).toBe(true);
    // 4 rows total: 2 valid rows imported, 2 invalid enum rows skipped
    expect(confirmRes.body.data.importedCount).toBe(2);
    expect(confirmRes.body.data.skippedCount).toBe(2);

    // Direct PostgreSQL verification:
    // 1. Invalid difficulty "INVALID" row MUST NOT exist in PostgreSQL
    const dbInvalidDiff = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Câu hỏi chứa độ khó không hợp lệ INVALID?",
        deletedAt: null,
      },
    });
    expect(dbInvalidDiff).toBeNull();

    // 2. Invalid status "SUPER_ADMIN" row MUST NOT exist in PostgreSQL
    const dbInvalidStatus = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Câu hỏi chứa trạng thái không hợp lệ SUPER_ADMIN?",
        deletedAt: null,
      },
    });
    expect(dbInvalidStatus).toBeNull();

    // 3. Row 1 (omitted difficulty & status) MUST exist with defaults "MEDIUM" and "APPROVED"
    const dbDefaultRow = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Câu hỏi hợp lệ không gửi độ khó và trạng thái?",
        deletedAt: null,
      },
    });
    expect(dbDefaultRow).not.toBeNull();
    expect(dbDefaultRow?.difficulty).toBe("MEDIUM");
    expect(dbDefaultRow?.status).toBe("APPROVED");

    // 4. Row 4 MUST exist with exact specified enums "EASY" and "DRAFT"
    const dbExplicitRow = await prisma.questionBankItem.findFirst({
      where: {
        questionText: "Câu hỏi hợp lệ có đầy đủ enum EASY và DRAFT?",
        deletedAt: null,
      },
    });
    expect(dbExplicitRow).not.toBeNull();
    expect(dbExplicitRow?.difficulty).toBe("EASY");
    expect(dbExplicitRow?.status).toBe("DRAFT");

    // 5. AuditLog verification: importedCount must be 2
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: "IMPORT_QUESTIONS",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(auditRecord).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diff = auditRecord?.diffJson as any;
    expect(diff.importedCount).toBe(2);
    expect(diff.skippedCount).toBe(2);
    expect(diff.totalReceived).toBe(4);
  });
});

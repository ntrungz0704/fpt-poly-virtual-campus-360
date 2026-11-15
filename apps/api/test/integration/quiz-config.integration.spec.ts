import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import type { QuizConfigQuestionDto, QuizConfigurationDto } from "@fpt-campus/shared";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Quiz Configuration Management Integration Suite (M7.1)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let adminToken = "";
  let studentToken = "";
  let tourEditorToken = "";
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let approvedQuestion1Id = "";
  let approvedQuestion2Id = "";
  let unapprovedQuestionId = "";
  let testEventId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("quiz_config_m71");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-QuizConfig-M71-2026!";
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
        username: "student_quiz_m71",
        fullName: "Sinh Viên Quiz M71",
        email: "student_m71@poly.edu.vn",
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
      jti: "test-jti-student-quiz-m71",
    });

    // 3. Create tour editor user (campus:write only, no events:write)
    const tourEditorRole = await prisma.role.findUniqueOrThrow({
      where: { code: "TOUR_EDITOR" },
    });

    const tourEditorUser = await prisma.user.create({
      data: {
        username: "tour_editor_quiz_m71",
        fullName: "Biên Tập Viên Tour Quiz M71",
        email: "tour_editor_m71@poly.edu.vn",
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
      jti: "test-jti-tour-editor-quiz-m71",
    });

    // 4. Seed test questions in Question Bank
    const q1 = await prisma.questionBankItem.create({
      data: {
        questionText: "FPT Polytechnic TP.HCM có bao nhiêu cơ sở đào tạo chính?",
        optionsJson: ["1 cơ sở", "2 cơ sở", "3 cơ sở", "4 cơ sở"],
        correctIndex: 2,
        explanation: "FPT Polytechnic TP.HCM có các cơ sở chính tại CVPM Quang Trung, Tân Bình và Nam Kỳ Khởi Nghĩa.",
        topic: "Lịch sử FPT",
        difficulty: "MEDIUM",
        status: "APPROVED",
      },
    });
    approvedQuestion1Id = q1.id;

    const q2 = await prisma.questionBankItem.create({
      data: {
        questionText: "Phương châm học tập tại FPT Polytechnic là gì?",
        optionsJson: ["Thực học - Thực nghiệp", "Lý thuyết hàng đầu", "Học vì tương lai", "Học ngày học đêm"],
        correctIndex: 0,
        explanation: "Thực học - Thực nghiệp là triết lý đào tạo cốt lõi.",
        topic: "Văn hóa FPT",
        difficulty: "EASY",
        status: "APPROVED",
      },
    });
    approvedQuestion2Id = q2.id;

    const qDraft = await prisma.questionBankItem.create({
      data: {
        questionText: "Câu hỏi nháp chưa được duyệt?",
        optionsJson: ["A", "B", "C", "D"],
        correctIndex: 0,
        topic: "Nháp",
        status: "DRAFT", // NOT APPROVED!
      },
    });
    unapprovedQuestionId = qDraft.id;

    // 5. Seed test Open Day event
    const campus = await prisma.campus.findFirstOrThrow();
    const event = await prisma.openDayEvent.create({
      data: {
        campusId: campus.id,
        eventKey: "OD26-M71-TEST",
        title: "Open Day 2026 Virtual Campus Test",
        dateLabel: "20/03/2026",
        timeLabel: "08:00 - 17:00",
        status: "PUBLISHED",
      },
    });
    testEventId = event.id;
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
  // 1. RBAC Protection
  // --------------------------------------------------------------------------
  it("Test 1 [RBAC]: Student token and campus:write-only token cannot access Quiz Config admin endpoints (403)", async () => {
    // Student token -> 403
    await request(server)
      .get("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);

    await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Student trying to create quiz" })
      .expect(403);

    // TOUR_EDITOR (campus:write, no events:write) -> 403
    await request(server)
      .get("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .expect(403);

    await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .send({ title: "Tour editor trying to create quiz" })
      .expect(403);

    // Unauthenticated -> 401
    await request(server).get("/api/v1/admin/quiz-configs").expect(401);
  });

  // --------------------------------------------------------------------------
  // 2. Validation & Creation
  // --------------------------------------------------------------------------
  it("Test 2 [Validation]: Rejects invalid quiz creation payloads (400 Bad Request)", async () => {
    // Title too short (< 3 chars)
    await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Hi" })
      .expect(400);

    // Non-existent eventId
    await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Quiz with fake event",
        eventId: "00000000-0000-4000-a000-000000000000",
      })
      .expect(400);

    // Duplicate question IDs
    await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Quiz with duplicate questions",
        questionIds: [approvedQuestion1Id, approvedQuestion1Id],
      })
      .expect(400);

    // Unapproved question ID
    await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Quiz with unapproved question",
        questionIds: [unapprovedQuestionId],
      })
      .expect(400);
  });

  // --------------------------------------------------------------------------
  // 3. Create, Persist in PostgreSQL & AuditLog
  // --------------------------------------------------------------------------
  let createdQuizId = "";

  it("Test 3 [CRUD]: Creates quiz configuration, snapshots approved questions, and records AuditLog", async () => {
    const res = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi Đấu trường Poly 2026",
        description: "Bài thi trắc nghiệm tìm hiểu truyền thống FPT Polytechnic.",
        eventId: testEventId,
        timeLimitMinutes: 20,
        passingScore: 80,
        maxAttempts: 2,
        isShuffleQuestions: true,
        isShuffleOptions: true,
        questionIds: [approvedQuestion1Id, approvedQuestion2Id],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    const quiz = res.body.data;
    expect(quiz.id).toBeDefined();
    expect(quiz.title).toBe("Bài thi Đấu trường Poly 2026");
    expect(quiz.status).toBe("DRAFT");
    expect(quiz.timeLimitMinutes).toBe(20);
    expect(quiz.passingScore).toBe(80);
    expect(quiz.questionsCount).toBe(2);
    expect(quiz.questions).toHaveLength(2);

    // Verify snapshot fields on question 1
    const q1Snap = quiz.questions[0];
    expect(q1Snap.questionText).toBe("FPT Polytechnic TP.HCM có bao nhiêu cơ sở đào tạo chính?");
    expect(q1Snap.correctIndex).toBe(2);
    expect(q1Snap.options).toHaveLength(4);

    createdQuizId = quiz.id;

    // Verify in PostgreSQL directly
    const dbConfig = await prisma.quizConfiguration.findFirst({
      where: { id: createdQuizId, deletedAt: null },
      include: { questions: { orderBy: { sortOrder: "asc" } } },
    });
    expect(dbConfig).not.toBeNull();
    expect(dbConfig?.status).toBe("DRAFT");
    expect(dbConfig?.questions).toHaveLength(2);

    // Verify AuditLog record
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "CREATE_QUIZ_CONFIG",
        resourceId: createdQuizId,
      },
    });
    expect(audit).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 4. Retrieve & Update Configuration
  // --------------------------------------------------------------------------
  it("Test 4 [Get & Update]: Retrieves quiz details and updates configuration settings", async () => {
    // Get by ID
    const getRes = await request(server)
      .get(`/api/v1/admin/quiz-configs/${createdQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.id).toBe(createdQuizId);
    expect(getRes.body.data.eventTitle).toBe("Open Day 2026 Virtual Campus Test");

    // Update title and time limit
    const updateRes = await request(server)
      .patch(`/api/v1/admin/quiz-configs/${createdQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi Đấu trường Poly 2026 (Chính Thức)",
        timeLimitMinutes: 25,
      })
      .expect(200);

    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe("Bài thi Đấu trường Poly 2026 (Chính Thức)");
    expect(updateRes.body.data.timeLimitMinutes).toBe(25);

    // Verify DB update
    const dbUpdated = await prisma.quizConfiguration.findUnique({
      where: { id: createdQuizId },
    });
    expect(dbUpdated?.title).toBe("Bài thi Đấu trường Poly 2026 (Chính Thức)");
    expect(dbUpdated?.timeLimitMinutes).toBe(25);
  });

  // --------------------------------------------------------------------------
  // 5. Manage Questions (Add, Remove, Reorder & Snapshot)
  // --------------------------------------------------------------------------
  it("Test 5 [Manage Questions]: Reorders questions, updates snapshot, and rejects unapproved questions", async () => {
    // Attempt to add unapproved question -> 400
    await request(server)
      .put(`/api/v1/admin/quiz-configs/${createdQuizId}/questions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionIds: [approvedQuestion1Id, unapprovedQuestionId] })
      .expect(400);

    // Reorder: Put question 2 first, then question 1
    const reorderRes = await request(server)
      .put(`/api/v1/admin/quiz-configs/${createdQuizId}/questions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionIds: [approvedQuestion2Id, approvedQuestion1Id] })
      .expect(200);

    expect(reorderRes.body.success).toBe(true);
    const questions = reorderRes.body.data.questions;
    expect(questions[0].questionBankItemId).toBe(approvedQuestion2Id);
    expect(questions[0].sortOrder).toBe(0);
    expect(questions[1].questionBankItemId).toBe(approvedQuestion1Id);
    expect(questions[1].sortOrder).toBe(1);

    // Verify in PostgreSQL
    const dbQuestions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: createdQuizId },
      orderBy: { sortOrder: "asc" },
    });
    expect(dbQuestions[0].questionBankItemId).toBe(approvedQuestion2Id);
    expect(dbQuestions[1].questionBankItemId).toBe(approvedQuestion1Id);
  });

  // --------------------------------------------------------------------------
  // 6. Publication Validation & Publishing
  // --------------------------------------------------------------------------
  it("Test 6 [Publish]: Cannot publish empty quiz, publishes valid quiz, and sets PUBLISHED status", async () => {
    // Create empty quiz
    const emptyQuizRes = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Bài thi chưa có câu hỏi" })
      .expect(201);

    const emptyQuizId = emptyQuizRes.body.data.id;

    // Attempt to publish empty quiz -> 400
    const failPublish = await request(server)
      .post(`/api/v1/admin/quiz-configs/${emptyQuizId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(400);

    expect(failPublish.body.success).toBe(false);

    // Publish valid quiz
    const publishRes = await request(server)
      .post(`/api/v1/admin/quiz-configs/${createdQuizId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(publishRes.body.success).toBe(true);
    expect(publishRes.body.data.status).toBe("PUBLISHED");
    expect(publishRes.body.data.publishedAt).not.toBeNull();

    // Verify in DB
    const dbPublished = await prisma.quizConfiguration.findUnique({
      where: { id: createdQuizId },
    });
    expect(dbPublished?.status).toBe("PUBLISHED");
    expect(dbPublished?.publishedAt).not.toBeNull();

    // Verify cannot modify questions once published -> 400
    await request(server)
      .put(`/api/v1/admin/quiz-configs/${createdQuizId}/questions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionIds: [approvedQuestion1Id] })
      .expect(400);
  });

  // --------------------------------------------------------------------------
  // 7. CRITICAL TEST: Immutable Question Snapshot
  // --------------------------------------------------------------------------
  it("Test 7 [Snapshot Immutability]: Modifying or deleting original QuestionBankItem DOES NOT alter published quiz snapshot", async () => {
    // Verify snapshot values before tampering
    const beforeQuiz = await request(server)
      .get(`/api/v1/admin/quiz-configs/${createdQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const originalSnap = beforeQuiz.body.data.questions.find(
      (q: QuizConfigQuestionDto) => q.questionBankItemId === approvedQuestion1Id,
    );
    expect(originalSnap.questionText).toBe("FPT Polytechnic TP.HCM có bao nhiêu cơ sở đào tạo chính?");
    expect(originalSnap.correctIndex).toBe(2);

    // TAMPER WITH ORIGINAL QUESTION IN QUESTION BANK:
    // 1. Change question text, options and correctIndex
    await prisma.questionBankItem.update({
      where: { id: approvedQuestion1Id },
      data: {
        questionText: "NỘI DUNG NÀY ĐÃ BỊ THAY ĐỔI TRONG NGÂN HÀNG CÂU HỎI HACKER!",
        correctIndex: 0,
        optionsJson: ["Tampered 1", "Tampered 2", "Tampered 3", "Tampered 4"],
      },
    });

    // 2. Soft-delete question 2 in Question Bank
    await prisma.questionBankItem.update({
      where: { id: approvedQuestion2Id },
      data: { deletedAt: new Date() },
    });

    // RE-FETCH QUIZ CONFIGURATION VIA API:
    const afterQuiz = await request(server)
      .get(`/api/v1/admin/quiz-configs/${createdQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const afterSnap1 = afterQuiz.body.data.questions.find(
      (q: QuizConfigQuestionDto) => q.questionBankItemId === approvedQuestion1Id,
    );

    // ASSERTION: Published snapshot MUST REMAIN IDENTICAL to original values!
    expect(afterSnap1.questionText).toBe("FPT Polytechnic TP.HCM có bao nhiêu cơ sở đào tạo chính?");
    expect(afterSnap1.correctIndex).toBe(2);
    expect(afterSnap1.options).toEqual(["1 cơ sở", "2 cơ sở", "3 cơ sở", "4 cơ sở"]);

    // ASSERTION: Question 2 snapshot still exists intact even though original QuestionBankItem was soft-deleted!
    const afterSnap2 = afterQuiz.body.data.questions.find(
      (q: QuizConfigQuestionDto) => q.questionBankItemId === approvedQuestion2Id,
    );
    expect(afterSnap2).toBeDefined();
    expect(afterSnap2.questionText).toBe("Phương châm học tập tại FPT Polytechnic là gì?");
    expect(afterSnap2.correctIndex).toBe(0);

    // DIRECT POSTGRESQL VERIFICATION:
    const dbSnapQuestion = await prisma.quizConfigQuestion.findFirst({
      where: { quizConfigId: createdQuizId, questionBankItemId: approvedQuestion1Id },
    });
    expect(dbSnapQuestion?.questionText).toBe("FPT Polytechnic TP.HCM có bao nhiêu cơ sở đào tạo chính?");
    expect(dbSnapQuestion?.correctIndex).toBe(2);
  });

  // --------------------------------------------------------------------------
  // 8. Archive & Soft Delete
  // --------------------------------------------------------------------------
  it("Test 8 [Archive & Delete]: Archives quiz, soft deletes, and excludes from active list", async () => {
    // Archive
    const archiveRes = await request(server)
      .post(`/api/v1/admin/quiz-configs/${createdQuizId}/archive`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(archiveRes.body.data.status).toBe("ARCHIVED");

    // List with status filter
    const listArchived = await request(server)
      .get("/api/v1/admin/quiz-configs?status=ARCHIVED")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(listArchived.body.data.items.some((i: QuizConfigurationDto) => i.id === createdQuizId)).toBe(true);

    // Delete
    const deleteRes = await request(server)
      .delete(`/api/v1/admin/quiz-configs/${createdQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(deleteRes.body.success).toBe(true);

    // Excluded from active list
    const listActive = await request(server)
      .get("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(listActive.body.data.items.some((i: QuizConfigurationDto) => i.id === createdQuizId)).toBe(false);

    // Get deleted -> 404
    await request(server)
      .get(`/api/v1/admin/quiz-configs/${createdQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  // --------------------------------------------------------------------------
  // 9. Backward Compatibility: Zero Regression on OpenDayQuizItem
  // --------------------------------------------------------------------------
  it("Test 9 [Regression Guard]: Existing Open Day event quiz items remain completely unaffected", async () => {
    // Seed OpenDayQuizItem
    const legacyQuiz = await prisma.openDayQuizItem.create({
      data: {
        eventId: testEventId,
        questionText: "Câu hỏi Open Day truyền thống?",
        optionsJson: ["A", "B", "C", "D"],
        correctIndex: 1,
        explanation: "Giải thích câu hỏi Open Day",
      },
    });

    expect(legacyQuiz.id).toBeDefined();

    const fetchLegacy = await prisma.openDayQuizItem.findUnique({
      where: { id: legacyQuiz.id },
    });
    expect(fetchLegacy?.questionText).toBe("Câu hỏi Open Day truyền thống?");
    expect(fetchLegacy?.correctIndex).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 10. B01: Published & Archived Configuration Immutability Guard
  // --------------------------------------------------------------------------
  it("Test 10 [Configuration Immutability (B01)]: PUBLISHED and ARCHIVED quizzes reject PATCH; DB and AuditLog remain untainted", async () => {
    // 1. Create a valid quiz and snapshot questions
    const createRes = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi chuẩn bị xuất bản để khóa",
        timeLimitMinutes: 15,
        passingScore: 70,
        maxAttempts: 3,
        questionIds: [approvedQuestion1Id],
      })
      .expect(201);

    const lockQuizId = createRes.body.data.id;

    // 2. Publish the quiz
    await request(server)
      .post(`/api/v1/admin/quiz-configs/${lockQuizId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // 3. Attempt to PATCH published configuration -> MUST FAIL WITH 400
    const rejectedPatch = await request(server)
      .patch(`/api/v1/admin/quiz-configs/${lockQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        passingScore: 99,
        timeLimitMinutes: 60,
        maxAttempts: 10,
        isShuffleQuestions: false,
      })
      .expect(400);

    expect(rejectedPatch.body.success).toBe(false);
    const errorMsg = rejectedPatch.body.error?.message || rejectedPatch.body.message || "";
    expect(errorMsg).toContain("PUBLISHED");

    // 4. Verify PostgreSQL directly: values MUST REMAIN 100% UNCHANGED
    const dbCheckAfterReject = await prisma.quizConfiguration.findUnique({
      where: { id: lockQuizId },
    });
    expect(dbCheckAfterReject?.passingScore).toBe(70);
    expect(dbCheckAfterReject?.timeLimitMinutes).toBe(15);
    expect(dbCheckAfterReject?.maxAttempts).toBe(3);
    expect(dbCheckAfterReject?.status).toBe("PUBLISHED");

    // 5. Verify AuditLog: NO UPDATE_QUIZ_CONFIG recorded for the rejected patch
    const auditRejected = await prisma.auditLog.findMany({
      where: {
        resourceId: lockQuizId,
        action: "UPDATE_QUIZ_CONFIG",
      },
    });
    expect(auditRejected).toHaveLength(0);

    // 6. Archive the quiz
    await request(server)
      .post(`/api/v1/admin/quiz-configs/${lockQuizId}/archive`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // 7. Attempt to PATCH archived configuration -> MUST FAIL WITH 400
    const rejectedArchivePatch = await request(server)
      .patch(`/api/v1/admin/quiz-configs/${lockQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Hacker attempt on archived" })
      .expect(400);

    expect(rejectedArchivePatch.body.success).toBe(false);
    const archiveErrorMsg = rejectedArchivePatch.body.error?.message || rejectedArchivePatch.body.message || "";
    expect(archiveErrorMsg).toContain("ARCHIVED");

    // Also verify PUT questions on ARCHIVED -> MUST FAIL WITH 400
    const rejectedArchiveQuestions = await request(server)
      .put(`/api/v1/admin/quiz-configs/${lockQuizId}/questions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionIds: [approvedQuestion1Id] })
      .expect(400);
    expect(rejectedArchiveQuestions.body.success).toBe(false);

    // 8. Confirm DRAFT quiz can still be updated normally
    const draftRes = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Bài thi nháp hợp lệ" })
      .expect(201);

    const draftId = draftRes.body.data.id;
    const updateDraftRes = await request(server)
      .patch(`/api/v1/admin/quiz-configs/${draftId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Bài thi nháp đã sửa", passingScore: 85 })
      .expect(200);

    expect(updateDraftRes.body.success).toBe(true);
    expect(updateDraftRes.body.data.title).toBe("Bài thi nháp đã sửa");
    expect(updateDraftRes.body.data.passingScore).toBe(85);
  });

  // --------------------------------------------------------------------------
  // 11. B02: Unified Default Values (3 / true / true)
  // --------------------------------------------------------------------------
  it("Test 11 [Unified Defaults (B02)]: API create with omitted optional fields receives default maxAttempts=3, isShuffleQuestions=true, isShuffleOptions=true", async () => {
    // 1. Create omitting maxAttempts, isShuffleQuestions, isShuffleOptions
    const defaultRes = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi kiểm tra Defaults",
      })
      .expect(201);

    expect(defaultRes.body.success).toBe(true);
    const data = defaultRes.body.data;
    expect(data.maxAttempts).toBe(3);
    expect(data.isShuffleQuestions).toBe(true);
    expect(data.isShuffleOptions).toBe(true);

    // Verify in PostgreSQL directly
    const dbDefault = await prisma.quizConfiguration.findUnique({
      where: { id: data.id },
    });
    expect(dbDefault?.maxAttempts).toBe(3);
    expect(dbDefault?.isShuffleQuestions).toBe(true);
    expect(dbDefault?.isShuffleOptions).toBe(true);

    // 2. Explicitly supplied values are accurately persisted
    const explicitRes = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi với giá trị tùy biến",
        maxAttempts: 5,
        isShuffleQuestions: false,
        isShuffleOptions: false,
      })
      .expect(201);

    expect(explicitRes.body.data.maxAttempts).toBe(5);
    expect(explicitRes.body.data.isShuffleQuestions).toBe(false);
    expect(explicitRes.body.data.isShuffleOptions).toBe(false);

    const dbExplicit = await prisma.quizConfiguration.findUnique({
      where: { id: explicitRes.body.data.id },
    });
    expect(dbExplicit?.maxAttempts).toBe(5);
    expect(dbExplicit?.isShuffleQuestions).toBe(false);
    expect(dbExplicit?.isShuffleOptions).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 12. B01-RACE: Atomic Concurrency (Concurrent PATCH vs Publish)
  // --------------------------------------------------------------------------
  it("Test 12 [Atomic Concurrency (B01-RACE)]: Concurrent PATCH vs Publish cannot overwrite metadata on published quiz", async () => {
    // 1. Create a quiz in DRAFT with approved question
    const res = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi kiểm thử Race Condition PATCH vs Publish",
        passingScore: 70,
        timeLimitMinutes: 15,
        questionIds: [approvedQuestion1Id],
      })
      .expect(201);

    const raceQuizId = res.body.data.id;

    // 2. Fire concurrent requests: PATCH and Publish at the exact same moment
    const [patchResult, publishResult] = await Promise.all([
      request(server)
        .patch(`/api/v1/admin/quiz-configs/${raceQuizId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          passingScore: 99,
          timeLimitMinutes: 99,
        }),
      request(server)
        .post(`/api/v1/admin/quiz-configs/${raceQuizId}/publish`)
        .set("Authorization", `Bearer ${adminToken}`),
    ]);

    // 3. Inspect PostgreSQL state:
    const finalDb = await prisma.quizConfiguration.findUnique({
      where: { id: raceQuizId },
    });
    expect(finalDb?.status).toBe("PUBLISHED");

    // Two valid outcomes depending on transaction serialization:
    // Outcome A: PATCH executed before publish committed -> PATCH returned 200, then publish published passingScore=99.
    // Outcome B: Publish committed before PATCH -> Publish returned 200, then PATCH returned 400 (Bad Request), leaving passingScore=70.
    // IMPOSSIBLE OUTCOME: PATCH succeeds after publish committed and corrupts a published quiz!
    if (patchResult.status === 200) {
      expect(publishResult.status).toBe(200);
      expect(finalDb?.passingScore).toBe(99);
    } else {
      expect(patchResult.status).toBe(400);
      expect(publishResult.status).toBe(200);
      expect(finalDb?.passingScore).toBe(70);
    }

    // 4. In either outcome, subsequent PATCH MUST 100% BE REJECTED with 400!
    await request(server)
      .patch(`/api/v1/admin/quiz-configs/${raceQuizId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ passingScore: 50 })
      .expect(400);
  });

  // --------------------------------------------------------------------------
  // 13. B01-RACE: Atomic Concurrency (Concurrent manageQuestions vs Publish)
  // --------------------------------------------------------------------------
  it("Test 13 [Atomic Concurrency (B01-RACE)]: Concurrent manageQuestions vs Publish cannot corrupt snapshot on published quiz", async () => {
    // 1. Create a quiz in DRAFT with question 1
    const res = await request(server)
      .post("/api/v1/admin/quiz-configs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài thi kiểm thử Race Condition Questions vs Publish",
        questionIds: [approvedQuestion1Id],
      })
      .expect(201);

    const raceQuizId = res.body.data.id;

    // 2. Fire concurrent requests: manageQuestions (change to question 2) and Publish
    const [manageResult, publishResult] = await Promise.all([
      request(server)
        .put(`/api/v1/admin/quiz-configs/${raceQuizId}/questions`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ questionIds: [approvedQuestion2Id] }),
      request(server)
        .post(`/api/v1/admin/quiz-configs/${raceQuizId}/publish`)
        .set("Authorization", `Bearer ${adminToken}`),
    ]);

    // 3. Inspect PostgreSQL state:
    const finalDb = await prisma.quizConfiguration.findUnique({
      where: { id: raceQuizId },
    });
    expect(finalDb?.status).toBe("PUBLISHED");

    const finalQuestions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: raceQuizId },
    });
    expect(finalQuestions.length).toBeGreaterThan(0);

    if (manageResult.status === 200) {
      expect(publishResult.status).toBe(200);
      expect(finalQuestions[0].questionBankItemId).toBe(approvedQuestion2Id);
    } else {
      expect(manageResult.status).toBe(400);
      expect(publishResult.status).toBe(200);
      expect(finalQuestions[0].questionBankItemId).toBe(approvedQuestion1Id);
    }

    // 4. Subsequent manageQuestions MUST 100% BE REJECTED with 400!
    await request(server)
      .put(`/api/v1/admin/quiz-configs/${raceQuizId}/questions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ questionIds: [approvedQuestion1Id] })
      .expect(400);
  });
});

import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import type {
  PortalQuizDetailDeliveryDto,
  PortalQuizSummaryDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Quiz Delivery Integration Suite (M7.2)", () => {
  jest.setTimeout(120_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let studentToken = "";
  let studentUser: { id: string; username: string | null };
  let student2Token = "";
  let _student2User: { id: string; username: string | null };
  let parentToken = "";

  let testEventId = "";
  let generalPublishedQuizId = "";
  let eventPublishedQuizId = "";
  let draftQuizId = "";
  let archivedQuizId = "";
  let softDeletedQuizId = "";
  let bankItem1Id = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("quiz_delivery_m72");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-QuizDelivery-M72-2026!";
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

    const passwordHash = adminLoginRes.body.data.user?.passwordHash || "some-hash";
    const jwtService = ctx.app.get(JwtService);

    // 2. Create Student 1 (Registered for Event)
    const s1 = await prisma.user.create({
      data: {
        username: "student_eligible_m72",
        fullName: "Sinh Viên Hợp Lệ M72",
        email: "student_eligible_m72@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash,
      },
    });
    studentUser = { id: s1.id, username: s1.username };
    studentToken = jwtService.sign({
      sub: s1.id,
      username: s1.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-student-m72-1",
    });

    // 3. Create Student 2 (NOT registered for Event)
    const s2 = await prisma.user.create({
      data: {
        username: "student_unregistered_m72",
        fullName: "Sinh Viên Chưa ĐK M72",
        email: "student_unregistered_m72@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash,
      },
    });
    _student2User = { id: s2.id, username: s2.username };
    student2Token = jwtService.sign({
      sub: s2.id,
      username: s2.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-student-m72-2",
    });

    // 4. Create Parent User (Unauthorized Role for Quiz Delivery)
    const p1 = await prisma.user.create({
      data: {
        username: "parent_user_m72",
        fullName: "Phụ Huynh M72",
        email: "parent_m72@poly.edu.vn",
        userType: "PARENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash,
      },
    });
    parentToken = jwtService.sign({
      sub: p1.id,
      username: p1.username,
      roles: ["PARENT"],
      pwdRequired: false,
      jti: "test-jti-parent-m72",
    });

    // 5. Query default seeded Campus & create Event
    const campus = await prisma.campus.findFirstOrThrow();

    const event = await prisma.openDayEvent.create({
      data: {
        campusId: campus.id,
        eventKey: "openday-m72-delivery",
        title: "Open Day Công Nghệ 2026 M72",
        dateLabel: "20/11/2026",
        timeLabel: "08:00 - 17:00",
        status: "PUBLISHED",
      },
    });
    testEventId = event.id;

    // Register Student 1 for Event
    await prisma.eventParticipation.create({
      data: {
        userId: studentUser.id,
        eventId: testEventId,
        ticketCode: "TICKET-M72-S1",
        attendeeName: "Sinh Viên Hợp Lệ M72",
        participationStatus: "CONFIRMED",
      },
    });

    // 6. Seed QuestionBankItems
    const bankItem1 = await prisma.questionBankItem.create({
      data: {
        questionText: "Framework nào phát triển bởi Vercel dựa trên React?",
        optionsJson: ["Next.js", "NuxtJS", "Angular", "Vue.js"],
        correctIndex: 0,
        explanation: "Next.js là React framework do Vercel phát triển.",
        topic: "Web Development",
        difficulty: "EASY",
        status: "APPROVED",
      },
    });
    bankItem1Id = bankItem1.id;

    const bankItem2 = await prisma.questionBankItem.create({
      data: {
        questionText: "Cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ nhất hiện nay là gì?",
        optionsJson: ["MongoDB", "PostgreSQL", "Redis", "Cassandra"],
        correctIndex: 1,
        explanation: "PostgreSQL là RDBMS mã nguồn mở mạnh mẽ và tiêu chuẩn.",
        topic: "Database",
        difficulty: "MEDIUM",
        status: "APPROVED",
      },
    });

    // 7. Seed General Published Quiz (eventId: null)
    const generalQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi Đánh giá Năng lực Nhập môn Công nghệ",
        description: "Khảo sát và kiểm tra kiến thức lập trình cơ bản",
        eventId: null,
        timeLimitMinutes: 20,
        passingScore: 75,
        maxAttempts: 3,
        isShuffleQuestions: true,
        isShuffleOptions: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
        questions: {
          create: [
            {
              sortOrder: 1,
              questionText: bankItem1.questionText,
              optionsJson: ["Next.js", "NuxtJS", "Angular", "Vue.js"],
              correctIndex: bankItem1.correctIndex,
              explanation: bankItem1.explanation,
              topic: bankItem1.topic,
              difficulty: bankItem1.difficulty,
              questionBankItemId: bankItem1.id,
            },
            {
              sortOrder: 2,
              questionText: bankItem2.questionText,
              optionsJson: ["MongoDB", "PostgreSQL", "Redis", "Cassandra"],
              correctIndex: bankItem2.correctIndex,
              explanation: bankItem2.explanation,
              topic: bankItem2.topic,
              difficulty: bankItem2.difficulty,
              questionBankItemId: bankItem2.id,
            },
          ],
        },
      },
    });
    generalPublishedQuizId = generalQuiz.id;

    // 8. Seed Event Published Quiz (eventId: testEventId)
    const eventQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Thử thách Công nghệ Open Day 2026",
        description: "Bộ câu hỏi đặc biệt dành cho thí sinh tham dự Open Day",
        eventId: testEventId,
        timeLimitMinutes: 15,
        passingScore: 80,
        maxAttempts: 2,
        isShuffleQuestions: true,
        isShuffleOptions: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
        questions: {
          create: [
            {
              sortOrder: 1,
              questionText: bankItem1.questionText,
              optionsJson: ["Next.js", "NuxtJS", "Angular", "Vue.js"],
              correctIndex: bankItem1.correctIndex,
              explanation: bankItem1.explanation,
              topic: bankItem1.topic,
              difficulty: bankItem1.difficulty,
              questionBankItemId: bankItem1.id,
            },
          ],
        },
      },
    });
    eventPublishedQuizId = eventQuiz.id;

    // 9. Seed DRAFT Quiz
    const draftQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi Bản nháp Chưa phát hành",
        description: "Bài thi đang trong quá trình soạn thảo",
        eventId: null,
        status: "DRAFT",
        questions: {
          create: [
            {
              sortOrder: 1,
              questionText: "Câu hỏi nháp?",
              optionsJson: ["A", "B"],
              correctIndex: 0,
              explanation: "Giải thích nháp",
              topic: "Draft",
            },
          ],
        },
      },
    });
    draftQuizId = draftQuiz.id;

    // 10. Seed ARCHIVED Quiz
    const archivedQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi Đã Lưu trữ Cũ",
        description: "Bài thi năm 2025 đã đóng",
        eventId: null,
        status: "ARCHIVED",
      },
    });
    archivedQuizId = archivedQuiz.id;

    // 11. Seed Soft-deleted Quiz
    const softDeletedQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi Đã Xóa Mềm",
        description: "Bài thi đã bị xóa khỏi hệ thống",
        eventId: null,
        status: "PUBLISHED",
        deletedAt: new Date(),
      },
    });
    softDeletedQuizId = softDeletedQuiz.id;
  });

  afterAll(async () => {
    if (ctx?.app) {
      await ctx.app.close();
    }
    if (dbHandle) {
      await dbHandle.drop();
    }
  });

  // ============================================================================
  // Test 1: Authentication Security
  // ============================================================================
  it("Test 1 [Authentication Security]: Unauthenticated request is rejected (401)", async () => {
    const listRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .expect(401);
    expect(listRes.body.statusCode || listRes.status).toBe(401);

    const detailRes = await request(server)
      .get(`/api/v1/portal/quiz/${generalPublishedQuizId}`)
      .expect(401);
    expect(detailRes.body.statusCode || detailRes.status).toBe(401);
  });

  // ============================================================================
  // Test 2: Role Authorization Guard
  // ============================================================================
  it("Test 2 [Role Authorization]: Non-student role (PARENT) is rejected (403)", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(403);

    const msg = res.body.error?.message || res.body.message || "";
    expect(msg).toContain("sinh viên");
  });

  // ============================================================================
  // Test 3: Active Quizzes Delivery & Lifecycle Filter
  // ============================================================================
  it("Test 3 [Active Quizzes Delivery]: Returns eligible PUBLISHED quizzes; excludes DRAFT, ARCHIVED, Soft-deleted", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);

    const data: PortalQuizSummaryDto[] = res.body.data;
    expect(Array.isArray(data)).toBe(true);

    const returnedIds = data.map((q) => q.id);

    // Eligible quizzes are present
    expect(returnedIds).toContain(generalPublishedQuizId);
    expect(returnedIds).toContain(eventPublishedQuizId);

    // Lifecycle guards: Non-published quizzes are completely excluded
    expect(returnedIds).not.toContain(draftQuizId);
    expect(returnedIds).not.toContain(archivedQuizId);
    expect(returnedIds).not.toContain(softDeletedQuizId);

    // Verify metadata allowlist
    const general = data.find((q) => q.id === generalPublishedQuizId)!;
    expect(general.title).toBe("Bài thi Đánh giá Năng lực Nhập môn Công nghệ");
    expect(general.eventId).toBeNull();
    expect(general.timeLimitMinutes).toBe(20);
    expect(general.passingScore).toBe(75);
    expect(general.maxAttempts).toBe(3);
    expect(general.totalQuestions).toBe(2);
    expect(general.isShuffleQuestions).toBe(true);
    expect(general.isShuffleOptions).toBe(true);

    const eventQuiz = data.find((q) => q.id === eventPublishedQuizId)!;
    expect(eventQuiz.eventName).toBe("Open Day Công Nghệ 2026 M72");
    expect(eventQuiz.totalQuestions).toBe(1);
  });

  // ============================================================================
  // Test 4: Safe Detail Delivery - ZERO LEAK GUARANTEE
  // ============================================================================
  it("Test 4 [Safe Detail Delivery]: Returns questions with ZERO LEAK of correctIndex, explanation, or internal IDs", async () => {
    const res = await request(server)
      .get(`/api/v1/portal/quiz/${generalPublishedQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);

    const quiz: PortalQuizDetailDeliveryDto = res.body.data;
    expect(quiz.id).toBe(generalPublishedQuizId);
    expect(quiz.questions.length).toBe(2);

    // 1. Inspect TypeScript DTO properties
    for (const q of quiz.questions) {
      expect(q.id).toBeDefined();
      expect(q.sortOrder).toBeGreaterThan(0);
      expect(typeof q.questionText).toBe("string");
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBe(4);
      expect(q.topic).toBeDefined();
      expect(q.difficulty).toBeDefined();

      // STRICT PROHIBITIONS:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((q as any).correctIndex).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((q as any).explanation).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((q as any).questionBankItemId).toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((q as any).optionsJson).toBeUndefined();

      // Check exact allowlist keys
      const keys = Object.keys(q).sort();
      expect(keys).toEqual(["difficulty", "id", "options", "questionText", "sortOrder", "topic"]);
    }

    // 2. Inspect raw JSON payload string
    const rawJson = JSON.stringify(res.body);
    expect(rawJson).not.toContain("correctIndex");
    expect(rawJson).not.toContain("correct_index");
    expect(rawJson).not.toContain("explanation");
    expect(rawJson).not.toContain("questionBankItemId");
    expect(rawJson).not.toContain("question_bank_item_id");
    expect(rawJson).not.toContain("audit_logs");
  });

  // ============================================================================
  // Test 5: Event Eligibility Enforcement & All Participation Statuses (B01)
  // ============================================================================
  it("Test 5 [Event Eligibility]: Enforces participation status across CONFIRMED, CHECKED_IN, INVITED, CANCELLED, and unregistered", async () => {
    const jwtService = ctx.app.get(JwtService);

    // 1. Student with CHECKED_IN status
    const checkedInUser = await prisma.user.create({
      data: {
        username: "student_checkedin_m72",
        fullName: "Sinh Viên Checkin M72",
        email: "student_checkedin_m72@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash: "some-hash",
      },
    });
    const checkedInToken = jwtService.sign({
      sub: checkedInUser.id,
      username: checkedInUser.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-checkedin",
    });
    await prisma.eventParticipation.create({
      data: {
        userId: checkedInUser.id,
        eventId: testEventId,
        ticketCode: "TICKET-CHECKEDIN-M72",
        participationStatus: "CHECKED_IN",
      },
    });

    // 2. Student with INVITED status
    const invitedUser = await prisma.user.create({
      data: {
        username: "student_invited_m72",
        fullName: "Sinh Viên Invited M72",
        email: "student_invited_m72@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash: "some-hash",
      },
    });
    const invitedToken = jwtService.sign({
      sub: invitedUser.id,
      username: invitedUser.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-invited",
    });
    await prisma.eventParticipation.create({
      data: {
        userId: invitedUser.id,
        eventId: testEventId,
        ticketCode: "TICKET-INVITED-M72",
        participationStatus: "INVITED",
      },
    });

    // 3. Student with CANCELLED status
    const cancelledUser = await prisma.user.create({
      data: {
        username: "student_cancelled_m72",
        fullName: "Sinh Viên Cancelled M72",
        email: "student_cancelled_m72@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash: "some-hash",
      },
    });
    const cancelledToken = jwtService.sign({
      sub: cancelledUser.id,
      username: cancelledUser.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-cancelled",
    });
    await prisma.eventParticipation.create({
      data: {
        userId: cancelledUser.id,
        eventId: testEventId,
        ticketCode: "TICKET-CANCELLED-M72",
        participationStatus: "CANCELLED",
      },
    });

    // --- Case 5.1: CONFIRMED student (studentToken) accesses event quiz: 200 OK & present in /active
    const confirmedRes = await request(server)
      .get(`/api/v1/portal/quiz/${eventPublishedQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    expect(confirmedRes.body.data.id).toBe(eventPublishedQuizId);

    const confirmedActiveRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    const confirmedActiveIds = (confirmedActiveRes.body.data as PortalQuizSummaryDto[]).map((q) => q.id);
    expect(confirmedActiveIds).toContain(eventPublishedQuizId);
    expect(confirmedActiveIds).toContain(generalPublishedQuizId);

    // --- Case 5.2: CHECKED_IN student accesses event quiz: 200 OK & present in /active
    const checkedInRes = await request(server)
      .get(`/api/v1/portal/quiz/${eventPublishedQuizId}`)
      .set("Authorization", `Bearer ${checkedInToken}`)
      .expect(200);
    expect(checkedInRes.body.data.id).toBe(eventPublishedQuizId);

    const checkedInActiveRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${checkedInToken}`)
      .expect(200);
    const checkedInActiveIds = (checkedInActiveRes.body.data as PortalQuizSummaryDto[]).map((q) => q.id);
    expect(checkedInActiveIds).toContain(eventPublishedQuizId);
    expect(checkedInActiveIds).toContain(generalPublishedQuizId);

    // --- Case 5.3: INVITED student accesses event quiz: 200 OK & present in /active
    const invitedRes = await request(server)
      .get(`/api/v1/portal/quiz/${eventPublishedQuizId}`)
      .set("Authorization", `Bearer ${invitedToken}`)
      .expect(200);
    expect(invitedRes.body.data.id).toBe(eventPublishedQuizId);

    const invitedActiveRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${invitedToken}`)
      .expect(200);
    const invitedActiveIds = (invitedActiveRes.body.data as PortalQuizSummaryDto[]).map((q) => q.id);
    expect(invitedActiveIds).toContain(eventPublishedQuizId);
    expect(invitedActiveIds).toContain(generalPublishedQuizId);

    // --- Case 5.4: CANCELLED student is REJECTED (403 Forbidden) and excluded from /active
    const cancelledRes = await request(server)
      .get(`/api/v1/portal/quiz/${eventPublishedQuizId}`)
      .set("Authorization", `Bearer ${cancelledToken}`)
      .expect(403);
    const cancelMsg = cancelledRes.body.error?.message || cancelledRes.body.message || "";
    expect(cancelMsg).toContain("đăng ký tham gia sự kiện");

    const cancelledActiveRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${cancelledToken}`)
      .expect(200);
    const cancelledActiveIds = (cancelledActiveRes.body.data as PortalQuizSummaryDto[]).map((q) => q.id);
    expect(cancelledActiveIds).not.toContain(eventPublishedQuizId);
    expect(cancelledActiveIds).toContain(generalPublishedQuizId); // Still has access to general quiz!

    // --- Case 5.5: Non-registered student (student2Token) is REJECTED (403) and excluded from /active
    const unregRes = await request(server)
      .get(`/api/v1/portal/quiz/${eventPublishedQuizId}`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(403);
    const unregMsg = unregRes.body.error?.message || unregRes.body.message || "";
    expect(unregMsg).toContain("đăng ký tham gia sự kiện");

    const unregActiveRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(200);
    const unregActiveIds = (unregActiveRes.body.data as PortalQuizSummaryDto[]).map((q) => q.id);
    expect(unregActiveIds).not.toContain(eventPublishedQuizId);
    expect(unregActiveIds).toContain(generalPublishedQuizId);
  });

  // ============================================================================
  // Test 6: Lifecycle Guard on Detail (DRAFT & ARCHIVED are 404)
  // ============================================================================
  it("Test 6 [Lifecycle Guard]: DRAFT and ARCHIVED quizzes reject detail access (404)", async () => {
    // DRAFT
    await request(server)
      .get(`/api/v1/portal/quiz/${draftQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);

    // ARCHIVED
    await request(server)
      .get(`/api/v1/portal/quiz/${archivedQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);
  });

  // ============================================================================
  // Test 7: Soft-Delete Guard on Detail (404)
  // ============================================================================
  it("Test 7 [Soft-Delete Guard]: Soft-deleted quiz rejects detail access (404)", async () => {
    await request(server)
      .get(`/api/v1/portal/quiz/${softDeletedQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);
  });

  // ============================================================================
  // Test 8: Tampered / Non-existent ID Guard (400 / 404)
  // ============================================================================
  it("Test 8 [ID Validation]: Invalid UUID returns 400; non-existent UUID returns 404", async () => {
    // Non-UUID
    await request(server)
      .get("/api/v1/portal/quiz/not-a-valid-uuid")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(400);

    // Non-existent UUID
    await request(server)
      .get("/api/v1/portal/quiz/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);
  });

  // ============================================================================
  // Test 9: Snapshot Immutability Guard
  // ============================================================================
  it("Test 9 [Snapshot Immutability]: Modifying or deleting QuestionBankItem does not change delivered quiz", async () => {
    // Modify bank item 1 in PostgreSQL
    await prisma.questionBankItem.update({
      where: { id: bankItem1Id },
      data: {
        questionText: "NỘI DUNG MỚI ĐÃ BỊ SỬA TRONG QUESTION BANK",
        explanation: "GIẢI THÍCH MỚI BỊ SỬA",
        deletedAt: new Date(),
      },
    });

    // Deliver quiz detail again
    const res = await request(server)
      .get(`/api/v1/portal/quiz/${generalPublishedQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);

    const question1 = res.body.data.questions.find((q: { sortOrder: number }) => q.sortOrder === 1);
    expect(question1).toBeDefined();
    // Snapshot in published quiz preserves original text!
    expect(question1.questionText).toBe("Framework nào phát triển bởi Vercel dựa trên React?");
    expect(question1.questionText).not.toContain("NỘI DUNG MỚI ĐÃ BỊ SỬA");
  });

  // ============================================================================
  // Test 10: Regression Guard on OpenDayQuizItem
  // ============================================================================
  it("Test 10 [Regression Guard]: Existing OpenDayQuizItem remains unaffected", async () => {
    const openDayQuiz = await prisma.openDayQuizItem.create({
      data: {
        eventId: testEventId,
        questionText: "Open Day quiz legacy item?",
        optionsJson: ["Option 1", "Option 2"],
        correctIndex: 0,
        explanation: "Legacy explanation",
        status: "PUBLISHED",
      },
    });

    const found = await prisma.openDayQuizItem.findUnique({
      where: { id: openDayQuiz.id },
    });
    expect(found).not.toBeNull();
    expect(found?.eventId).toBe(testEventId);
  });
});

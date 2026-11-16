import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import type {
  AdminQuizResultDetailDto,
  AdminQuizResultItemDto,
  AdminQuizResultListResponseDto,
  AdminQuizResultSummaryDto,
  StudentQuizHistoryDetailDto,
  StudentQuizHistoryListResponseDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Quiz Results & History Review Dashboard Integration Suite (M7.5)", () => {
  jest.setTimeout(120_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let student1Token = "";
  let student1User: { id: string; username: string | null };
  let student2Token = "";
  let student2User: { id: string; username: string | null };
  let parentToken = "";
  let adminToken = "";

  let quizConfigAId = "";
  let quizConfigBId = "";
  let student1Attempt1Id = "";
  let student1Attempt2Id = "";
  let student1Attempt3Id = "";
  let student2Attempt1Id = "";
  let student2AttemptBId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("quiz_results_m75");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-QuizResults-M75-2026!";
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
    const passwordHash = adminLoginRes.body.data.user?.passwordHash || "hash-m75";
    const jwtService = ctx.app.get(JwtService);

    // 2. Create Student 1
    const s1 = await prisma.user.create({
      data: {
        username: "student_results_m75_1",
        fullName: "Nguyễn Văn Sinh Viên 1",
        email: "student_results_1@poly.edu.vn",
        studentCode: "PS12345",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash,
      },
    });
    student1User = { id: s1.id, username: s1.username };
    student1Token = jwtService.sign({
      sub: s1.id,
      username: s1.username,
      roles: ["STUDENT"],
      userType: "STUDENT",
      pwdRequired: false,
      jti: "test-jti-s1-m75",
    });

    // 3. Create Student 2
    const s2 = await prisma.user.create({
      data: {
        username: "student_results_m75_2",
        fullName: "Trần Thị Sinh Viên 2",
        email: "student_results_2@poly.edu.vn",
        studentCode: "PS67890",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash,
      },
    });
    student2User = { id: s2.id, username: s2.username };
    student2Token = jwtService.sign({
      sub: s2.id,
      username: s2.username,
      roles: ["STUDENT"],
      userType: "STUDENT",
      pwdRequired: false,
      jti: "test-jti-s2-m75",
    });

    // 4. Create Parent User
    const p1 = await prisma.user.create({
      data: {
        username: "parent_results_m75",
        fullName: "Phụ Huynh M75",
        email: "parent_results_m75@poly.edu.vn",
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
      userType: "PARENT",
      pwdRequired: false,
      jti: "test-jti-parent-m75",
    });

    // 5. Seed Quiz Config A (2 questions, passingScore = 50, maxAttempts = 3)
    const quizA = await prisma.quizConfiguration.create({
      data: {
        title: "Bài Thi Khảo Sát M7.5 (A)",
        description: "M75 Quiz A Description",
        timeLimitMinutes: 15,
        passingScore: 50,
        maxAttempts: 3,
        isShuffleQuestions: false,
        isShuffleOptions: false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    quizConfigAId = quizA.id;

    const qA1 = await prisma.quizConfigQuestion.create({
      data: {
        quizConfigId: quizA.id,
        sortOrder: 1,
        questionText: "HTML viết tắt của cụm từ nào?",
        optionsJson: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Home Tool Markup Language",
          "Hyperlinks Text Mark Language",
        ],
        correctIndex: 0,
        explanation: "HTML là Hyper Text Markup Language.",
        topic: "Web",
        difficulty: "EASY",
      },
    });

    const qA2 = await prisma.quizConfigQuestion.create({
      data: {
        quizConfigId: quizA.id,
        sortOrder: 2,
        questionText: "CSS dùng để làm gì?",
        optionsJson: [
          "Lập trình cơ sở dữ liệu",
          "Định dạng và trang trí giao diện web",
          "Quản trị mạng",
          "Bảo mật máy chủ",
        ],
        correctIndex: 1,
        explanation: "CSS viết tắt của Cascading Style Sheets, dùng định kiểu giao diện.",
        topic: "Web",
        difficulty: "EASY",
      },
    });

    // 6. Seed Quiz Config B (1 question, passingScore = 100, maxAttempts = 2)
    const quizB = await prisma.quizConfiguration.create({
      data: {
        title: "Bài Thi Nâng Cao M7.5 (B)",
        description: "M75 Quiz B Description",
        timeLimitMinutes: 20,
        passingScore: 100,
        maxAttempts: 2,
        isShuffleQuestions: false,
        isShuffleOptions: false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    quizConfigBId = quizB.id;

    const qB1 = await prisma.quizConfigQuestion.create({
      data: {
        quizConfigId: quizB.id,
        sortOrder: 1,
        questionText: "PostgreSQL là loại hệ quản trị cơ sở dữ liệu nào?",
        optionsJson: ["RDBMS", "NoSQL", "Key-Value", "Graph"],
        correctIndex: 0,
        explanation: "PostgreSQL là RDBMS mã nguồn mở mạnh mẽ.",
        topic: "Database",
        difficulty: "MEDIUM",
      },
    });

    // 7. Seed Student 1 Attempt 1 (Quiz A) -> SUBMITTED, 100% (2/2), PASS, 40 XP
    const now = Date.now();
    const att1 = await prisma.quizConfigAttempt.create({
      data: {
        userId: student1User.id,
        quizConfigId: quizA.id,
        attemptNumber: 1,
        status: "SUBMITTED",
        startedAt: new Date(now - 30 * 60 * 1000),
        expiresAt: new Date(now - 15 * 60 * 1000),
        submittedAt: new Date(now - 20 * 60 * 1000),
        totalQuestions: 2,
        answeredCount: 2,
        correctCount: 2,
        scorePercent: 100,
        passed: true,
        baseXp: 20,
        bonusXp: 20,
        awardedXp: 40,
      },
    });
    student1Attempt1Id = att1.id;

    await prisma.quizConfigAttemptAnswer.createMany({
      data: [
        {
          attemptId: att1.id,
          quizConfigQuestionId: qA1.id,
          displayedOrder: 1,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 0,
        },
        {
          attemptId: att1.id,
          quizConfigQuestionId: qA2.id,
          displayedOrder: 2,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 1,
        },
      ],
    });

    await prisma.quizXpClaim.create({
      data: {
        userId: student1User.id,
        quizConfigId: quizA.id,
        attemptId: att1.id,
        awardedXp: 40,
      },
    });

    // 8. Seed Student 1 Attempt 2 (Quiz A) -> SUBMITTED (Retake), 50% (1/2), PASS, 0 XP
    const att2 = await prisma.quizConfigAttempt.create({
      data: {
        userId: student1User.id,
        quizConfigId: quizA.id,
        attemptNumber: 2,
        status: "SUBMITTED",
        startedAt: new Date(now - 15 * 60 * 1000),
        expiresAt: new Date(now),
        submittedAt: new Date(now - 5 * 60 * 1000),
        totalQuestions: 2,
        answeredCount: 2,
        correctCount: 1,
        scorePercent: 50,
        passed: true,
        baseXp: 10,
        bonusXp: 20,
        awardedXp: 0,
      },
    });
    student1Attempt2Id = att2.id;

    await prisma.quizConfigAttemptAnswer.createMany({
      data: [
        {
          attemptId: att2.id,
          quizConfigQuestionId: qA1.id,
          displayedOrder: 1,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 0,
        },
        {
          attemptId: att2.id,
          quizConfigQuestionId: qA2.id,
          displayedOrder: 2,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 3, // wrong option
        },
      ],
    });

    // 9. Seed Student 1 Attempt 3 (Quiz A) -> EXPIRED
    const att3 = await prisma.quizConfigAttempt.create({
      data: {
        userId: student1User.id,
        quizConfigId: quizA.id,
        attemptNumber: 3,
        status: "EXPIRED",
        startedAt: new Date(now - 60 * 60 * 1000),
        expiresAt: new Date(now - 45 * 60 * 1000),
        submittedAt: null,
        totalQuestions: 2,
        answeredCount: 1,
        correctCount: null,
        scorePercent: null,
        passed: null,
        baseXp: null,
        bonusXp: null,
        awardedXp: null,
      },
    });
    student1Attempt3Id = att3.id;

    await prisma.quizConfigAttemptAnswer.createMany({
      data: [
        {
          attemptId: att3.id,
          quizConfigQuestionId: qA1.id,
          displayedOrder: 1,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 0,
        },
        {
          attemptId: att3.id,
          quizConfigQuestionId: qA2.id,
          displayedOrder: 2,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: null,
        },
      ],
    });

    // 10. Seed Student 2 Attempt 1 (Quiz A) -> SUBMITTED, 0% (0/2), FAIL, 0 XP
    const s2Att1 = await prisma.quizConfigAttempt.create({
      data: {
        userId: student2User.id,
        quizConfigId: quizA.id,
        attemptNumber: 1,
        status: "SUBMITTED",
        startedAt: new Date(now - 25 * 60 * 1000),
        expiresAt: new Date(now - 10 * 60 * 1000),
        submittedAt: new Date(now - 15 * 60 * 1000),
        totalQuestions: 2,
        answeredCount: 2,
        correctCount: 0,
        scorePercent: 0,
        passed: false,
        baseXp: 0,
        bonusXp: 0,
        awardedXp: 0,
      },
    });
    student2Attempt1Id = s2Att1.id;

    await prisma.quizConfigAttemptAnswer.createMany({
      data: [
        {
          attemptId: s2Att1.id,
          quizConfigQuestionId: qA1.id,
          displayedOrder: 1,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 2, // wrong
        },
        {
          attemptId: s2Att1.id,
          quizConfigQuestionId: qA2.id,
          displayedOrder: 2,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 0, // wrong
        },
      ],
    });

    await prisma.quizXpClaim.create({
      data: {
        userId: student2User.id,
        quizConfigId: quizA.id,
        attemptId: s2Att1.id,
        awardedXp: 0,
      },
    });

    // 11. Seed Student 2 Attempt on Quiz B -> IN_PROGRESS
    const s2AttB = await prisma.quizConfigAttempt.create({
      data: {
        userId: student2User.id,
        quizConfigId: quizB.id,
        attemptNumber: 1,
        status: "IN_PROGRESS",
        startedAt: new Date(now - 5 * 60 * 1000),
        expiresAt: new Date(now + 15 * 60 * 1000),
        submittedAt: null,
        totalQuestions: 1,
        answeredCount: 0,
        correctCount: null,
        scorePercent: null,
        passed: null,
        baseXp: null,
        bonusXp: null,
        awardedXp: null,
      },
    });
    student2AttemptBId = s2AttB.id;

    await prisma.quizConfigAttemptAnswer.create({
      data: {
        attemptId: s2AttB.id,
        quizConfigQuestionId: qB1.id,
        displayedOrder: 1,
        optionOrderJson: [0, 1, 2, 3],
        selectedOptionIndex: null,
      },
    });
  });

  afterAll(async () => {
    await ctx?.app.close();
    await dbHandle?.drop();
  });

  // ============================================================================
  // Test 1: Student 1 queries quiz history list (M7.5-A)
  // ============================================================================
  it("Test 1: Student 1 queries quiz history list returns paginated attempts ordered by startedAt desc", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/history")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const data = res.body.data as StudentQuizHistoryListResponseDto;
    expect(data.total).toBe(3);
    expect(data.items).toHaveLength(3);

    // Verify ordering: descending by startedAt
    const timestamps = data.items.map((i) => new Date(i.startedAt).getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }
  });

  // ============================================================================
  // Test 2: Student history distinguishes first attempt from retakes (isRetake)
  // ============================================================================
  it("Test 2: Student history distinguishes first attempt (isRetake: false) from retakes (isRetake: true)", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/history")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const data = res.body.data as StudentQuizHistoryListResponseDto;
    const att1Item = data.items.find((i) => i.id === student1Attempt1Id);
    const att2Item = data.items.find((i) => i.id === student1Attempt2Id);
    const att3Item = data.items.find((i) => i.id === student1Attempt3Id);

    expect(att1Item).toBeDefined();
    expect(att1Item?.attemptNumber).toBe(1);
    expect(att1Item?.isRetake).toBe(false);

    expect(att2Item).toBeDefined();
    expect(att2Item?.attemptNumber).toBe(2);
    expect(att2Item?.isRetake).toBe(true);

    expect(att3Item).toBeDefined();
    expect(att3Item?.attemptNumber).toBe(3);
    expect(att3Item?.isRetake).toBe(true);
  });

  // ============================================================================
  // Test 3: Student history reflects awarded XP and reason
  // ============================================================================
  it("Test 3: Student history reflects awarded XP and reason (first submit vs retake 0 XP)", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/history")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const data = res.body.data as StudentQuizHistoryListResponseDto;
    const att1Item = data.items.find((i) => i.id === student1Attempt1Id)!;
    const att2Item = data.items.find((i) => i.id === student1Attempt2Id)!;

    expect(att1Item.awardedXp).toBe(40);
    expect(att1Item.isXpAwarded).toBe(true);
    expect(att1Item.xpReason).toBe("FIRST_QUIZ_SUBMISSION");

    expect(att2Item.awardedXp).toBe(0);
    expect(att2Item.isXpAwarded).toBe(false);
    expect(att2Item.xpReason).toBe("ALREADY_AWARDED_OR_RETAKE");
  });

  // ============================================================================
  // Test 4: Student history filter by status
  // ============================================================================
  it("Test 4: Student history filter by status=SUBMITTED returns only submitted attempts", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/history?status=SUBMITTED")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const data = res.body.data as StudentQuizHistoryListResponseDto;
    expect(data.total).toBe(2);
    expect(data.items.every((i) => i.status === "SUBMITTED")).toBe(true);
  });

  // ============================================================================
  // Test 5: Student history filter by passed=true
  // ============================================================================
  it("Test 5: Student history filter by passed=true returns only passed attempts", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/history?passed=true")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const data = res.body.data as StudentQuizHistoryListResponseDto;
    expect(data.total).toBe(2);
    expect(data.items.every((i) => i.passed === true)).toBe(true);
  });

  // ============================================================================
  // Test 6: Student history filter by quizConfigId
  // ============================================================================
  it("Test 6: Student history filter by quizConfigId isolates attempts for that quiz", async () => {
    const res = await request(server)
      .get(`/api/v1/portal/quiz/history?quizConfigId=${quizConfigAId}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const data = res.body.data as StudentQuizHistoryListResponseDto;
    expect(data.total).toBe(3);
    expect(data.items.every((i) => i.quizConfigId === quizConfigAId)).toBe(true);

    const resB = await request(server)
      .get(`/api/v1/portal/quiz/history?quizConfigId=${quizConfigBId}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);
    expect((resB.body.data as StudentQuizHistoryListResponseDto).total).toBe(0);
  });

  // ============================================================================
  // Test 7: Student views SUBMITTED attempt detail (M7.5-B)
  // ============================================================================
  it("Test 7: Student views SUBMITTED attempt detail returns full questions review with options, student selection, correct answer and explanation", async () => {
    const res = await request(server)
      .get(`/api/v1/portal/quiz/history/${student1Attempt1Id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const detail = res.body.data as StudentQuizHistoryDetailDto;
    expect(detail.id).toBe(student1Attempt1Id);
    expect(detail.status).toBe("SUBMITTED");
    expect(detail.scorePercent).toBe(100);
    expect(detail.passed).toBe(true);
    expect(detail.awardedXp).toBe(40);

    expect(detail.results).toBeDefined();
    expect(detail.results).toHaveLength(2);

    const q1Review = detail.results![0];
    expect(q1Review.questionText).toBe("HTML viết tắt của cụm từ nào?");
    expect(q1Review.options).toHaveLength(4);
    expect(q1Review.selectedOptionIndex).toBe(0);
    expect(q1Review.correctOptionIndex).toBe(0);
    expect(q1Review.isCorrect).toBe(true);
    expect(q1Review.explanation).toBe("HTML là Hyper Text Markup Language.");
  });

  // ============================================================================
  // Test 8: Zero-Leak Invariant on EXPIRED attempt
  // ============================================================================
  it("Test 8: Zero-Leak Invariant: Student viewing EXPIRED attempt detail returns results: [] and NEVER leaks correct answers or explanations", async () => {
    const res = await request(server)
      .get(`/api/v1/portal/quiz/history/${student1Attempt3Id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const detail = res.body.data as StudentQuizHistoryDetailDto;
    expect(detail.id).toBe(student1Attempt3Id);
    expect(detail.status).toBe("EXPIRED");
    expect(detail.results).toEqual([]);
    expect(detail.summary?.passed).toBe(false);
  });

  // ============================================================================
  // Test 9: Zero-Leak Invariant on IN_PROGRESS attempt
  // ============================================================================
  it("Test 9: Zero-Leak Invariant: Student viewing IN_PROGRESS attempt detail returns results: [] and NEVER leaks correct answers", async () => {
    const res = await request(server)
      .get(`/api/v1/portal/quiz/history/${student2AttemptBId}`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(200);

    const detail = res.body.data as StudentQuizHistoryDetailDto;
    expect(detail.id).toBe(student2AttemptBId);
    expect(detail.status).toBe("IN_PROGRESS");
    expect(detail.results).toEqual([]);
  });

  // ============================================================================
  // Test 10: IDOR Protection on Student Attempt Detail
  // ============================================================================
  it("Test 10: IDOR Protection: Student 2 attempting to view Student 1 attempt detail is rejected with 403 Forbidden", async () => {
    // Student 2 can view their own attempt successfully
    await request(server)
      .get(`/api/v1/portal/quiz/history/${student2Attempt1Id}`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(200);

    // Student 2 accessing Student 1's attempt is blocked
    const res = await request(server)
      .get(`/api/v1/portal/quiz/history/${student1Attempt1Id}`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(403);

    expect(res.body.code || res.body.error?.code).toBe("FORBIDDEN_ATTEMPT_OWNERSHIP");
  });

  // ============================================================================
  // Test 11: Idempotency & Zero XP on Read
  // ============================================================================
  it("Test 11: Zero XP on Read: Repeatedly viewing history or detail does NOT alter attempt status, score or XP claims", async () => {
    const claimsBefore = await prisma.quizXpClaim.count();
    const attemptsBefore = await prisma.quizConfigAttempt.findUniqueOrThrow({
      where: { id: student1Attempt1Id },
    });

    // Make 3 consecutive detail requests
    await request(server)
      .get(`/api/v1/portal/quiz/history/${student1Attempt1Id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);
    await request(server)
      .get(`/api/v1/portal/quiz/history/${student1Attempt1Id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);
    await request(server)
      .get("/api/v1/portal/quiz/history")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(200);

    const claimsAfter = await prisma.quizXpClaim.count();
    const attemptsAfter = await prisma.quizConfigAttempt.findUniqueOrThrow({
      where: { id: student1Attempt1Id },
    });

    expect(claimsAfter).toBe(claimsBefore);
    expect(attemptsAfter.awardedXp).toBe(attemptsBefore.awardedXp);
    expect(attemptsAfter.status).toBe(attemptsBefore.status);
    expect(attemptsAfter.scorePercent).toBe(attemptsBefore.scorePercent);
  });

  // ============================================================================
  // Test 12: Admin queries quiz results with pagination (M7.5-C)
  // ============================================================================
  it("Test 12: Admin queries quiz results with pagination returns all campus attempts with student profiles", async () => {
    const res = await request(server)
      .get("/api/v1/admin/quiz-configs/results?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const data = res.body.data as AdminQuizResultListResponseDto;
    expect(data.total).toBe(5); // 3 of s1 + 2 of s2
    expect(data.items).toHaveLength(5);

    const first = data.items[0];
    expect(first.student).toBeDefined();
    expect(first.student.id).toBeDefined();
    expect(first.student.fullName).toBeDefined();
    expect(first.student.email).toBeDefined();
    expect(first.quizTitle).toBeDefined();
  });

  // ============================================================================
  // Test 13: Admin search by student (name, email, studentCode)
  // ============================================================================
  it("Test 13: Admin search by student (studentCode PS67890) returns only Student 2 attempts", async () => {
    const res = await request(server)
      .get("/api/v1/admin/quiz-configs/results?search=PS67890")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const data = res.body.data as AdminQuizResultListResponseDto;
    expect(data.total).toBe(2);
    expect(data.items.every((i) => i.student.id === student2User.id)).toBe(true);
  });

  // ============================================================================
  // Test 14: Admin filter by passed=true
  // ============================================================================
  it("Test 14: Admin filter by passed=true returns only passed attempts across campus", async () => {
    const res = await request(server)
      .get("/api/v1/admin/quiz-configs/results?passed=true")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const data = res.body.data as AdminQuizResultListResponseDto;
    expect(data.total).toBe(2); // Student 1 Attempt 1 and Attempt 2
    expect(data.items.every((i) => i.passed === true)).toBe(true);
  });

  // ============================================================================
  // Test 15: Admin sorting by scorePercent desc
  // ============================================================================
  it("Test 15: Admin sorting by scorePercent desc orders highest score first", async () => {
    const res = await request(server)
      .get("/api/v1/admin/quiz-configs/results?status=SUBMITTED&sortBy=scorePercent&sortOrder=desc")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const data = res.body.data as AdminQuizResultListResponseDto;
    expect(data.total).toBe(3); // 100%, 50%, 0%
    const scores = data.items.map((i) => i.scorePercent ?? 0);
    expect(scores).toEqual([100, 50, 0]);
  });

  // ============================================================================
  // Test 16: Admin summary KPI metrics (M7.5-C)
  // ============================================================================
  it("Test 16: Admin summary KPI metrics computes accurate aggregate counts and pass rate", async () => {
    const res = await request(server)
      .get(`/api/v1/admin/quiz-configs/results/summary?quizConfigId=${quizConfigAId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const summary = res.body.data as AdminQuizResultSummaryDto;
    expect(summary.totalAttempts).toBe(4); // 3 of S1 + 1 of S2 on Quiz A
    expect(summary.totalSubmitted).toBe(3); // att1, att2 of S1 + s2Att1
    expect(summary.totalPassed).toBe(2); // att1, att2 of S1
    expect(summary.totalFailed).toBe(1); // s2Att1
    expect(summary.passRatePercent).toBe(67); // round(2/3 * 100) = 67
    expect(summary.uniqueStudentsCount).toBe(2); // S1 and S2
    expect(summary.totalAwardedXp).toBe(40); // 40 XP from S1 Att1, 0 from others
  });

  // ============================================================================
  // Test 17: Admin view attempt detail (M7.5-C)
  // ============================================================================
  it("Test 17: Admin view attempt detail returns complete question answers and explanation for admin review", async () => {
    const res = await request(server)
      .get(`/api/v1/admin/quiz-configs/results/${student1Attempt2Id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const detail = res.body.data as AdminQuizResultDetailDto;
    expect(detail.id).toBe(student1Attempt2Id);
    expect(detail.student.id).toBe(student1User.id);
    expect(detail.attemptNumber).toBe(2);
    expect(detail.isRetake).toBe(true);
    expect(detail.scorePercent).toBe(50);
    expect(detail.awardedXp).toBe(0);
    expect(detail.results).toHaveLength(2);

    const wrongQ = detail.results[1];
    expect(wrongQ.selectedOptionIndex).toBe(3);
    expect(wrongQ.correctOptionIndex).toBe(1);
    expect(wrongQ.isCorrect).toBe(false);
    expect(wrongQ.explanation).toBe("CSS viết tắt của Cascading Style Sheets, dùng định kiểu giao diện.");
  });

  // ============================================================================
  // Test 18: Admin student retake history endpoint (M7.5-C)
  // ============================================================================
  it("Test 18: Admin student retake history endpoint returns all attempts for user and quiz in ascending order", async () => {
    const res = await request(server)
      .get(`/api/v1/admin/quiz-configs/results/students/${student1User.id}/quizzes/${quizConfigAId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const history = res.body.data as AdminQuizResultItemDto[];
    expect(history).toHaveLength(3);
    expect(history[0].attemptNumber).toBe(1);
    expect(history[0].awardedXp).toBe(40);
    expect(history[0].isRetake).toBe(false);

    expect(history[1].attemptNumber).toBe(2);
    expect(history[1].awardedXp).toBe(0);
    expect(history[1].isRetake).toBe(true);

    expect(history[2].attemptNumber).toBe(3);
    expect(history[2].status).toBe("EXPIRED");
  });

  // ============================================================================
  // Test 19: RBAC: Non-admin calling admin results is rejected with 403 Forbidden
  // ============================================================================
  it("Test 19: RBAC: Student calling admin results endpoints is rejected with 403 Forbidden", async () => {
    await request(server)
      .get("/api/v1/admin/quiz-configs/results")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(403);

    await request(server)
      .get("/api/v1/admin/quiz-configs/results/summary")
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(403);

    await request(server)
      .get(`/api/v1/admin/quiz-configs/results/${student1Attempt1Id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .expect(403);
  });

  // ============================================================================
  // Test 20: RBAC: Non-student calling portal quiz history is rejected with 403
  // ============================================================================
  it("Test 20: RBAC: Parent calling portal quiz history is rejected with 403 Forbidden (FORBIDDEN_STUDENT_ONLY)", async () => {
    const res = await request(server)
      .get("/api/v1/portal/quiz/history")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(403);

    expect(res.body.code || res.body.error?.code).toBe("FORBIDDEN_STUDENT_ONLY");
  });
});

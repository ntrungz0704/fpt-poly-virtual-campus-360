import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import type { SubmitQuizAttemptResponseDto } from "@fpt-campus/shared";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Quiz Submission, Scoring & XP Integration Suite (M7.4)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let studentToken = "";
  let studentUser: { id: string; username: string | null };
  let student2Token = "";
  let student2User: { id: string; username: string | null };
  let parentToken = "";
  let _adminToken = "";

  let _testEventId = "";
  let generalPublishedQuizId = "";
  let threeQuestionQuizId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("quiz_submit_m74");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-QuizSubmit-M74-2026!";
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

    _adminToken = adminLoginRes.body.data.accessToken;
    const passwordHash = adminLoginRes.body.data.user?.passwordHash || "some-hash";
    const jwtService = ctx.app.get(JwtService);

    // 2. Create Student 1
    const s1 = await prisma.user.create({
      data: {
        username: "student_submit_m74_1",
        fullName: "Sinh Viên Nộp Bài 1",
        email: "student_submit_1@poly.edu.vn",
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
      jti: "test-jti-student-m74-1",
    });

    // 3. Create Student 2
    const s2 = await prisma.user.create({
      data: {
        username: "student_submit_m74_2",
        fullName: "Sinh Viên Nộp Bài 2",
        email: "student_submit_2@poly.edu.vn",
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
      pwdRequired: false,
      jti: "test-jti-student-m74-2",
    });

    // 4. Create Parent User
    const p1 = await prisma.user.create({
      data: {
        username: "parent_user_m74",
        fullName: "Phụ Huynh M74",
        email: "parent_m74@poly.edu.vn",
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
      jti: "test-jti-parent-m74",
    });

    // 5. Seed Test Event
    const campus = await prisma.campus.findFirstOrThrow();
    const event = await prisma.openDayEvent.create({
      data: {
        campusId: campus.id,
        eventKey: "openday-m74-submit",
        title: "Sự Kiện Open Day Thi Thử M74",
        dateLabel: "26/12/2026",
        timeLabel: "08:00 - 17:00",
        status: "PUBLISHED",
      },
    });
    _testEventId = event.id;

    // 6. Seed General Published Quiz with 2 Questions (passingScore = 70)
    const genQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài Thi Khảo Sát Kiến Thức M74 (2 câu)",
        description: "M74 Standard Quiz",
        timeLimitMinutes: 15,
        passingScore: 70,
        maxAttempts: 3,
        isShuffleQuestions: false,
        isShuffleOptions: false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    generalPublishedQuizId = genQuiz.id;

    await prisma.quizConfigQuestion.create({
      data: {
        quizConfigId: genQuiz.id,
        sortOrder: 1,
        questionText: "HTML là viết tắt của cụm từ nào?",
        optionsJson: [
          "HyperText Markup Language",
          "HighText Machine Language",
          "HyperTransfer Mode Language",
          "Home Tool Markup Language",
        ],
        correctIndex: 0,
        explanation: "HTML là ngôn ngữ đánh dấu siêu văn bản.",
        topic: "Web Dev",
        difficulty: "EASY",
      },
    });

    await prisma.quizConfigQuestion.create({
      data: {
        quizConfigId: genQuiz.id,
        sortOrder: 2,
        questionText: "Thủ đô của Việt Nam là thành phố nào?",
        optionsJson: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ"],
        correctIndex: 1,
        explanation: "Hà Nội là thủ đô của nước CHXHCN Việt Nam.",
        topic: "Địa lý",
        difficulty: "EASY",
      },
    });

    // 7. Seed Quiz with 3 Questions for Rounding & Boundary Testing (passingScore = 70)
    const threeQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài Thi Làm Tròn Điểm M74 (3 câu)",
        description: "3 questions quiz for rounding tests",
        timeLimitMinutes: 10,
        passingScore: 70,
        maxAttempts: 3,
        isShuffleQuestions: false,
        isShuffleOptions: false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    threeQuestionQuizId = threeQuiz.id;

    for (let i = 1; i <= 3; i++) {
      await prisma.quizConfigQuestion.create({
        data: {
          quizConfigId: threeQuiz.id,
          sortOrder: i,
          questionText: `Câu hỏi số ${i}?`,
          optionsJson: ["Đáp án 0", "Đáp án 1", "Đáp án 2", "Đáp án 3"],
          correctIndex: 0,
          explanation: `Giải thích câu ${i}`,
          topic: "Toán",
          difficulty: "MEDIUM",
        },
      });
    }
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.app.close();
    }
    if (dbHandle) {
      await dbHandle.drop();
    }
  });

  // ============================================================================
  // Test 1: Authentication & Role Authorization
  // ============================================================================
  it("Test 1 [Auth & Role]: Rejects unauthenticated request (401) and non-student role (403)", async () => {
    // Unauthenticated
    await request(server)
      .post("/api/v1/portal/quiz/attempts/00000000-0000-0000-0000-000000000000/submit")
      .expect(401);

    // Non-student role (PARENT)
    await request(server)
      .post("/api/v1/portal/quiz/attempts/00000000-0000-0000-0000-000000000000/submit")
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(403);
  });

  // ============================================================================
  // Test 2: Attempt Ownership & IDOR Protection
  // ============================================================================
  it("Test 2 [Ownership & IDOR Protection]: Student B cannot submit Student A's attempt (403)", async () => {
    // Create attempt for Student 1
    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const attemptId = startRes.body.data.id;

    // Student 2 tries to submit Student 1's attempt
    const res = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(403);

    expect(res.body.error?.code || res.body.code).toBe("FORBIDDEN_ATTEMPT_OWNERSHIP");
  });

  // ============================================================================
  // Test 3: Expiry & Status Guard
  // ============================================================================
  it("Test 3 [Expiry & Status Guard]: Rejects expired attempt (400) and updates DB status to EXPIRED", async () => {
    // Create an expired attempt directly in DB
    const expiredAttempt = await prisma.quizConfigAttempt.create({
      data: {
        userId: studentUser.id,
        quizConfigId: generalPublishedQuizId,
        attemptNumber: 99,
        status: "IN_PROGRESS",
        startedAt: new Date(Date.now() - 3600_000),
        expiresAt: new Date(Date.now() - 1000), // Expired 1 sec ago
      },
    });

    const res = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${expiredAttempt.id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(400);

    const msg = res.body.error?.message || res.body.message || "";
    expect(msg).toContain("hết thời gian");

    // Verify DB updated to EXPIRED
    const checkDb = await prisma.quizConfigAttempt.findUniqueOrThrow({
      where: { id: expiredAttempt.id },
    });
    expect(checkDb.status).toBe("EXPIRED");
  });

  // ============================================================================
  // Test 4: Perfect 100% Score & First XP Award
  // ============================================================================
  it("Test 4 [Perfect Score & First XP]: Scores 100%, passes quiz, awards base + bonus XP, and creates XpLedger", async () => {
    // Start attempt for Student 2 (who hasn't taken generalPublishedQuizId yet)
    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(201);

    const attemptId = startRes.body.data.id;
    const questions = startRes.body.data.questions;

    // Answer both questions correctly:
    // Q1: correctIndex = 0.
    // Q2: correctIndex = 1.
    const q1 = await prisma.quizConfigQuestion.findUniqueOrThrow({ where: { id: questions[0].id } });
    const q2 = await prisma.quizConfigQuestion.findUniqueOrThrow({ where: { id: questions[1].id } });

    const ans1 = await prisma.quizConfigAttemptAnswer.findUniqueOrThrow({
      where: { attemptId_quizConfigQuestionId: { attemptId, quizConfigQuestionId: q1.id } },
    });
    const ans2 = await prisma.quizConfigAttemptAnswer.findUniqueOrThrow({
      where: { attemptId_quizConfigQuestionId: { attemptId, quizConfigQuestionId: q2.id } },
    });

    const order1 = ans1.optionOrderJson as number[];
    const order2 = ans2.optionOrderJson as number[];

    // Save answers
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${attemptId}/progress`)
      .set("Authorization", `Bearer ${student2Token}`)
      .send({
        answers: [
          { quizConfigQuestionId: q1.id, selectedOptionIndex: order1.indexOf(q1.correctIndex) },
          { quizConfigQuestionId: q2.id, selectedOptionIndex: order2.indexOf(q2.correctIndex) },
        ],
      })
      .expect(200);

    // Submit attempt
    const submitRes = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(201);

    const body: SubmitQuizAttemptResponseDto = submitRes.body.data;
    expect(body.status).toBe("SUBMITTED");
    expect(body.summary.totalQuestions).toBe(2);
    expect(body.summary.answeredCount).toBe(2);
    expect(body.summary.correctCount).toBe(2);
    expect(body.summary.scorePercent).toBe(100);
    expect(body.summary.passed).toBe(true);

    // XP: 2 correct * 10 = 20 base + 20 bonus = 40 XP
    expect(body.xp.baseXp).toBe(20);
    expect(body.xp.bonusXp).toBe(20);
    expect(body.xp.awardedXp).toBe(40);
    expect(body.xp.isXpAwarded).toBe(true);
    expect(body.xp.reason).toBe("FIRST_QUIZ_SUBMISSION");

    // Results array
    expect(body.results.length).toBe(2);
    expect(body.results.every((r) => r.isCorrect)).toBe(true);

    // Verify DB XpLedger
    const ledger = await prisma.xpLedger.findUnique({
      where: { idempotencyKey: `quiz:first-submit:${student2User.id}:${generalPublishedQuizId}` },
    });
    expect(ledger).not.toBeNull();
    expect(ledger?.amountXp).toBe(40);
    expect(ledger?.source).toBe("QUIZ_CONFIG_FIRST_SUBMIT");

    // Verify DB QuizConfigAttempt
    const dbAttempt = await prisma.quizConfigAttempt.findUniqueOrThrow({
      where: { id: attemptId },
    });
    expect(dbAttempt.status).toBe("SUBMITTED");
    expect(dbAttempt.scorePercent).toBe(100);
    expect(dbAttempt.passed).toBe(true);
    expect(dbAttempt.awardedXp).toBe(40);
  });

  // ============================================================================
  // Test 5: Zero Score & Omitted Questions
  // ============================================================================
  it("Test 5 [Zero Score & Omitted]: Omitted questions count as incorrect, score is 0, bonus is 0, 0 XP awarded", async () => {
    // Create new student for isolated test
    const sZero = await prisma.user.create({
      data: {
        username: "student_zero_m74",
        fullName: "Sinh Viên 0 Điểm",
        email: "student_zero@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
      },
    });
    const jwtService = ctx.app.get(JwtService);
    const zeroToken = jwtService.sign({
      sub: sZero.id,
      username: sZero.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-zero",
    });

    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${zeroToken}`)
      .expect(201);

    const attemptId = startRes.body.data.id;

    // Do NOT answer any question (omitted)
    const submitRes = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${zeroToken}`)
      .expect(201);

    const body: SubmitQuizAttemptResponseDto = submitRes.body.data;
    expect(body.status).toBe("SUBMITTED");
    expect(body.summary.totalQuestions).toBe(2);
    expect(body.summary.answeredCount).toBe(0);
    expect(body.summary.correctCount).toBe(0);
    expect(body.summary.scorePercent).toBe(0);
    expect(body.summary.passed).toBe(false);

    expect(body.xp.baseXp).toBe(0);
    expect(body.xp.bonusXp).toBe(0);
    expect(body.xp.awardedXp).toBe(0);
    expect(body.xp.isXpAwarded).toBe(false);

    // No ledger created because 0 XP
    const ledger = await prisma.xpLedger.findUnique({
      where: { idempotencyKey: `quiz:first-submit:${sZero.id}:${generalPublishedQuizId}` },
    });
    expect(ledger).toBeNull();
  });

  // ============================================================================
  // Test 6: Passing Boundary & Mathematical Rounding
  // ============================================================================
  it("Test 6 [Boundary & Rounding]: 2/3 correct rounds to 67%, below 70% threshold -> FAIL, awards 20 base XP and 0 bonus XP", async () => {
    // Quiz with 3 questions, passingScore = 70
    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${threeQuestionQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const attemptId = startRes.body.data.id;
    const questions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: threeQuestionQuizId },
      orderBy: { sortOrder: "asc" },
    });

    // Answer Q1 correct, Q2 correct, Q3 wrong (option 1 instead of correct 0)
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${attemptId}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [
          { quizConfigQuestionId: questions[0].id, selectedOptionIndex: 0 },
          { quizConfigQuestionId: questions[1].id, selectedOptionIndex: 0 },
          { quizConfigQuestionId: questions[2].id, selectedOptionIndex: 1 },
        ],
      })
      .expect(200);

    const submitRes = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const body: SubmitQuizAttemptResponseDto = submitRes.body.data;
    // 2 / 3 = 66.666...% -> round(66.666) = 67%
    expect(body.summary.correctCount).toBe(2);
    expect(body.summary.totalQuestions).toBe(3);
    expect(body.summary.scorePercent).toBe(67);
    expect(body.summary.passingScore).toBe(70);
    expect(body.summary.passed).toBe(false); // 67 < 70 -> FAIL

    // Base XP: 2 * 10 = 20, Bonus XP = 0 (failed)
    expect(body.xp.baseXp).toBe(20);
    expect(body.xp.bonusXp).toBe(0);
    expect(body.xp.awardedXp).toBe(20);
    expect(body.xp.isXpAwarded).toBe(true);

    // Verify DB
    const ledger = await prisma.xpLedger.findUnique({
      where: { idempotencyKey: `quiz:first-submit:${studentUser.id}:${threeQuestionQuizId}` },
    });
    expect(ledger?.amountXp).toBe(20);
  });

  // ============================================================================
  // Test 7: Shuffled Options Mapping Accuracy
  // ============================================================================
  it("Test 7 [Shuffle Mapping]: Correctly scores question when option order is shuffled", async () => {
    // Create a quiz with shuffle options enabled
    const shuffleQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài Thi Xáo Trộn Đáp Án M74",
        timeLimitMinutes: 10,
        passingScore: 50,
        maxAttempts: 3,
        isShuffleOptions: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    const q = await prisma.quizConfigQuestion.create({
      data: {
        quizConfigId: shuffleQuiz.id,
        sortOrder: 1,
        questionText: "1 + 1 = ?",
        optionsJson: ["0", "1", "2", "3"], // index 2 is correct ("2")
        correctIndex: 2,
        explanation: "1 + 1 = 2",
        topic: "Toán",
        difficulty: "EASY",
      },
    });

    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${shuffleQuiz.id}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const attemptId = startRes.body.data.id;

    // Check displayed order in DB
    const answerRow = await prisma.quizConfigAttemptAnswer.findUniqueOrThrow({
      where: { attemptId_quizConfigQuestionId: { attemptId, quizConfigQuestionId: q.id } },
    });
    const optionOrder = answerRow.optionOrderJson as number[];
    const displayedIndexOfCorrectOption = optionOrder.indexOf(2);

    // Select the correct option in displayed order
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${attemptId}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [{ quizConfigQuestionId: q.id, selectedOptionIndex: displayedIndexOfCorrectOption }],
      })
      .expect(200);

    const submitRes = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    expect(submitRes.body.data.summary.correctCount).toBe(1);
    expect(submitRes.body.data.summary.scorePercent).toBe(100);
    expect(submitRes.body.data.summary.passed).toBe(true);
    expect(submitRes.body.data.results[0].isCorrect).toBe(true);
    expect(submitRes.body.data.results[0].correctOptionIndex).toBe(displayedIndexOfCorrectOption);
  });

  // ============================================================================
  // Test 8: One-Time XP Award Policy (Retake Gets 0 XP)
  // ============================================================================
  it("Test 8 [One-Time XP]: Retake attempt is scored and saved as SUBMITTED, but awards 0 XP", async () => {
    // Student 2 already received XP for generalPublishedQuizId in Test 4.
    // Start attempt 2 for Student 2
    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(201);

    const attemptId = startRes.body.data.id;
    expect(startRes.body.data.attemptNumber).toBe(2);

    // Answer both correctly
    const questions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: generalPublishedQuizId },
      orderBy: { sortOrder: "asc" },
    });

    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${attemptId}/progress`)
      .set("Authorization", `Bearer ${student2Token}`)
      .send({
        answers: [
          { quizConfigQuestionId: questions[0].id, selectedOptionIndex: 0 },
          { quizConfigQuestionId: questions[1].id, selectedOptionIndex: 1 },
        ],
      })
      .expect(200);

    const submitRes = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(201);

    const body: SubmitQuizAttemptResponseDto = submitRes.body.data;
    expect(body.status).toBe("SUBMITTED");
    expect(body.summary.scorePercent).toBe(100);
    expect(body.summary.passed).toBe(true);

    // CRITICAL: awardedXp must be 0 for retake!
    expect(body.xp.awardedXp).toBe(0);
    expect(body.xp.isXpAwarded).toBe(false);
    expect(body.xp.reason).toBe("ALREADY_AWARDED_OR_RETAKE");

    // Total XpLedger entries for Student 2 on this quiz remains exactly 1!
    const ledgers = await prisma.xpLedger.findMany({
      where: {
        userId: student2User.id,
        referenceId: generalPublishedQuizId,
      },
    });
    expect(ledgers.length).toBe(1);
  });

  // ============================================================================
  // Test 9: Idempotent Repeat Submit
  // ============================================================================
  it("Test 9 [Idempotency]: Submitting an already SUBMITTED attempt returns saved result with HTTP 200 without creating extra XP", async () => {
    const activeAttempt = await prisma.quizConfigAttempt.findFirstOrThrow({
      where: { userId: student2User.id, quizConfigId: generalPublishedQuizId, status: "SUBMITTED" },
    });

    const res1 = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/submit`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(200);

    const res2 = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/submit`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(200);

    expect(res1.body.data.attemptId).toBe(activeAttempt.id);
    expect(res2.body.data.attemptId).toBe(activeAttempt.id);
    expect(res1.body.data.summary.scorePercent).toBe(res2.body.data.summary.scorePercent);
  });

  // ============================================================================
  // Test 10: Concurrency - 10 Parallel Submits for Same Attempt
  // ============================================================================
  it("Test 10 [Concurrency Same Attempt]: 10 concurrent submits on same attempt all succeed without duplicate ledger records", async () => {
    // Create new student and attempt
    const sConc = await prisma.user.create({
      data: {
        username: "student_conc_m74",
        fullName: "Sinh Viên Đồng Thời M74",
        email: "student_conc@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
      },
    });
    const jwtService = ctx.app.get(JwtService);
    const concToken = jwtService.sign({
      sub: sConc.id,
      username: sConc.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-conc",
    });

    const startRes = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${concToken}`)
      .expect(201);

    const attemptId = startRes.body.data.id;

    // Answer both questions correctly so attempt qualifies for XP award
    const questions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: generalPublishedQuizId },
      orderBy: { sortOrder: "asc" },
    });
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${attemptId}/progress`)
      .set("Authorization", `Bearer ${concToken}`)
      .send({
        answers: [
          { quizConfigQuestionId: questions[0].id, selectedOptionIndex: 0 },
          { quizConfigQuestionId: questions[1].id, selectedOptionIndex: 1 },
        ],
      })
      .expect(200);

    // Fire 10 concurrent submits
    const promises = Array.from({ length: 10 }).map(() =>
      request(server)
        .post(`/api/v1/portal/quiz/attempts/${attemptId}/submit`)
        .set("Authorization", `Bearer ${concToken}`)
    );

    const results = await Promise.all(promises);

    // All should return either 200 or 201 (none 500)
    for (const res of results) {
      expect([200, 201]).toContain(res.status);
    }

    // Exactly 1 XpLedger record created in PostgreSQL
    const ledgers = await prisma.xpLedger.findMany({
      where: { userId: sConc.id, referenceId: generalPublishedQuizId },
    });
    expect(ledgers.length).toBe(1);

    // Attempt status is SUBMITTED
    const dbAttempt = await prisma.quizConfigAttempt.findUniqueOrThrow({
      where: { id: attemptId },
    });
    expect(dbAttempt.status).toBe("SUBMITTED");
  });

  // ============================================================================
  // Test 11: Concurrency - 2 Different Attempts for Same Student Submit Simultaneously
  // ============================================================================
  it("Test 11 [Concurrency 2 Attempts Same Student]: Unique idempotency key ensures exactly ONE attempt receives XP", async () => {
    const sDual = await prisma.user.create({
      data: {
        username: "student_dual_m74",
        fullName: "Sinh Viên Hai Lượt M74",
        email: "student_dual@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
      },
    });
    const jwtService = ctx.app.get(JwtService);
    const dualToken = jwtService.sign({
      sub: sDual.id,
      username: sDual.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-dual",
    });

    // Create Attempt 1
    const att1 = await prisma.quizConfigAttempt.create({
      data: {
        userId: sDual.id,
        quizConfigId: generalPublishedQuizId,
        attemptNumber: 1,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 600_000),
      },
    });

    // Create Attempt 2
    const att2 = await prisma.quizConfigAttempt.create({
      data: {
        userId: sDual.id,
        quizConfigId: generalPublishedQuizId,
        attemptNumber: 2,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 600_000),
      },
    });

    // Seed questions for both
    const questions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: generalPublishedQuizId },
    });

    for (const att of [att1, att2]) {
      for (let i = 0; i < questions.length; i++) {
        await prisma.quizConfigAttemptAnswer.create({
          data: {
            attemptId: att.id,
            quizConfigQuestionId: questions[i].id,
            displayedOrder: i + 1,
            optionOrderJson: [0, 1, 2, 3],
            selectedOptionIndex: questions[i].correctIndex, // Correct answers
          },
        });
      }
    }

    // Submit both simultaneously
    const [res1, res2] = await Promise.all([
      request(server)
        .post(`/api/v1/portal/quiz/attempts/${att1.id}/submit`)
        .set("Authorization", `Bearer ${dualToken}`),
      request(server)
        .post(`/api/v1/portal/quiz/attempts/${att2.id}/submit`)
        .set("Authorization", `Bearer ${dualToken}`),
    ]);

    expect([200, 201]).toContain(res1.status);
    expect([200, 201]).toContain(res2.status);

    const xp1 = res1.body.data?.xp?.awardedXp ?? 0;
    const xp2 = res2.body.data?.xp?.awardedXp ?? 0;

    // Exactly one must have received XP (40), the other must have received 0!
    expect(xp1 + xp2).toBe(40);
    expect(Math.min(xp1, xp2)).toBe(0);
    expect(Math.max(xp1, xp2)).toBe(40);

    // Exactly 1 XpLedger row exists in PostgreSQL
    const ledgers = await prisma.xpLedger.findMany({
      where: { userId: sDual.id, referenceId: generalPublishedQuizId },
    });
    expect(ledgers.length).toBe(1);
    expect(ledgers[0].amountXp).toBe(40);
  });

  // ============================================================================
  // Test 12: Submit vs Expiry Row Lock Contention
  // ============================================================================
  it("Test 12 [Submit Lock Contention on Expiry]: Submit request waiting on lock past expiresAt is rejected with 400 and committed as EXPIRED", async () => {
    const expiringAttempt = await prisma.quizConfigAttempt.create({
      data: {
        userId: studentUser.id,
        quizConfigId: generalPublishedQuizId,
        attemptNumber: 120,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 1200),
      },
    });

    let releaseHoldingLock!: () => void;
    const lockWaitPromise = new Promise<void>((resolve) => {
      releaseHoldingLock = resolve;
    });

    let lockAcquiredSignal!: () => void;
    const lockAcquiredPromise = new Promise<void>((resolve) => {
      lockAcquiredSignal = resolve;
    });

    const holdingTxPromise = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM quiz_config_attempts WHERE id = ${expiringAttempt.id}::uuid FOR UPDATE`;
      lockAcquiredSignal();
      await lockWaitPromise;
    });

    try {
      await lockAcquiredPromise;
      expect(Date.now()).toBeLessThan(expiringAttempt.expiresAt.getTime());

      let requestCompleted = false;
      const inFlightSubmitPromise = request(server)
        .post(`/api/v1/portal/quiz/attempts/${expiringAttempt.id}/submit`)
        .set("Authorization", `Bearer ${studentToken}`)
        .then(
          (res) => {
            requestCompleted = true;
            return res;
          },
          (err: unknown) => {
            requestCompleted = true;
            throw err;
          },
        );

      // Verify lock contention in pg_stat_activity
      let lockWaitingDetected = false;
      const pollStart = Date.now();
      while (Date.now() - pollStart < 3000) {
        const waitingRows = await prisma.$queryRaw<
          Array<{ pid: number; wait_event_type: string | null; wait_event: string | null; query: string | null }>
        >`
          SELECT pid, wait_event_type, wait_event, query
          FROM pg_stat_activity
          WHERE wait_event_type = 'Lock'
            AND query ILIKE '%quiz_config_attempts%'
            AND query ILIKE '%FOR UPDATE%'
        `;
        if (waitingRows.length > 0) {
          lockWaitingDetected = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 20));
      }

      expect(lockWaitingDetected).toBe(true);
      expect(requestCompleted).toBe(false);

      // Advance past expiresAt
      while (Date.now() <= expiringAttempt.expiresAt.getTime() + 100) {
        await new Promise((r) => setTimeout(r, 25));
      }

      // Release holding lock
      releaseHoldingLock();
      await holdingTxPromise;

      const submitRes = await inFlightSubmitPromise;
      expect(submitRes.status).toBe(400);
      expect(submitRes.body.error?.message || submitRes.body.message).toContain("hết thời gian");

      // Verify status committed as EXPIRED
      const checkDb = await prisma.quizConfigAttempt.findUniqueOrThrow({
        where: { id: expiringAttempt.id },
      });
      expect(checkDb.status).toBe("EXPIRED");
    } finally {
      releaseHoldingLock?.();
      await holdingTxPromise.catch(() => {});
    }
  });

  // ============================================================================
  // Test 13: Zero Sensitive Data Leakage & Client Payload Tampering Resistance
  // ============================================================================
  it("Test 13 [Zero Leakage & Tamper Resistance]: Ignores client payload attempting to inject score/answers", async () => {
    const attempt = await prisma.quizConfigAttempt.create({
      data: {
        userId: studentUser.id,
        quizConfigId: generalPublishedQuizId,
        attemptNumber: 130,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 600_000),
      },
    });

    const questions = await prisma.quizConfigQuestion.findMany({
      where: { quizConfigId: generalPublishedQuizId },
    });

    for (let i = 0; i < questions.length; i++) {
      await prisma.quizConfigAttemptAnswer.create({
        data: {
          attemptId: attempt.id,
          quizConfigQuestionId: questions[i].id,
          displayedOrder: i + 1,
          optionOrderJson: [0, 1, 2, 3],
          selectedOptionIndex: 3, // Wrong answers
        },
      });
    }

    // Client tries to spoof 100% score and 999 XP in body
    const submitRes = await request(server)
      .post(`/api/v1/portal/quiz/attempts/${attempt.id}/submit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        scorePercent: 100,
        correctCount: 2,
        awardedXp: 999,
        passed: true,
      })
      .expect(201);

    // Server-side scoring must ignore client payload completely!
    const submitBody: SubmitQuizAttemptResponseDto = submitRes.body.data;
    expect(submitBody.summary.scorePercent).toBe(0);
    expect(submitBody.summary.correctCount).toBe(0);
    expect(submitBody.summary.passed).toBe(false);
    expect(submitBody.xp.awardedXp).toBe(0);
  });
});

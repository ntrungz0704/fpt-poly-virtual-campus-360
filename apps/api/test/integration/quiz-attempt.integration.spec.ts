import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import type {
  PortalQuizAttemptDto,
  SaveQuizProgressResponseDto,
} from "@fpt-campus/shared";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Quiz Attempt Integration Suite (M7.3)", () => {
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

  let testEventId = "";
  let generalPublishedQuizId = "";
  let eventPublishedQuizId = "";
  let draftQuizId = "";
  let archivedQuizId = "";
  let softDeletedQuizId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("quiz_attempt_m73");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-QuizAttempt-M73-2026!";
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
        username: "student_eligible_m73",
        fullName: "Sinh Viên Hợp Lệ M73",
        email: "student_eligible_m73@poly.edu.vn",
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
      jti: "test-jti-student-m73-1",
    });

    // 3. Create Student 2 (Unregistered)
    const s2 = await prisma.user.create({
      data: {
        username: "student_unregistered_m73",
        fullName: "Sinh Viên Chưa ĐK M73",
        email: "student_unregistered_m73@poly.edu.vn",
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
      jti: "test-jti-student-m73-2",
    });

    // 4. Create Parent User
    const p1 = await prisma.user.create({
      data: {
        username: "parent_user_m73",
        fullName: "Phụ Huynh M73",
        email: "parent_m73@gmail.com",
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
      jti: "test-jti-parent-m73",
    });

    // 5. Seed Campus & Event
    const campus = await prisma.campus.findFirstOrThrow();
    const event = await prisma.openDayEvent.create({
      data: {
        campusId: campus.id,
        eventKey: "openday-m73-attempt",
        title: "Open Day Tech Fest 2026 M73",
        dateLabel: "25/12/2026",
        timeLabel: "08:00 - 17:00",
        status: "PUBLISHED",
      },
    });
    testEventId = event.id;

    // Register Student 1 for event (CONFIRMED)
    await prisma.eventParticipation.create({
      data: {
        userId: studentUser.id,
        eventId: testEventId,
        ticketCode: "TICKET-ELIGIBLE-M73",
        participationStatus: "CONFIRMED",
      },
    });

    // 6. Create QuestionBank Items
    const q1 = await prisma.questionBankItem.create({
      data: {
        questionText: "Next.js là framework dựa trên thư viện nào?",
        optionsJson: ["React", "Vue", "Angular", "Svelte"],
        correctIndex: 0,
        explanation: "Next.js là React framework cho fullstack web.",
        topic: "Web Development",
        difficulty: "EASY",
        status: "APPROVED",
        createdById: s1.id,
      },
    });
    const q2 = await prisma.questionBankItem.create({
      data: {
        questionText: "Prisma là gì trong hệ sinh thái Node.js/TypeScript?",
        optionsJson: ["Database ORM", "CSS Framework", "Web Server", "Testing Tool"],
        correctIndex: 0,
        explanation: "Prisma là thế hệ ORM mới cho TypeScript.",
        topic: "Database",
        difficulty: "MEDIUM",
        status: "APPROVED",
        createdById: s1.id,
      },
    });

    // 7. Create General Published Quiz (eventId == null, maxAttempts = 2, shuffle = true)
    const generalQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Khảo sát đầu vào Công nghệ Thông tin M73",
        description: "Bài thi khảo sát toàn trường",
        eventId: null,
        timeLimitMinutes: 10,
        passingScore: 60,
        maxAttempts: 2,
        isShuffleQuestions: true,
        isShuffleOptions: true,
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdById: s1.id,
        questions: {
          create: [
            {
              questionBankItemId: q1.id,
              sortOrder: 1,
              questionText: q1.questionText,
              optionsJson: q1.optionsJson as string[],
              correctIndex: q1.correctIndex,
              explanation: q1.explanation,
              topic: q1.topic,
              difficulty: q1.difficulty,
            },
            {
              questionBankItemId: q2.id,
              sortOrder: 2,
              questionText: q2.questionText,
              optionsJson: q2.optionsJson as string[],
              correctIndex: q2.correctIndex,
              explanation: q2.explanation,
              topic: q2.topic,
              difficulty: q2.difficulty,
            },
          ],
        },
      },
    });
    generalPublishedQuizId = generalQuiz.id;

    // 8. Create Event Published Quiz (maxAttempts = 3, timeLimit = 5)
    const eventQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Thử thách Open Day 2026 M73",
        description: "Dành riêng cho sinh viên tham gia sự kiện",
        eventId: testEventId,
        timeLimitMinutes: 5,
        passingScore: 80,
        maxAttempts: 3,
        isShuffleQuestions: false,
        isShuffleOptions: false,
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdById: s1.id,
        questions: {
          create: [
            {
              questionBankItemId: q1.id,
              sortOrder: 1,
              questionText: q1.questionText,
              optionsJson: q1.optionsJson as string[],
              correctIndex: q1.correctIndex,
              explanation: q1.explanation,
              topic: q1.topic,
              difficulty: q1.difficulty,
            },
          ],
        },
      },
    });
    eventPublishedQuizId = eventQuiz.id;

    // 9. DRAFT Quiz
    const draftQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi bản nháp M73",
        eventId: null,
        status: "DRAFT",
        createdById: s1.id,
      },
    });
    draftQuizId = draftQuiz.id;

    // 10. ARCHIVED Quiz
    const archivedQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi đã lưu trữ M73",
        eventId: null,
        status: "ARCHIVED",
        createdById: s1.id,
      },
    });
    archivedQuizId = archivedQuiz.id;

    // 11. Soft-deleted Quiz
    const softDeletedQuiz = await prisma.quizConfiguration.create({
      data: {
        title: "Bài thi đã xóa mềm M73",
        eventId: null,
        status: "PUBLISHED",
        deletedAt: new Date(),
        createdById: s1.id,
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
  // Test 1: Authentication & Authorization Security
  // ============================================================================
  it("Test 1 [Security]: Unauthenticated request is rejected (401)", async () => {
    await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .expect(401);
  });

  it("Test 2 [Security]: Non-student role (PARENT) is rejected (403)", async () => {
    const res = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${parentToken}`)
      .expect(403);

    const msg = res.body.error?.message || res.body.message || "";
    expect(msg).toContain("sinh viên (STUDENT)");
  });

  // ============================================================================
  // Test 3: Lifecycle Guard (Cannot start DRAFT, ARCHIVED, or Soft-Deleted Quiz)
  // ============================================================================
  it("Test 3 [Lifecycle Guard]: DRAFT, ARCHIVED, and Soft-deleted quizzes cannot be started (404)", async () => {
    // DRAFT
    await request(server)
      .post(`/api/v1/portal/quiz/${draftQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);

    // ARCHIVED
    await request(server)
      .post(`/api/v1/portal/quiz/${archivedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);

    // Soft-deleted
    await request(server)
      .post(`/api/v1/portal/quiz/${softDeletedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(404);
  });

  // ============================================================================
  // Test 4: Event Eligibility Guard
  // ============================================================================
  it("Test 4 [Event Eligibility]: Unregistered student cannot start event quiz (403)", async () => {
    const res = await request(server)
      .post(`/api/v1/portal/quiz/${eventPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(403);

    const msg = res.body.error?.message || res.body.message || "";
    expect(msg).toContain("đăng ký tham gia sự kiện");
  });

  // ============================================================================
  // Test 5: Successful Attempt Start & Server-side Timer Precision
  // ============================================================================
  it("Test 5 [Start Attempt]: Successfully starts attempt with server-side timer & Zero-leak guarantee", async () => {
    const beforeStart = Date.now();
    const res = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const afterStart = Date.now();
    const data: PortalQuizAttemptDto = res.body.data;

    expect(data.id).toBeDefined();
    expect(data.quizConfigId).toBe(generalPublishedQuizId);
    expect(data.attemptNumber).toBe(1);
    expect(data.maxAttempts).toBe(2);
    expect(data.status).toBe("IN_PROGRESS");
    expect(data.totalQuestions).toBe(2);
    expect(data.answeredQuestions).toBe(0);

    // Verify Server-side Timer Precision
    const startedAt = new Date(data.startedAt).getTime();
    const expiresAt = new Date(data.expiresAt).getTime();
    expect(startedAt).toBeGreaterThanOrEqual(beforeStart - 2000);
    expect(startedAt).toBeLessThanOrEqual(afterStart + 2000);

    // Expected duration = 10 minutes = 600,000 ms
    const diffMs = expiresAt - startedAt;
    expect(diffMs).toBe(10 * 60 * 1000);
    expect(data.remainingSeconds).toBeGreaterThanOrEqual(590);
    expect(data.remainingSeconds).toBeLessThanOrEqual(600);

    // ZERO LEAK CONTRACT VERIFICATION
    expect((data as unknown as Record<string, unknown>).correctIndex).toBeUndefined();
    expect((data as unknown as Record<string, unknown>).explanation).toBeUndefined();
    for (const q of data.questions) {
      expect((q as unknown as Record<string, unknown>).correctIndex).toBeUndefined();
      expect((q as unknown as Record<string, unknown>).explanation).toBeUndefined();
      expect((q as unknown as Record<string, unknown>).questionBankItemId).toBeUndefined();
      expect(q.selectedOptionIndex).toBeNull();
      expect(q.options.length).toBeGreaterThanOrEqual(4);
    }
  });

  // ============================================================================
  // Test 6: Resume Existing In-Progress Attempt (Idempotent Resume)
  // ============================================================================
  it("Test 6 [Resume Attempt]: Starting again while IN_PROGRESS resumes existing attempt without incrementing attemptNumber", async () => {
    // Call start attempt again with the same student
    const res = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const data: PortalQuizAttemptDto = res.body.data;
    // Must return the SAME attempt #1, not creating attempt #2
    expect(data.attemptNumber).toBe(1);
    expect(data.status).toBe("IN_PROGRESS");

    // Total attempts in database for this student must still be exactly 1
    const totalAttempts = await prisma.quizConfigAttempt.count({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
    });
    expect(totalAttempts).toBe(1);
  });

  // ============================================================================
  // Test 7: Shuffling Stability across Reload & Resume
  // ============================================================================
  it("Test 7 [Shuffle Stability]: Question order and option mapping remain completely stable across resume and GET", async () => {
    // 1. Get attempt details via GET /api/v1/portal/quiz/attempts/:attemptId
    const activeAttempt = await prisma.quizConfigAttempt.findFirstOrThrow({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
    });

    const res1 = await request(server)
      .get(`/api/v1/portal/quiz/attempts/${activeAttempt.id}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);

    const data1: PortalQuizAttemptDto = res1.body.data;

    // 2. Call start again (resume)
    const res2 = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    const data2: PortalQuizAttemptDto = res2.body.data;

    expect(data1.questions.length).toBe(data2.questions.length);
    for (let i = 0; i < data1.questions.length; i++) {
      expect(data1.questions[i].id).toBe(data2.questions[i].id);
      expect(data1.questions[i].displayedOrder).toBe(data2.questions[i].displayedOrder);
      expect(data1.questions[i].options).toEqual(data2.questions[i].options);
    }
  });

  // ============================================================================
  // Test 8: Save Progress (Real-time Answer Persistence in PostgreSQL)
  // ============================================================================
  it("Test 8 [Save Progress]: Saves answers directly to PostgreSQL and prevents duplicates", async () => {
    const activeAttempt = await prisma.quizConfigAttempt.findFirstOrThrow({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
      include: { answers: true },
    });

    const firstQuestionId = activeAttempt.answers[0].quizConfigQuestionId;

    // Save answer: select option 2
    const saveRes = await request(server)
      .put(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [{ quizConfigQuestionId: firstQuestionId, selectedOptionIndex: 2 }],
      })
      .expect(200);

    const saveResult: SaveQuizProgressResponseDto = saveRes.body.data;
    expect(saveResult.savedCount).toBe(1);
    expect(saveResult.answeredQuestions).toBe(1);
    expect(saveResult.totalQuestions).toBe(2);

    // Verify persisted in PostgreSQL
    const dbAnswer = await prisma.quizConfigAttemptAnswer.findUniqueOrThrow({
      where: {
        attemptId_quizConfigQuestionId: {
          attemptId: activeAttempt.id,
          quizConfigQuestionId: firstQuestionId,
        },
      },
    });
    expect(dbAnswer.selectedOptionIndex).toBe(2);
    expect(dbAnswer.answeredAt).not.toBeNull();

    // Verify GET /attempts/:attemptId restores the answer
    const getRes = await request(server)
      .get(`/api/v1/portal/quiz/attempts/${activeAttempt.id}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    const restored = getRes.body.data.questions.find(
      (q: { id: string }) => q.id === firstQuestionId,
    );
    expect(restored.selectedOptionIndex).toBe(2);

    // Call save again with different option (0): must UPDATE, not duplicate
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [{ quizConfigQuestionId: firstQuestionId, selectedOptionIndex: 0 }],
      })
      .expect(200);

    const totalAnswerRows = await prisma.quizConfigAttemptAnswer.count({
      where: { attemptId: activeAttempt.id },
    });
    expect(totalAnswerRows).toBe(2); // Exactly 2 questions, no duplicates!
  });

  // ============================================================================
  // Test 9: Input Validation on Save Progress (Invalid Question / Option Index)
  // ============================================================================
  it("Test 9 [Validation]: Rejects non-existent question or out-of-range option index (400)", async () => {
    const activeAttempt = await prisma.quizConfigAttempt.findFirstOrThrow({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
      include: { answers: true },
    });

    const firstQuestionId = activeAttempt.answers[0].quizConfigQuestionId;

    // Out of range option index (e.g. 99)
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [{ quizConfigQuestionId: firstQuestionId, selectedOptionIndex: 99 }],
      })
      .expect(400);

    // Random non-existent question UUID
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [
          {
            quizConfigQuestionId: "a0000000-0000-0000-0000-000000000000",
            selectedOptionIndex: 1,
          },
        ],
      })
      .expect(400);
  });

  // ============================================================================
  // Test 10: Attempt Ownership Enforcement (IDOR Protection)
  // ============================================================================
  it("Test 10 [IDOR Protection]: Student B cannot read or modify Student A's attempt (403)", async () => {
    const student1Attempt = await prisma.quizConfigAttempt.findFirstOrThrow({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
    });

    // Student 2 tries to read Student 1's attempt
    await request(server)
      .get(`/api/v1/portal/quiz/attempts/${student1Attempt.id}`)
      .set("Authorization", `Bearer ${student2Token}`)
      .expect(403);

    // Student 2 tries to update Student 1's progress
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${student1Attempt.id}/progress`)
      .set("Authorization", `Bearer ${student2Token}`)
      .send({
        answers: [],
      })
      .expect(403);
  });

  // ============================================================================
  // Test 11: Server-side Expiration & Immutability Guard
  // ============================================================================
  it("Test 11 [Expiry Guard]: Expired attempt transitions to EXPIRED and rejects further progress (400)", async () => {
    const activeAttempt = await prisma.quizConfigAttempt.findFirstOrThrow({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
      include: { answers: true },
    });

    // Artificially expire the attempt by setting expiresAt in the past
    await prisma.quizConfigAttempt.update({
      where: { id: activeAttempt.id },
      data: {
        expiresAt: new Date(Date.now() - 1000 * 60), // 1 minute ago
      },
    });

    // Fetch attempt details: should automatically reflect EXPIRED
    const getRes = await request(server)
      .get(`/api/v1/portal/quiz/attempts/${activeAttempt.id}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);

    expect(getRes.body.data.status).toBe("EXPIRED");
    expect(getRes.body.data.remainingSeconds).toBe(0);

    // Attempting to save progress on expired attempt must be rejected (400)
    await request(server)
      .put(`/api/v1/portal/quiz/attempts/${activeAttempt.id}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        answers: [
          {
            quizConfigQuestionId: activeAttempt.answers[0].quizConfigQuestionId,
            selectedOptionIndex: 1,
          },
        ],
      })
      .expect(400);
  });

  // ============================================================================
  // Test 12: Max Attempts Enforcement
  // ============================================================================
  it("Test 12 [Max Attempts]: Student can start second attempt after first expired, but 3rd attempt is rejected (400)", async () => {
    // Current state: Attempt 1 is EXPIRED. MaxAttempts = 2.
    // Start attempt 2: should succeed
    const res2 = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(201);

    expect(res2.body.data.attemptNumber).toBe(2);
    expect(res2.body.data.status).toBe("IN_PROGRESS");

    // Manually expire Attempt 2 so student tries to start Attempt 3
    await prisma.quizConfigAttempt.update({
      where: { id: res2.body.data.id },
      data: {
        status: "EXPIRED",
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    // Start attempt 3: must be REJECTED (400) because maxAttempts = 2
    const res3 = await request(server)
      .post(`/api/v1/portal/quiz/${generalPublishedQuizId}/attempts`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(400);

    const msg = res3.body.error?.message || res3.body.message || "";
    expect(msg).toContain("số lượt thi cho phép");

    // Total attempts in DB remains exactly 2
    const count = await prisma.quizConfigAttempt.count({
      where: { userId: studentUser.id, quizConfigId: generalPublishedQuizId },
    });
    expect(count).toBe(2);
  });

  // ============================================================================
  // Test 13: Concurrency Race Condition Guard (Atomic Max Attempts Lock)
  // ============================================================================
  it("Test 13 [Concurrency]: Concurrent start requests respect maxAttempts via advisory lock without over-provisioning", async () => {
    // Register Student 2 for Event Quiz (eventPublishedQuizId has maxAttempts = 3)
    await prisma.eventParticipation.create({
      data: {
        userId: student2User.id,
        eventId: testEventId,
        ticketCode: "TICKET-STUDENT2-M73",
        participationStatus: "CONFIRMED",
      },
    });

    // Fire 6 concurrent start requests for Student 2
    const startPromises = Array.from({ length: 6 }).map(() =>
      request(server)
        .post(`/api/v1/portal/quiz/${eventPublishedQuizId}/attempts`)
        .set("Authorization", `Bearer ${student2Token}`),
    );

    const results = await Promise.all(startPromises);
    // All requests must return valid HTTP responses (201 resume/start or 400 max attempts exceeded, never 500)
    for (const r of results) {
      expect([201, 400]).toContain(r.status);
    }

    // In database: total attempts for student 2 must be <= 3 (and since resume is idempotent, exactly 1 active attempt was returned)
    const attempts = await prisma.quizConfigAttempt.findMany({
      where: { userId: student2User.id, quizConfigId: eventPublishedQuizId },
    });
    expect(attempts.length).toBeLessThanOrEqual(3);
    expect(attempts.length).toBe(1); // Idempotent resume returned the same attempt!
  });

  // ============================================================================
  // Test 14: Regression Guard (M7.2 Delivery & M7.1 Config remain intact)
  // ============================================================================
  it("Test 14 [Regression Guard]: M7.2 delivery endpoints and M7.1 config remain completely functional", async () => {
    // M7.2 Active Quizzes
    const activeRes = await request(server)
      .get("/api/v1/portal/quiz/active")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    expect(activeRes.body.data.length).toBeGreaterThanOrEqual(1);

    // M7.2 Quiz Detail (Safe delivery)
    const detailRes = await request(server)
      .get(`/api/v1/portal/quiz/${generalPublishedQuizId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    expect(detailRes.body.data.id).toBe(generalPublishedQuizId);
    expect((detailRes.body.data as Record<string, unknown>).correctIndex).toBeUndefined();
  });
});

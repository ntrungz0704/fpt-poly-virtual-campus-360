import { JwtService } from "@nestjs/jwt";
import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  extractCookieValue,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Audit Batch A — Security, Concurrency, Tour Go-Live & Portal Integrity Integration Suite", () => {
  jest.setTimeout(120_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let adminToken = "";
  let studentAToken = "";
  let studentAId = "";
  let studentBToken = "";
  let studentBId = "";
  let parentToken = "";
  let parentId = "";
  let publishedEventId = "";
  let campusId = "";
  let passwordHash = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("audit_batch_a");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    const adminLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;

    const adminRow = await prisma.user.findFirstOrThrow({
      where: { username: "admin" },
    });
    passwordHash = adminRow.passwordHash!;

    const jwtService = ctx.app.get(JwtService);

    const [sA, sB, pUser] = await Promise.all([
      prisma.user.create({
        data: {
          username: "batcha_student_a",
          fullName: "Nguyễn Minh Anh",
          email: "batcha.student.a@poly.edu.vn",
          userType: "STUDENT",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "BOOTSTRAP",
          mustChangePassword: false,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: "batcha_student_b",
          fullName: "Nguyễn Minh Anh",
          email: "batcha.student.b@poly.edu.vn",
          userType: "STUDENT",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "BOOTSTRAP",
          mustChangePassword: false,
          passwordHash,
        },
      }),
      prisma.user.create({
        data: {
          username: "batcha_parent",
          fullName: "Trần Thị Phụ Huynh",
          email: "batcha.parent@gmail.com",
          userType: "PARENT",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "BOOTSTRAP",
          mustChangePassword: false,
          passwordHash,
        },
      }),
    ]);

    studentAId = sA.id;
    studentBId = sB.id;
    parentId = pUser.id;

    studentAToken = jwtService.sign({
      sub: sA.id,
      username: sA.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "batcha-jti-sa",
    });
    studentBToken = jwtService.sign({
      sub: sB.id,
      username: sB.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "batcha-jti-sb",
    });
    parentToken = jwtService.sign({
      sub: pUser.id,
      username: pUser.username,
      roles: ["PARENT"],
      pwdRequired: false,
      jti: "batcha-jti-parent",
    });

    const ev = await prisma.openDayEvent.findFirstOrThrow({
      where: { status: "PUBLISHED", deletedAt: null },
    });
    publishedEventId = ev.id;
    campusId = ev.campusId;
  });

  afterAll(async () => {
    await ctx?.close();
    await dbHandle?.drop();
  });

  describe("1. Gamification Identity Isolation, Optional Auth & Concurrency Locks", () => {
    const ownedTicketCode = "OD26-A101-A101";
    const guestTicketCode = "OD26-G999-9999";

    beforeAll(async () => {
      await prisma.eventParticipation.createMany({
        data: [
          {
            eventId: publishedEventId,
            userId: studentAId,
            ticketCode: ownedTicketCode,
            attendeeName: "Nguyễn Minh Anh",
            attendeeEmail: "batcha.student.a@poly.edu.vn",
            attendeePhone: "0901111111",
            participationStatus: "CHECKED_IN",
            checkedInAt: new Date(),
          },
          {
            eventId: publishedEventId,
            userId: null,
            ticketCode: guestTicketCode,
            attendeeName: "Khách Test Race",
            attendeeEmail: "guest.race@poly.edu.vn",
            attendeePhone: "0902222222",
            participationStatus: "CHECKED_IN",
            checkedInAt: new Date(),
          },
        ],
      });

      // Award initial XP to Student A so Student A is clearly distinguished from B
      await prisma.xpLedger.create({
        data: {
          userId: studentAId,
          ticketCode: ownedTicketCode,
          attendeeName: "Nguyễn Minh Anh",
          amountXp: 250,
          source: "CHECK_IN",
          referenceId: "seed-batcha-checkin",
          idempotencyKey: "batcha:seed:sa",
        },
      });
    });

    it("blocks attendeeName cross-user spin/XP leakage and rejects anonymous use of account-bound tickets", async () => {
      // Unauthenticated request WITHOUT server-issued guest session MUST fail closed (never fall back to attendeeName)
      const noSessionProfile = await request(server)
        .get("/api/v1/public/gamification/profile")
        .query({ attendeeName: "Nguyễn Minh Anh" })
        .expect(401);
      expect(noSessionProfile.body.error.code).toBe("GUEST_SESSION_REQUIRED");

      const noSessionSpin = await request(server)
        .post("/api/v1/public/gamification/spin")
        .send({ attendeeName: "Nguyễn Minh Anh" })
        .expect(401);
      expect(noSessionSpin.body.error.code).toBe("GUEST_SESSION_REQUIRED");

      // Even WITH a valid server-issued guest session, matching Student A's attendeeName MUST NOT leak XP or spins
      const anonAgent = request.agent(server);
      await anonAgent.post("/api/v1/public/gamification/guest-session").expect(200);

      const anonByName = await anonAgent
        .get("/api/v1/public/gamification/profile")
        .query({ attendeeName: "Nguyễn Minh Anh" })
        .expect(200);
      expect(anonByName.body.data.totalXp).toBe(0);
      expect(anonByName.body.data.spinsAvailable).toBe(0);

      const anonSpin = await anonAgent
        .post("/api/v1/public/gamification/spin")
        .send({ attendeeName: "Nguyễn Minh Anh" })
        .expect(400);
      expect(anonSpin.body.error.code).toBe("NO_SPINS_REMAINING");

      // Anonymous OR Student B passing Student A's account-bound ticketCode MUST receive 403
      const anonTicketTheft = await request(server)
        .post("/api/v1/public/gamification/spin")
        .send({ attendeeName: "Kẻ mạo danh", ticketCode: ownedTicketCode })
        .expect(403);
      expect(anonTicketTheft.body.error.code).toBe("TICKET_BELONGS_TO_ACCOUNT");

      await request(server)
        .get("/api/v1/public/gamification/profile")
        .set("Authorization", `Bearer ${studentBToken}`)
        .query({ ticketCode: ownedTicketCode })
        .expect(403);

      // Authenticated Student A via @OptionalAuth() receives own profile and can spin cleanly
      const authProfile = await request(server)
        .get("/api/v1/public/gamification/profile")
        .set("Authorization", `Bearer ${studentAToken}`)
        .expect(200);
      expect(authProfile.body.data.totalXp).toBe(250);
      expect(authProfile.body.data.spinsAvailable).toBe(3);

      const authSpin = await request(server)
        .post("/api/v1/public/gamification/spin")
        .set("Authorization", `Bearer ${studentAToken}`)
        .send({ attendeeName: "Nguyễn Minh Anh" })
        .expect(201);
      expect(authSpin.body.data.spinsRemaining).toBe(2);
    });

    it("enforces atomic one-time quiz XP under 5 concurrent POST /public/gamification/quiz/submit calls", async () => {
      const quizItem = await prisma.openDayQuizItem.findFirstOrThrow({
        where: { eventId: publishedEventId, status: "PUBLISHED", deletedAt: null },
      });

      const calls = Array.from({ length: 5 }, () =>
        request(server)
          .post("/api/v1/public/gamification/quiz/submit")
          .set("Authorization", `Bearer ${studentBToken}`)
          .send({
            eventId: publishedEventId,
            attendeeName: "Nguyễn Minh Anh",
            items: [
              {
                questionId: quizItem.id,
                selectedIndex: quizItem.correctIndex,
              },
            ],
          }),
      );

      const responses = await Promise.all(calls);
      for (const res of responses) {
        expect(res.status).toBe(201);
      }

      const xpAwards = responses.filter((r) => r.body.data.isXpAwarded === true);
      expect(xpAwards).toHaveLength(1);
      expect(xpAwards[0].body.data.scoreXp).toBe(60);

      const dbLedgers = await prisma.xpLedger.findMany({
        where: { userId: studentBId, source: "QUIZ_COMPLETION" },
      });
      expect(dbLedgers).toHaveLength(1);
      expect(dbLedgers[0].idempotencyKey).toMatch(/^gamification:quiz:/);
    });

    it("serializes 6 concurrent spins via advisory lock and never allows negative spins or negative stock", async () => {
      // Configure a limited-stock reward alongside infinite fallback XP slices
      const limitedReward = await prisma.spinRewardConfig.create({
        data: {
          label: "Bình giữ nhiệt Giới hạn Test",
          rewardType: "GIFT",
          amountXp: 0,
          probabilityWeight: 9999,
          stockQuantity: 1,
          remainingQuantity: 1,
          isActive: true,
          sortOrder: 99,
        },
      });

      const responses = await Promise.all(
        Array.from({ length: 6 }, () =>
          request(server)
            .post("/api/v1/public/gamification/spin")
            .send({
              attendeeName: "Khách Test Race",
              ticketCode: guestTicketCode,
            }),
        ),
      );

      const successes = responses.filter((r) => r.status === 201);
      const rejections = responses.filter((r) => r.status === 400);

      // Guest ticket OD26-G999-9999 is checked-in => exactly 3 earned spins (1 base + 2 checkin)
      expect(successes).toHaveLength(3);
      expect(rejections).toHaveLength(3);
      for (const r of rejections) {
        expect(r.body.error.code).toBe("NO_SPINS_REMAINING");
      }

      const dbSpins = await prisma.userSpinHistory.count({
        where: { ticketCode: guestTicketCode },
      });
      expect(dbSpins).toBe(3);

      const updatedLimited = await prisma.spinRewardConfig.findUniqueOrThrow({
        where: { id: limitedReward.id },
      });
      expect(updatedLimited.remainingQuantity).toBeGreaterThanOrEqual(0);
    });

    it("returns 100% real leaderboard without fake baselineAmbassadors or name-overwrite collisions", async () => {
      // Note: Student A and Student B share identical fullName "Nguyễn Minh Anh"
      const lbRes = await request(server)
        .get("/api/v1/public/gamification/leaderboard")
        .set("Authorization", `Bearer ${studentBToken}`)
        .query({ limit: 50 })
        .expect(200);

      const entries: Array<{
        attendeeName: string;
        totalXp: number;
        isCurrentAttendee: boolean;
      }> = lbRes.body.data.topEntries;

      // Fake baseline ambassadors must NEVER appear
      expect(entries.some((e) => e.attendeeName.includes("Đặng Quốc Hưng"))).toBe(
        false,
      );
      expect(entries.some((e) => e.attendeeName.includes("Lê Hoàng Yến"))).toBe(false);

      // Both distinct students named "Nguyễn Minh Anh" must coexist without overwriting each other
      const minhAnhEntries = entries.filter(
        (e) => e.attendeeName === "Nguyễn Minh Anh",
      );
      expect(minhAnhEntries).toHaveLength(2);
      // Exactly ONE matches authenticated Student B
      expect(minhAnhEntries.filter((e) => e.isCurrentAttendee)).toHaveLength(1);
    });

    it("B-A1: isolates two anonymous walk-in guests with identical attendeeName via server-signed guest sessions", async () => {
      const sharedGuestName = "Trần Khách Trùng Tên";
      const quizItem = await prisma.openDayQuizItem.findFirstOrThrow({
        where: { eventId: publishedEventId, status: "PUBLISHED", deletedAt: null },
      });

      const agentA = request.agent(server);
      const agentB = request.agent(server);

      const sessionARes = await agentA
        .post("/api/v1/public/gamification/guest-session")
        .expect(200);
      expect(sessionARes.body.data.sessionActive).toBe(true);
      expect(sessionARes.body.data.guestId).toBeUndefined();
      expect(sessionARes.body.data.token).toBeUndefined();

      const cookieA = extractCookieValue(
        sessionARes.headers["set-cookie"],
        "gamification_guest",
      );
      expect(cookieA).not.toBeNull();
      expect(cookieA!.rawHeader).toContain("HttpOnly");
      expect(cookieA!.rawHeader).toContain("SameSite=Lax");
      expect(cookieA!.rawHeader).toContain("Path=/api/v1/public/gamification");

      const sessionBRes = await agentB
        .post("/api/v1/public/gamification/guest-session")
        .expect(200);
      const cookieB = extractCookieValue(
        sessionBRes.headers["set-cookie"],
        "gamification_guest",
      );
      expect(cookieB).not.toBeNull();
      expect(cookieA!.value).not.toBe(cookieB!.value);

      // Re-calling guest-session on agentA preserves the verified identity stably
      const sessionAReload = await agentA
        .post("/api/v1/public/gamification/guest-session")
        .expect(200);
      const cookieAReload = extractCookieValue(
        sessionAReload.headers["set-cookie"],
        "gamification_guest",
      );
      expect(cookieAReload!.value.split(".")[1]).toBe(cookieA!.value.split(".")[1]);

      // Guest A completes quiz under sharedGuestName -> receives 60 XP and 2 spins
      const submitA = await agentA
        .post("/api/v1/public/gamification/quiz/submit")
        .send({
          eventId: publishedEventId,
          attendeeName: sharedGuestName,
          items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
        })
        .expect(201);
      expect(submitA.body.data.isXpAwarded).toBe(true);
      expect(submitA.body.data.scoreXp).toBe(60);

      // Guest A spins once cleanly
      const spinA = await agentA
        .post("/api/v1/public/gamification/spin")
        .send({ attendeeName: sharedGuestName })
        .expect(201);
      expect(spinA.body.data.spinsRemaining).toBe(1);

      // Guest B using EXACT SAME attendeeName sees 0 XP, 0 quiz attempts, 0 spins, 0 recent rewards
      const profileB = await agentB
        .get("/api/v1/public/gamification/profile")
        .query({ attendeeName: sharedGuestName })
        .expect(200);
      expect(profileB.body.data.totalXp).toBe(0);
      expect(profileB.body.data.quizAttemptsCount).toBe(0);
      expect(profileB.body.data.spinsAvailable).toBe(0);
      expect(profileB.body.data.spinsUsed).toBe(0);
      expect(profileB.body.data.recentRewards).toHaveLength(0);

      // Guest B cannot spend Guest A's remaining spin via matching attendeeName
      const spinBAttempt = await agentB
        .post("/api/v1/public/gamification/spin")
        .send({ attendeeName: sharedGuestName })
        .expect(400);
      expect(spinBAttempt.body.error.code).toBe("NO_SPINS_REMAINING");

      // Guest B submits quiz under SAME attendeeName -> independently earns own 60 XP
      const submitB = await agentB
        .post("/api/v1/public/gamification/quiz/submit")
        .send({
          eventId: publishedEventId,
          attendeeName: sharedGuestName,
          items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
        })
        .expect(201);
      expect(submitB.body.data.isXpAwarded).toBe(true);
      expect(submitB.body.data.scoreXp).toBe(60);

      // Leaderboard lists both distinct guests cleanly without collision & highlights only caller's entry
      const lbA = await agentA
        .get("/api/v1/public/gamification/leaderboard")
        .query({ limit: 50, attendeeName: sharedGuestName })
        .expect(200);
      const sharedEntriesA = lbA.body.data.topEntries.filter(
        (e: { attendeeName: string }) => e.attendeeName === sharedGuestName,
      );
      expect(sharedEntriesA).toHaveLength(2);
      expect(
        sharedEntriesA.filter((e: { isCurrentAttendee?: boolean }) => e.isCurrentAttendee),
      ).toHaveLength(1);
      expect(lbA.body.data.currentEntry.totalSpins).toBe(1);

      // Unauthenticated request WITHOUT cookie specifying ?attendeeName= MUST NOT highlight or impersonate either guest
      const lbAnon = await request(server)
        .get("/api/v1/public/gamification/leaderboard")
        .query({ limit: 50, attendeeName: sharedGuestName })
        .expect(200);
      const sharedEntriesAnon = lbAnon.body.data.topEntries.filter(
        (e: { attendeeName: string }) => e.attendeeName === sharedGuestName,
      );
      expect(
        sharedEntriesAnon.some((e: { isCurrentAttendee?: boolean }) => e.isCurrentAttendee),
      ).toBe(false);
      expect(lbAnon.body.data.currentEntry).toBeNull();
    });

    it("B-A1: fails closed on missing, tampered, or payload-spoofed guest identity and handles concurrency atomically", async () => {
      const quizItem = await prisma.openDayQuizItem.findFirstOrThrow({
        where: { eventId: publishedEventId, status: "PUBLISHED", deletedAt: null },
      });

      // 1. Missing guest cookie on quiz submit & profile -> 401 GUEST_SESSION_REQUIRED
      const noCookieSubmit = await request(server)
        .post("/api/v1/public/gamification/quiz/submit")
        .send({
          eventId: publishedEventId,
          attendeeName: "Trần Khách Trùng Tên",
          items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
        })
        .expect(401);
      expect(noCookieSubmit.body.error.code).toBe("GUEST_SESSION_REQUIRED");

      // 2. Tampered cookie (forged guestId / broken signature) -> 401 INVALID_GUEST_SESSION across all endpoints
      const realSession = await request(server)
        .post("/api/v1/public/gamification/guest-session")
        .expect(200);
      const realToken = extractCookieValue(
        realSession.headers["set-cookie"],
        "gamification_guest",
      )!.value;
      const parts = realToken.split(".");
      const swappedUuid =
        parts[1] === "00000000-0000-4000-8000-000000000001"
          ? "00000000-0000-4000-8000-000000000002"
          : "00000000-0000-4000-8000-000000000001";
      const tamperedCookie = `gamification_guest=${parts[0]}.${swappedUuid}.${parts[2]}.${parts[3]}`;

      for (const reqCall of [
        request(server).get("/api/v1/public/gamification/profile").set("Cookie", tamperedCookie),
        request(server)
          .get("/api/v1/public/gamification/leaderboard")
          .set("Cookie", tamperedCookie),
        request(server)
          .post("/api/v1/public/gamification/spin")
          .set("Cookie", tamperedCookie)
          .send({ attendeeName: "Kẻ Giả Mạo Cookie" }),
      ]) {
        const res = await reqCall.expect(401);
        expect(res.body.error.code).toBe("INVALID_GUEST_SESSION");
      }

      // 3. Payload spoofing extra identity fields -> 400 forbidden by strict whitelist DTO pipe
      await request(server)
        .post("/api/v1/public/gamification/spin")
        .set("Cookie", `gamification_guest=${realToken}`)
        .send({
          attendeeName: "Guest C",
          guestSessionId: swappedUuid,
        })
        .expect(400);

      // 4. Concurrent quiz submit & spin requests for the SAME verified guest cookie remain atomic
      const concurrentSubmits = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(server)
            .post("/api/v1/public/gamification/quiz/submit")
            .set("Cookie", `gamification_guest=${realToken}`)
            .send({
              eventId: publishedEventId,
              attendeeName: "Lê Khách Đồng Thời",
              items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
            }),
        ),
      );
      expect(concurrentSubmits.every((r) => r.status === 201)).toBe(true);
      expect(concurrentSubmits.filter((r) => r.body.data.isXpAwarded)).toHaveLength(1);

      const guestLedgers = await prisma.xpLedger.findMany({
        where: { guestSessionId: parts[1], source: "QUIZ_COMPLETION" },
      });
      expect(guestLedgers).toHaveLength(1);

      const concurrentSpins = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(server)
            .post("/api/v1/public/gamification/spin")
            .set("Cookie", `gamification_guest=${realToken}`)
            .send({ attendeeName: "Lê Khách Đồng Thời" }),
        ),
      );
      // Passed quiz => 2 spins total (1 quiz + 1 >=60%), so exactly 2 succeed and 3 reject
      expect(concurrentSpins.filter((r) => r.status === 201)).toHaveLength(2);
      expect(concurrentSpins.filter((r) => r.status === 400)).toHaveLength(3);
      expect(
        await prisma.userSpinHistory.count({ where: { guestSessionId: parts[1] } }),
      ).toBe(2);

      // 5. Authenticated Student B cannot hijack unassigned guestTicketCode (mismatched email)
      await request(server)
        .post("/api/v1/public/gamification/spin")
        .set("Authorization", `Bearer ${studentBToken}`)
        .send({ attendeeName: "Nguyễn Minh Anh", ticketCode: guestTicketCode })
        .expect(403);
    });

    it("B-A2: rejects unknown, cancelled, and deleted-event tickets with zero DB writes", async () => {
      const fakeTicketCode = "OD26-FAKE-9999";
      const cancelledTicketCode = "OD26-CANC-8888";
      const deletedEventTicketCode = "OD26-DELT-7777";

      const quizItem = await prisma.openDayQuizItem.findFirstOrThrow({
        where: { eventId: publishedEventId, status: "PUBLISHED", deletedAt: null },
      });

      // Prepare CANCELLED ticket and soft-deleted-event ticket
      const deletedEvent = await prisma.openDayEvent.create({
        data: {
          campusId,
          eventKey: "ba2-deleted-event",
          title: "Sự kiện đã bị xóa mềm B-A2",
          subtitle: "Deleted event",
          dateLabel: "01/01/2026",
          timeLabel: "08:00 - 12:00",
          status: "PUBLISHED",
          deletedAt: new Date(),
        },
      });

      await prisma.eventParticipation.createMany({
        data: [
          {
            eventId: publishedEventId,
            userId: null,
            ticketCode: cancelledTicketCode,
            attendeeName: "Khách Đã Hủy Vé",
            attendeeEmail: "cancelled.ba2@poly.edu.vn",
            attendeePhone: "0903333333",
            participationStatus: "CANCELLED",
          },
          {
            eventId: deletedEvent.id,
            userId: null,
            ticketCode: deletedEventTicketCode,
            attendeeName: "Khách Sự Kiện Đã Xóa",
            attendeeEmail: "deleted.ev.ba2@poly.edu.vn",
            attendeePhone: "0904444444",
            participationStatus: "CHECKED_IN",
            checkedInAt: new Date(),
          },
        ],
      });

      // 1. Unknown ticket MUST be rejected 404 on quiz/submit, spin, profile, leaderboard
      const quizUnknown = await request(server)
        .post("/api/v1/public/gamification/quiz/submit")
        .send({
          eventId: publishedEventId,
          attendeeName: "Khách Vé Giả",
          ticketCode: fakeTicketCode,
          items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
        })
        .expect(404);
      expect(quizUnknown.body.error.code).toBe("TICKET_NOT_FOUND");

      const spinUnknown = await request(server)
        .post("/api/v1/public/gamification/spin")
        .send({ attendeeName: "Khách Vé Giả", ticketCode: fakeTicketCode })
        .expect(404);
      expect(spinUnknown.body.error.code).toBe("TICKET_NOT_FOUND");

      await request(server)
        .get("/api/v1/public/gamification/profile")
        .query({ ticketCode: fakeTicketCode })
        .expect(404);

      await request(server)
        .get("/api/v1/public/gamification/leaderboard")
        .query({ ticketCode: fakeTicketCode })
        .expect(404);

      // Even authenticated Student A cannot submit quiz under non-existent ticketCode
      await request(server)
        .post("/api/v1/public/gamification/quiz/submit")
        .set("Authorization", `Bearer ${studentAToken}`)
        .send({
          eventId: publishedEventId,
          attendeeName: "Nguyễn Minh Anh",
          ticketCode: fakeTicketCode,
          items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
        })
        .expect(404);

      // 2. CANCELLED ticket and soft-deleted-event ticket MUST be rejected 400 TICKET_CANCELLED
      for (const badTicket of [cancelledTicketCode, deletedEventTicketCode]) {
        const qRes = await request(server)
          .post("/api/v1/public/gamification/quiz/submit")
          .send({
            eventId: publishedEventId,
            attendeeName: "Khách Vé Không Hợp Lệ",
            ticketCode: badTicket,
            items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
          })
          .expect(400);
        expect(qRes.body.error.code).toBe("TICKET_CANCELLED");

        const sRes = await request(server)
          .post("/api/v1/public/gamification/spin")
          .send({ attendeeName: "Khách Vé Không Hợp Lệ", ticketCode: badTicket })
          .expect(400);
        expect(sRes.body.error.code).toBe("TICKET_CANCELLED");

        await request(server)
          .get("/api/v1/public/gamification/profile")
          .query({ ticketCode: badTicket })
          .expect(400);
      }

      // 3. Zero DB persistence for unknown, cancelled, or deleted-event tickets
      const [badLedgers, badAttempts, badSpins] = await Promise.all([
        prisma.xpLedger.count({
          where: {
            ticketCode: {
              in: [fakeTicketCode, cancelledTicketCode, deletedEventTicketCode],
            },
          },
        }),
        prisma.quizAttempt.count({
          where: {
            ticketCode: {
              in: [fakeTicketCode, cancelledTicketCode, deletedEventTicketCode],
            },
          },
        }),
        prisma.userSpinHistory.count({
          where: {
            ticketCode: {
              in: [fakeTicketCode, cancelledTicketCode, deletedEventTicketCode],
            },
          },
        }),
      ]);
      expect(badLedgers).toBe(0);
      expect(badAttempts).toBe(0);
      expect(badSpins).toBe(0);

      // 4. Valid existing ticket (OD26-G999-9999) continues working cleanly on quiz submission & profile
      const validTicketSubmit = await request(server)
        .post("/api/v1/public/gamification/quiz/submit")
        .send({
          eventId: publishedEventId,
          attendeeName: "Khách Test Race",
          ticketCode: guestTicketCode,
          items: [{ questionId: quizItem.id, selectedIndex: quizItem.correctIndex }],
        })
        .expect(201);
      expect(validTicketSubmit.body.data.isXpAwarded).toBe(true);
    });
  });

  describe("2. TourAdmin Go-Live Guards, Media isAiPlaceholder & Cross-Node Hotspot Isolation", () => {
    it("computes isAiPlaceholder dynamically and blocks Go-Live publish with 422 AI_PLACEHOLDER_BLOCKED or unapproved asset", async () => {
      // Seeded AI synthetic placeholder asset must expose isAiPlaceholder: true
      const mediaListRes = await request(server)
        .get("/api/v1/admin/media")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      const aiAsset = mediaListRes.body.data.items.find(
        (m: { isAiPlaceholder: boolean }) => m.isAiPlaceholder === true,
      );
      expect(aiAsset).toBeDefined();

      // Publishing all nodes (which include AI synthetic placeholder panoramas) MUST reject 422 AI_PLACEHOLDER_BLOCKED
      const aiNode = await prisma.tourNode.findFirstOrThrow({
        where: { deletedAt: null },
      });
      const publishAiRes = await request(server)
        .post("/api/v1/admin/tour/publish")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ nodeIds: [aiNode.id] })
        .expect(422);
      expect(publishAiRes.body.error.code).toBe("AI_PLACEHOLDER_BLOCKED");

      // Direct PATCH status=PUBLISHED on AI placeholder node MUST also reject 422
      const patchAiRes = await request(server)
        .patch(`/api/v1/admin/tour/nodes/${aiNode.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "PUBLISHED" })
        .expect(422);
      expect(patchAiRes.body.error.code).toBe("AI_PLACEHOLDER_BLOCKED");

      // Create genuine QTSC non-AI asset (isPreviewApproved = false initially)
      const adminUser = await prisma.user.findFirstOrThrow({
        where: { username: "admin" },
      });
      const publishedLoc = await prisma.location.findFirstOrThrow({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          building: { status: "PUBLISHED", deletedAt: null },
        },
      });
      const genuineUnapproved = await prisma.mediaAsset.create({
        data: {
          assetKind: "PANORAMA_2_1",
          originalFilename: "real-qtsc-hall.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 512000n,
          sha256Checksum: "b".repeat(64),
          originalWidth: 4096,
          originalHeight: 2048,
          isValid2To1: true,
          isPreviewApproved: false,
          originalObjectKey: "/images/panoramas/real-qtsc-hall.jpg",
          processingStatus: "READY",
          cameraMetadata: { isRealQtscCapture: true, assetOrigin: "CAMERA_360" },
          uploadedBy: adminUser.id,
        },
      });

      const realNodeRes = await request(server)
        .post("/api/v1/admin/tour/nodes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Real Camera Hall Node",
          slug: "real-camera-hall-node",
          intro: "Captured on genuine QTSC 360 camera.",
          locationId: publishedLoc.id,
          panoramaAssetId: genuineUnapproved.id,
        })
        .expect(201);
      const realNodeId: string = realNodeRes.body.data.id;

      // Must fail 422 while isPreviewApproved = false
      await request(server)
        .post("/api/v1/admin/tour/publish")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ nodeIds: [realNodeId] })
        .expect(422);

      // Approve preview -> publish succeeds (201)
      await prisma.mediaAsset.update({
        where: { id: genuineUnapproved.id },
        data: { isPreviewApproved: true },
      });
      const publishOk = await request(server)
        .post("/api/v1/admin/tour/publish")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ nodeIds: [realNodeId] })
        .expect(201);
      expect(publishOk.body.data.publishedCount).toBe(1);

      // Cross-node hotspot isolation: Hotspot owned by realNodeId cannot be mutated via aiNode.id
      const hsRes = await request(server)
        .post(`/api/v1/admin/tour/nodes/${realNodeId}/hotspots`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          hotspotType: "INFO",
          yaw: 15,
          pitch: 2,
          title: "Node A Original Hotspot",
        })
        .expect(201);

      await request(server)
        .post(`/api/v1/admin/tour/nodes/${aiNode.id}/hotspots`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          id: hsRes.body.data.id,
          hotspotType: "INFO",
          yaw: 99,
          pitch: 9,
          title: "Tampered Title",
        })
        .expect(404);

      const intactHotspot = await prisma.hotspot.findUniqueOrThrow({
        where: { id: hsRes.body.data.id },
      });
      expect(intactHotspot.title).toBe("Node A Original Hotspot");
    });
  });

  describe("3. Portal Security, Published Filtering & Real Rank Integrity", () => {
    it("rejects dangerous avatarUrl schemes (XSS guard), filters DRAFT schedule sessions, and computes real rank", async () => {
      // XSS javascript: and protocol-relative // avatar URLs rejected cleanly (400)
      await request(server)
        .patch("/api/v1/portal/profile")
        .set("Authorization", `Bearer ${studentAToken}`)
        .send({ avatarUrl: "javascript:alert(document.cookie)" })
        .expect(400);

      await request(server)
        .patch("/api/v1/portal/profile")
        .set("Authorization", `Bearer ${studentAToken}`)
        .send({ avatarUrl: "//evil.example/payload.png" })
        .expect(400);

      // Safe https URL accepted (200)
      const okProfile = await request(server)
        .patch("/api/v1/portal/profile")
        .set("Authorization", `Bearer ${studentAToken}`)
        .send({ avatarUrl: "https://cdn.example.edu.vn/avatars/student-a.png" })
        .expect(200);
      expect(okProfile.body.data.avatarUrl).toBe(
        "https://cdn.example.edu.vn/avatars/student-a.png",
      );

      // Create DRAFT session on published event -> must NOT leak in GET /portal/schedule
      const draftSession = await prisma.openDaySession.create({
        data: {
          campusId,
          eventId: publishedEventId,
          title: "Phiên Nội Bộ DRAFT Secret Session",
          sessionPeriod: "NOON",
          startTimeLabel: "12:00",
          endTimeLabel: "12:45",
          timeRangeLabel: "12:00 - 12:45",
          customLocationLabel: "Phòng Họp Kín",
          hostUnit: "Ban Tổ Chức",
          description: "Draft only",
          isPublic: true,
          status: "DRAFT",
        },
      });

      const schedRes = await request(server)
        .get("/api/v1/portal/schedule")
        .set("Authorization", `Bearer ${studentAToken}`)
        .expect(200);
      expect(
        schedRes.body.data.some((s: { id: string }) => s.id === draftSession.id),
      ).toBe(false);

      // Portal Gamification rank reflects real XP standing (Student A > Student B)
      const [gA, gB] = await Promise.all([
        request(server)
          .get("/api/v1/portal/gamification")
          .set("Authorization", `Bearer ${studentAToken}`)
          .expect(200),
        request(server)
          .get("/api/v1/portal/gamification")
          .set("Authorization", `Bearer ${studentBToken}`)
          .expect(200),
      ]);
      expect(typeof gA.body.data.rank).toBe("number");
      expect(typeof gB.body.data.rank).toBe("number");
      expect(gA.body.data.rank).toBeLessThan(gB.body.data.rank);

      // Parent batch student summary lookup works cleanly
      await prisma.parentStudentLink.create({
        data: {
          parentId,
          studentId: studentAId,
          status: "APPROVED",
          relationship: "Mẹ",
        },
      });
      const parentRes = await request(server)
        .get("/api/v1/parent/students")
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);
      expect(parentRes.body.data).toHaveLength(1);
      expect(parentRes.body.data[0].totalXp).toBeGreaterThanOrEqual(250);
      expect(parentRes.body.data[0].ticketsCount).toBe(1);
    });
  });
});

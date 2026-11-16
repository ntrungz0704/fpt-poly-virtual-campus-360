import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import { hashPasswordArgon2id } from "../../src/common/utils/token-crypto";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("M8 Open Day QR Check-in Engine, Concurrency, XP, RBAC, Audit & Attendance Integration Suite", () => {
  jest.setTimeout(120_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let adminToken = "";
  let adminUserId = "";
  let staffOperatorToken = "";
  let staffOperatorId = "";
  let staffOperatorUsername = "";
  let tourEditorToken = "";
  let studentToken = "";
  let studentUserId = "";
  let student2UserId = "";
  let parentToken = "";

  let primaryEventId = "";
  let secondaryEventId = "";
  let draftEventId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("m8_checkin");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Bootstrap & login ADMIN (SUPER_ADMIN)
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-M8-Checkin-Strong-2026!";
    await request(server)
      .patch("/api/v1/auth/me/password")
      .set("Authorization", `Bearer ${adminBootstrap.body.data.accessToken}`)
      .send({
        currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
        newPassword: adminNewPw,
      })
      .expect(200);

    const adminLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: adminNewPw })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
    adminUserId = adminLogin.body.data.user.id;

    // 2. Provision STAFF (EVENT_OPERATOR -> events:write) & STAFF (TOUR_EDITOR -> no events:write)
    const [eventRole, tourRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { code: "EVENT_OPERATOR" } }),
      prisma.role.findUniqueOrThrow({ where: { code: "TOUR_EDITOR" } }),
    ]);
    const staffPassword = "Staff-M8-Checkin-Strong-2026!";
    const staffHash = await hashPasswordArgon2id(staffPassword);

    const staffOperator = await prisma.user.create({
      data: {
        username: "m8.staff.operator",
        fullName: "Nhân sự Check-in M8",
        email: "m8.staff.operator@fpt.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        mustChangePassword: false,
        passwordHash: staffHash,
        userRoles: { create: { roleId: eventRole.id } },
      },
    });
    staffOperatorId = staffOperator.id;
    staffOperatorUsername = staffOperator.username!;

    await prisma.user.create({
      data: {
        username: "m8.tour.editor",
        fullName: "Biên tập viên Tour M8",
        email: "m8.tour.editor@fpt.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        mustChangePassword: false,
        passwordHash: staffHash,
        userRoles: { create: { roleId: tourRole.id } },
      },
    });

    const staffLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "m8.staff.operator", password: staffPassword })
      .expect(200);
    staffOperatorToken = staffLogin.body.data.accessToken;

    const tourLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "m8.tour.editor", password: staffPassword })
      .expect(200);
    tourEditorToken = tourLogin.body.data.accessToken;

    // 3. Provision STUDENT and PARENT users
    const jwtService = ctx.app.get(JwtService);
    const student1 = await prisma.user.create({
      data: {
        username: "m8.student.1",
        fullName: "Sinh viên Nguyễn Văn A",
        email: "m8.student.1@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        passwordHash: staffHash,
      },
    });
    studentUserId = student1.id;
    studentToken = jwtService.sign({
      sub: student1.id,
      username: student1.username,
      roles: [],
      pwdRequired: false,
      jti: "m8-jti-student-1",
    });

    const student2 = await prisma.user.create({
      data: {
        username: "m8.student.2",
        fullName: "Sinh viên Trần Thị B",
        email: "m8.student.2@poly.edu.vn",
        userType: "STUDENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        passwordHash: staffHash,
      },
    });
    student2UserId = student2.id;

    const parent = await prisma.user.create({
      data: {
        username: "m8.parent.1",
        fullName: "Phụ huynh M8",
        email: "m8.parent.1@poly.edu.vn",
        userType: "PARENT",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        passwordHash: staffHash,
      },
    });
    parentToken = jwtService.sign({
      sub: parent.id,
      username: parent.username,
      roles: [],
      pwdRequired: false,
      jti: "m8-jti-parent-1",
    });

    // 4. Resolve primary published event + create secondary published event + draft event
    const primaryEvent = await prisma.openDayEvent.findFirstOrThrow({
      where: {
        eventKey: "open-day-2026-qtsc",
        status: "PUBLISHED",
        deletedAt: null,
      },
    });
    primaryEventId = primaryEvent.id;

    const secondaryEvent = await prisma.openDayEvent.create({
      data: {
        campusId: primaryEvent.campusId,
        eventKey: "open-day-2026-secondary",
        title: "Open Day Đợt 2 — QTSC",
        dateLabel: "20/12/2026",
        timeLabel: "08:00 - 16:30",
        status: "PUBLISHED",
      },
    });
    secondaryEventId = secondaryEvent.id;

    const draftEvent = await prisma.openDayEvent.create({
      data: {
        campusId: primaryEvent.campusId,
        eventKey: "open-day-2026-draft",
        title: "Open Day Bản Nháp",
        dateLabel: "30/12/2026",
        timeLabel: "08:00 - 16:30",
        status: "DRAFT",
      },
    });
    draftEventId = draftEvent.id;
  });

  afterAll(async () => {
    await ctx?.close();
    await dbHandle?.drop();
  });

  // ==========================================================================
  // Test 10 & 11: RBAC Authorization & Actor Integrity
  // ==========================================================================
  describe("Phase C — RBAC & Actor Integrity", () => {
    it("10. Rejects unauthenticated (401), STUDENT (403), PARENT (403), and STAFF without events:write (403); rejects client-spoofed checkedInBy (400)", async () => {
      await request(server)
        .post("/api/v1/open-day/check-in")
        .send({ ticketCode: "OD26-TEST-0001" })
        .expect(401);

      const studentRes = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ ticketCode: "OD26-TEST-0001" })
        .expect(403);
      expect(studentRes.body.error.code).toBe("FORBIDDEN");

      await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ ticketCode: "OD26-TEST-0001" })
        .expect(403);

      await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${tourEditorToken}`)
        .send({ ticketCode: "OD26-TEST-0001" })
        .expect(403);

      // Client tries to spoof checkedInBy
      await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .send({
          ticketCode: "OD26-TEST-0001",
          checkedInBy: studentUserId,
        })
        .expect(400);
    });

    it("11 & 13. Allows ADMIN and STAFF (EVENT_OPERATOR) to check-in and records AuditLog with authentic actor", async () => {
      const staffTicketCode = "OD26-M8ST-0001";
      const adminTicketCode = "OD26-M8AD-0001";

      const pStaff = await prisma.eventParticipation.create({
        data: {
          eventId: primaryEventId,
          userId: null,
          ticketCode: staffTicketCode,
          attendeeName: "Khách Checkin Bởi Staff",
          attendeeEmail: "staff.checkin.guest@poly.edu.vn",
          attendeePhone: "0911111111",
          participationStatus: "INVITED",
        },
      });

      const pAdmin = await prisma.eventParticipation.create({
        data: {
          eventId: primaryEventId,
          userId: null,
          ticketCode: adminTicketCode,
          attendeeName: "Khách Checkin Bởi Admin",
          attendeeEmail: "admin.checkin.guest@poly.edu.vn",
          attendeePhone: "0922222222",
          participationStatus: "CONFIRMED",
        },
      });

      // STAFF check-in using QR payload prefix TICKET:
      const staffRes = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .send({
          ticketCode: `TICKET:${staffTicketCode}`,
          eventId: primaryEventId,
        })
        .expect(200);

      expect(staffRes.body.success).toBe(true);
      expect(staffRes.body.data.status).toBe("CHECKED_IN_SUCCESS");
      expect(staffRes.body.data.checkedInBy).toBe(staffOperatorId);
      expect(staffRes.body.data.ticket.participationStatus).toBe("CHECKED_IN");

      // ADMIN check-in
      const adminRes = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ticketCode: adminTicketCode,
          eventId: primaryEventId,
        })
        .expect(200);

      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.status).toBe("CHECKED_IN_SUCCESS");
      expect(adminRes.body.data.checkedInBy).toBe(adminUserId);

      // Verify DB checkedInBy & AuditLog actor + no sensitive PII leak
      const [dbStaffTicket, dbAdminTicket, staffAudit, adminAudit] =
        await Promise.all([
          prisma.eventParticipation.findUniqueOrThrow({
            where: { id: pStaff.id },
          }),
          prisma.eventParticipation.findUniqueOrThrow({
            where: { id: pAdmin.id },
          }),
          prisma.auditLog.findFirstOrThrow({
            where: {
              action: "OPEN_DAY_CHECK_IN",
              resourceId: pStaff.id,
            },
          }),
          prisma.auditLog.findFirstOrThrow({
            where: {
              action: "OPEN_DAY_CHECK_IN",
              resourceId: pAdmin.id,
            },
          }),
        ]);

      expect(dbStaffTicket.checkedInBy).toBe(staffOperatorId);
      expect(dbAdminTicket.checkedInBy).toBe(adminUserId);

      expect(staffAudit.actorUserId).toBe(staffOperatorId);
      expect(staffAudit.actorUsername).toBe(staffOperatorUsername);
      expect(staffAudit.resourceType).toBe("event_participation");
      const staffDiff = staffAudit.diffJson as Record<string, unknown>;
      expect(staffDiff.ticketCode).toBe(staffTicketCode);
      expect(staffDiff.previousStatus).toBe("INVITED");
      expect(staffDiff.newStatus).toBe("CHECKED_IN");
      expect(staffDiff.checkedInBy).toBe(staffOperatorId);
      expect(JSON.stringify(staffDiff)).not.toContain("0911111111");
      expect(JSON.stringify(staffDiff)).not.toContain("staff.checkin.guest@poly.edu.vn");

      expect(adminAudit.actorUserId).toBe(adminUserId);
      expect(adminAudit.actorUsername).toBe("admin");
    });
  });

  // ==========================================================================
  // Test 1, 2, 3, 4, 5, 7, 8, 12: Core Business Rules & XP Ledger
  // ==========================================================================
  describe("Phase B — Business Rules, Validation & XP Ledger", () => {
    it("1, 7 & 8. Valid linked-user ticket awards exactly 50 XP once; retry returns ALREADY_CHECKED_IN and never duplicates XP", async () => {
      const linkedTicketCode = "OD26-M8XP-0001";
      const participation = await prisma.eventParticipation.create({
        data: {
          eventId: primaryEventId,
          userId: studentUserId,
          ticketCode: linkedTicketCode,
          attendeeName: "Sinh viên Nguyễn Văn A",
          attendeeEmail: "m8.student.1@poly.edu.vn",
          attendeePhone: "0933333333",
          participationStatus: "CONFIRMED",
        },
      });

      // First check-in -> 200 CHECKED_IN_SUCCESS + 50 XP
      const res1 = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .send({ ticketCode: linkedTicketCode, eventId: primaryEventId })
        .expect(200);

      expect(res1.body.success).toBe(true);
      expect(res1.body.data.status).toBe("CHECKED_IN_SUCCESS");
      expect(res1.body.data.xpReward.awarded).toBe(true);
      expect(res1.body.data.xpReward.amountXp).toBe(50);
      expect(res1.body.data.xpReward.userId).toBe(studentUserId);
      expect(res1.body.data.xpReward.reason).toBe("CHECKED_IN_REWARD");
      expect(res1.body.data.xpReward.idempotencyKey).toBe(
        `open-day:check-in:${primaryEventId}:${linkedTicketCode}`,
      );

      // Verify exactly 1 XpLedger entry created in PostgreSQL
      const ledgersAfterFirst = await prisma.xpLedger.findMany({
        where: { ticketCode: linkedTicketCode },
      });
      expect(ledgersAfterFirst).toHaveLength(1);
      expect(ledgersAfterFirst[0].amountXp).toBe(50);
      expect(ledgersAfterFirst[0].userId).toBe(studentUserId);
      expect(ledgersAfterFirst[0].source).toBe("CHECK_IN");
      expect(ledgersAfterFirst[0].referenceId).toBe(participation.id);
      expect(ledgersAfterFirst[0].idempotencyKey).toBe(
        `open-day:check-in:${primaryEventId}:${linkedTicketCode}`,
      );

      // 5 & 8. Retry check-in -> 409 ALREADY_CHECKED_IN and still exactly 1 XP ledger row
      const retryRes = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .send({ ticketCode: linkedTicketCode, eventId: primaryEventId })
        .expect(409);

      expect(retryRes.body.success).toBe(false);
      expect(retryRes.body.error.code).toBe("ALREADY_CHECKED_IN");

      const ledgersAfterRetry = await prisma.xpLedger.findMany({
        where: { ticketCode: linkedTicketCode },
      });
      expect(ledgersAfterRetry).toHaveLength(1);
    });

    it("12. Unlinked guest ticket (userId = null) checks in validly without assigning XP to staff or any other user", async () => {
      const guestTicketCode = "OD26-M8GU-0001";
      const participation = await prisma.eventParticipation.create({
        data: {
          eventId: primaryEventId,
          userId: null,
          ticketCode: guestTicketCode,
          attendeeName: "Khách tự do M8",
          attendeeEmail: "guest.unlinked.m8@gmail.com",
          attendeePhone: "0944444444",
          participationStatus: "CONFIRMED",
        },
      });

      const actorXpBefore = await prisma.xpLedger.count({
        where: { userId: staffOperatorId },
      });

      const res = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .send({ ticketCode: guestTicketCode, eventId: primaryEventId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("CHECKED_IN_SUCCESS");
      expect(res.body.data.ticket.participationStatus).toBe("CHECKED_IN");
      expect(res.body.data.xpReward).toEqual({
        awarded: false,
        amountXp: 0,
        userId: null,
        reason: "NO_LINKED_USER",
        ledgerId: null,
        idempotencyKey: null,
      });

      // Zero XpLedger rows created for this ticket or actor
      const [ticketLedgers, actorXpAfter, auditEntry] = await Promise.all([
        prisma.xpLedger.count({ where: { ticketCode: guestTicketCode } }),
        prisma.xpLedger.count({ where: { userId: staffOperatorId } }),
        prisma.auditLog.findFirstOrThrow({
          where: {
            action: "OPEN_DAY_CHECK_IN",
            resourceId: participation.id,
          },
        }),
      ]);

      expect(ticketLedgers).toBe(0);
      expect(actorXpAfter).toBe(actorXpBefore);

      const diff = auditEntry.diffJson as Record<string, unknown>;
      expect(diff.xpAwarded).toBe(false);
      expect(diff.xpAmount).toBe(0);
      expect(diff.xpRecipientUserId).toBeNull();
      expect(diff.xpReason).toBe("NO_LINKED_USER");
    });

    it("2. Non-existent ticket returns 404 INVALID_TICKET", async () => {
      const res = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: "OD26-DOES-NOTX", eventId: primaryEventId })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_TICKET");
    });

    it("3. Cancelled ticket returns 400 CANCELLED_TICKET and cannot check in", async () => {
      const cancelledCode = "OD26-M8CA-0001";
      await prisma.eventParticipation.create({
        data: {
          eventId: primaryEventId,
          userId: null,
          ticketCode: cancelledCode,
          attendeeName: "Khách đã hủy vé",
          attendeeEmail: "cancelled.m8@gmail.com",
          attendeePhone: "0955555555",
          participationStatus: "CANCELLED",
        },
      });

      const res = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: cancelledCode, eventId: primaryEventId })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CANCELLED_TICKET");

      const dbRow = await prisma.eventParticipation.findUniqueOrThrow({
        where: { ticketCode: cancelledCode },
      });
      expect(dbRow.participationStatus).toBe("CANCELLED");
      expect(dbRow.checkedInAt).toBeNull();
    });

    it("4. Wrong eventId returns 422 EVENT_MISMATCH and DRAFT event returns 422 INVALID_EVENT_STATUS", async () => {
      const secCode = "OD26-M8EV-0002";
      await prisma.eventParticipation.create({
        data: {
          eventId: secondaryEventId,
          userId: null,
          ticketCode: secCode,
          attendeeName: "Khách sự kiện khác",
          attendeeEmail: "secondary.m8@gmail.com",
          attendeePhone: "0966666666",
          participationStatus: "CONFIRMED",
        },
      });

      // Try checking secondary event ticket while booth is locked on primary event
      const mismatchRes = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: secCode, eventId: primaryEventId })
        .expect(422);

      expect(mismatchRes.body.success).toBe(false);
      expect(mismatchRes.body.error.code).toBe("EVENT_MISMATCH");

      // Ticket must remain CONFIRMED
      const dbSecRow = await prisma.eventParticipation.findUniqueOrThrow({
        where: { ticketCode: secCode },
      });
      expect(dbSecRow.participationStatus).toBe("CONFIRMED");

      // Draft event ticket cannot check in even without eventId override
      const draftTicketCode = "OD26-M8DR-0001";
      await prisma.eventParticipation.create({
        data: {
          eventId: draftEventId,
          userId: null,
          ticketCode: draftTicketCode,
          attendeeName: "Khách sự kiện nháp",
          attendeeEmail: "draft.m8@gmail.com",
          attendeePhone: "0977777777",
          participationStatus: "CONFIRMED",
        },
      });

      const draftRes = await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: draftTicketCode })
        .expect(422);

      expect(draftRes.body.success).toBe(false);
      expect(draftRes.body.error.code).toBe("INVALID_EVENT_STATUS");
    });
  });

  // ==========================================================================
  // Test 6 & 9: PostgreSQL Concurrency Race Condition & Atomic Rollback
  // ==========================================================================
  describe("Phase B — PostgreSQL Concurrency Lock & Transaction Rollback", () => {
    it("6. Two concurrent requests for the same ticket: PostgreSQL FOR UPDATE serializes them so strictly 1 succeeds and 1 returns 409 ALREADY_CHECKED_IN with only 1 XP ledger entry", async () => {
      const raceCode = "OD26-M8RC-0001";
      const participation = await prisma.eventParticipation.create({
        data: {
          eventId: secondaryEventId,
          userId: student2UserId,
          ticketCode: raceCode,
          attendeeName: "Sinh viên Trần Thị B",
          attendeeEmail: "m8.student.2@poly.edu.vn",
          attendeePhone: "0988888888",
          participationStatus: "CONFIRMED",
        },
      });

      // Install a controlled PostgreSQL advisory lock barrier on event_participations UPDATE
      // so Request 1 pauses inside its transaction while holding the FOR UPDATE row lock,
      // forcing Request 2 to wait at PostgreSQL kernel level on SELECT ... FOR UPDATE!
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_test_m8_race_barrier ON event_participations;`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test_m8_checkin_barrier();`);

      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION test_m8_checkin_barrier() RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.ticket_code = '${raceCode}' THEN
            PERFORM pg_advisory_xact_lock(777999);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trg_test_m8_race_barrier
        BEFORE UPDATE ON event_participations
        FOR EACH ROW EXECUTE FUNCTION test_m8_checkin_barrier();
      `);

      let releaseBarrier: () => void = () => {};
      const barrierPromise = new Promise<void>((resolve) => {
        releaseBarrier = resolve;
      });
      let holderAcquired: () => void = () => {};
      const holderReady = new Promise<void>((resolve) => {
        holderAcquired = resolve;
      });

      const holdingTx = prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(777999)`;
        holderAcquired();
        await barrierPromise;
      });

      try {
        await holderReady;

        // Fire Request 1 (ADMIN)
        let req1Done = false;
        const req1Promise = request(server)
          .post("/api/v1/open-day/check-in")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ticketCode: raceCode, eventId: secondaryEventId })
          .then((res) => {
            req1Done = true;
            return res;
          });

        // Wait until Request 1 reaches the trigger and holds the row lock
        let req1WaitingInTrigger = false;
        const t0 = Date.now();
        while (Date.now() - t0 < 3000) {
          const rows = await prisma.$queryRaw<Array<{ pid: number }>>`
            SELECT pid FROM pg_stat_activity
            WHERE wait_event_type = 'Lock' AND wait_event = 'advisory'
          `;
          if (rows.length > 0) {
            req1WaitingInTrigger = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 20));
        }
        expect(req1WaitingInTrigger).toBe(true);
        expect(req1Done).toBe(false);

        // Fire Request 2 (STAFF) concurrently while Request 1 holds the FOR UPDATE lock
        let req2Done = false;
        const req2Promise = request(server)
          .post("/api/v1/open-day/check-in")
          .set("Authorization", `Bearer ${staffOperatorToken}`)
          .send({ ticketCode: raceCode, eventId: secondaryEventId })
          .then((res) => {
            req2Done = true;
            return res;
          });

        // Verify Request 2 is blocked in PostgreSQL on SELECT ... FOR UPDATE
        let req2BlockedOnRowLock = false;
        const t1 = Date.now();
        while (Date.now() - t1 < 3000) {
          const rows = await prisma.$queryRaw<Array<{ pid: number }>>`
            SELECT pid FROM pg_stat_activity
            WHERE wait_event_type = 'Lock'
              AND query ILIKE '%event_participations%'
              AND query ILIKE '%FOR UPDATE%'
          `;
          if (rows.length > 0) {
            req2BlockedOnRowLock = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 20));
        }
        expect(req2BlockedOnRowLock).toBe(true);
        expect(req2Done).toBe(false);

        // Release barrier so Request 1 commits, then Request 2 proceeds
        releaseBarrier();
        await holdingTx;

        const [res1, res2] = await Promise.all([req1Promise, req2Promise]);
        const statuses = [res1.status, res2.status].sort();
        expect(statuses).toEqual([200, 409]);

        const winner = res1.status === 200 ? res1 : res2;
        const loser = res1.status === 409 ? res1 : res2;

        expect(winner.body.data.status).toBe("CHECKED_IN_SUCCESS");
        expect(winner.body.data.xpReward.awarded).toBe(true);
        expect(winner.body.data.xpReward.amountXp).toBe(50);

        expect(loser.body.success).toBe(false);
        expect(loser.body.error.code).toBe("ALREADY_CHECKED_IN");

        // Verify DB integrity: strictly 1 XP ledger & 1 audit log
        const [xpRows, auditRows, dbParticipation] = await Promise.all([
          prisma.xpLedger.findMany({ where: { ticketCode: raceCode } }),
          prisma.auditLog.findMany({
            where: {
              action: "OPEN_DAY_CHECK_IN",
              resourceId: participation.id,
            },
          }),
          prisma.eventParticipation.findUniqueOrThrow({
            where: { id: participation.id },
          }),
        ]);

        expect(xpRows).toHaveLength(1);
        expect(xpRows[0].amountXp).toBe(50);
        expect(xpRows[0].userId).toBe(student2UserId);
        expect(auditRows).toHaveLength(1);
        expect(dbParticipation.participationStatus).toBe("CHECKED_IN");
      } finally {
        releaseBarrier();
        await holdingTx.catch(() => undefined);
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_test_m8_race_barrier ON event_participations;`).catch(() => undefined);
        await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test_m8_checkin_barrier();`).catch(() => undefined);
      }
    });

    it("9. Failure when writing XpLedger rolls back the entire transaction (participation remains CONFIRMED, zero AuditLog, zero XP)", async () => {
      const rollbackStudent = await prisma.user.create({
        data: {
          username: "m8.student.rollback",
          fullName: "Sinh viên Rollback M8",
          email: "m8.rollback@poly.edu.vn",
          userType: "STUDENT",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "ADMIN_DIRECT",
        },
      });

      const rollbackCode = "OD26-M8RB-0001";
      const participation = await prisma.eventParticipation.create({
        data: {
          eventId: secondaryEventId,
          userId: rollbackStudent.id,
          ticketCode: rollbackCode,
          attendeeName: "Sinh viên Rollback M8",
          attendeeEmail: "m8.rollback@poly.edu.vn",
          attendeePhone: "0999999999",
          participationStatus: "CONFIRMED",
        },
      });

      // Inject PostgreSQL trigger failure on xp_ledgers INSERT
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION test_m8_fail_xp_insert() RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.ticket_code = '${rollbackCode}' THEN
            RAISE EXCEPTION 'Simulated PostgreSQL failure on xp_ledgers';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_test_m8_fail_xp ON xp_ledgers;`);
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trg_test_m8_fail_xp
        BEFORE INSERT ON xp_ledgers
        FOR EACH ROW EXECUTE FUNCTION test_m8_fail_xp_insert();
      `);

      try {
        await request(server)
          .post("/api/v1/open-day/check-in")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ ticketCode: rollbackCode, eventId: secondaryEventId })
          .expect(500);

        // Verify complete rollback in PostgreSQL
        const [dbTicket, xpCount, auditCount] = await Promise.all([
          prisma.eventParticipation.findUniqueOrThrow({
            where: { id: participation.id },
          }),
          prisma.xpLedger.count({ where: { ticketCode: rollbackCode } }),
          prisma.auditLog.count({
            where: {
              action: "OPEN_DAY_CHECK_IN",
              resourceId: participation.id,
            },
          }),
        ]);

        expect(dbTicket.participationStatus).toBe("CONFIRMED");
        expect(dbTicket.checkedInAt).toBeNull();
        expect(dbTicket.checkedInBy).toBeNull();
        expect(xpCount).toBe(0);
        expect(auditCount).toBe(0);
      } finally {
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_test_m8_fail_xp ON xp_ledgers;`).catch(() => undefined);
        await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test_m8_fail_xp_insert();`).catch(() => undefined);
      }
    });
  });

  // ==========================================================================
  // Test 14: Attendance Dashboard PostgreSQL Statistics Accuracy
  // ==========================================================================
  describe("Phase E — Attendance Dashboard Real PostgreSQL Metrics", () => {
    it("14. Computes exact Attendance Rate excluding CANCELLED tickets from valid ticket denominator", async () => {
      const campus = await prisma.campus.findFirstOrThrow();
      const statsEvent = await prisma.openDayEvent.create({
        data: {
          campusId: campus.id,
          eventKey: "open-day-m8-stats-verify",
          title: "Open Day Thống Kê M8",
          dateLabel: "25/12/2026",
          timeLabel: "08:00 - 16:00",
          status: "PUBLISHED",
        },
      });

      // Seed:
      // - 1 CONFIRMED
      // - 1 INVITED
      // - 2 CHECKED_IN (via API)
      // - 2 CANCELLED (must be excluded from totalValidTickets!)
      // => totalValidTickets = 4, totalCheckedIn = 2, totalNotCheckedIn = 2, totalCancelled = 2
      // => Attendance Rate = 2 / 4 * 100 = 50%
      await prisma.eventParticipation.createMany({
        data: [
          {
            eventId: statsEvent.id,
            ticketCode: "OD26-ST-0001",
            attendeeName: "Guest 1",
            participationStatus: "CONFIRMED",
          },
          {
            eventId: statsEvent.id,
            ticketCode: "OD26-ST-0002",
            attendeeName: "Guest 2",
            participationStatus: "INVITED",
          },
          {
            eventId: statsEvent.id,
            ticketCode: "OD26-ST-0003",
            attendeeName: "Guest 3",
            participationStatus: "CONFIRMED",
          },
          {
            eventId: statsEvent.id,
            ticketCode: "OD26-ST-0004",
            attendeeName: "Guest 4",
            participationStatus: "INVITED",
          },
          {
            eventId: statsEvent.id,
            ticketCode: "OD26-ST-0005",
            attendeeName: "Guest Cancelled 1",
            participationStatus: "CANCELLED",
          },
          {
            eventId: statsEvent.id,
            ticketCode: "OD26-ST-0006",
            attendeeName: "Guest Cancelled 2",
            participationStatus: "CANCELLED",
          },
        ],
      });

      // Check-in 2 valid tickets via real API
      await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .send({ ticketCode: "OD26-ST-0003", eventId: statsEvent.id })
        .expect(200);

      await request(server)
        .post("/api/v1/open-day/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: "OD26-ST-0004", eventId: statsEvent.id })
        .expect(200);

      // Verify dedicated stats endpoint
      const statsRes = await request(server)
        .get(`/api/v1/open-day/events/${statsEvent.id}/attendance-stats`)
        .set("Authorization", `Bearer ${staffOperatorToken}`)
        .expect(200);

      expect(statsRes.body.success).toBe(true);
      expect(statsRes.body.data).toEqual({
        eventId: statsEvent.id,
        eventTitle: "Open Day Thống Kê M8",
        totalAllTickets: 6,
        totalValidTickets: 4,
        totalInvited: 1,
        totalConfirmed: 1,
        totalCheckedIn: 2,
        totalNotCheckedIn: 2,
        totalCancelled: 2,
        attendanceRate: 50,
      });

      // Verify participations endpoint returns matching stats and RBAC rejects STUDENT
      const listRes = await request(server)
        .get(`/api/v1/admin/events/${statsEvent.id}/participations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(listRes.body.data.stats).toEqual(statsRes.body.data);
      expect(listRes.body.data.attendanceRate).toBe(50);

      await request(server)
        .get(`/api/v1/open-day/events/${statsEvent.id}/attendance-stats`)
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});

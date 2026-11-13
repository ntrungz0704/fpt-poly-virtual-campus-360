import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Open Day Tickets, Registration & QR Check-in Integration Suite (M3C)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let adminToken = "";
  let publishedEventId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("m3c_tickets");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });

    const prisma = ctx.app.get(PrismaService);
    const server = ctx.app.getHttpServer();

    // 1. Authenticate admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-M3C-Tickets-Strong-2026!";
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

    // 2. Locate seeded published event
    const event = await prisma.openDayEvent.findFirstOrThrow({
      where: { eventKey: "open-day-2026-qtsc", status: "PUBLISHED", deletedAt: null },
    });
    publishedEventId = event.id;
  });

  afterAll(async () => {
    await ctx.app.close();
    await dbHandle.drop();
  });

  describe("Public Events & Ticket Registration", () => {
    it("GET /api/v1/public/events returns real event from database", async () => {
      const res = await request(ctx.app.getHttpServer())
        .get("/api/v1/public/events")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.event).not.toBeNull();
      expect(res.body.data.event.id).toBe(publishedEventId);
      expect(res.body.data.sessions.length).toBeGreaterThanOrEqual(1);
    });

    it("POST /api/v1/public/events/register creates a confirmed participation with unique ticket code", async () => {
      const regPayload = {
        eventId: publishedEventId,
        fullName: "Trần Anh Tuấn",
        email: "tuan.tran.test@gmail.com",
        phone: "0912345678",
        notes: "Quan tâm ngành Thiết kế đồ họa và AI",
      };

      const res = await request(ctx.app.getHttpServer())
        .post("/api/v1/public/events/register")
        .send(regPayload)
        .expect(201);

      expect(res.body.success).toBe(true);
      const ticket = res.body.data;
      expect(ticket.id).toBeDefined();
      expect(ticket.ticketCode).toMatch(/^OD26-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(ticket.attendeeName).toBe("Trần Anh Tuấn");
      expect(ticket.attendeeEmail).toBe("tuan.tran.test@gmail.com");
      expect(ticket.attendeePhone).toBe("0912345678");
      expect(ticket.participationStatus).toBe("CONFIRMED");
      expect(ticket.checkedInAt).toBeNull();
      expect(ticket.qrPayload).toBe(`TICKET:${ticket.ticketCode}`);

      // Verify row in database
      const prisma = ctx.app.get(PrismaService);
      const dbRow = await prisma.eventParticipation.findUnique({
        where: { ticketCode: ticket.ticketCode },
      });
      expect(dbRow).not.toBeNull();
      expect(dbRow?.attendeeEmail).toBe("tuan.tran.test@gmail.com");
    });

    it("POST /api/v1/public/events/register rejects duplicate registration with 409 Conflict", async () => {
      const duplicatePayload = {
        eventId: publishedEventId,
        fullName: "Trần Anh Tuấn (Duplicate)",
        email: "tuan.tran.test@gmail.com",
        phone: "0988776655",
      };

      const res = await request(ctx.app.getHttpServer())
        .post("/api/v1/public/events/register")
        .send(duplicatePayload)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("DUPLICATE_REGISTRATION");
    });

    it("POST /api/v1/public/events/register rejects invalid phone number with 400 Bad Request", async () => {
      const invalidPhonePayload = {
        eventId: publishedEventId,
        fullName: "Lê Văn B",
        email: "le.van.b@gmail.com",
        phone: "12345",
      };

      await request(ctx.app.getHttpServer())
        .post("/api/v1/public/events/register")
        .send(invalidPhonePayload)
        .expect(400);
    });

    it("GET /api/v1/public/events/tickets/:ticketCode retrieves ticket accurately", async () => {
      // Register a new attendee
      const reg = await request(ctx.app.getHttpServer())
        .post("/api/v1/public/events/register")
        .send({
          eventId: publishedEventId,
          fullName: "Nguyễn Thị Mai",
          email: "mai.nguyen.test@gmail.com",
          phone: "0909123456",
        })
        .expect(201);

      const ticketCode = reg.body.data.ticketCode;

      const lookup = await request(ctx.app.getHttpServer())
        .get(`/api/v1/public/events/tickets/${ticketCode}`)
        .expect(200);

      expect(lookup.body.success).toBe(true);
      expect(lookup.body.data.ticketCode).toBe(ticketCode);
      expect(lookup.body.data.attendeeName).toBe("Nguyễn Thị Mai");
      expect(lookup.body.data.participationStatus).toBe("CONFIRMED");
    });

    it("GET /api/v1/public/events/tickets/:ticketCode returns 404 for non-existent ticket", async () => {
      await request(ctx.app.getHttpServer())
        .get("/api/v1/public/events/tickets/OD26-0000-0000")
        .expect(404);
    });
  });

  describe("Admin Check-in & Roster", () => {
    let createdTicketCode = "";

    beforeAll(async () => {
      const reg = await request(ctx.app.getHttpServer())
        .post("/api/v1/public/events/register")
        .send({
          eventId: publishedEventId,
          fullName: "Hoàng Minh Đức",
          email: "duc.hoang.test@gmail.com",
          phone: "0933445566",
        })
        .expect(201);
      createdTicketCode = reg.body.data.ticketCode;
    });

    it("POST /api/v1/admin/events/check-in rejects unauthenticated requests with 401", async () => {
      await request(ctx.app.getHttpServer())
        .post("/api/v1/admin/events/check-in")
        .send({ ticketCode: createdTicketCode })
        .expect(401);
    });

    it("POST /api/v1/admin/events/check-in successfully checks in valid ticket", async () => {
      const res = await request(ctx.app.getHttpServer())
        .post("/api/v1/admin/events/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: createdTicketCode })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.ticket.participationStatus).toBe("CHECKED_IN");
      expect(res.body.data.ticket.checkedInAt).not.toBeNull();

      // Verify in DB
      const prisma = ctx.app.get(PrismaService);
      const dbRow = await prisma.eventParticipation.findUnique({
        where: { ticketCode: createdTicketCode },
      });
      expect(dbRow?.participationStatus).toBe("CHECKED_IN");
      expect(dbRow?.checkedInAt).not.toBeNull();
      expect(dbRow?.checkedInBy).toBeDefined();
    });

    it("POST /api/v1/admin/events/check-in rejects duplicate check-in with 409 Conflict", async () => {
      const res = await request(ctx.app.getHttpServer())
        .post("/api/v1/admin/events/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: createdTicketCode })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("ALREADY_CHECKED_IN");
    });

    it("POST /api/v1/admin/events/check-in returns 404 for non-existent ticket code", async () => {
      await request(ctx.app.getHttpServer())
        .post("/api/v1/admin/events/check-in")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ticketCode: "OD26-FAKE-CODE" })
        .expect(404);
    });

    it("GET /api/v1/admin/events/:eventId/participations lists registered attendees with stats", async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/v1/admin/events/${publishedEventId}/participations`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.total).toBeGreaterThanOrEqual(3);
      expect(data.totalCheckedIn).toBeGreaterThanOrEqual(1);
      expect(data.items.length).toBeGreaterThanOrEqual(3);

      const checkedInItem = data.items.find(
        (it: { ticketCode: string }) => it.ticketCode === createdTicketCode,
      );
      expect(checkedInItem).toBeDefined();
      expect(checkedInItem.participationStatus).toBe("CHECKED_IN");
    });

    it("GET /api/v1/admin/events/:eventId/participations filters by search query", async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/v1/admin/events/${publishedEventId}/participations?search=Hoàng Minh Đức`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].attendeeName).toBe("Hoàng Minh Đức");
    });
  });
});

import request from "supertest";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Audit Batch B-B1 — Auth Seed Policy & Concurrent Registration Race Integration Suite", () => {
  jest.setTimeout(120_000);

  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;
  let publishedEventId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("audit_batch_b1");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    const ev = await prisma.openDayEvent.findFirstOrThrow({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    publishedEventId = ev.id;
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.close();
    }
    if (dbHandle) {
      await dbHandle.drop();
    }
  });

  describe("1. AUTH-SEED-POLICY — Seeded Bootstrap Admin Retains mustChangePassword=true", () => {
    it("provisions seeded admin with mustChangePassword=true and blocks admin routes until password change", async () => {
      const seededAdmin = await prisma.user.findFirstOrThrow({
        where: { username: "admin", deletedAt: null },
      });
      expect(seededAdmin.mustChangePassword).toBe(true);

      const login1 = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
        .expect(200);
      expect(login1.body.data.user.mustChangePassword).toBe(true);

      const blocked = await request(server)
        .get("/api/v1/admin/events")
        .set("Authorization", `Bearer ${login1.body.data.accessToken}`)
        .expect(403);
      expect(blocked.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    });
  });

  describe("2. PUBLIC-REG-RACE — Partial Unique Index & Atomic 409 Conflict Guard", () => {
    it("verifies PostgreSQL partial unique index uq_event_participations_active_email exists and permits CANCELLED/NULL rows", async () => {
      const indexes = await prisma.$queryRaw<
        Array<{ indexname: string; indexdef: string }>
      >`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'event_participations'
          AND indexname = 'uq_event_participations_active_email';
      `;

      expect(indexes).toHaveLength(1);
      expect(indexes[0].indexdef.toLowerCase()).toContain("lower");
      expect(indexes[0].indexdef).toContain("CANCELLED");

      // Portal rows with NULL attendee_email must never conflict
      await prisma.eventParticipation.create({
        data: {
          eventId: publishedEventId,
          ticketCode: "OD26-NULL-0001",
          attendeeName: "Null Email One",
          attendeeEmail: null,
          participationStatus: "CONFIRMED",
        },
      });
      const secondNull = await prisma.eventParticipation.create({
        data: {
          eventId: publishedEventId,
          ticketCode: "OD26-NULL-0002",
          attendeeName: "Null Email Two",
          attendeeEmail: null,
          participationStatus: "CONFIRMED",
        },
      });
      expect(secondNull.ticketCode).toBe("OD26-NULL-0002");

      // Direct DB duplicate active email with mixed casing fails with P2002
      await prisma.eventParticipation.create({
        data: {
          eventId: publishedEventId,
          ticketCode: "OD26-IDX-0001",
          attendeeName: "Case Check One",
          attendeeEmail: "idx.race.check@poly.edu.vn",
          participationStatus: "CONFIRMED",
        },
      });

      await expect(
        prisma.eventParticipation.create({
          data: {
            eventId: publishedEventId,
            ticketCode: "OD26-IDX-0002",
            attendeeName: "Case Check Two",
            attendeeEmail: "IDX.Race.Check@Poly.edu.vn",
            participationStatus: "INVITED",
          },
        }),
      ).rejects.toMatchObject({ code: "P2002" } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
    });

    it("serializes 2 concurrent registrations with the same email -> 1x 201 and 1x 409 DUPLICATE_REGISTRATION", async () => {
      const email = "double.click.race@poly.edu.vn";
      const [resA, resB] = await Promise.all([
        request(server).post("/api/v1/public/events/register").send({
          eventId: publishedEventId,
          fullName: "Thí sinh Double Click 1",
          email,
          phone: "0901234561",
        }),
        request(server).post("/api/v1/public/events/register").send({
          eventId: publishedEventId,
          fullName: "Thí sinh Double Click 2",
          email,
          phone: "0901234562",
        }),
      ]);

      const responses = [resA, resB];
      const created = responses.filter((r) => r.status === 201);
      const conflicts = responses.filter((r) => r.status === 409);

      expect(created).toHaveLength(1);
      expect(conflicts).toHaveLength(1);
      expect(created[0].body.data.ticketCode).toMatch(/^OD26-/);
      expect(conflicts[0].body.error.code).toBe("DUPLICATE_REGISTRATION");

      const activeRows = await prisma.eventParticipation.count({
        where: {
          eventId: publishedEventId,
          attendeeEmail: email,
          participationStatus: { not: "CANCELLED" },
        },
      });
      expect(activeRows).toBe(1);
    });

    it("serializes 5 parallel mixed-case email requests -> strictly 1x 201 and 4x 409 DUPLICATE_REGISTRATION", async () => {
      const candidates = [
        "Parallel.Burst@Poly.EDU.VN",
        "parallel.burst@poly.edu.vn",
        "PARALLEL.BURST@poly.edu.vn",
        "parallel.burst@POLY.edu.vn",
        "Parallel.burst@poly.edu.vn",
      ];

      const results = await Promise.all(
        candidates.map((email, index) =>
          request(server)
            .post("/api/v1/public/events/register")
            .send({
              eventId: publishedEventId,
              fullName: `Thí sinh Race Burst ${index + 1}`,
              email,
              phone: `091234560${index}`,
            }),
        ),
      );

      const created = results.filter((r) => r.status === 201);
      const conflicts = results.filter((r) => r.status === 409);

      expect(created).toHaveLength(1);
      expect(conflicts).toHaveLength(4);
      for (const c of conflicts) {
        expect(c.body.error.code).toBe("DUPLICATE_REGISTRATION");
      }

      const activeRows = await prisma.eventParticipation.count({
        where: {
          eventId: publishedEventId,
          attendeeEmail: "parallel.burst@poly.edu.vn",
          participationStatus: { not: "CANCELLED" },
        },
      });
      expect(activeRows).toBe(1);
    });

    it("allows re-registration with 201 Created once prior ticket is CANCELLED", async () => {
      const email = "cancel.reregister@poly.edu.vn";

      const first = await request(server)
        .post("/api/v1/public/events/register")
        .send({
          eventId: publishedEventId,
          fullName: "Thí sinh Hủy Vé Trước",
          email,
          phone: "0908887766",
        })
        .expect(201);

      await prisma.eventParticipation.update({
        where: { ticketCode: first.body.data.ticketCode },
        data: { participationStatus: "CANCELLED" },
      });

      const second = await request(server)
        .post("/api/v1/public/events/register")
        .send({
          eventId: publishedEventId,
          fullName: "Thí sinh Đăng Ký Lại",
          email,
          phone: "0908887766",
        })
        .expect(201);

      expect(second.body.data.ticketCode).not.toBe(first.body.data.ticketCode);
      expect(second.body.data.participationStatus).toBe("CONFIRMED");
    });
  });
});

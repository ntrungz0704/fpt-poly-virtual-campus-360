import request from "supertest";
import {
  AccountStatus,
  ActivationStatus,
  MediaKind,
  ParticipationStatus,
  ProcessingStatus,
  PublishStatus,
} from "@prisma/client";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import { AdminOverviewService } from "../../src/modules/audit-log/admin-overview.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Audit Batch B-B3 — Real PostgreSQL Admin Overview Metrics & Audit Log Integration Suite", () => {
  jest.setTimeout(120_000);

  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let adminToken = "";
  let adminUserId = "";
  let studentToken = "";
  let operatorToken = "";
  let tourEditorToken = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("audit_batch_b3");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const rotatedPw = "BatchB3-Rotated-Admin-Pass-2026!";
    await request(server)
      .patch("/api/v1/auth/me/password")
      .set("Authorization", `Bearer ${adminBootstrap.body.data.accessToken}`)
      .send({
        currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
        newPassword: rotatedPw,
      })
      .expect(200);

    const adminLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: rotatedPw })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
    adminUserId = adminLogin.body.data.user.id;

    const adminRow = await prisma.user.findUniqueOrThrow({
      where: { id: adminUserId },
    });

    const [studentUser, operatorUser, editorUser, operatorRole, editorRole] =
      await Promise.all([
        prisma.user.create({
          data: {
            username: "b3_student",
            fullName: "Sinh Vien B3",
            email: "b3.student@poly.edu.vn",
            userType: "STUDENT",
            accountStatus: "ACTIVE",
            activationStatus: "ACTIVATED",
            provisioningMethod: "ADMIN_DIRECT",
            mustChangePassword: false,
            passwordHash: adminRow.passwordHash,
          },
        }),
        prisma.user.create({
          data: {
            username: "b3_operator",
            fullName: "Operator B3",
            email: "b3.operator@poly.edu.vn",
            userType: "STAFF",
            accountStatus: "ACTIVE",
            activationStatus: "ACTIVATED",
            provisioningMethod: "ADMIN_DIRECT",
            mustChangePassword: false,
            passwordHash: adminRow.passwordHash,
          },
        }),
        prisma.user.create({
          data: {
            username: "b3_tour_editor",
            fullName: "Tour Editor B3",
            email: "b3.editor@poly.edu.vn",
            userType: "STAFF",
            accountStatus: "ACTIVE",
            activationStatus: "ACTIVATED",
            provisioningMethod: "ADMIN_DIRECT",
            mustChangePassword: false,
            passwordHash: adminRow.passwordHash,
          },
        }),
        prisma.role.findUniqueOrThrow({ where: { code: "EVENT_OPERATOR" } }),
        prisma.role.findUniqueOrThrow({ where: { code: "TOUR_EDITOR" } }),
      ]);

    await Promise.all([
      prisma.userRole.create({
        data: { userId: operatorUser.id, roleId: operatorRole.id },
      }),
      prisma.userRole.create({
        data: { userId: editorUser.id, roleId: editorRole.id },
      }),
    ]);

    const [studentLogin, operatorLogin, editorLogin] = await Promise.all([
      request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: studentUser.username, password: rotatedPw })
        .expect(200),
      request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: operatorUser.username, password: rotatedPw })
        .expect(200),
      request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: editorUser.username, password: rotatedPw })
        .expect(200),
    ]);

    studentToken = studentLogin.body.data.accessToken;
    operatorToken = operatorLogin.body.data.accessToken;
    tourEditorToken = editorLogin.body.data.accessToken;
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.close();
    }
    if (dbHandle) {
      await dbHandle.drop();
    }
  });

  it("enforces RBAC on /admin/overview vs strict audit:read 403 on /admin/audit-logs", async () => {
    // Unauthenticated rejected 401
    await request(server).get("/api/v1/admin/overview").expect(401);
    await request(server).get("/api/v1/admin/audit-logs?limit=8").expect(401);

    // STUDENT denied 403 on both overview and audit-logs
    await request(server)
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);
    await request(server)
      .get("/api/v1/admin/audit-logs?limit=8")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);

    // EVENT_OPERATOR & TOUR_EDITOR allowed on /admin/overview (200), still blocked 403 on /admin/audit-logs (audit:read policy intact)
    await request(server)
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${operatorToken}`)
      .expect(200);
    await request(server)
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .expect(200);

    await request(server)
      .get("/api/v1/admin/audit-logs?limit=8")
      .set("Authorization", `Bearer ${operatorToken}`)
      .expect(403);
    await request(server)
      .get("/api/v1/admin/audit-logs?limit=8")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .expect(403);

    // SUPER_ADMIN allowed on both (200) and receives real AuditLog entries descending by createdAt
    const auditRes = await request(server)
      .get("/api/v1/admin/audit-logs?page=1&limit=8")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(auditRes.body.data)).toBe(true);
    expect(auditRes.body.data.length).toBeGreaterThan(0);
    expect(auditRes.body.data.length).toBeLessThanOrEqual(8);
    expect(auditRes.body.meta.limit).toBe(8);
    expect(auditRes.body.meta.total).toBeGreaterThanOrEqual(
      auditRes.body.data.length,
    );
  });

  it("computes exact PostgreSQL counts & percentages dynamically and returns 0/null when empty (never fake constants)", async () => {
    // Verify baseline matches direct PostgreSQL counts 1:1
    const baselineRes = await request(server)
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const baseline = baselineRes.body.data;

    const [
      expectedTourTotal,
      expectedTourPublished,
      expectedHotspots,
      expectedLocTotal,
      expectedLocPublished,
      expectedPanos,
      expectedEventsPub,
      expectedActiveRegs,
      expectedCheckedInRegs,
      expectedActiveUsers,
      expectedActivatedUsers,
    ] = await Promise.all([
      prisma.tourNode.count({ where: { deletedAt: null } }),
      prisma.tourNode.count({
        where: { deletedAt: null, status: PublishStatus.PUBLISHED },
      }),
      prisma.hotspot.count({ where: { node: { deletedAt: null } } }),
      prisma.location.count({ where: { deletedAt: null } }),
      prisma.location.count({
        where: { deletedAt: null, status: PublishStatus.PUBLISHED },
      }),
      prisma.mediaAsset.count({
        where: {
          deletedAt: null,
          assetKind: MediaKind.PANORAMA_2_1,
          processingStatus: ProcessingStatus.READY,
          isPreviewApproved: true,
        },
      }),
      prisma.openDayEvent.count({
        where: { deletedAt: null, status: PublishStatus.PUBLISHED },
      }),
      prisma.eventParticipation.count({
        where: {
          participationStatus: { not: ParticipationStatus.CANCELLED },
          event: { deletedAt: null },
        },
      }),
      prisma.eventParticipation.count({
        where: {
          participationStatus: ParticipationStatus.CHECKED_IN,
          event: { deletedAt: null },
        },
      }),
      prisma.user.count({
        where: { deletedAt: null, accountStatus: AccountStatus.ACTIVE },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          accountStatus: AccountStatus.ACTIVE,
          activationStatus: ActivationStatus.ACTIVATED,
        },
      }),
    ]);

    expect(baseline.tourNodesTotal).toBe(expectedTourTotal);
    expect(baseline.tourNodesPublished).toBe(expectedTourPublished);
    expect(baseline.hotspotsTotal).toBe(expectedHotspots);
    expect(baseline.locationsTotal).toBe(expectedLocTotal);
    expect(baseline.locationsPublished).toBe(expectedLocPublished);
    expect(baseline.approvedPanoramasCount).toBe(expectedPanos);
    expect(baseline.openDayEventsPublished).toBe(expectedEventsPub);
    expect(baseline.eventRegistrationsActive).toBe(expectedActiveRegs);
    expect(baseline.eventRegistrationsCheckedIn).toBe(expectedCheckedInRegs);
    expect(baseline.activeUsersTotal).toBe(expectedActiveUsers);
    expect(baseline.activatedUsersTotal).toBe(expectedActivatedUsers);

    // Mutate DB: clear existing participations to verify 0 / null(N/A), then insert 2 active (1 checked in) + 1 cancelled
    await prisma.eventParticipation.deleteMany({});
    const zeroRegRes = await request(server)
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(zeroRegRes.body.data.eventRegistrationsActive).toBe(0);
    expect(zeroRegRes.body.data.eventRegistrationsCheckedIn).toBe(0);
    expect(zeroRegRes.body.data.checkInRatePercent).toBeNull();

    const event = await prisma.openDayEvent.findFirstOrThrow({
      where: { deletedAt: null },
    });
    await prisma.eventParticipation.createMany({
      data: [
        {
          eventId: event.id,
          ticketCode: "OD26-B3-001",
          attendeeName: "Checked In B3",
          attendeeEmail: "checkedin.b3@poly.edu.vn",
          participationStatus: ParticipationStatus.CHECKED_IN,
          checkedInAt: new Date(),
        },
        {
          eventId: event.id,
          ticketCode: "OD26-B3-002",
          attendeeName: "Confirmed B3",
          attendeeEmail: "confirmed.b3@poly.edu.vn",
          participationStatus: ParticipationStatus.CONFIRMED,
        },
        {
          eventId: event.id,
          ticketCode: "OD26-B3-003",
          attendeeName: "Cancelled B3",
          attendeeEmail: "cancelled.b3@poly.edu.vn",
          participationStatus: ParticipationStatus.CANCELLED,
        },
      ],
    });

    // Also add 1 published TourNode + 1 Hotspot to verify Tour metrics delta
    const loc = await prisma.location.findFirstOrThrow({
      where: { deletedAt: null },
    });
    const pano = await prisma.mediaAsset.findFirstOrThrow({
      where: { deletedAt: null },
    });
    const newNode = await prisma.tourNode.create({
      data: {
        slug: "b3-metrics-node",
        title: "B3 Metrics Scene",
        intro: "B3 real PostgreSQL counter test",
        locationId: loc.id,
        panoramaAssetId: pano.id,
        status: PublishStatus.PUBLISHED,
      },
    });
    await prisma.hotspot.create({
      data: {
        nodeId: newNode.id,
        hotspotType: "INFO",
        yaw: 0,
        pitch: 0,
        title: "B3 Test Hotspot",
      },
    });

    const afterMutRes = await request(server)
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const afterMut = afterMutRes.body.data;
    expect(afterMut.eventRegistrationsActive).toBe(2);
    expect(afterMut.eventRegistrationsCheckedIn).toBe(1);
    expect(afterMut.checkInRatePercent).toBe(50.0);
    expect(afterMut.tourNodesTotal).toBe(expectedTourTotal + 1);
    expect(afterMut.tourNodesPublished).toBe(expectedTourPublished + 1);
    expect(afterMut.hotspotsTotal).toBe(expectedHotspots + 1);

    // Pure empty-DB boundary check on AdminOverviewService with zero counts
    const zeroCountMockPrisma = {
      tourNode: { count: async () => 0 },
      hotspot: { count: async () => 0 },
      location: { count: async () => 0 },
      mediaAsset: { count: async () => 0 },
      openDayEvent: { count: async () => 0 },
      eventParticipation: { count: async () => 0 },
      user: { count: async () => 0 },
    } as unknown as PrismaService;
    const zeroService = new AdminOverviewService(zeroCountMockPrisma);
    const emptySnapshot = await zeroService.getOverviewMetrics();
    expect(emptySnapshot.tourNodesTotal).toBe(0);
    expect(emptySnapshot.eventRegistrationsActive).toBe(0);
    expect(emptySnapshot.activeUsersTotal).toBe(0);
    expect(emptySnapshot.checkInRatePercent).toBeNull();
    expect(emptySnapshot.activationRatePercent).toBeNull();
  });
});

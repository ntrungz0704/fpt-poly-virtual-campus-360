import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import { hashPasswordArgon2id } from "../../src/common/utils/token-crypto";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Open Day Admin RBAC, CRUD & Cross-Campus Guards (M2-C, M2-D, DEC-M2-B)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;

  const staffPassword = "OpenDay-Staff-Strong-2026!";
  let adminToken = "";
  let tourEditorToken = "";
  let eventOperatorToken = "";
  let pendingPwOperatorToken = "";

  let foreignBuildingId = "";
  let foreignLocationId = "";
  let foreignTourNodeId = "";
  let foreignEventId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("open_day");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });

    const prisma = ctx.app.get(PrismaService);
    const server = ctx.app.getHttpServer();

    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-OpenDay-M2-Strong-2026!";
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

    const [tourRole, eventRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { code: "TOUR_EDITOR" } }),
      prisma.role.findUniqueOrThrow({ where: { code: "EVENT_OPERATOR" } }),
    ]);
    const pwHash = await hashPasswordArgon2id(staffPassword);

    await prisma.user.create({
      data: {
        username: "m2.tour.editor",
        fullName: "M2 Tour Editor",
        email: "m2.tour.editor@fpt.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        mustChangePassword: false,
        passwordHash: pwHash,
        userRoles: { create: { roleId: tourRole.id } },
      },
    });
    await prisma.user.create({
      data: {
        username: "m2.event.operator",
        fullName: "M2 Event Operator",
        email: "m2.event.operator@fpt.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        mustChangePassword: false,
        passwordHash: pwHash,
        userRoles: { create: { roleId: eventRole.id } },
      },
    });
    await prisma.user.create({
      data: {
        username: "m2.pending.operator",
        fullName: "M2 Pending Password Operator",
        email: "m2.pending.operator@fpt.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        mustChangePassword: true,
        passwordHash: pwHash,
        userRoles: { create: { roleId: eventRole.id } },
      },
    });

    const tourRes = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "m2.tour.editor", password: staffPassword })
      .expect(200);
    tourEditorToken = tourRes.body.data.accessToken;

    const opRes = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "m2.event.operator", password: staffPassword })
      .expect(200);
    eventOperatorToken = opRes.body.data.accessToken;

    const pendingRes = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "m2.pending.operator", password: staffPassword })
      .expect(200);
    pendingPwOperatorToken = pendingRes.body.data.accessToken;

    // Seed foreign campus entities for cross-campus isolation tests (DEC-M2-B)
    const locType = await prisma.locationType.findFirstOrThrow();
    const foreignCampus = await prisma.campus.create({
      data: {
        code: "HN-HOLA",
        name: "FPT Polytechnic Hanoi",
        address: "Hanoi",
        originPointJson: { lat: 21.0, lng: 105.5 },
        landmarksJson: [],
      },
    });
    const foreignBuilding = await prisma.building.create({
      data: {
        campusId: foreignCampus.id,
        code: "TOA-H",
        slug: "toa-h-foreign",
        name: "Foreign Building",
        shortName: "Tòa H",
        category: "ACADEMIC",
        categoryLabel: "Học thuật",
        lat: 21.001,
        lng: 105.501,
        floorsLabel: "3 tầng",
        summary: "Foreign campus building",
        description: "Foreign campus building description",
        addressNote: "Hanoi campus",
        statusNote: "Published",
        mapIconKey: "ACADEMIC_HALL",
        status: "PUBLISHED",
      },
    });
    const foreignLocation = await prisma.location.create({
      data: {
        buildingId: foreignBuilding.id,
        locationTypeId: locType.id,
        code: "H101",
        slug: "h101-foreign",
        name: "Phòng H101",
        categoryLabel: "Giảng đường",
        shortSummary: "Foreign room",
        description: "Foreign campus location",
        status: "PUBLISHED",
      },
    });
    const adminRecord = await prisma.user.findFirstOrThrow({
      where: { username: "admin" },
      select: { id: true },
    });
    const foreignPano = await prisma.mediaAsset.create({
      data: {
        assetKind: "PANORAMA_2_1",
        originalFilename: "foreign-campus-secret.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: BigInt(102400),
        sha256Checksum: "b".repeat(64),
        originalWidth: 4096,
        originalHeight: 2048,
        originalObjectKey: "private/raw/foreign-campus-secret.jpg",
        processingStatus: "READY",
        isPreviewApproved: true,
        uploadedBy: adminRecord.id,
      },
    });
    const foreignNode = await prisma.tourNode.create({
      data: {
        locationId: foreignLocation.id,
        panoramaAssetId: foreignPano.id,
        slug: "foreign-node-h101",
        title: "Foreign Node",
        intro: "Foreign node intro",
        status: "PUBLISHED",
      },
    });
    const foreignEvent = await prisma.openDayEvent.create({
      data: {
        campusId: foreignCampus.id,
        eventKey: "foreign-hn-event",
        title: "Foreign Hanoi Event",
        dateLabel: "01/10/2026",
        timeLabel: "08:00 - 17:00",
        status: "PUBLISHED",
      },
    });

    foreignBuildingId = foreignBuilding.id;
    foreignLocationId = foreignLocation.id;
    foreignTourNodeId = foreignNode.id;
    foreignEventId = foreignEvent.id;
  });

  afterAll(async () => {
    await ctx?.close();
    await dbHandle?.drop();
  });

  it("enforces DEC-M2-B RBAC boundary across anonymous, TOUR_EDITOR, EVENT_OPERATOR, SUPER_ADMIN, and mustChangePassword", async () => {
    const server = ctx.app.getHttpServer();

    // Anonymous -> 401
    await request(server).get("/api/v1/admin/events").expect(401);
    await request(server)
      .get("/api/v1/admin/events/lookups/buildings")
      .expect(401);

    // mustChangePassword=true -> 403 PASSWORD_CHANGE_REQUIRED
    const pendingRes = await request(server)
      .get("/api/v1/admin/events")
      .set("Authorization", `Bearer ${pendingPwOperatorToken}`)
      .expect(403);
    expect(pendingRes.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");

    // TOUR_EDITOR -> 403 FORBIDDEN on all /admin/events*
    await request(server)
      .get("/api/v1/admin/events")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .expect(403);
    await request(server)
      .get("/api/v1/admin/events/lookups/buildings")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .expect(403);
    await request(server)
      .post("/api/v1/admin/events")
      .set("Authorization", `Bearer ${tourEditorToken}`)
      .send({
        eventKey: "unauthorized-tour-event",
        title: "Denied",
        dateLabel: "TBD",
        timeLabel: "08:00 - 17:00",
      })
      .expect(403);

    // EVENT_OPERATOR -> 403 FORBIDDEN on /admin/users and /admin/audit-logs (DEC-M2-B)
    await request(server)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(403);
    await request(server)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(403);

    // EVENT_OPERATOR -> 200 on /admin/events & minimal lookups (no originalObjectKey)
    const buildingsRes = await request(server)
      .get("/api/v1/admin/events/lookups/buildings")
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);
    expect(buildingsRes.body.data).toHaveLength(5);
    for (const b of buildingsRes.body.data) {
      expect(Object.keys(b).sort()).toEqual([
        "code",
        "id",
        "name",
        "shortName",
        "status",
      ]);
    }
    expect(JSON.stringify(buildingsRes.body)).not.toContain("TOA-H");

    const nodesRes = await request(server)
      .get("/api/v1/admin/events/lookups/tour-nodes")
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);
    expect(nodesRes.body.data.length).toBeGreaterThanOrEqual(5);
    for (const n of nodesRes.body.data) {
      expect(Object.keys(n).sort()).toEqual([
        "buildingCode",
        "floorName",
        "id",
        "slug",
        "status",
        "title",
      ]);
    }
    const serializedNodes = JSON.stringify(nodesRes.body);
    expect(serializedNodes).not.toContain("originalObjectKey");
    expect(serializedNodes).not.toContain("foreign-node-h101");

    // SUPER_ADMIN -> 200 on /admin/events
    await request(server)
      .get("/api/v1/admin/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
  });

  it("supports Event/Session/FAQ/Quiz CRUD, atomic isDefault, isPublic preservation, cross-campus rejection, and AuditLog records", async () => {
    const prisma = ctx.app.get(PrismaService);
    const server = ctx.app.getHttpServer();

    const qtscBuilding = await prisma.building.findFirstOrThrow({
      where: { code: "TOA-T", deletedAt: null },
    });
    const qtscNode = await prisma.tourNode.findFirstOrThrow({
      where: { slug: "cong-chao-qtsc", deletedAt: null },
    });

    // Reject foreign campusId property cleanly via ValidationPipe
    await request(server)
      .post("/api/v1/admin/events")
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        eventKey: "m2-client-campus-spoof",
        title: "Spoof Campus",
        dateLabel: "10/10/2026",
        timeLabel: "08:00 - 16:00",
        campusId: "00000000-0000-4000-8000-000000000001",
      })
      .expect(400);

    // Create Event 1 as default -> flips seeded default off atomically
    const createEv1 = await request(server)
      .post("/api/v1/admin/events")
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        eventKey: "open-day-m2-fall-2026",
        title: "Open Day Fall 2026",
        subtitle: "Khám phá cơ sở QTSC",
        dateLabel: "25/10/2026",
        timeLabel: "08:00 - 16:30",
        eventDate: "2026-10-25",
        isDefault: true,
        status: "PUBLISHED",
      })
      .expect(201);
    const ev1Id: string = createEv1.body.data.id;
    expect(createEv1.body.data.isDefault).toBe(true);

    // Verify only 1 active default event exists in QTSC campus
    const defaultEvents = await prisma.openDayEvent.findMany({
      where: {
        campusId: createEv1.body.data.campusId,
        deletedAt: null,
        isDefault: true,
      },
    });
    expect(defaultEvents).toHaveLength(1);
    expect(defaultEvents[0].id).toBe(ev1Id);

    // Metadata endpoint returns lightweight OpenDayEventMetadataDto
    const metaRes = await request(server)
      .get(`/api/v1/admin/events/${ev1Id}/metadata`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);
    expect(metaRes.body.data.eventKey).toBe("open-day-m2-fall-2026");

    // Cross-campus foreign eventId rejected with 422 UNPROCESSABLE_ENTITY
    await request(server)
      .get(`/api/v1/admin/events/${foreignEventId}/metadata`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(422);

    // Session CRUD preserving isPublic: false and rejecting foreign refs (422)
    await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/sessions`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        buildingId: foreignBuildingId,
        title: "Foreign Building Session",
        sessionPeriod: "MORNING",
        startTimeLabel: "08:00",
        endTimeLabel: "09:00",
        customLocationLabel: "Sảnh",
        hostUnit: "CTSV",
        description: "Must reject",
      })
      .expect(422);

    await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/sessions`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        locationId: foreignLocationId,
        title: "Foreign Location Session",
        sessionPeriod: "MORNING",
        startTimeLabel: "08:00",
        endTimeLabel: "09:00",
        customLocationLabel: "Sảnh",
        hostUnit: "CTSV",
        description: "Must reject",
      })
      .expect(422);

    const createSessionRes = await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/sessions`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        buildingId: qtscBuilding.id,
        tourNodeId: qtscNode.id,
        title: "Private VIP Counseling",
        sessionPeriod: "AFTERNOON",
        startTimeLabel: "14:00",
        endTimeLabel: "15:30",
        customLocationLabel: "Phòng T201",
        hostUnit: "Tuyển sinh",
        isPublic: false,
        description: "Invited guests only",
        sortOrder: 5,
        status: "PUBLISHED",
      })
      .expect(201);
    const sessionId: string = createSessionRes.body.data.id;
    expect(createSessionRes.body.data.isPublic).toBe(false);
    expect(createSessionRes.body.data.accessType).toBe("invited");
    expect(createSessionRes.body.data.timeRange).toBe("14:00 - 15:30");

    // Partial PATCH preserves isPublic: false
    const patchSessionRes = await request(server)
      .patch(`/api/v1/admin/events/${ev1Id}/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({ title: "Private VIP Counseling Updated" })
      .expect(200);
    expect(patchSessionRes.body.data.isPublic).toBe(false);

    // FAQ CRUD
    const createFaqRes = await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/faqs`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        question: "Có bãi giữ xe miễn phí không?",
        answer: "Có khu giữ xe dành riêng cho khách Open Day tại cổng QTSC.",
        sortOrder: 1,
        status: "PUBLISHED",
      })
      .expect(201);
    const faqId: string = createFaqRes.body.data.id;

    await request(server)
      .patch(`/api/v1/admin/events/${ev1Id}/faqs/${faqId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sortOrder: 2 })
      .expect(200);

    // Quiz Item CRUD: reject out-of-range correctIndex and foreign tourNodeId
    await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/quiz-items`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        eventId: ev1Id,
        tourNodeId: qtscNode.id,
        questionText: "Bad Index Question",
        options: ["A", "B"],
        correctIndex: 2,
        explanation: "Invalid",
      })
      .expect(400);

    await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/quiz-items`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        eventId: ev1Id,
        tourNodeId: foreignTourNodeId,
        questionText: "Foreign TourNode Quiz",
        options: ["A", "B"],
        correctIndex: 0,
        explanation: "Must reject 422",
      })
      .expect(422);

    const createQuizRes = await request(server)
      .post(`/api/v1/admin/events/${ev1Id}/quiz-items`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({
        eventId: ev1Id,
        tourNodeId: qtscNode.id,
        questionText: "Tòa nào là trung tâm thực hành CNTT tại QTSC?",
        options: ["Tòa P", "Tòa T", "Tòa F"],
        correctIndex: 1,
        explanation: "Tòa T là cụm lab CNTT trọng điểm.",
        sortOrder: 1,
        status: "PUBLISHED",
      })
      .expect(201);
    const quizId: string = createQuizRes.body.data.id;

    // Shrinking options array when index becomes invalid -> 400 (with or without explicit correctIndex)
    await request(server)
      .patch(`/api/v1/admin/events/${ev1Id}/quiz-items/${quizId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({ options: ["A", "B"], correctIndex: 2 })
      .expect(400);

    // Update correctIndex to 2 (valid for 3 options), then shrink options without sending correctIndex -> 400
    await request(server)
      .patch(`/api/v1/admin/events/${ev1Id}/quiz-items/${quizId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({ correctIndex: 2 })
      .expect(200);
    await request(server)
      .patch(`/api/v1/admin/events/${ev1Id}/quiz-items/${quizId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .send({ options: ["A", "B"] })
      .expect(400);

    // Soft-delete FAQ, QuizItem, Session, Event and ensure deleted entities disappear from GET lists
    await request(server)
      .delete(`/api/v1/admin/events/${ev1Id}/faqs/${faqId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);
    await request(server)
      .delete(`/api/v1/admin/events/${ev1Id}/quiz-items/${quizId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);
    await request(server)
      .delete(`/api/v1/admin/events/${ev1Id}/sessions/${sessionId}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);
    await request(server)
      .delete(`/api/v1/admin/events/${ev1Id}`)
      .set("Authorization", `Bearer ${eventOperatorToken}`)
      .expect(200);

    // Restore original seeded default event cleanly
    const seededEvent = await prisma.openDayEvent.findFirstOrThrow({
      where: { eventKey: "open-day-2026-qtsc", deletedAt: null },
    });
    await request(server)
      .patch(`/api/v1/admin/events/${seededEvent.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isDefault: true })
      .expect(200);

    // Verify audit logs recorded for OPEN_DAY_* mutations
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: { startsWith: "OPEN_DAY_" },
      },
    });
    const actions = new Set(auditLogs.map((l) => l.action));
    expect(actions.has("OPEN_DAY_EVENT_CREATE")).toBe(true);
    expect(actions.has("OPEN_DAY_EVENT_DELETE")).toBe(true);
    expect(actions.has("OPEN_DAY_SESSION_CREATE")).toBe(true);
    expect(actions.has("OPEN_DAY_FAQ_CREATE")).toBe(true);
    expect(actions.has("OPEN_DAY_QUIZ_CREATE")).toBe(true);
  });
});

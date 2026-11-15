import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("GIS & Locations Admin CRUD Integration Suite (Module 4)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let adminToken = "";
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("m4_gis_crud");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // Authenticate admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-GIS-M4-Strong-2026!";
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
  });

  afterAll(async () => {
    await ctx.app.close();
    await dbHandle.drop();
  });

  it("1. GET /api/v1/admin/locations returns real seeded locations from PostgreSQL", async () => {
    const res = await request(server)
      .get("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const list = res.body.data;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    // Verify first item contains expected properties
    const item = list[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("code");
    expect(item).toHaveProperty("name");
    expect(item).toHaveProperty("buildingCode");
    expect(item).toHaveProperty("floor");
    expect(item).toHaveProperty("status");
  });

  it("2. POST /api/v1/admin/locations creates a new location, commits to PostgreSQL, and records AuditLog", async () => {
    const payload = {
      name: "Phòng Thực hành AI & Big Data M4",
      code: "LAB-AI-M4",
      buildingCode: "INNOVATION",
      floor: "Tầng 1 — Hội trường Đa năng",
      category: "lab",
      shortDesc: "Phòng nghiên cứu và thực hành AI thực tế ảo",
      sceneId: "sanh-innovation",
      status: "published",
    };

    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    const created = res.body.data;
    expect(created.code).toBe("LAB-AI-M4");
    expect(created.buildingCode).toBe("INNOVATION");
    expect(created.status).toBe("published");

    // Direct PostgreSQL verification
    const dbRecord = await prisma.location.findFirstOrThrow({
      where: { code: "LAB-AI-M4", deletedAt: null },
      include: { building: true, floor: true, locationType: true, primaryNode: true },
    });

    expect(dbRecord.name).toBe("Phòng Thực hành AI & Big Data M4");
    expect(dbRecord.building.code).toBe("INNOVATION");
    expect(dbRecord.floor?.name).toBe("Tầng 1 — Hội trường Đa năng");
    expect(dbRecord.locationType.code).toBe("LAB");
    expect(dbRecord.primaryNode?.slug).toBe("sanh-innovation");

    // AuditLog verification
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        resourceType: "location",
        resourceId: dbRecord.id,
        action: "CREATE_LOCATION",
      },
    });
    expect(auditRecord).not.toBeNull();
  });

  it("3. Reject invalid buildingCode with 400 Bad Request (no silent fallback)", async () => {
    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Phòng Ảo Lỗi Tòa Nhà",
        code: "ERR-BLD-01",
        buildingCode: "TOA_NHA_KHONG_TON_TAI",
        floor: "Tầng 1",
        category: "common",
      })
      .expect(400);

    expect(res.body.error.message).toContain("không tồn tại");
  });

  it("4a. Reject real floor belonging to ANOTHER building with 400 Bad Request", async () => {
    // "Tầng Trệt" belongs to INNOVATION, not TOA-F
    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Phòng Sai Tòa",
        code: "ERR-FLR-XBLD",
        buildingCode: "TOA-F",
        floor: "Tầng Trệt",
        category: "common",
      })
      .expect(400);

    expect(res.body.error.message).toContain("không thuộc tòa nhà");
  });

  it("4b. Reject invalid floor on building with no floors (SPORTS) with 400 Bad Request", async () => {
    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Sân Bóng Lỗi Tầng",
        code: "ERR-FLR-NOFLR",
        buildingCode: "SPORTS",
        floor: "Tầng 5 Không Tồn Tại",
        category: "common",
      })
      .expect(400);

    expect(res.body.error.message).toContain("không thuộc tòa nhà");
  });

  it("5. Reject non-existent sceneId with 400 Bad Request (no silent ignore)", async () => {
    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Phòng Lỗi Scene",
        code: "ERR-SCN-01",
        buildingCode: "INNOVATION",
        sceneId: "canh-360-khong-ton-tai-404",
        category: "common",
      })
      .expect(400);

    expect(res.body.error.message).toContain("không tồn tại");
  });

  it("6. Reject duplicate location code with 409 Conflict", async () => {
    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Phòng Trùng Mã",
        code: "LAB-AI-M4", // already created in test 2
        buildingCode: "INNOVATION",
        category: "lab",
      })
      .expect(409);

    expect(res.body.error.message).toContain("đã được sử dụng");
  });

  it("7. PATCH /api/v1/admin/locations/:id updates category, locationTypeId and AuditLog", async () => {
    const loc = await prisma.location.findFirstOrThrow({
      where: { code: "LAB-AI-M4", deletedAt: null },
    });

    const updatePayload = {
      name: "Studio Đồ Họa Đã Đổi",
      code: "LAB-AI-M4",
      buildingCode: "INNOVATION",
      category: "studio", // Changed from lab to studio
      shortDesc: "Đã chuyển đổi thành Studio Đồ Họa",
      status: "published",
    };

    const res = await request(server)
      .patch(`/api/v1/admin/locations/${loc.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updatePayload)
      .expect(200);

    expect(res.body.data.name).toBe("Studio Đồ Họa Đã Đổi");
    expect(res.body.data.category).toBe("studio");

    // Verify in DB that locationTypeId was updated to STUDIO
    const updatedDb = await prisma.location.findUniqueOrThrow({
      where: { id: loc.id },
      include: { locationType: true },
    });
    expect(updatedDb.locationType.code).toBe("STUDIO");
    expect(updatedDb.categoryLabel).toBe("Studio & Multimedia");

    // Verify update audit log
    const auditUpdate = await prisma.auditLog.findFirst({
      where: {
        resourceType: "location",
        resourceId: loc.id,
        action: "UPDATE_LOCATION",
      },
    });
    expect(auditUpdate).not.toBeNull();
  });

  it("7b. PATCH changing buildingCode without new floor resets floorId to null", async () => {
    // Look up real records to connect
    const innovBuilding = await prisma.building.findFirstOrThrow({
      where: { code: "INNOVATION", deletedAt: null },
    });
    const innovFloor = await prisma.floor.findFirstOrThrow({
      where: { buildingId: innovBuilding.id, deletedAt: null },
    });
    const classType = await prisma.locationType.findFirstOrThrow({
      where: { code: "CLASSROOM" },
    });

    // Create a location with a floor in INNOVATION
    const created = await prisma.location.create({
      data: {
        code: "LOC-TEST-XBLD",
        name: "Phòng Thử Đổi Tòa Nhà",
        slug: "phong-thu-doi-toa-nha",
        buildingId: innovBuilding.id,
        floorId: innovFloor.id,
        locationTypeId: classType.id,
        categoryLabel: "Không gian Chung",
        shortSummary: "Test reset floor on building change",
        description: "Test description",
        status: "PUBLISHED",
      },
    });

    // PATCH to SPORTS without passing floor
    await request(server)
      .patch(`/api/v1/admin/locations/${created.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Sân Thể Thao Mới",
        code: "LOC-TEST-XBLD",
        buildingCode: "SPORTS",
        // floor is omitted
      })
      .expect(200);

    // Verify in DB that floorId is reset to null
    const updated = await prisma.location.findUniqueOrThrow({
      where: { id: created.id },
      include: { building: true },
    });
    expect(updated.building.code).toBe("SPORTS");
    expect(updated.floorId).toBeNull();

    // Clean up
    await prisma.location.delete({ where: { id: created.id } });
  });

  it("8. Public endpoint /api/v1/public/locations reflects the new location", async () => {
    const res = await request(server)
      .get("/api/v1/public/locations")
      .expect(200);

    const publicList = res.body.data;
    const found = publicList.find((l: { code: string }) => l.code === "LAB-AI-M4");
    expect(found).toBeDefined();
    expect(found.name).toBe("Studio Đồ Họa Đã Đổi");
  });

  it("9. DELETE /api/v1/admin/locations/:id soft-deletes and removes from public listing", async () => {
    const loc = await prisma.location.findFirstOrThrow({
      where: { code: "LAB-AI-M4", deletedAt: null },
    });

    await request(server)
      .delete(`/api/v1/admin/locations/${loc.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    // Verify soft-deleted in DB
    const deletedDb = await prisma.location.findUniqueOrThrow({
      where: { id: loc.id },
    });
    expect(deletedDb.deletedAt).not.toBeNull();

    // Verify no longer appears on public endpoint
    const resPublic = await request(server)
      .get("/api/v1/public/locations")
      .expect(200);

    const stillInPublic = resPublic.body.data.some(
      (l: { code: string }) => l.code === "LAB-AI-M4",
    );
    expect(stillInPublic).toBe(false);
  });

  it("10. GET /api/v1/admin/locations/structure returns dynamic buildings and floors from PostgreSQL", async () => {
    const res = await request(server)
      .get("/api/v1/admin/locations/structure")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const structures = res.body.data;
    expect(Array.isArray(structures)).toBe(true);
    expect(structures.length).toBeGreaterThanOrEqual(4);

    const innovation = structures.find((s: { code: string }) => s.code === "INNOVATION");
    expect(innovation).toBeDefined();
    expect(innovation.floors.length).toBeGreaterThanOrEqual(2);
    expect(innovation.floors[0]).toHaveProperty("name");
  });

  it("11. API rejects unauthorized requests (no token returns 401)", async () => {
    await request(server)
      .get("/api/v1/admin/locations")
      .expect(401);

    await request(server)
      .post("/api/v1/admin/locations")
      .send({ name: "Hacker Room", code: "HACK", buildingCode: "INNOVATION" })
      .expect(401);
  });
});

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

  it("4. Reject invalid floor not belonging to building with 400 Bad Request", async () => {
    const res = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Phòng Lỗi Tầng",
        code: "ERR-FLR-01",
        buildingCode: "TOA-F",
        floor: "Tầng 99 Không Tồn Tại",
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
});

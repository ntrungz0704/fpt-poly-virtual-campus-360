import crypto from "crypto";
import request from "supertest";
import sharp from "sharp";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Advanced Media Library Integration Suite (WebP, Multi-File, Safety)", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let adminToken = "";
  let studentToken = "";
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("media_library_advanced");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // 1. Authenticate super admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-Media-Advanced-2026!";
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

    // 2. Create student without media permissions
    const studentUser = await prisma.user.create({
      data: {
        username: "test_regular_student_media",
        fullName: "Sinh Viên Thử Nghiệm",
        email: "student.media@fpt.edu.vn",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        userType: "STUDENT",
        mustChangePassword: false,
      },
    });

    const jwtService = ctx.app.get(JwtService);
    studentToken = jwtService.sign({
      sub: studentUser.id,
      username: studentUser.username,
      roles: ["STUDENT"],
      pwdRequired: false,
      jti: "test-jti-student-media-001",
    });
  });

  afterAll(async () => {
    await ctx.app.close();
    await dbHandle.drop();
  });

  // Helper to create valid JPEG buffer of specific size using sharp
  const createTestImageBuffer = async (width: number, height: number): Promise<Buffer> => {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 120, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  };

  describe("1. Full Presign -> Binary Upload -> Complete with WebP Generation", () => {
    let panoramaAssetId = "";
    let photo2dAssetId = "";

    it("should successfully presign, upload 2:1 panorama, and auto-generate 3 WebP variants", async () => {
      // 2:1 Panorama (e.g. 1000x500)
      const panoBuffer = await createTestImageBuffer(1000, 500);
      const panoSha256 = crypto.createHash("sha256").update(panoBuffer).digest("hex");

      // Step A: Presign
      const presignRes = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PANORAMA_2_1",
          filename: "sanh_chinh_toa_t_360.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: panoBuffer.length,
          declaredWidth: 1000,
          declaredHeight: 500,
          sha256: panoSha256,
          tags: ["toa-t", "sanh-chinh", "vr360"],
          category: "PANORAMA_360",
        })
        .expect(201);

      expect(presignRes.body.data).toHaveProperty("assetId");
      expect(presignRes.body.data).toHaveProperty("uploadUrl");
      expect(presignRes.body.data).toHaveProperty("uploadToken");
      panoramaAssetId = presignRes.body.data.assetId;

      // Step B: Direct Binary Upload
      const uploadRes = await request(server)
        .put(`/api/v1/storage/upload?token=${presignRes.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(panoBuffer)
        .expect(200);

      expect(uploadRes.body.data.success).toBe(true);

      // Step C: Complete Upload
      const completeRes = await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          token: presignRes.body.data.uploadToken,
          sha256Checksum: panoSha256,
        })
        .expect(201);

      const asset = completeRes.body.data;
      expect(asset.id).toBe(panoramaAssetId);
      expect(asset.processingStatus).toBe("READY");
      expect(asset.isWebpOptimized).toBe(true);
      expect(asset.thumbnailUrl).toContain("-thumb.webp");
      expect(asset.optimizedDesktopUrl).toContain("-desktop.webp");
      expect(asset.optimizedMobileUrl).toContain("-mobile.webp");
      expect(asset.tags).toEqual(["toa-t", "sanh-chinh", "vr360"]);
      expect(asset.category).toBe("PANORAMA_360");
    });

    it("should upload a standard 2D photo and convert WebP successfully", async () => {
      // 2D Photo (800x600)
      const photoBuffer = await createTestImageBuffer(800, 600);
      const photoSha256 = crypto.createHash("sha256").update(photoBuffer).digest("hex");

      const presignRes = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "thu_vien_goc_doc_sach.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: photoBuffer.length,
          declaredWidth: 800,
          declaredHeight: 600,
          sha256: photoSha256,
          tags: ["thu-vien", "khong-gian-hoc"],
          category: "STANDARD_IMAGE",
        })
        .expect(201);

      photo2dAssetId = presignRes.body.data.assetId;

      await request(server)
        .put(`/api/v1/storage/upload?token=${presignRes.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(photoBuffer)
        .expect(200);

      const completeRes = await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          token: presignRes.body.data.uploadToken,
          sha256Checksum: photoSha256,
        })
        .expect(201);

      expect(completeRes.body.data.id).toBe(photo2dAssetId);
      expect(completeRes.body.data.processingStatus).toBe("READY");
      expect(completeRes.body.data.isWebpOptimized).toBe(true);
    });

    it("should reject completion if SHA-256 does not match", async () => {
      const buffer = await createTestImageBuffer(400, 400);
      const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

      const presignRes = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "test_corrupted.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: buffer.length,
          declaredWidth: 400,
          declaredHeight: 400,
          sha256,
        })
        .expect(201);

      await request(server)
        .put(`/api/v1/storage/upload?token=${presignRes.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(buffer)
        .expect(200);

      const fakeSha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const res = await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          token: presignRes.body.data.uploadToken,
          sha256Checksum: fakeSha,
        })
        .expect(400);

      expect(res.body.error.message).toContain("SHA-256");
    });
  });

  describe("2. Search & Filter Capabilities", () => {
    it("should filter media by filename query 'q'", async () => {
      const res = await request(server)
        .get("/api/v1/admin/media?q=sanh_chinh")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].originalFilename).toContain("sanh_chinh");
    });

    it("should filter media by tag", async () => {
      const res = await request(server)
        .get("/api/v1/admin/media?tag=vr360")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].tags).toContain("vr360");
    });

    it("should filter media by category", async () => {
      const res = await request(server)
        .get("/api/v1/admin/media?category=PANORAMA_360")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items.every((it: { category?: string }) => it.category === "PANORAMA_360")).toBe(true);
    });

    it("should filter media by assetKind", async () => {
      const res = await request(server)
        .get("/api/v1/admin/media?assetKind=PANORAMA_2_1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.items.every((it: { assetKind?: string }) => it.assetKind === "PANORAMA_2_1")).toBe(true);
    });
  });

  describe("3. Referential Integrity & Deletion Protection", () => {
    let unreferencedAssetId = "";
    let referencedByNewsAssetId = "";
    let referencedByBuildingAssetId = "";

    beforeAll(async () => {
      const buffer = await createTestImageBuffer(300, 300);
      const sha = crypto.createHash("sha256").update(buffer).digest("hex");

      // 1. Unreferenced asset
      const p1 = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "unused_asset.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: buffer.length,
          declaredWidth: 300,
          declaredHeight: 300,
          sha256: sha,
        });
      unreferencedAssetId = p1.body.data.assetId;
      await request(server)
        .put(`/api/v1/storage/upload?token=${p1.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(buffer);
      await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ token: p1.body.data.uploadToken, sha256Checksum: sha });

      // 2. Asset to reference in NewsArticle
      const p2 = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "news_cover_referenced.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: buffer.length,
          declaredWidth: 300,
          declaredHeight: 300,
          sha256: sha,
        });
      referencedByNewsAssetId = p2.body.data.assetId;
      await request(server)
        .put(`/api/v1/storage/upload?token=${p2.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(buffer);
      await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ token: p2.body.data.uploadToken, sha256Checksum: sha });

      // Attach to NewsArticle
      await prisma.newsArticle.create({
        data: {
          slug: "bai-viet-gan-media-test-an-toan",
          title: "Bài viết gắn media test an toàn",
          tag: "Tin tức chung",
          excerpt: "Tóm tắt bài viết gắn media kiểm thử xóa an toàn tối thiểu mười ký tự.",
          content: "Nội dung bài viết chi tiết phục vụ kiểm thử tính toàn vẹn quan hệ cơ sở dữ liệu.",
          status: "PUBLISHED",
          coverMediaId: referencedByNewsAssetId,
        },
      });

      // 3. Asset to reference in Building
      const p3 = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "building_cover_referenced.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: buffer.length,
          declaredWidth: 300,
          declaredHeight: 300,
          sha256: sha,
        });
      referencedByBuildingAssetId = p3.body.data.assetId;
      await request(server)
        .put(`/api/v1/storage/upload?token=${p3.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(buffer);
      await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ token: p3.body.data.uploadToken, sha256Checksum: sha });

      // Attach to existing Building
      const firstBuilding = await prisma.building.findFirst();
      if (firstBuilding) {
        await prisma.building.update({
          where: { id: firstBuilding.id },
          data: { coverMediaId: referencedByBuildingAssetId },
        });
      }
    });

    it("should safely soft-delete an unreferenced media asset", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${unreferencedAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.success).toBe(true);

      // Verify soft-deleted in DB
      const dbAsset = await prisma.mediaAsset.findUnique({
        where: { id: unreferencedAssetId },
      });
      expect(dbAsset?.deletedAt).not.toBeNull();
    });

    it("should prevent deletion with 409 Conflict when asset is referenced by a NewsArticle", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${referencedByNewsAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.error.code).toBe("MEDIA_IN_USE");
      expect(res.body.error.message).toContain("Tin tức: 1");
    });

    it("should prevent deletion with 409 Conflict when asset is referenced by a Building", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${referencedByBuildingAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.error.code).toBe("MEDIA_IN_USE");
      expect(res.body.error.message).toContain("Tòa nhà: 1");
    });
  });

  describe("4. RBAC and Permissions", () => {
    it("should forbid regular student without media:upload permission", async () => {
      await request(server)
        .get("/api/v1/admin/media")
        .set("Authorization", `Bearer ${studentToken}`)
        .expect(403);

      await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "hacker.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 100,
          declaredWidth: 100,
          declaredHeight: 100,
          sha256: "fake",
        })
        .expect(403);
    });
  });
});

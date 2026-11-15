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

    it("should automatically default category to PANORAMA_360 for 2:1 image when category is not specified", async () => {
      const panoBuffer = await createTestImageBuffer(1200, 600);
      const sha256 = crypto.createHash("sha256").update(panoBuffer).digest("hex");

      const presignRes = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PANORAMA_2_1",
          filename: "default_category_pano_test.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: panoBuffer.length,
          declaredWidth: 1200,
          declaredHeight: 600,
          sha256,
        })
        .expect(201);

      await request(server)
        .put(`/api/v1/storage/upload?token=${presignRes.body.data.uploadToken}`)
        .set("Content-Type", "image/jpeg")
        .send(panoBuffer)
        .expect(200);

      const completeRes = await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          token: presignRes.body.data.uploadToken,
          sha256Checksum: sha256,
        })
        .expect(201);

      expect(completeRes.body.data.category).toBe("PANORAMA_360");

      const dbAsset = await prisma.mediaAsset.findUnique({
        where: { id: presignRes.body.data.assetId },
      });
      const meta = dbAsset?.cameraMetadata as Record<string, unknown>;
      expect(meta?.category).toBe("PANORAMA_360");
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
      expect(completeRes.body.data.category).toBe("STANDARD_IMAGE");
    });

    it("should mark asset FAILED, leave token unconsumed, and allow safe retry when image processing fails", async () => {
      // Create a corrupted image payload that has valid JPEG magic bytes (\xFF\xD8\xFF\xE0) but corrupted body
      const corruptBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xde, 0xad, 0xbe, 0xef,
      ]);
      const corruptSha = crypto.createHash("sha256").update(corruptBuffer).digest("hex");

      const presignRes = await request(server)
        .post("/api/v1/admin/media/presign")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assetKind: "PHOTO_2D",
          filename: "corrupt_retry_test.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 200_000,
          declaredWidth: 400,
          declaredHeight: 400,
          sha256: corruptSha,
        })
        .expect(201);

      const token = presignRes.body.data.uploadToken;
      const assetId = presignRes.body.data.assetId;

      await request(server)
        .put(`/api/v1/storage/upload?token=${token}`)
        .set("Content-Type", "image/jpeg")
        .send(corruptBuffer)
        .expect(200);

      // Attempt completeUpload with corrupt image -> Sharp fails
      const failRes = await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          token,
          sha256Checksum: corruptSha,
        })
        .expect(400);

      expect(failRes.body.error.code).toBe("IMAGE_PROCESSING_FAILED");

      // Verify in PostgreSQL: asset status is FAILED, NOT READY
      const failedAsset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
      expect(failedAsset?.processingStatus).toBe("FAILED");
      expect(failedAsset?.processingError).toContain("Lỗi xử lý nén WebP");

      // Verify token was NOT consumed (usedAt is null)
      const tokenRecord = await prisma.uploadToken.findUnique({ where: { jti: token } });
      expect(tokenRecord?.usedAt).toBeNull();

      // NOW RETRY: Replace with valid image buffer in storage & call completeUpload
      const validBuffer = await createTestImageBuffer(400, 400);
      const validSha = crypto.createHash("sha256").update(validBuffer).digest("hex");

      // Update asset's expected sha256 to allow retry verification
      await prisma.mediaAsset.update({
        where: { id: assetId },
        data: { sha256Checksum: validSha },
      });

      // Upload valid binary to existing objectKey
      await request(server)
        .put(`/api/v1/storage/upload?token=${token}`)
        .set("Content-Type", "image/jpeg")
        .send(validBuffer)
        .expect(200);

      // Complete upload retry
      const retryRes = await request(server)
        .post("/api/v1/admin/media/complete-upload")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          token,
          sha256Checksum: validSha,
        })
        .expect(201);

      expect(retryRes.body.data.processingStatus).toBe("READY");
      expect(retryRes.body.data.isWebpOptimized).toBe(true);

      // Token is now consumed
      const tokenAfter = await prisma.uploadToken.findUnique({ where: { jti: token } });
      expect(tokenAfter?.usedAt).not.toBeNull();
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

  describe("3. Full 4-Way Referential Integrity & Deletion Protection", () => {
    let unreferencedAssetId = "";
    let referencedByNewsAssetId = "";
    let referencedByBuildingAssetId = "";
    let referencedByTourNodeAssetId = "";
    let referencedByLocationAssetId = "";

    beforeAll(async () => {
      const buffer = await createTestImageBuffer(300, 300);
      const sha = crypto.createHash("sha256").update(buffer).digest("hex");

      const createUploadedAsset = async (filename: string): Promise<string> => {
        const p = await request(server)
          .post("/api/v1/admin/media/presign")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            assetKind: "PHOTO_2D",
            filename,
            mimeType: "image/jpeg",
            fileSizeBytes: buffer.length,
            declaredWidth: 300,
            declaredHeight: 300,
            sha256: sha,
          });
        await request(server)
          .put(`/api/v1/storage/upload?token=${p.body.data.uploadToken}`)
          .set("Content-Type", "image/jpeg")
          .send(buffer);
        await request(server)
          .post("/api/v1/admin/media/complete-upload")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ token: p.body.data.uploadToken, sha256Checksum: sha });
        return p.body.data.assetId;
      };

      // 1. Unreferenced asset
      unreferencedAssetId = await createUploadedAsset("unused_asset.jpg");

      // 2. Asset to reference in NewsArticle
      referencedByNewsAssetId = await createUploadedAsset("news_cover_referenced.jpg");
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
      referencedByBuildingAssetId = await createUploadedAsset("building_cover_referenced.jpg");
      const firstBuilding = await prisma.building.findFirst();
      if (firstBuilding) {
        await prisma.building.update({
          where: { id: firstBuilding.id },
          data: { coverMediaId: referencedByBuildingAssetId },
        });
      }

      // 4. Asset to reference in TourNode (Panorama 360)
      referencedByTourNodeAssetId = await createUploadedAsset("tour_node_referenced.jpg");
      const firstTourNode = await prisma.tourNode.findFirst();
      if (firstTourNode) {
        await prisma.tourNode.update({
          where: { id: firstTourNode.id },
          data: { panoramaAssetId: referencedByTourNodeAssetId },
        });
      } else {
        const firstLoc = await prisma.location.findFirst();
        await prisma.tourNode.create({
          data: {
            slug: "test-tour-node-media",
            title: "Điểm dừng 360 kiểm thử",
            intro: "Mô tả điểm dừng 360 kiểm thử an toàn.",
            locationId: firstLoc!.id,
            panoramaAssetId: referencedByTourNodeAssetId,
          },
        });
      }

      // 5. Asset to reference in LocationMedia
      referencedByLocationAssetId = await createUploadedAsset("location_media_referenced.jpg");
      const firstLocation = await prisma.location.findFirst();
      if (firstLocation) {
        await prisma.locationMedia.create({
          data: {
            locationId: firstLocation.id,
            mediaAssetId: referencedByLocationAssetId,
            caption: "Ảnh minh họa địa điểm kiểm thử",
          },
        });
      }
    });

    it("should safely soft-delete an unreferenced media asset", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${unreferencedAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.success).toBe(true);

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

      const dbAsset = await prisma.mediaAsset.findUnique({ where: { id: referencedByNewsAssetId } });
      expect(dbAsset?.deletedAt).toBeNull();
    });

    it("should prevent deletion with 409 Conflict when asset is referenced by a Building", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${referencedByBuildingAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.error.code).toBe("MEDIA_IN_USE");
      expect(res.body.error.message).toContain("Tòa nhà: 1");

      const dbAsset = await prisma.mediaAsset.findUnique({ where: { id: referencedByBuildingAssetId } });
      expect(dbAsset?.deletedAt).toBeNull();
    });

    it("should prevent deletion with 409 Conflict when asset is referenced by a TourNode", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${referencedByTourNodeAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.error.code).toBe("MEDIA_IN_USE");
      expect(res.body.error.message).toContain("Cảnh 360°: 1");

      const dbAsset = await prisma.mediaAsset.findUnique({ where: { id: referencedByTourNodeAssetId } });
      expect(dbAsset?.deletedAt).toBeNull();
    });

    it("should prevent deletion with 409 Conflict when asset is referenced by a LocationMedia", async () => {
      const res = await request(server)
        .delete(`/api/v1/admin/media/${referencedByLocationAssetId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(409);

      expect(res.body.error.code).toBe("MEDIA_IN_USE");
      expect(res.body.error.message).toContain("Địa điểm: 1");

      const dbAsset = await prisma.mediaAsset.findUnique({ where: { id: referencedByLocationAssetId } });
      expect(dbAsset?.deletedAt).toBeNull();
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

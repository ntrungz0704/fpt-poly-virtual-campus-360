import request from "supertest";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("News Content CMS Integration Suite", () => {
  jest.setTimeout(60_000);
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let adminToken = "";
  let studentToken = "";
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("news_cms_crud");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    // Authenticate admin
    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const adminNewPw = "Admin-News-CMS-Strong-2026!";
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

    // Create a regular student user without campus:write permission
    const studentUser = await prisma.user.create({
      data: {
        username: "test_regular_student",
        fullName: "Sinh Viên Thử Nghiệm",
        email: "student.regular@fpt.edu.vn",
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
      jti: "test-jti-student-forbidden-001",
    });
  });

  afterAll(async () => {
    await ctx.app.close();
    await dbHandle.drop();
  });

  let createdArticleId = "";
  const testSlug = "trai-nghiem-cong-nghe-vr-360-tai-fpt-polytechnic";

  it("1. GET /api/v1/admin/news returns paginated news list with admin token", async () => {
    const res = await request(server)
      .get("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("data");
    const { items, total } = res.body.data;
    expect(Array.isArray(items)).toBe(true);
    expect(typeof total).toBe("number");
  });

  it("2. POST /api/v1/admin/news creates a new DRAFT article and writes AuditLog", async () => {
    const payload = {
      title: "Trải nghiệm công nghệ VR 360 tại FPT Polytechnic",
      slug: testSlug,
      tag: "Công nghệ",
      excerpt: "Khám phá không gian thực tế ảo hiện đại chuẩn quốc tế.",
      content:
        "FPT Polytechnic vừa ra mắt hệ thống thực tế ảo 360 độ.\n\nSinh viên có thể tham quan toàn bộ khuôn viên trường và phòng thực hành từ xa.",
      status: "DRAFT",
    };

    const res = await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    const created = res.body.data;
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.title).toBe(payload.title);
    expect(created.slug).toBe(testSlug);
    expect(created.status).toBe("DRAFT");
    createdArticleId = created.id;

    // Verify in PostgreSQL directly
    const dbRecord = await prisma.newsArticle.findUnique({
      where: { id: createdArticleId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.slug).toBe(testSlug);
    expect(dbRecord?.status).toBe("DRAFT");

    // Verify AuditLog record
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: "CREATE_NEWS_ARTICLE",
        resourceId: createdArticleId,
      },
    });
    expect(auditRecord).not.toBeNull();
  });

  it("3. GET /api/v1/public/news does NOT show DRAFT articles", async () => {
    const res = await request(server)
      .get("/api/v1/public/news")
      .expect(200);

    const { items } = res.body.data;
    const found = items.find((item: { slug: string }) => item.slug === testSlug);
    expect(found).toBeUndefined();
  });

  it("4. GET /api/v1/public/news/:slug returns 404 for DRAFT article and non-existent slug", async () => {
    // 4.1 DRAFT article -> 404
    await request(server)
      .get(`/api/v1/public/news/${testSlug}`)
      .expect(404);

    // 4.2 Completely non-existent slug -> 404
    await request(server)
      .get("/api/v1/public/news/slug-hoan-toan-khong-ton-tai-xyz-404")
      .expect(404);
  });

  it("5. POST /api/v1/admin/news/:id/publish publishes article and records AuditLog", async () => {
    const res = await request(server)
      .post(`/api/v1/admin/news/${createdArticleId}/publish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const published = res.body.data;
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();

    // Verify in PostgreSQL
    const dbRecord = await prisma.newsArticle.findUnique({
      where: { id: createdArticleId },
    });
    expect(dbRecord?.status).toBe("PUBLISHED");
    expect(dbRecord?.publishedAt).not.toBeNull();
  });

  it("6. GET /api/v1/public/news NOW returns the published article", async () => {
    const res = await request(server)
      .get("/api/v1/public/news")
      .expect(200);

    const { items } = res.body.data;
    const found = items.find((item: { slug: string }) => item.slug === testSlug);
    expect(found).toBeDefined();
    expect(found.title).toBe("Trải nghiệm công nghệ VR 360 tại FPT Polytechnic");
    expect(found.tag).toBe("Công nghệ");
  });

  it("7. GET /api/v1/public/news/:slug returns full article details with parsed paragraphs", async () => {
    const res = await request(server)
      .get(`/api/v1/public/news/${testSlug}`)
      .expect(200);

    const article = res.body.data;
    expect(article.slug).toBe(testSlug);
    expect(article.contentJson).toHaveLength(2);
    expect(article.contentJson[0]).toContain("FPT Polytechnic");
  });

  it("8. POST /api/v1/admin/news rejects duplicate active slug with 409 Conflict", async () => {
    const payload = {
      title: "Trùng lặp Slug",
      slug: testSlug,
      excerpt: "Thử nghiệm trùng slug",
      content: "Nội dung...",
    };

    const res = await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload)
      .expect(409);

    expect(res.body.error.message).toContain("đã được sử dụng");
  });

  it("9. PATCH /api/v1/admin/news/:id updates article title and excerpt", async () => {
    const updatePayload = {
      title: "Trải nghiệm công nghệ VR 360 Đỉnh Cao tại FPT Poly",
      excerpt: "Bản cập nhật tóm tắt mới nhất 2026.",
    };

    const res = await request(server)
      .patch(`/api/v1/admin/news/${createdArticleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updatePayload)
      .expect(200);

    const updated = res.body.data;
    expect(updated.title).toBe(updatePayload.title);
    expect(updated.excerpt).toBe(updatePayload.excerpt);

    // Verify in PostgreSQL
    const dbRecord = await prisma.newsArticle.findUnique({
      where: { id: createdArticleId },
    });
    expect(dbRecord?.title).toBe(updatePayload.title);
  });

  it("10. POST /api/v1/admin/news/:id/unpublish reverts article back to DRAFT", async () => {
    const res = await request(server)
      .post(`/api/v1/admin/news/${createdArticleId}/unpublish`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.status).toBe("DRAFT");

    // Public endpoint should now return 404
    await request(server)
      .get(`/api/v1/public/news/${testSlug}`)
      .expect(404);
  });

  it("11. DELETE /api/v1/admin/news/:id soft-deletes article and records AuditLog", async () => {
    const res = await request(server)
      .delete(`/api/v1/admin/news/${createdArticleId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.deleted).toBe(true);

    // Verify soft-deleted in PostgreSQL
    const dbRecord = await prisma.newsArticle.findUnique({
      where: { id: createdArticleId },
    });
    expect(dbRecord?.deletedAt).not.toBeNull();

    // Verify public get by slug returns 404 for soft-deleted article
    await request(server)
      .get(`/api/v1/public/news/${testSlug}`)
      .expect(404);

    // Verify AuditLog
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: "DELETE_NEWS_ARTICLE",
        resourceId: createdArticleId,
      },
    });
    expect(auditRecord).not.toBeNull();
  });

  it("12. POST /api/v1/admin/news rejects reusing slug of soft-deleted article with 409 Conflict", async () => {
    const payload = {
      title: "Tái sử dụng slug đã xóa",
      slug: testSlug,
      excerpt: "Thử nghiệm tái sử dụng slug đã xóa",
      content: "Nội dung...",
    };

    const res = await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload)
      .expect(409);

    expect(res.body.error.message).toContain("đã xóa lưu trữ");
  });

  it("13. Public Pagination: GET /api/v1/public/news supports page and limit properly", async () => {
    // 3 canonical articles are already seeded in DB.
    // Create and publish a 4th article to test clean 2x2 pagination:
    await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài viết Phân trang thứ tư",
        slug: "bai-viet-phan-trang-thu-tu",
        excerpt: "Tóm tắt bài viết phân trang thứ tư",
        content: "Nội dung bài viết...",
        status: "PUBLISHED",
      })
      .expect(201);

    const resPage1 = await request(server)
      .get("/api/v1/public/news?page=1&limit=2")
      .expect(200);

    expect(resPage1.body.data.page).toBe(1);
    expect(resPage1.body.data.limit).toBe(2);
    expect(resPage1.body.data.items).toHaveLength(2);
    expect(resPage1.body.data.total).toBe(4);

    const resPage2 = await request(server)
      .get("/api/v1/public/news?page=2&limit=2")
      .expect(200);

    expect(resPage2.body.data.page).toBe(2);
    expect(resPage2.body.data.limit).toBe(2);
    expect(resPage2.body.data.items).toHaveLength(2);
    expect(resPage2.body.data.total).toBe(4);

    // Page 1 and Page 2 should not share items
    const page1Slugs = resPage1.body.data.items.map((i: { slug: string }) => i.slug);
    const page2Slugs = resPage2.body.data.items.map((i: { slug: string }) => i.slug);
    for (const slug of page1Slugs) {
      expect(page2Slugs).not.toContain(slug);
    }
    expect(new Set([...page1Slugs, ...page2Slugs]).size).toBe(4);
  });

  it("14. RBAC: Rejects access without token (401) or without campus:write permission (403)", async () => {
    // 1. Without token -> 401
    await request(server)
      .get("/api/v1/admin/news")
      .expect(401);

    await request(server)
      .post("/api/v1/admin/news")
      .send({ title: "Hack" })
      .expect(401);

    // 2. With student token (no campus:write) -> 403
    await request(server)
      .get("/api/v1/admin/news")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);

    await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Hack" })
      .expect(403);
  });

  it("15. Concurrency & P2002: Concurrent creation with same slug triggers P2002 and resolves cleanly with 409 Conflict without 500", async () => {
    const concurrentSlug = "concurrent-p2002-creation-slug";
    const payloadA = {
      title: "Bài viết Concurrency A",
      slug: concurrentSlug,
      excerpt: "Tóm tắt bài viết Concurrency A dài hơn 10 ký tự",
      content: "Nội dung bài viết A...",
    };
    const payloadB = {
      title: "Bài viết Concurrency B",
      slug: concurrentSlug,
      excerpt: "Tóm tắt bài viết Concurrency B dài hơn 10 ký tự",
      content: "Nội dung bài viết B...",
    };

    // Send two requests concurrently
    const [resA, resB] = await Promise.all([
      request(server)
        .post("/api/v1/admin/news")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payloadA),
      request(server)
        .post("/api/v1/admin/news")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payloadB),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    // Check PostgreSQL database: exactly 1 article exists with concurrentSlug
    const articlesInDb = await prisma.newsArticle.findMany({
      where: { slug: concurrentSlug },
    });
    expect(articlesInDb).toHaveLength(1);

    // Check AuditLog: exactly 1 CREATE_NEWS_ARTICLE audit log exists for this slug
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: "CREATE_NEWS_ARTICLE",
        resourceId: articlesInDb[0].id,
      },
    });
    expect(auditLogs).toHaveLength(1);
  });

  it("16. Concurrency & P2002: Concurrent update to same target slug triggers P2002 and returns 409 without 500 or duplicate data", async () => {
    // Create two distinct articles first
    const art1 = await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài viết Update Race 1",
        slug: "update-race-slug-1",
        excerpt: "Tóm tắt bài viết Update Race 1 dài hơn 10 ký tự",
        content: "Nội dung bài viết 1...",
      })
      .expect(201);

    const art2 = await request(server)
      .post("/api/v1/admin/news")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Bài viết Update Race 2",
        slug: "update-race-slug-2",
        excerpt: "Tóm tắt bài viết Update Race 2 dài hơn 10 ký tự",
        content: "Nội dung bài viết 2...",
      })
      .expect(201);

    const targetSlug = "shared-update-race-target-slug";

    // Concurrently update both to targetSlug
    const [updateRes1, updateRes2] = await Promise.all([
      request(server)
        .patch(`/api/v1/admin/news/${art1.body.data.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ slug: targetSlug }),
      request(server)
        .patch(`/api/v1/admin/news/${art2.body.data.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ slug: targetSlug }),
    ]);

    const statuses = [updateRes1.status, updateRes2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // Check PostgreSQL database: exactly 1 article possesses targetSlug
    const countTarget = await prisma.newsArticle.count({
      where: { slug: targetSlug },
    });
    expect(countTarget).toBe(1);
  });
});

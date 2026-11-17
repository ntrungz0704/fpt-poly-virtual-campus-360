import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Audit Batch B-B2 — Tour Studio & Admin Locations PostgreSQL Sync Integration Suite", () => {
  jest.setTimeout(120_000);

  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let server: any;

  let adminToken = "";
  let studentToken = "";
  let editorToken = "";
  let adminUserId = "";
  let genuinePanoramaAssetId = "";
  let secondGenuinePanoramaAssetId = "";
  let publishedLocationId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("audit_batch_b2");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
    prisma = ctx.app.get(PrismaService);
    server = ctx.app.getHttpServer();

    const adminBootstrap = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
      .expect(200);

    const rotatedAdminPw = "BatchB2-Rotated-Admin-Pass-2026!";
    await request(server)
      .patch("/api/v1/auth/me/password")
      .set("Authorization", `Bearer ${adminBootstrap.body.data.accessToken}`)
      .send({
        currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
        newPassword: rotatedAdminPw,
      })
      .expect(200);

    const adminLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: rotatedAdminPw })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
    adminUserId = adminLogin.body.data.user.id;

    const adminRow = await prisma.user.findUniqueOrThrow({
      where: { id: adminUserId },
    });

    // Provision STUDENT (no tour permissions) & EVENT_OPERATOR (only events:write)
    const [studentUser, operatorUser, operatorRole] = await Promise.all([
      prisma.user.create({
        data: {
          username: "b2_student",
          fullName: "Sinh Vien B2",
          email: "b2.student@poly.edu.vn",
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
          username: "b2_operator",
          fullName: "Operator B2",
          email: "b2.operator@poly.edu.vn",
          userType: "STAFF",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "ADMIN_DIRECT",
          mustChangePassword: false,
          passwordHash: adminRow.passwordHash,
        },
      }),
      prisma.role.findUniqueOrThrow({ where: { code: "EVENT_OPERATOR" } }),
    ]);

    await prisma.userRole.create({
      data: { userId: operatorUser.id, roleId: operatorRole.id },
    });

    const [studentLogin, operatorLogin] = await Promise.all([
      request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: studentUser.username, password: rotatedAdminPw })
        .expect(200),
      request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: operatorUser.username, password: rotatedAdminPw })
        .expect(200),
    ]);
    studentToken = studentLogin.body.data.accessToken;
    editorToken = operatorLogin.body.data.accessToken;

    // Seed two genuine non-AI approved 2:1 panoramas and locate a published location
    const pubLoc = await prisma.location.findFirstOrThrow({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        building: { deletedAt: null, status: "PUBLISHED" },
      },
    });
    publishedLocationId = pubLoc.id;

    const [pano1, pano2] = await Promise.all([
      prisma.mediaAsset.create({
        data: {
          assetKind: "PANORAMA_2_1",
          originalFilename: "qtsc-b2-real-1.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 600000n,
          sha256Checksum: "c".repeat(64),
          originalWidth: 4096,
          originalHeight: 2048,
          isValid2To1: true,
          isPreviewApproved: true,
          originalObjectKey: "/images/panoramas/campus-courtyard-360.jpg",
          processingStatus: "READY",
          cameraMetadata: { isRealQtscCapture: true, assetOrigin: "CAMERA_360" },
          uploadedBy: adminUserId,
        },
      }),
      prisma.mediaAsset.create({
        data: {
          assetKind: "PANORAMA_2_1",
          originalFilename: "qtsc-b2-real-2.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 650000n,
          sha256Checksum: "d".repeat(64),
          originalWidth: 4096,
          originalHeight: 2048,
          isValid2To1: true,
          isPreviewApproved: true,
          originalObjectKey: "/images/panoramas/library-360.jpg",
          processingStatus: "READY",
          cameraMetadata: { isRealQtscCapture: true, assetOrigin: "CAMERA_360" },
          uploadedBy: adminUserId,
        },
      }),
    ]);

    genuinePanoramaAssetId = pano1.id;
    secondGenuinePanoramaAssetId = pano2.id;
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.close();
    }
    if (dbHandle) {
      await dbHandle.drop();
    }
  });

  it("enforces RBAC (401/403) on Tour Studio & Admin Locations endpoints", async () => {
    await request(server).get("/api/v1/admin/tour/nodes").expect(401);
    await request(server).get("/api/v1/admin/locations").expect(401);

    await request(server)
      .get("/api/v1/admin/tour/nodes")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(403);

    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ scenes: [] })
      .expect(403);

    await request(server)
      .delete("/api/v1/admin/tour/nodes/00000000-0000-4000-8000-000000000001")
      .set("Authorization", `Bearer ${editorToken}`)
      .expect(403);
  });

  it("persists newly created TourNodes, batch-save hotspots/TourEdges/panoramaAssetId, reconciles deletions, and syncs Admin Locations", async () => {
    // 1. Create two genuine TourNodes via POST /api/v1/admin/tour/nodes
    const nodeARes = await request(server)
      .post("/api/v1/admin/tour/nodes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Studio B2 Node Alpha",
        slug: "studio-b2-alpha",
        intro: "Initial Alpha Intro",
        buildingCode: "TOA-T",
        locationId: publishedLocationId,
        panoramaAssetId: genuinePanoramaAssetId,
        initialYaw: 10,
        initialPitch: 2,
        initialFov: 68,
      })
      .expect(201);

    const nodeBRes = await request(server)
      .post("/api/v1/admin/tour/nodes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Studio B2 Node Beta",
        slug: "studio-b2-beta",
        intro: "Initial Beta Intro",
        locationId: publishedLocationId,
        panoramaAssetId: secondGenuinePanoramaAssetId,
      })
      .expect(201);

    const nodeAId: string = nodeARes.body.data.id;
    const nodeBId: string = nodeBRes.body.data.id;

    // 2. GET /admin/tour/nodes includes new nodes with publicUrl + isAiPlaceholder=false + building/floor metadata
    const listRes = await request(server)
      .get("/api/v1/admin/tour/nodes")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    const listedAlpha = listRes.body.data.find(
      (n: { slug: string }) => n.slug === "studio-b2-alpha",
    );
    expect(listedAlpha).toBeDefined();
    expect(listedAlpha.panoramaAsset.publicUrl).toBe(
      "/images/panoramas/campus-courtyard-360.jpg",
    );
    expect(listedAlpha.panoramaAsset.isAiPlaceholder).toBe(false);

    // 3. Admin Location created referencing newly created TourNode slug succeeds in PostgreSQL
    const locRes = await request(server)
      .post("/api/v1/admin/locations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Phòng Sync Tour B2",
        code: "SYNC-B2-101",
        buildingCode: "INNOVATION",
        category: "lab",
        shortDesc: "Phòng gắn với cảnh 360 mới tạo",
        sceneId: "studio-b2-alpha",
        status: "draft",
      })
      .expect(201);
    expect(locRes.body.data.sceneId).toBe("studio-b2-alpha");

    // 4. POST /admin/tour/studio/batch-save persists metadata, FOV, swapped panoramaAssetId, SCENE_LINK TourEdge & INFO hotspot
    const saveRes = await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: nodeAId,
            slug: "studio-b2-alpha",
            title: "Alpha Updated Title",
            description: "Alpha Updated Intro",
            panoramaAssetId: secondGenuinePanoramaAssetId,
            initialYaw: 45,
            initialPitch: -5,
            initialFov: 62,
            hotspots: [
              {
                hotspotType: "SCENE_LINK",
                yaw: 33.5,
                pitch: 1.5,
                title: "Đi tới Beta",
                targetNodeSlug: "studio-b2-beta",
              },
              {
                hotspotType: "INFO",
                yaw: -20,
                pitch: 4,
                title: "Thông tin Alpha",
                body: "Nội dung thông tin thật",
              },
            ],
          },
        ],
      })
      .expect(201);

    expect(saveRes.body.data.savedCount).toBe(1);
    const updatedAlpha = saveRes.body.data.nodes.find(
      (n: { id: string }) => n.id === nodeAId,
    );
    expect(updatedAlpha.title).toBe("Alpha Updated Title");
    expect(updatedAlpha.initialFov).toBe(62);
    expect(updatedAlpha.panoramaAssetId).toBe(secondGenuinePanoramaAssetId);
    expect(updatedAlpha.hotspots).toHaveLength(2);

    const sceneLinkHs = updatedAlpha.hotspots.find(
      (h: { hotspotType: string }) => h.hotspotType === "SCENE_LINK",
    );
    const infoHs = updatedAlpha.hotspots.find(
      (h: { hotspotType: string }) => h.hotspotType === "INFO",
    );
    expect(sceneLinkHs).toBeDefined();
    expect(sceneLinkHs.edge?.toNode?.slug).toBe("studio-b2-beta");
    expect(infoHs).toBeDefined();

    // Verify TourEdge exists in PostgreSQL
    const dbEdges = await prisma.tourEdge.findMany({
      where: { fromNodeId: nodeAId, toNodeId: nodeBId },
    });
    expect(dbEdges).toHaveLength(1);

    // 5. Re-save with INFO hotspot removed & SCENE_LINK preserved by UUID -> deleted hotspot removed cleanly
    const resaveRes = await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: nodeAId,
            slug: "studio-b2-alpha",
            title: "Alpha Updated Title",
            description: "Alpha Updated Intro",
            initialYaw: 45,
            initialPitch: -5,
            initialFov: 62,
            hotspots: [
              {
                id: sceneLinkHs.id,
                hotspotType: "SCENE_LINK",
                yaw: 50,
                pitch: 3,
                title: "Đi tới Beta (Updated)",
                targetNodeSlug: "studio-b2-beta",
              },
            ],
          },
        ],
      })
      .expect(201);

    const alphaAfterDelete = resaveRes.body.data.nodes.find(
      (n: { id: string }) => n.id === nodeAId,
    );
    expect(alphaAfterDelete.hotspots).toHaveLength(1);
    expect(alphaAfterDelete.hotspots[0].id).toBe(sceneLinkHs.id);
    expect(alphaAfterDelete.hotspots[0].yaw).toBe(50);

    // 6. Publish real-media nodes and verify public tour node output reflects real synced data
    await request(server)
      .post("/api/v1/admin/tour/publish")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nodeIds: [nodeAId, nodeBId] })
      .expect(201);

    const publicNodeRes = await request(server)
      .get("/api/v1/public/tour/nodes/studio-b2-alpha")
      .expect(200);
    expect(publicNodeRes.body.data.node.title).toBe("Alpha Updated Title");
    expect(publicNodeRes.body.data.node.initialFov).toBe(62);
    expect(publicNodeRes.body.data.hotspots).toHaveLength(1);
    expect(publicNodeRes.body.data.hotspots[0].targetNodeSlug).toBe(
      "studio-b2-beta",
    );

    // 7. Error rejections: unknown scene slug (404), self-referencing link (400), cross-node hotspot tamper (404)
    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            slug: "non-existent-scene-slug",
            title: "Ghost Scene",
          },
        ],
      })
      .expect(404);

    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: nodeAId,
            slug: "studio-b2-alpha",
            title: "Alpha",
            hotspots: [
              {
                hotspotType: "SCENE_LINK",
                yaw: 0,
                pitch: 0,
                title: "Self Loop",
                targetNodeSlug: "studio-b2-alpha",
              },
            ],
          },
        ],
      })
      .expect(400);

    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: nodeBId,
            slug: "studio-b2-beta",
            title: "Beta",
            hotspots: [
              {
                id: sceneLinkHs.id,
                hotspotType: "INFO",
                yaw: 0,
                pitch: 0,
                title: "Tampered Hotspot Ownership",
              },
            ],
          },
        ],
      })
      .expect(404);

    // 8. DELETE /admin/tour/nodes/:id soft-deletes nodeA, clears Location.primaryNodeId, removes edges/hotspots
    await request(server)
      .delete(`/api/v1/admin/tour/nodes/${nodeAId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const locAfterNodeDelete = await prisma.location.findUniqueOrThrow({
      where: { id: locRes.body.data.id },
    });
    expect(locAfterNodeDelete.primaryNodeId).toBeNull();

    const deletedNodeDb = await prisma.tourNode.findUniqueOrThrow({
      where: { id: nodeAId },
    });
    expect(deletedNodeDb.deletedAt).not.toBeNull();
    expect(deletedNodeDb.status).toBe("ARCHIVED");

    const auditDelete = await prisma.auditLog.findFirst({
      where: { action: "TOUR_NODE_DELETE", resourceId: nodeAId },
    });
    expect(auditDelete).not.toBeNull();
  });

  it("proves batchSaveStudio multi-scene rollback, selective SCENE_LINK edge deletion, deleteNode FK/orphan cleanup with atomic AuditLog, and strict tour:publish 403 enforcement", async () => {
    // 1. Provision staff user with ONLY tour:write (explicitly lacking tour:publish)
    const rotatedPw = "BatchB2-Rotated-Admin-Pass-2026!";
    const adminRow = await prisma.user.findUniqueOrThrow({
      where: { id: adminUserId },
    });
    const tourWritePerm = await prisma.permission.findUniqueOrThrow({
      where: { code: "tour:write" },
    });
    const writerOnlyRole = await prisma.role.create({
      data: {
        code: "TOUR_WRITER_NO_PUB",
        name: "Tour Writer Without Publish",
      },
    });
    await prisma.rolePermission.create({
      data: {
        roleId: writerOnlyRole.id,
        permissionId: tourWritePerm.id,
      },
    });
    const writerUser = await prisma.user.create({
      data: {
        username: "b2_writer_only",
        fullName: "Writer Only B2",
        email: "b2.writer.only@poly.edu.vn",
        userType: "STAFF",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "ADMIN_DIRECT",
        mustChangePassword: false,
        passwordHash: adminRow.passwordHash,
      },
    });
    await prisma.userRole.create({
      data: { userId: writerUser.id, roleId: writerOnlyRole.id },
    });
    const writerLogin = await request(server)
      .post("/api/v1/auth/login")
      .send({ identifier: writerUser.username, password: rotatedPw })
      .expect(200);
    const writerOnlyToken: string = writerLogin.body.data.accessToken;

    // 2. Create 3 nodes (S1, S2, S3) for rollback, selective edge delete, and FK delete proofs
    const createScene = async (slug: string, title: string) => {
      const res = await request(server)
        .post("/api/v1/admin/tour/nodes")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title,
          slug,
          intro: `${title} intro`,
          locationId: publishedLocationId,
          panoramaAssetId: genuinePanoramaAssetId,
        })
        .expect(201);
      return res.body.data.id as string;
    };

    const s1Id = await createScene("b2-verify-s1", "Verify Scene 1");
    const s2Id = await createScene("b2-verify-s2", "Verify Scene 2");
    const s3Id = await createScene("b2-verify-s3", "Verify Scene 3");

    // 3. Authoritative backend tour:publish enforcement (401/403) including PATCH /nodes/:id bypass guard
    await request(server)
      .post("/api/v1/admin/tour/publish")
      .send({ nodeIds: [s1Id] })
      .expect(401);

    await request(server)
      .post("/api/v1/admin/tour/publish")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ nodeIds: [s1Id] })
      .expect(403);

    await request(server)
      .post("/api/v1/admin/tour/publish")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ nodeIds: [s1Id] })
      .expect(403);

    // writerOnly HAS tour:write -> can batch-save & edit metadata, CANNOT publish/unpublish/patch status=PUBLISHED
    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${writerOnlyToken}`)
      .send({
        scenes: [
          {
            nodeId: s1Id,
            slug: "b2-verify-s1",
            title: "Verify Scene 1 Writer Edit",
            hotspots: [
              {
                hotspotType: "SCENE_LINK",
                yaw: 12,
                pitch: 0,
                title: "S1 -> S2",
                targetNodeSlug: "b2-verify-s2",
              },
              {
                hotspotType: "SCENE_LINK",
                yaw: 90,
                pitch: 0,
                title: "S1 -> S3",
                targetNodeSlug: "b2-verify-s3",
              },
            ],
          },
          {
            nodeId: s2Id,
            slug: "b2-verify-s2",
            title: "Verify Scene 2",
            hotspots: [
              {
                hotspotType: "SCENE_LINK",
                yaw: 15,
                pitch: 0,
                title: "S2 -> S3",
                targetNodeSlug: "b2-verify-s3",
              },
            ],
          },
          {
            nodeId: s3Id,
            slug: "b2-verify-s3",
            title: "Verify Scene 3",
            hotspots: [
              {
                hotspotType: "SCENE_LINK",
                yaw: -45,
                pitch: 2,
                title: "S3 -> S2",
                targetNodeSlug: "b2-verify-s2",
              },
              {
                hotspotType: "SCENE_LINK",
                yaw: 120,
                pitch: -2,
                title: "S3 -> S1",
                targetNodeSlug: "b2-verify-s1",
              },
            ],
          },
        ],
      })
      .expect(201);

    await request(server)
      .patch(`/api/v1/admin/tour/nodes/${s1Id}`)
      .set("Authorization", `Bearer ${writerOnlyToken}`)
      .send({ intro: "Updated intro without status escalation" })
      .expect(200);

    await request(server)
      .post("/api/v1/admin/tour/publish")
      .set("Authorization", `Bearer ${writerOnlyToken}`)
      .send({ nodeIds: [s1Id] })
      .expect(403);

    await request(server)
      .post("/api/v1/admin/tour/unpublish")
      .set("Authorization", `Bearer ${writerOnlyToken}`)
      .send({ nodeIds: [s1Id] })
      .expect(403);

    await request(server)
      .patch(`/api/v1/admin/tour/nodes/${s1Id}`)
      .set("Authorization", `Bearer ${writerOnlyToken}`)
      .send({ status: "PUBLISHED" })
      .expect(403);

    const s1DbBeforeRollback = await prisma.tourNode.findUniqueOrThrow({
      where: { id: s1Id },
      include: { hotspots: true },
    });
    expect(s1DbBeforeRollback.status).toBe("DRAFT");
    const s1S2Hotspot = s1DbBeforeRollback.hotspots.find((h) => h.title === "S1 -> S2");
    expect(s1S2Hotspot).toBeDefined();

    // 4. Multi-scene partial failure rollback test: S1 valid mutation + S2 invalid target -> full TX rollback
    const studioAuditCountBefore = await prisma.auditLog.count({
      where: { resourceType: "TourStudio" },
    });

    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: s1Id,
            slug: "b2-verify-s1",
            title: "MUST ROLLBACK TITLE",
            hotspots: [
              {
                hotspotType: "INFO",
                yaw: 0,
                pitch: 0,
                title: "Should Not Exist After Rollback",
                body: "Rollback verification",
              },
            ],
          },
          {
            nodeId: s2Id,
            slug: "b2-verify-s2",
            title: "S2 Triggers Mid-Batch Failure",
            hotspots: [
              {
                hotspotType: "SCENE_LINK",
                yaw: 5,
                pitch: 1,
                title: "Broken Link",
                targetNodeSlug: "non-existent-target-scene",
              },
            ],
          },
        ],
      })
      .expect(400);

    // Also test rollback when S2 fails via cross-node hotspot tamper (404)
    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: s1Id,
            slug: "b2-verify-s1",
            title: "MUST ROLLBACK TITLE 2",
          },
          {
            nodeId: s2Id,
            slug: "b2-verify-s2",
            title: "S2 Cross-Node Tamper",
            hotspots: [
              {
                id: s1S2Hotspot!.id,
                hotspotType: "INFO",
                yaw: 0,
                pitch: 0,
                title: "Tampered",
              },
            ],
          },
        ],
      })
      .expect(404);

    const s1AfterRollback = await prisma.tourNode.findUniqueOrThrow({
      where: { id: s1Id },
      include: { hotspots: true },
    });
    expect(s1AfterRollback.title).toBe("Verify Scene 1 Writer Edit");
    expect(s1AfterRollback.hotspots).toHaveLength(2);
    expect(
      s1AfterRollback.hotspots.some((h) => h.title === "Should Not Exist After Rollback"),
    ).toBe(false);
    const studioAuditCountAfter = await prisma.auditLog.count({
      where: { resourceType: "TourStudio" },
    });
    expect(studioAuditCountAfter).toBe(studioAuditCountBefore);

    // 5. Selective SCENE_LINK hotspot deletion removes ONLY its TourEdge without affecting sibling/other edges
    await request(server)
      .post("/api/v1/admin/tour/studio/batch-save")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        scenes: [
          {
            nodeId: s1Id,
            slug: "b2-verify-s1",
            title: "Verify Scene 1 Writer Edit",
            hotspots: [
              {
                id: s1S2Hotspot!.id,
                hotspotType: "SCENE_LINK",
                yaw: 12,
                pitch: 0,
                title: "S1 -> S2",
                targetNodeSlug: "b2-verify-s2",
              },
            ],
          },
        ],
      })
      .expect(201);

    const [edgeS1S3, edgeS1S2, edgeS2S3] = await Promise.all([
      prisma.tourEdge.findFirst({ where: { fromNodeId: s1Id, toNodeId: s3Id } }),
      prisma.tourEdge.findFirst({ where: { fromNodeId: s1Id, toNodeId: s2Id } }),
      prisma.tourEdge.findFirst({ where: { fromNodeId: s2Id, toNodeId: s3Id } }),
    ]);
    expect(edgeS1S3).toBeNull();
    expect(edgeS1S2).not.toBeNull();
    expect(edgeS2S3).not.toBeNull();

    // 6. deleteNode() clears ALL 3 nullable FKs (Location, Building, Campus), incoming/outgoing hotspots & edges cleanly with atomic AuditLog
    const building = await prisma.building.findFirstOrThrow({
      where: { deletedAt: null },
    });
    const campus = await prisma.campus.findFirstOrThrow({
      where: { deletedAt: null },
    });
    await Promise.all([
      prisma.location.update({
        where: { id: publishedLocationId },
        data: { primaryNodeId: s2Id },
      }),
      prisma.building.update({
        where: { id: building.id },
        data: { defaultNodeId: s2Id },
      }),
      prisma.campus.update({
        where: { id: campus.id },
        data: { defaultEntryNodeId: s2Id },
      }),
    ]);

    const deleteAuditCountBefore = await prisma.auditLog.count({
      where: { action: "TOUR_NODE_DELETE" },
    });

    // Missing node delete -> 404 and zero AuditLog written
    await request(server)
      .delete("/api/v1/admin/tour/nodes/00000000-0000-4000-8000-000000000999")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
    expect(
      await prisma.auditLog.count({ where: { action: "TOUR_NODE_DELETE" } }),
    ).toBe(deleteAuditCountBefore);

    // Delete S2 (which has Location.primaryNodeId, Building.defaultNodeId, Campus.defaultEntryNodeId, incoming S1->S2, S3->S2, outgoing S2->S3)
    await request(server)
      .delete(`/api/v1/admin/tour/nodes/${s2Id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const [locAfter, bldAfter, campusAfter, s2After, orphanEdges, incomingOrOwnHotspots, unrelatedEdgeS3S1, s2DeleteAudit] =
      await Promise.all([
        prisma.location.findUniqueOrThrow({ where: { id: publishedLocationId } }),
        prisma.building.findUniqueOrThrow({ where: { id: building.id } }),
        prisma.campus.findUniqueOrThrow({ where: { id: campus.id } }),
        prisma.tourNode.findUniqueOrThrow({ where: { id: s2Id } }),
        prisma.tourEdge.findMany({
          where: { OR: [{ fromNodeId: s2Id }, { toNodeId: s2Id }] },
        }),
        prisma.hotspot.findMany({
          where: { OR: [{ nodeId: s2Id }, { edge: { is: { toNodeId: s2Id } } }] },
        }),
        prisma.tourEdge.findFirst({ where: { fromNodeId: s3Id, toNodeId: s1Id } }),
        prisma.auditLog.findFirst({
          where: { action: "TOUR_NODE_DELETE", resourceId: s2Id },
        }),
      ]);

    expect(locAfter.primaryNodeId).toBeNull();
    expect(bldAfter.defaultNodeId).toBeNull();
    expect(campusAfter.defaultEntryNodeId).toBeNull();
    expect(s2After.deletedAt).not.toBeNull();
    expect(s2After.status).toBe("ARCHIVED");
    expect(orphanEdges).toHaveLength(0);
    expect(incomingOrOwnHotspots).toHaveLength(0);
    expect(unrelatedEdgeS3S1).not.toBeNull();
    expect(s2DeleteAudit).not.toBeNull();
  });
});

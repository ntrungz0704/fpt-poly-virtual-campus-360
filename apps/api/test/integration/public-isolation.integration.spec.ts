import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Public Endpoints & TourNode/Media/Events Isolation integration tests (D-2A2-03)", () => {
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("public");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
  });

  afterAll(async () => {
    await ctx?.close();
    await dbHandle?.drop();
  });

  describe("Baseline QTSC seed (5 TourNodes DRAFT + isPreviewApproved=false, 2 private OpenDaySessions)", () => {
    it("masks all DRAFT/unapproved TourNode references on /public/campus, /buildings, /locations and omits gallery/tourNodes from /public/locations summary", async () => {
      const server = ctx.app.getHttpServer();

      const campusRes = await request(server)
        .get("/api/v1/public/campus")
        .expect(200);
      expect(campusRes.body.data.campus.code).toBe("QTSC-Q12");
      expect(campusRes.body.data.campus.defaultEntryNodeSlug).toBeNull();
      expect(campusRes.body.data.buildings).toHaveLength(5);
      for (const b of campusRes.body.data.buildings) {
        expect(b.defaultNodeSlug).toBeNull();
        expect(b.publishedNodeCount).toBe(0);
      }

      const bDetail = await request(server)
        .get("/api/v1/public/buildings/toa-nha-t")
        .expect(200);
      expect(bDetail.body.data.building.defaultNodeSlug).toBeNull();
      expect(bDetail.body.data.building.publishedNodeCount).toBe(0);
      expect(Array.isArray(bDetail.body.data.floors)).toBe(true);
      for (const floor of bDetail.body.data.floors) {
        expect(floor.nodes).toEqual([]);
        for (const pin of floor.locations) {
          expect(pin.primaryNodeSlug).toBeNull();
        }
      }

      // Summary DTO strict split: NEVER includes `gallery` or `tourNodes`
      const locList = await request(server)
        .get("/api/v1/public/locations")
        .expect(200);
      expect(locList.body.data).toHaveLength(6);
      for (const item of locList.body.data) {
        expect(item.primaryNodeSlug).toBeNull();
        expect(item).not.toHaveProperty("gallery");
        expect(item).not.toHaveProperty("tourNodes");
      }

      // Location filters
      const filteredLabs = await request(server)
        .get("/api/v1/public/locations?buildingCode=TOA-T&category=lab")
        .expect(200);
      expect(filteredLabs.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredLabs.body.data.every(
          (l: { buildingCode: string; category: string }) =>
            l.buildingCode === "TOA-T" && l.category === "lab",
        ),
      ).toBe(true);

      // Detail DTO on khu-the-thao-qtsc includes gallery + tourNodes: []
      const locDetail = await request(server)
        .get("/api/v1/public/locations/khu-the-thao-qtsc")
        .expect(200);
      expect(locDetail.body.data.primaryNodeSlug).toBeNull();
      expect(locDetail.body.data.tourNodes).toEqual([]);
      expect(Array.isArray(locDetail.body.data.gallery)).toBe(true);
    });

    it("returns [] on /public/tour/nodes and 404 on DRAFT/unapproved /public/tour/nodes/:slug", async () => {
      const server = ctx.app.getHttpServer();

      const listRes = await request(server)
        .get("/api/v1/public/tour/nodes")
        .expect(200);
      expect(listRes.body.data).toEqual([]);

      await request(server)
        .get("/api/v1/public/tour/nodes/cong-chao-qtsc")
        .expect(404);
    });

    it("returns ONLY 4 isPublic=true sessions (omitting 2 private sessions), strips quiz answers, masks DRAFT tourNodeSlug, and verifies quiz statelessly", async () => {
      const server = ctx.app.getHttpServer();

      const eventsRes = await request(server)
        .get("/api/v1/public/events")
        .expect(200);
      const payload = eventsRes.body.data;
      expect(payload.event.eventKey).toBe("open-day-2026-qtsc");

      // Seed has 6 sessions: sortOrder 3 and 5 have isPublic=false -> ONLY 4 public sessions exposed
      expect(payload.sessions).toHaveLength(4);
      expect(
        payload.sessions.every(
          (s: { accessType: string; nodeSlug: string | null }) =>
            s.accessType === "public" && s.nodeSlug === null,
        ),
      ).toBe(true);
      const sortOrders = payload.sessions.map(
        (s: { sortOrder: number }) => s.sortOrder,
      );
      expect(sortOrders).toEqual([1, 2, 4, 6]);

      expect(payload.faqs).toHaveLength(4);
      expect(payload.quizItems).toHaveLength(3);
      for (const q of payload.quizItems) {
        expect(q).not.toHaveProperty("correctIndex");
        expect(q).not.toHaveProperty("explanation");
        expect(q.tourNodeSlug).toBeNull();
      }

      // Stateless quiz verify
      const verifyRes = await request(server)
        .post("/api/v1/public/quiz/verify")
        .send({
          items: [
            { questionId: payload.quizItems[0].id, selectedIndex: 0 },
            { questionId: payload.quizItems[1].id, selectedIndex: 1 },
          ],
        })
        .expect(200);
      expect(verifyRes.body.data.total).toBe(2);
      expect(verifyRes.body.data.results).toHaveLength(2);
      expect(typeof verifyRes.body.data.results[0].correctIndex).toBe("number");
      expect(typeof verifyRes.body.data.results[0].explanation).toBe("string");
    });
  });

  describe("Controlled Publish + Unapproved/Deleted/Non-Leak Matrix", () => {
    it("exposes ONLY (PUBLISHED & deletedAt=null & isPreviewApproved=true) nodes, filters unsafe SCENE_LINK targets, and never leaks originalObjectKey", async () => {
      const prisma = ctx.app.get(PrismaService);
      const server = ctx.app.getHttpServer();

      const adminUser = await prisma.user.findFirstOrThrow({
        where: { username: "admin" },
      });
      const targetLocation = await prisma.location.findFirstOrThrow({
        where: { slug: "khu-the-thao-qtsc" },
        include: { building: true },
      });

      // Distinct originalObjectKey vs optimizedDesktopKey to prove originalObjectKey NEVER leaks
      const approvedPano = await prisma.mediaAsset.create({
        data: {
          assetKind: "PANORAMA_2_1",
          originalObjectKey: "/images/raw-secret-original/approved-raw.jpg",
          optimizedDesktopKey: "/images/panoramas/campus-courtyard-360.jpg",
          optimizedMobileKey: "/images/panoramas/campus-courtyard-360.jpg",
          thumbnailKey: "/images/locations/sports-complex.jpg",
          originalFilename: "approved.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 1000,
          sha256Checksum: "a".repeat(64),
          originalWidth: 4096,
          originalHeight: 2048,
          isValid2To1: true,
          processingStatus: "READY",
          isPreviewApproved: true,
          uploadedBy: adminUser.id,
        },
      });

      const unapprovedPano = await prisma.mediaAsset.create({
        data: {
          assetKind: "PANORAMA_2_1",
          originalObjectKey: "/images/raw-secret-original/unapproved-raw.jpg",
          optimizedDesktopKey: "/images/panoramas/it-lab-360.jpg",
          thumbnailKey: "/images/locations/lab-it.jpg",
          originalFilename: "unapproved.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 1000,
          sha256Checksum: "b".repeat(64),
          originalWidth: 4096,
          originalHeight: 2048,
          isValid2To1: true,
          processingStatus: "READY",
          isPreviewApproved: false,
          uploadedBy: adminUser.id,
        },
      });

      const eligibleNode = await prisma.tourNode.create({
        data: {
          slug: "fixture-eligible-node",
          title: "Fixture Eligible Panorama",
          intro: "Eligible node intro",
          category: "exterior",
          locationId: targetLocation.id,
          panoramaAssetId: approvedPano.id,
          status: "PUBLISHED",
          sortOrder: 90,
        },
      });

      const secondEligible = await prisma.tourNode.create({
        data: {
          slug: "fixture-eligible-target",
          title: "Fixture Eligible Target",
          intro: "Second eligible node",
          category: "study",
          locationId: targetLocation.id,
          panoramaAssetId: approvedPano.id,
          status: "PUBLISHED",
          sortOrder: 91,
        },
      });

      const unapprovedNode = await prisma.tourNode.create({
        data: {
          slug: "fixture-published-unapproved-node",
          title: "Unapproved Published Node",
          intro: "Must remain hidden",
          category: "lab",
          locationId: targetLocation.id,
          panoramaAssetId: unapprovedPano.id,
          status: "PUBLISHED",
          sortOrder: 92,
        },
      });

      const softDeletedNode = await prisma.tourNode.create({
        data: {
          slug: "fixture-soft-deleted-node",
          title: "Soft Deleted Node",
          intro: "Must remain hidden",
          category: "lab",
          locationId: targetLocation.id,
          panoramaAssetId: approvedPano.id,
          status: "PUBLISHED",
          deletedAt: new Date(),
          sortOrder: 93,
        },
      });

      const draftNode = await prisma.tourNode.create({
        data: {
          slug: "fixture-draft-approved-node",
          title: "Draft Node",
          intro: "Must remain hidden",
          category: "lab",
          locationId: targetLocation.id,
          panoramaAssetId: approvedPano.id,
          status: "DRAFT",
          sortOrder: 94,
        },
      });

      // Create TourEdges + SCENE_LINK hotspots from eligibleNode to safe AND unsafe targets
      const safeEdge = await prisma.tourEdge.create({
        data: {
          fromNodeId: eligibleNode.id,
          toNodeId: secondEligible.id,
          edgeType: "WALKWAY",
          label: "Go to Safe Target",
          targetEntryYaw: 15,
          targetEntryPitch: 0,
        },
      });
      const unsafeUnapprovedEdge = await prisma.tourEdge.create({
        data: {
          fromNodeId: eligibleNode.id,
          toNodeId: unapprovedNode.id,
          edgeType: "DOORWAY",
          label: "Unsafe Unapproved Edge",
        },
      });
      const unsafeDraftEdge = await prisma.tourEdge.create({
        data: {
          fromNodeId: eligibleNode.id,
          toNodeId: draftNode.id,
          edgeType: "DOORWAY",
          label: "Unsafe Draft Edge",
        },
      });
      const unsafeDeletedEdge = await prisma.tourEdge.create({
        data: {
          fromNodeId: eligibleNode.id,
          toNodeId: softDeletedNode.id,
          edgeType: "DOORWAY",
          label: "Unsafe Deleted Edge",
        },
      });

      await prisma.hotspot.createMany({
        data: [
          {
            nodeId: eligibleNode.id,
            hotspotType: "SCENE_LINK",
            edgeId: safeEdge.id,
            yaw: 10,
            pitch: 0,
            title: "Go to Safe Target",
          },
          {
            nodeId: eligibleNode.id,
            hotspotType: "SCENE_LINK",
            edgeId: unsafeUnapprovedEdge.id,
            yaw: 40,
            pitch: 0,
            title: "Leaked Unapproved Target",
          },
          {
            nodeId: eligibleNode.id,
            hotspotType: "SCENE_LINK",
            edgeId: unsafeDraftEdge.id,
            yaw: 70,
            pitch: 0,
            title: "Leaked Draft Target",
          },
          {
            nodeId: eligibleNode.id,
            hotspotType: "SCENE_LINK",
            edgeId: unsafeDeletedEdge.id,
            yaw: 95,
            pitch: 0,
            title: "Leaked Deleted Target",
          },
        ],
      });

      await prisma.location.update({
        where: { id: targetLocation.id },
        data: { primaryNodeId: eligibleNode.id },
      });

      // Check listTourNodes -> ONLY the 2 eligible nodes, NEVER unapproved/deleted/draft or originalObjectKey
      const tourNodesRes = await request(server)
        .get("/api/v1/public/tour/nodes")
        .expect(200);
      const slugs = tourNodesRes.body.data.map(
        (n: { slug: string }) => n.slug,
      );
      expect(slugs).toEqual([
        "fixture-eligible-node",
        "fixture-eligible-target",
      ]);

      const serializedList = JSON.stringify(tourNodesRes.body);
      expect(serializedList).not.toContain("/images/raw-secret-original/");
      expect(serializedList).not.toContain("fixture-published-unapproved-node");
      expect(serializedList).not.toContain("fixture-soft-deleted-node");
      expect(serializedList).not.toContain("fixture-draft-approved-node");

      // Check detail endpoints on unsafe nodes return 404
      await request(server)
        .get("/api/v1/public/tour/nodes/fixture-published-unapproved-node")
        .expect(404);
      await request(server)
        .get("/api/v1/public/tour/nodes/fixture-soft-deleted-node")
        .expect(404);
      await request(server)
        .get("/api/v1/public/tour/nodes/fixture-draft-approved-node")
        .expect(404);

      // Check eligible detail filters unsafe SCENE_LINK hotspots & siblingNodes strictly
      const detailRes = await request(server)
        .get("/api/v1/public/tour/nodes/fixture-eligible-node?quality=mobile")
        .expect(200);
      expect(detailRes.body.data.hotspots).toHaveLength(1);
      expect(detailRes.body.data.hotspots[0].targetNodeSlug).toBe(
        "fixture-eligible-target",
      );
      expect(detailRes.body.data.location.siblingNodes).toEqual([
        { slug: "fixture-eligible-node", title: "Fixture Eligible Panorama" },
        { slug: "fixture-eligible-target", title: "Fixture Eligible Target" },
      ]);
      const serializedDetail = JSON.stringify(detailRes.body);
      expect(serializedDetail).not.toContain("/images/raw-secret-original/");
      expect(serializedDetail).not.toContain(
        "fixture-published-unapproved-node",
      );
      expect(serializedDetail).not.toContain("fixture-draft-approved-node");
      expect(serializedDetail).not.toContain("fixture-soft-deleted-node");

      // Location & Campus counts reflect ONLY eligible nodes
      const sportsLoc = await request(server)
        .get("/api/v1/public/locations/khu-the-thao-qtsc")
        .expect(200);
      expect(sportsLoc.body.data.primaryNodeSlug).toBe("fixture-eligible-node");
      expect(sportsLoc.body.data.tourNodes).toHaveLength(2);
    });
  });
});

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

    it("returns ONLY 4 isPublic=true sessions (omitting 2 private sessions), withholds quizItems (no Event FK), leaks zero answers, and rejects POST /public/quiz/verify with 404 before DB query", async () => {
      const prisma = ctx.app.get(PrismaService);
      const server = ctx.app.getHttpServer();

      const seededPrivateSessions = await prisma.openDaySession.findMany({
        where: { isPublic: false, deletedAt: null },
        select: { id: true, title: true },
      });
      expect(seededPrivateSessions).toHaveLength(2);

      const seededPublishedQuizzes = await prisma.openDayQuizItem.findMany({
        where: { status: "PUBLISHED", deletedAt: null },
        select: { id: true, questionText: true, explanation: true },
      });
      expect(seededPublishedQuizzes).toHaveLength(3);

      const eventsRes = await request(server)
        .get("/api/v1/public/events")
        .expect(200);
      const payload = eventsRes.body.data;
      expect(payload.event.eventKey).toBe("open-day-2026-qtsc");

      // Seed has 6 sessions: sortOrder 3 and 5 have isPublic=false -> ONLY 4 public sessions exposed
      expect(payload.sessions).toHaveLength(4);
      expect(
        payload.sessions.every(
          (s: { eventId: string; accessType: string; nodeSlug: string | null }) =>
            s.eventId === payload.event.id &&
            s.accessType === "public" &&
            s.nodeSlug === null,
        ),
      ).toBe(true);
      const sortOrders = payload.sessions.map(
        (s: { sortOrder: number }) => s.sortOrder,
      );
      expect(sortOrders).toEqual([1, 2, 4, 6]);

      expect(payload.faqs).toHaveLength(4);

      // D-2A2-03 §3.4 Remediation: OpenDayQuizItem lacks eventId/FK in Prisma schema,
      // so GET /public/events intentionally withholds quizItems ([]) instead of inferring ownership.
      expect(payload.quizItems).toEqual([]);

      const serializedEvents = JSON.stringify(eventsRes.body);
      expect(serializedEvents).not.toContain("correctIndex");
      expect(serializedEvents).not.toContain("explanation");
      for (const priv of seededPrivateSessions) {
        expect(serializedEvents).not.toContain(priv.id);
        expect(serializedEvents).not.toContain(priv.title);
      }
      for (const q of seededPublishedQuizzes) {
        expect(serializedEvents).not.toContain(q.id);
        expect(serializedEvents).not.toContain(q.questionText);
        expect(serializedEvents).not.toContain(q.explanation);
      }

      // Public quiz verification is temporarily disabled (404 NOT_FOUND before DB query/answer processing)
      const quizFindManySpy = jest.spyOn(prisma.openDayQuizItem, "findMany");
      const quizFindFirstSpy = jest.spyOn(prisma.openDayQuizItem, "findFirst");
      const quizFindUniqueSpy = jest.spyOn(
        prisma.openDayQuizItem,
        "findUnique",
      );
      try {
        const verifyRes = await request(server)
          .post("/api/v1/public/quiz/verify")
          .send({
            items: [
              { questionId: seededPublishedQuizzes[0].id, selectedIndex: 0 },
              { questionId: seededPublishedQuizzes[1].id, selectedIndex: 1 },
            ],
          })
          .expect(404);
        expect(verifyRes.body.error.code).toBe("NOT_FOUND");
        expect(verifyRes.body).not.toHaveProperty("data");
        const verifySerialized = JSON.stringify(verifyRes.body);
        expect(verifySerialized).not.toContain("isCorrect");
        expect(verifySerialized).not.toContain("correctIndex");
        expect(verifySerialized).not.toContain("explanation");
        for (const q of seededPublishedQuizzes) {
          expect(verifySerialized).not.toContain(q.questionText);
          expect(verifySerialized).not.toContain(q.explanation);
        }
        expect(quizFindManySpy).not.toHaveBeenCalled();
        expect(quizFindFirstSpy).not.toHaveBeenCalled();
        expect(quizFindUniqueSpy).not.toHaveBeenCalled();
      } finally {
        quizFindManySpy.mockRestore();
        quizFindFirstSpy.mockRestore();
        quizFindUniqueSpy.mockRestore();
      }
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

    it("isolates OpenDayEvent (DRAFT/deleted), OpenDaySession (isPublic=false/DRAFT/deleted/unsafe-parent), and withholds OpenDayQuizItem safely", async () => {
      const prisma = ctx.app.get(PrismaService);
      const server = ctx.app.getHttpServer();

      const publishedEvent = await prisma.openDayEvent.findFirstOrThrow({
        where: { eventKey: "open-day-2026-qtsc" },
      });
      const building = await prisma.building.findFirstOrThrow({
        where: { campusId: publishedEvent.campusId, deletedAt: null },
      });
      const eligibleNode = await prisma.tourNode.findFirst({
        where: { slug: "fixture-eligible-node", deletedAt: null },
      });

      const draftEvent = await prisma.openDayEvent.create({
        data: {
          campusId: publishedEvent.campusId,
          eventKey: "fixture-draft-event",
          title: "Secret Draft Open Day Event",
          dateLabel: "TBD",
          timeLabel: "08:00 - 17:00",
          isDefault: false,
          status: "DRAFT",
        },
      });
      const sessionUnderDraftEvent = await prisma.openDaySession.create({
        data: {
          eventId: draftEvent.id,
          campusId: publishedEvent.campusId,
          buildingId: building.id,
          title: "Trap Session Under Draft Event",
          sessionPeriod: "MORNING",
          startTimeLabel: "08:30",
          endTimeLabel: "09:30",
          timeRangeLabel: "08:30 - 09:30",
          customLocationLabel: "Sảnh A",
          hostUnit: "Phòng Đào tạo",
          isPublic: true,
          description: "Must never be exposed while parent event is DRAFT",
          sortOrder: 1,
          status: "PUBLISHED",
        },
      });

      const deletedEvent = await prisma.openDayEvent.create({
        data: {
          campusId: publishedEvent.campusId,
          eventKey: "fixture-deleted-event",
          title: "Secret Soft Deleted Open Day Event",
          dateLabel: "TBD",
          timeLabel: "08:00 - 17:00",
          isDefault: false,
          status: "PUBLISHED",
          deletedAt: new Date(),
        },
      });
      const sessionUnderDeletedEvent = await prisma.openDaySession.create({
        data: {
          eventId: deletedEvent.id,
          campusId: publishedEvent.campusId,
          buildingId: building.id,
          title: "Trap Session Under Deleted Event",
          sessionPeriod: "AFTERNOON",
          startTimeLabel: "14:00",
          endTimeLabel: "15:00",
          timeRangeLabel: "14:00 - 15:00",
          customLocationLabel: "Hội trường",
          hostUnit: "CTSV",
          isPublic: true,
          description: "Must never be exposed while parent event is soft-deleted",
          sortOrder: 2,
          status: "PUBLISHED",
        },
      });

      const privateSession = await prisma.openDaySession.create({
        data: {
          eventId: publishedEvent.id,
          campusId: publishedEvent.campusId,
          buildingId: building.id,
          title: "Fixture Invited Private Session",
          sessionPeriod: "NOON",
          startTimeLabel: "11:30",
          endTimeLabel: "12:30",
          timeRangeLabel: "11:30 - 12:30",
          customLocationLabel: "Phòng VIP",
          hostUnit: "Ban Giám hiệu",
          isPublic: false,
          description: "Invited only",
          sortOrder: 90,
          status: "PUBLISHED",
        },
      });
      const draftSession = await prisma.openDaySession.create({
        data: {
          eventId: publishedEvent.id,
          campusId: publishedEvent.campusId,
          buildingId: building.id,
          title: "Fixture Draft Session",
          sessionPeriod: "NOON",
          startTimeLabel: "12:30",
          endTimeLabel: "13:00",
          timeRangeLabel: "12:30 - 13:00",
          customLocationLabel: "Sảnh chính",
          hostUnit: "CTSV",
          isPublic: true,
          description: "Still draft",
          sortOrder: 91,
          status: "DRAFT",
        },
      });
      const deletedSession = await prisma.openDaySession.create({
        data: {
          eventId: publishedEvent.id,
          campusId: publishedEvent.campusId,
          buildingId: building.id,
          title: "Fixture Soft Deleted Session",
          sessionPeriod: "AFTERNOON",
          startTimeLabel: "15:30",
          endTimeLabel: "16:30",
          timeRangeLabel: "15:30 - 16:30",
          customLocationLabel: "Sân bóng",
          hostUnit: "CLB",
          isPublic: true,
          description: "Soft deleted",
          sortOrder: 92,
          status: "PUBLISHED",
          deletedAt: new Date(),
        },
      });
      const eligibleSession = await prisma.openDaySession.create({
        data: {
          eventId: publishedEvent.id,
          campusId: publishedEvent.campusId,
          buildingId: building.id,
          title: "Fixture Eligible Public Session",
          sessionPeriod: "AFTERNOON",
          startTimeLabel: "16:30",
          endTimeLabel: "17:00",
          timeRangeLabel: "16:30 - 17:00",
          customLocationLabel: "Khu thể thao",
          hostUnit: "Ban Tổ chức",
          isPublic: true,
          description: "Valid public session on published event",
          sortOrder: 93,
          status: "PUBLISHED",
        },
      });

      const publishedUnlinkedQuiz = await prisma.openDayQuizItem.create({
        data: {
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Fixture Published Quiz Missing Event Relation?",
          optionsJson: ["Option A", "Option B", "Option C"],
          correctIndex: 1,
          explanation: "SECRET_UNLINKED_QUIZ_EXPLANATION",
          sortOrder: 90,
          status: "PUBLISHED",
        },
      });
      const draftQuiz = await prisma.openDayQuizItem.create({
        data: {
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Fixture Draft Quiz Question?",
          optionsJson: ["Draft A", "Draft B"],
          correctIndex: 0,
          explanation: "SECRET_DRAFT_QUIZ_EXPLANATION",
          sortOrder: 91,
          status: "DRAFT",
        },
      });
      const deletedQuiz = await prisma.openDayQuizItem.create({
        data: {
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Fixture Deleted Quiz Question?",
          optionsJson: ["Deleted A", "Deleted B"],
          correctIndex: 0,
          explanation: "SECRET_DELETED_QUIZ_EXPLANATION",
          sortOrder: 92,
          status: "PUBLISHED",
          deletedAt: new Date(),
        },
      });

      // 1. Explicit query for DRAFT event -> event=null, sessions=[], faqs=[], quizItems=[]
      const draftEventRes = await request(server)
        .get("/api/v1/public/events?eventKey=fixture-draft-event")
        .expect(200);
      expect(draftEventRes.body.data).toEqual({
        event: null,
        sessions: [],
        faqs: [],
        quizItems: [],
      });
      const draftSerialized = JSON.stringify(draftEventRes.body);
      expect(draftSerialized).not.toContain(draftEvent.id);
      expect(draftSerialized).not.toContain("Secret Draft Open Day Event");
      expect(draftSerialized).not.toContain(sessionUnderDraftEvent.id);
      expect(draftSerialized).not.toContain("Trap Session Under Draft Event");

      // 2. Explicit query for soft-deleted event -> event=null, sessions=[], faqs=[], quizItems=[]
      const deletedEventRes = await request(server)
        .get("/api/v1/public/events?eventKey=fixture-deleted-event")
        .expect(200);
      expect(deletedEventRes.body.data).toEqual({
        event: null,
        sessions: [],
        faqs: [],
        quizItems: [],
      });
      const deletedSerialized = JSON.stringify(deletedEventRes.body);
      expect(deletedSerialized).not.toContain(deletedEvent.id);
      expect(deletedSerialized).not.toContain(
        "Secret Soft Deleted Open Day Event",
      );
      expect(deletedSerialized).not.toContain(sessionUnderDeletedEvent.id);
      expect(deletedSerialized).not.toContain(
        "Trap Session Under Deleted Event",
      );

      // 3. Active PUBLISHED event returns ONLY eligible public sessions & omits ALL quizItems
      const activeEventsRes = await request(server)
        .get("/api/v1/public/events")
        .expect(200);
      const activePayload = activeEventsRes.body.data;
      expect(activePayload.event.id).toBe(publishedEvent.id);
      expect(
        activePayload.sessions.every(
          (s: { eventId: string; accessType: string }) =>
            s.eventId === publishedEvent.id && s.accessType === "public",
        ),
      ).toBe(true);
      const returnedSessionIds = activePayload.sessions.map(
        (s: { id: string }) => s.id,
      );
      expect(returnedSessionIds).toContain(eligibleSession.id);
      expect(returnedSessionIds).not.toContain(privateSession.id);
      expect(returnedSessionIds).not.toContain(draftSession.id);
      expect(returnedSessionIds).not.toContain(deletedSession.id);
      expect(returnedSessionIds).not.toContain(sessionUnderDraftEvent.id);
      expect(returnedSessionIds).not.toContain(sessionUnderDeletedEvent.id);
      expect(activePayload.quizItems).toEqual([]);

      const activeSerialized = JSON.stringify(activeEventsRes.body);
      expect(activeSerialized).not.toContain("correctIndex");
      expect(activeSerialized).not.toContain("explanation");
      expect(activeSerialized).not.toContain("Fixture Invited Private Session");
      expect(activeSerialized).not.toContain("Fixture Draft Session");
      expect(activeSerialized).not.toContain("Fixture Soft Deleted Session");
      expect(activeSerialized).not.toContain("Trap Session Under Draft Event");
      expect(activeSerialized).not.toContain("Trap Session Under Deleted Event");
      expect(activeSerialized).not.toContain(publishedUnlinkedQuiz.id);
      expect(activeSerialized).not.toContain(draftQuiz.id);
      expect(activeSerialized).not.toContain(deletedQuiz.id);
      expect(activeSerialized).not.toContain(
        "Fixture Published Quiz Missing Event Relation?",
      );
      expect(activeSerialized).not.toContain("Fixture Draft Quiz Question?");
      expect(activeSerialized).not.toContain("Fixture Deleted Quiz Question?");
      expect(activeSerialized).not.toContain("SECRET_UNLINKED_QUIZ_EXPLANATION");
      expect(activeSerialized).not.toContain("SECRET_DRAFT_QUIZ_EXPLANATION");
      expect(activeSerialized).not.toContain("SECRET_DELETED_QUIZ_EXPLANATION");

      // 4. POST /public/quiz/verify must reject ALL requests immediately (PUBLISHED without Event FK,
      // DRAFT, soft-deleted, and arbitrary valid UUID) with 404 NOT_FOUND before querying DB or leaking answers
      const matrixQuizFindManySpy = jest.spyOn(
        prisma.openDayQuizItem,
        "findMany",
      );
      const matrixQuizFindFirstSpy = jest.spyOn(
        prisma.openDayQuizItem,
        "findFirst",
      );
      const matrixQuizFindUniqueSpy = jest.spyOn(
        prisma.openDayQuizItem,
        "findUnique",
      );
      try {
        const quizVerifyCases = [
          {
            label: "PUBLISHED quiz missing Event FK",
            questionId: publishedUnlinkedQuiz.id,
            selectedIndex: 0,
            forbiddenTerms: [
              "SECRET_UNLINKED_QUIZ_EXPLANATION",
              "Fixture Published Quiz Missing Event Relation?",
            ],
          },
          {
            label: "DRAFT quiz",
            questionId: draftQuiz.id,
            selectedIndex: 0,
            forbiddenTerms: [
              "SECRET_DRAFT_QUIZ_EXPLANATION",
              "Fixture Draft Quiz Question?",
            ],
          },
          {
            label: "soft-deleted PUBLISHED quiz",
            questionId: deletedQuiz.id,
            selectedIndex: 0,
            forbiddenTerms: [
              "SECRET_DELETED_QUIZ_EXPLANATION",
              "Fixture Deleted Quiz Question?",
            ],
          },
          {
            label: "nonexistent valid UUID",
            questionId: "00000000-0000-4000-8000-000000000099",
            selectedIndex: 0,
            forbiddenTerms: [],
          },
        ];

        for (const testCase of quizVerifyCases) {
          const verifyRes = await request(server)
            .post("/api/v1/public/quiz/verify")
            .send({
              items: [
                {
                  questionId: testCase.questionId,
                  selectedIndex: testCase.selectedIndex,
                },
              ],
            })
            .expect(404);
          expect(verifyRes.body.error.code).toBe("NOT_FOUND");
          expect(verifyRes.body).not.toHaveProperty("data");
          const serialized = JSON.stringify(verifyRes.body);
          expect(serialized).not.toContain("isCorrect");
          expect(serialized).not.toContain("correctIndex");
          expect(serialized).not.toContain("explanation");
          for (const term of testCase.forbiddenTerms) {
            expect(serialized).not.toContain(term);
          }
        }

        expect(matrixQuizFindManySpy).not.toHaveBeenCalled();
        expect(matrixQuizFindFirstSpy).not.toHaveBeenCalled();
        expect(matrixQuizFindUniqueSpy).not.toHaveBeenCalled();
      } finally {
        matrixQuizFindManySpy.mockRestore();
        matrixQuizFindFirstSpy.mockRestore();
        matrixQuizFindUniqueSpy.mockRestore();
      }

      // 5. When NO PUBLISHED non-deleted event exists, default GET /public/events returns null/empty
      await prisma.openDayEvent.update({
        where: { id: publishedEvent.id },
        data: { status: "DRAFT" },
      });
      try {
        const noPublishedRes = await request(server)
          .get("/api/v1/public/events")
          .expect(200);
        expect(noPublishedRes.body.data).toEqual({
          event: null,
          sessions: [],
          faqs: [],
          quizItems: [],
        });
        const noPubSerialized = JSON.stringify(noPublishedRes.body);
        expect(noPubSerialized).not.toContain("Secret Draft Open Day Event");
        expect(noPubSerialized).not.toContain(
          "Secret Soft Deleted Open Day Event",
        );
        expect(noPubSerialized).not.toContain("Fixture Eligible Public Session");
      } finally {
        await prisma.openDayEvent.update({
          where: { id: publishedEvent.id },
          data: { status: "PUBLISHED" },
        });
      }
    });
  });
});

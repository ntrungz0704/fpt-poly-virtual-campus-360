import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Public Endpoints & TourNode/Media/Events Isolation integration tests (D-2A2-03)", () => {
  jest.setTimeout(60_000);
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

      // M2-A: Baseline seed has 3 PUBLISHED quiz items linked to open-day-2026-qtsc,
      // exposed without correctIndex/explanation, with tourNodeSlug=null while TourNodes are DRAFT.
      expect(payload.quizItems).toHaveLength(3);
      for (const item of payload.quizItems) {
        expect(item.tourNodeSlug).toBeNull();
        expect(Array.isArray(item.options)).toBe(true);
        expect(item.options.length).toBeGreaterThanOrEqual(2);
        expect(item).not.toHaveProperty("correctIndex");
        expect(item).not.toHaveProperty("explanation");
      }

      const serializedEvents = JSON.stringify(eventsRes.body);
      expect(serializedEvents).not.toContain("correctIndex");
      expect(serializedEvents).not.toContain("explanation");
      for (const priv of seededPrivateSessions) {
        expect(serializedEvents).not.toContain(priv.id);
        expect(serializedEvents).not.toContain(priv.title);
      }
      for (const q of seededPublishedQuizzes) {
        expect(serializedEvents).toContain(q.id);
        expect(serializedEvents).not.toContain(q.explanation);
      }

      // M2-B: POST /public/quiz/verify computes stateless scores with 0 DB writes
      const quizWriteSpies = [
        jest.spyOn(prisma.openDayQuizItem, "create"),
        jest.spyOn(prisma.openDayQuizItem, "update"),
        jest.spyOn(prisma.openDayQuizItem, "updateMany"),
        jest.spyOn(prisma.openDayQuizItem, "delete"),
        jest.spyOn(prisma.openDayQuizItem, "deleteMany"),
      ];
      try {
        const seededAnswers = await prisma.openDayQuizItem.findMany({
          where: { id: { in: seededPublishedQuizzes.map((q) => q.id) } },
          select: { id: true, correctIndex: true, optionsJson: true },
        });
        const answerMap = new Map(seededAnswers.map((a) => [a.id, a]));
        const itemsPayload = seededPublishedQuizzes.map((q, idx) => {
          const row = answerMap.get(q.id)!;
          const opts = Array.isArray(row.optionsJson) ? row.optionsJson : [];
          const pick =
            idx === 0
              ? row.correctIndex
              : (row.correctIndex + 1) % Math.max(opts.length, 2);
          return { questionId: q.id, selectedIndex: pick };
        });

        const verifyRes = await request(server)
          .post("/api/v1/public/quiz/verify")
          .send({ items: itemsPayload })
          .expect(200);
        expect(verifyRes.body.data.total).toBe(3);
        expect(verifyRes.body.data.correctCount).toBe(1);
        expect(verifyRes.body.data.results).toHaveLength(3);
        expect(verifyRes.body.data.results[0].isCorrect).toBe(true);
        expect(verifyRes.body.data.results[1].isCorrect).toBe(false);
        expect(verifyRes.body.data.results[2].isCorrect).toBe(false);
        for (const spy of quizWriteSpies) {
          expect(spy).not.toHaveBeenCalled();
        }
      } finally {
        for (const spy of quizWriteSpies) {
          spy.mockRestore();
        }
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

      const publishedEventQuiz = await prisma.openDayQuizItem.create({
        data: {
          eventId: publishedEvent.id,
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Fixture Published Quiz Linked To Event?",
          optionsJson: ["Option A", "Option B", "Option C"],
          correctIndex: 1,
          explanation: "SECRET_PUBLISHED_QUIZ_EXPLANATION",
          sortOrder: 90,
          status: "PUBLISHED",
        },
      });
      const quizUnderDraftEvent = await prisma.openDayQuizItem.create({
        data: {
          eventId: draftEvent.id,
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Trap Quiz Under Draft Event?",
          optionsJson: ["Option 1", "Option 2"],
          correctIndex: 0,
          explanation: "SECRET_UNDER_DRAFT_EVENT_EXPLANATION",
          sortOrder: 91,
          status: "PUBLISHED",
        },
      });
      const draftQuiz = await prisma.openDayQuizItem.create({
        data: {
          eventId: publishedEvent.id,
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Fixture Draft Quiz Question?",
          optionsJson: ["Draft A", "Draft B"],
          correctIndex: 0,
          explanation: "SECRET_DRAFT_QUIZ_EXPLANATION",
          sortOrder: 92,
          status: "DRAFT",
        },
      });
      const deletedQuiz = await prisma.openDayQuizItem.create({
        data: {
          eventId: publishedEvent.id,
          tourNodeId: eligibleNode?.id ?? null,
          questionText: "Fixture Deleted Quiz Question?",
          optionsJson: ["Deleted A", "Deleted B"],
          correctIndex: 0,
          explanation: "SECRET_DELETED_QUIZ_EXPLANATION",
          sortOrder: 93,
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
      expect(draftSerialized).not.toContain(quizUnderDraftEvent.id);
      expect(draftSerialized).not.toContain("SECRET_UNDER_DRAFT_EVENT_EXPLANATION");

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

      // 3. Active PUBLISHED event returns ONLY eligible public sessions & PUBLISHED quizItems (no answers)
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

      const returnedQuizIds = activePayload.quizItems.map(
        (q: { id: string }) => q.id,
      );
      expect(returnedQuizIds).toContain(publishedEventQuiz.id);
      expect(returnedQuizIds).not.toContain(quizUnderDraftEvent.id);
      expect(returnedQuizIds).not.toContain(draftQuiz.id);
      expect(returnedQuizIds).not.toContain(deletedQuiz.id);

      const publishedQuizDto = activePayload.quizItems.find(
        (q: { id: string }) => q.id === publishedEventQuiz.id,
      );
      expect(publishedQuizDto?.tourNodeSlug).toBe(
        eligibleNode ? "fixture-eligible-node" : null,
      );

      const activeSerialized = JSON.stringify(activeEventsRes.body);
      expect(activeSerialized).not.toContain("correctIndex");
      expect(activeSerialized).not.toContain("explanation");
      expect(activeSerialized).not.toContain("Fixture Invited Private Session");
      expect(activeSerialized).not.toContain("Fixture Draft Session");
      expect(activeSerialized).not.toContain("Fixture Soft Deleted Session");
      expect(activeSerialized).not.toContain("Trap Session Under Draft Event");
      expect(activeSerialized).not.toContain("Trap Session Under Deleted Event");
      expect(activeSerialized).not.toContain(quizUnderDraftEvent.id);
      expect(activeSerialized).not.toContain(draftQuiz.id);
      expect(activeSerialized).not.toContain(deletedQuiz.id);
      expect(activeSerialized).not.toContain("Trap Quiz Under Draft Event?");
      expect(activeSerialized).not.toContain("Fixture Draft Quiz Question?");
      expect(activeSerialized).not.toContain("Fixture Deleted Quiz Question?");
      expect(activeSerialized).not.toContain("SECRET_PUBLISHED_QUIZ_EXPLANATION");
      expect(activeSerialized).not.toContain("SECRET_UNDER_DRAFT_EVENT_EXPLANATION");
      expect(activeSerialized).not.toContain("SECRET_DRAFT_QUIZ_EXPLANATION");
      expect(activeSerialized).not.toContain("SECRET_DELETED_QUIZ_EXPLANATION");

      // 4. POST /public/quiz/verify scores eligible quiz & fails closed on mixed/draft/deleted/missing/out-of-bounds
      const okVerify = await request(server)
        .post("/api/v1/public/quiz/verify")
        .send({
          items: [{ questionId: publishedEventQuiz.id, selectedIndex: 1 }],
        })
        .expect(200);
      expect(okVerify.body.data).toEqual({
        results: [
          {
            questionId: publishedEventQuiz.id,
            selectedIndex: 1,
            isCorrect: true,
            correctIndex: 1,
            explanation: "SECRET_PUBLISHED_QUIZ_EXPLANATION",
          },
        ],
        correctCount: 1,
        total: 1,
      });

      // Out-of-bounds selectedIndex (3 options -> index 3) fails 400 BEFORE returning partial answers
      const oobRes = await request(server)
        .post("/api/v1/public/quiz/verify")
        .send({
          items: [
            { questionId: publishedEventQuiz.id, selectedIndex: 1 },
            { questionId: publishedEventQuiz.id, selectedIndex: 5 },
          ],
        })
        .expect(400);
      expect(oobRes.body.error.code).toBe("VALIDATION_ERROR");
      expect(oobRes.body).not.toHaveProperty("data");
      expect(JSON.stringify(oobRes.body)).not.toContain(
        "SECRET_PUBLISHED_QUIZ_EXPLANATION",
      );

      // Mixed batch containing a valid PUBLISHED quiz + an ineligible ID MUST fail 404 with ZERO partial leakage
      const failClosedCases = [
        {
          label: "quiz under DRAFT event",
          questionId: quizUnderDraftEvent.id,
          forbiddenTerms: [
            "SECRET_UNDER_DRAFT_EVENT_EXPLANATION",
            "SECRET_PUBLISHED_QUIZ_EXPLANATION",
            "Trap Quiz Under Draft Event?",
          ],
        },
        {
          label: "DRAFT quiz",
          questionId: draftQuiz.id,
          forbiddenTerms: [
            "SECRET_DRAFT_QUIZ_EXPLANATION",
            "SECRET_PUBLISHED_QUIZ_EXPLANATION",
            "Fixture Draft Quiz Question?",
          ],
        },
        {
          label: "soft-deleted PUBLISHED quiz",
          questionId: deletedQuiz.id,
          forbiddenTerms: [
            "SECRET_DELETED_QUIZ_EXPLANATION",
            "SECRET_PUBLISHED_QUIZ_EXPLANATION",
            "Fixture Deleted Quiz Question?",
          ],
        },
        {
          label: "nonexistent valid UUID",
          questionId: "00000000-0000-4000-8000-000000000099",
          forbiddenTerms: ["SECRET_PUBLISHED_QUIZ_EXPLANATION"],
        },
      ];

      for (const testCase of failClosedCases) {
        const verifyRes = await request(server)
          .post("/api/v1/public/quiz/verify")
          .send({
            items: [
              { questionId: publishedEventQuiz.id, selectedIndex: 1 },
              { questionId: testCase.questionId, selectedIndex: 0 },
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
        expect(noPubSerialized).not.toContain("SECRET_PUBLISHED_QUIZ_EXPLANATION");
      } finally {
        await prisma.openDayEvent.update({
          where: { id: publishedEvent.id },
          data: { status: "PUBLISHED" },
        });
      }
    });
  });

  describe("M2 Quiz Verify Rate Limit & IP Spoofing Protection (DEC-M2-A)", () => {
    it("allows 15 POST /public/quiz/verify requests/60s, returns 429 RATE_LIMITED + Retry-After on 16th, ignores spoofed X-Forwarded-For, and leaves other public routes unaffected", async () => {
      const rateCtx = await createIntegrationApiApp({
        databaseUrl: dbHandle.testDbUrl,
      });
      try {
        const prisma = rateCtx.app.get(PrismaService);
        const server = rateCtx.app.getHttpServer();
        const quiz = await prisma.openDayQuizItem.findFirstOrThrow({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            event: { status: "PUBLISHED", deletedAt: null },
          },
          select: { id: true, correctIndex: true },
        });

        for (let i = 1; i <= 15; i += 1) {
          const okRes = await request(server)
            .post("/api/v1/public/quiz/verify")
            .send({
              items: [{ questionId: quiz.id, selectedIndex: quiz.correctIndex }],
            })
            .expect(200);
          expect(okRes.body.data.correctCount).toBe(1);
        }

        const blockedRes = await request(server)
          .post("/api/v1/public/quiz/verify")
          .send({
            items: [{ questionId: quiz.id, selectedIndex: quiz.correctIndex }],
          })
          .expect(429);
        expect(blockedRes.body.success).toBe(false);
        expect(blockedRes.body.error.code).toBe("RATE_LIMITED");
        const retryAfterRaw = blockedRes.headers["retry-after"];
        expect(retryAfterRaw).toBeDefined();
        const retryAfterSec = Number(retryAfterRaw);
        expect(Number.isFinite(retryAfterSec)).toBe(true);
        expect(retryAfterSec).toBeGreaterThanOrEqual(1);
        expect(retryAfterSec).toBeLessThanOrEqual(60);

        // Spoofed X-Forwarded-For must be ignored because Express trust proxy stays disabled
        const spoofedRes = await request(server)
          .post("/api/v1/public/quiz/verify")
          .set("X-Forwarded-For", "203.0.113.99")
          .send({
            items: [{ questionId: quiz.id, selectedIndex: quiz.correctIndex }],
          })
          .expect(429);
        expect(spoofedRes.body.error.code).toBe("RATE_LIMITED");

        // Other public routes share the global 120 req/60s bucket and stay accessible
        await request(server).get("/api/v1/public/events").expect(200);
        await request(server).get("/api/v1/public/campus").expect(200);
      } finally {
        await rateCtx.close();
      }
    });
  });
});

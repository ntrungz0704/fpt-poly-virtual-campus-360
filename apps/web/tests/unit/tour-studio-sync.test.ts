import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  mapAdminTourNodesToStudioScenes,
  resolveActiveStudioSceneId,
} from "../../src/lib/admin/tour-studio-mapper";
import {
  buildTourStudioBatchPayload,
  createAdminTourNode,
  deleteAdminTourNode,
  fetchAdminTourNodes,
  saveTourStudioBatch,
  type AdminTourNodeItem,
} from "../../src/lib/admin/tour-admin-api";
import { ApiClientError } from "../../src/lib/auth/api-client";

const SAMPLE_DB_NODES: AdminTourNodeItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "custom-db-hall-new",
    title: "Hội trường Mới Từ PostgreSQL",
    intro: "Cảnh được tạo trực tiếp trong CSDL không nằm trong TOUR_SCENES tĩnh.",
    category: "common",
    initialYaw: 25,
    initialPitch: -4,
    initialFov: 72,
    sortOrder: 1,
    status: "DRAFT",
    panoramaAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    locationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    panoramaAsset: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      originalFilename: "custom-hall-360.jpg",
      originalObjectKey: "/images/panoramas/custom-hall-360.jpg",
      optimizedDesktopKey: "/images/panoramas/custom-hall-desktop.webp",
      thumbnailKey: "/images/panoramas/custom-hall-thumb.webp",
      publicUrl: "/images/panoramas/custom-hall-desktop.webp",
      thumbnailUrl: "/images/panoramas/custom-hall-thumb.webp",
      isValid2To1: true,
      isPreviewApproved: true,
      isAiPlaceholder: false,
      processingStatus: "READY",
    },
    location: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      slug: "hoi-truong-moi",
      code: "H-101",
      name: "Hội trường Mới",
      floor: { id: "f1", name: "Tầng 1" },
      building: { id: "b1", code: "TOA-T", name: "Tòa Nhà T" },
    },
    hotspots: [
      {
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        hotspotType: "SCENE_LINK",
        yaw: 40.5,
        pitch: 1.2,
        title: "Sang Lab AI mới",
        body: null,
        edge: {
          id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          toNodeId: "22222222-2222-4222-8222-222222222222",
          toNode: {
            id: "22222222-2222-4222-8222-222222222222",
            slug: "lab-ai-new",
            title: "Lab AI",
          },
        },
      },
      {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        hotspotType: "INFO",
        yaw: -15,
        pitch: 5,
        title: "Thông tin sức chứa",
        body: "Sức chứa 300 người",
        edge: null,
      },
    ],
  },
];

test("B-B2 mapper loads canonical PostgreSQL nodes including newly created nodes and SCENE_LINK edge targets", () => {
  const scenes = mapAdminTourNodesToStudioScenes(SAMPLE_DB_NODES);
  assert.equal(scenes.length, 1);

  const scene = scenes[0];
  assert.equal(scene.id, "custom-db-hall-new");
  assert.equal(scene.nodeId, "11111111-1111-4111-8111-111111111111");
  assert.equal(scene.buildingCode, "TOA-T");
  assert.equal(scene.buildingLabel, "Tòa Nhà T");
  assert.equal(scene.floor, "Tầng 1");
  assert.equal(scene.status, "draft");
  assert.equal(scene.bgUrl, "/images/panoramas/custom-hall-desktop.webp");
  assert.equal(scene.thumbUrl, "/images/panoramas/custom-hall-thumb.webp");
  assert.equal(scene.isValid2To1, true);
  assert.equal(scene.isPreviewApproved, true);
  assert.equal(scene.isAiPlaceholder, false);

  assert.equal(scene.hotspots.length, 2);
  assert.equal(scene.hotspots[0].type, "scene");
  assert.equal(scene.hotspots[0].targetSceneId, "lab-ai-new");
  assert.equal(scene.hotspots[1].type, "info");
  assert.equal(scene.hotspots[1].infoText, "Sức chứa 300 người");

  assert.equal(resolveActiveStudioSceneId([], null), "");
  assert.equal(
    resolveActiveStudioSceneId(scenes, "custom-db-hall-new"),
    "custom-db-hall-new",
  );
  assert.equal(
    resolveActiveStudioSceneId(scenes, "deleted-slug"),
    "custom-db-hall-new",
  );
});

test("B-B2 batchSave payload preserves UUID hotspots, strips synthetic hs- IDs, and forwards panoramaAssetId & targetNodeSlug", () => {
  const scenes = mapAdminTourNodesToStudioScenes(SAMPLE_DB_NODES);
  scenes[0].hotspots.push({
    id: "hs-1799999999",
    label: "Điểm mới đặt",
    yaw: 12.5,
    pitch: -3.2,
    type: "scene",
    targetSceneId: "lab-ai-new",
  });

  const payload = buildTourStudioBatchPayload(scenes);
  assert.equal(payload.scenes.length, 1);
  assert.equal(payload.scenes[0].nodeId, "11111111-1111-4111-8111-111111111111");
  assert.equal(payload.scenes[0].panoramaAssetId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(payload.scenes[0].initialFov, 72);

  assert.equal(payload.scenes[0].hotspots.length, 3);
  assert.equal(
    payload.scenes[0].hotspots[0].id,
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  );
  assert.equal(payload.scenes[0].hotspots[0].targetNodeSlug, "lab-ai-new");
  assert.equal(payload.scenes[0].hotspots[2].id, undefined);
  assert.equal(payload.scenes[0].hotspots[2].targetNodeSlug, "lab-ai-new");
});

test("B-B2 tour-admin-api propagates HTTP 403/500/offline errors without fake success fallback", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "FORBIDDEN", message: "Thiếu quyền tour:write." },
          meta: { requestId: "req-b2-403", timestamp: new Date().toISOString() },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => fetchAdminTourNodes(),
      (err: unknown) => err instanceof ApiClientError && err.status === 403,
    );

    const scenes = mapAdminTourNodesToStudioScenes(SAMPLE_DB_NODES);
    await assert.rejects(
      () => saveTourStudioBatch(scenes),
      (err: unknown) => err instanceof ApiClientError && err.status === 403,
    );

    globalThis.fetch = async () => {
      throw new TypeError("Backend offline");
    };

    await assert.rejects(
      () =>
        createAdminTourNode({
          title: "Offline Node",
          slug: "offline-node",
          intro: "Should fail",
          panoramaAssetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        }),
      (err: unknown) => err instanceof ApiClientError && err.status === 0,
    );

    await assert.rejects(
      () => deleteAdminTourNode("11111111-1111-4111-8111-111111111111"),
      (err: unknown) => err instanceof ApiClientError && err.status === 0,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("B-B2 Tour Studio and Admin Locations pages contain zero localStorage or static TOUR_SCENES runtime fallback", () => {
  const tourStudioSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/admin/virtual-tour/page.tsx"),
    "utf8",
  );
  const locationsAdminSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/admin/locations/page.tsx"),
    "utf8",
  );

  assert.equal(tourStudioSource.includes("localStorage"), false);
  assert.equal(tourStudioSource.includes("vc_admin_tour_scenes"), false);
  assert.equal(/\bTOUR_SCENES\b/.test(tourStudioSource), false);
  assert.equal(/\bTOUR_SCENES\b/.test(locationsAdminSource), false);
});

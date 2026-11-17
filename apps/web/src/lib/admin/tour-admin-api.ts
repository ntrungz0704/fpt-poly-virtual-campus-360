import { apiRequest } from "../auth/api-client";
import type { TourSceneItem } from "@/data/campus-data";

export interface AdminTourNodeItem {
  id: string;
  slug: string;
  title: string;
  intro: string;
  category: string;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  panoramaAssetId: string;
  locationId: string;
  panoramaAsset: {
    id: string;
    originalFilename?: string;
    originalObjectKey: string;
    optimizedDesktopKey?: string | null;
    optimizedMobileKey?: string | null;
    thumbnailKey?: string | null;
    isValid2To1?: boolean;
    isPreviewApproved?: boolean;
    processingStatus?: string;
    publicUrl?: string | null;
    thumbnailUrl?: string | null;
    isAiPlaceholder?: boolean;
  } | null;
  location?: {
    id: string;
    slug?: string;
    code: string;
    name: string;
    floor?: { id: string; name: string } | null;
    building?: { id: string; code: string; name: string } | null;
  } | null;
  hotspots: Array<{
    id: string;
    hotspotType: "INFO" | "SCENE_LINK" | "MEDIA" | "QUIZ_CHECKPOINT";
    yaw: number;
    pitch: number;
    title: string;
    body?: string | null;
    edge?: {
      id: string;
      toNodeId: string;
      toNode?: { id: string; slug: string; title: string } | null;
    } | null;
  }>;
}

export interface StudioSceneItem extends TourSceneItem {
  nodeId: string;
  panoramaAssetId: string;
  locationId?: string;
  isAiPlaceholder: boolean;
  isPreviewApproved: boolean;
  isValid2To1: boolean;
}

export interface CreateAdminTourNodeInput {
  title: string;
  slug: string;
  intro: string;
  category?: string;
  buildingCode?: string;
  locationId?: string;
  panoramaAssetId: string;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeYawDeg(yaw: number): number {
  const wrapped = ((yaw + 180) % 360 + 360) % 360 - 180;
  return Math.round(wrapped * 100) / 100;
}

function clampRange(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(val * 100) / 100));
}

/**
 * Build canonical Tour Studio batch-save request payload from scene items.
 */
export function buildTourStudioBatchPayload(scenes: StudioSceneItem[]) {
  return {
    scenes: scenes.map((s) => ({
      nodeId: s.nodeId,
      slug: s.id,
      title: s.name,
      description: s.intro,
      panoramaAssetId: s.panoramaAssetId,
      panoramaUrl: s.bgUrl,
      initialYaw: normalizeYawDeg(s.initialView.yaw),
      initialPitch: clampRange(s.initialView.pitch, -90, 90),
      initialFov: clampRange(s.initialView.fov, 30, 100),
      hotspots: s.hotspots.map((h) => ({
        id: UUID_PATTERN.test(h.id) ? h.id : undefined,
        hotspotType: (h.type === "scene" ? "SCENE_LINK" : "INFO") as
          | "SCENE_LINK"
          | "INFO",
        yaw: normalizeYawDeg(h.yaw),
        pitch: clampRange(h.pitch, -90, 90),
        title: h.label,
        body: h.infoText,
        targetNodeSlug:
          h.type === "scene" && h.targetSceneId ? h.targetSceneId : undefined,
      })),
    })),
  };
}

/**
 * Fetch all tour nodes from backend PostgreSQL database.
 * GET /api/v1/admin/tour/nodes
 */
export async function fetchAdminTourNodes(): Promise<AdminTourNodeItem[]> {
  return apiRequest<AdminTourNodeItem[]>("/admin/tour/nodes", { auth: true });
}

/**
 * Create a new tour node directly in PostgreSQL.
 * POST /api/v1/admin/tour/nodes
 */
export async function createAdminTourNode(
  input: CreateAdminTourNodeInput,
): Promise<AdminTourNodeItem> {
  return apiRequest<AdminTourNodeItem>("/admin/tour/nodes", {
    method: "POST",
    body: input,
    auth: true,
  });
}

/**
 * Soft-delete a tour node directly in PostgreSQL.
 * DELETE /api/v1/admin/tour/nodes/:id
 */
export async function deleteAdminTourNode(
  nodeId: string,
): Promise<{ success: boolean; deletedId: string }> {
  return apiRequest<{ success: boolean; deletedId: string }>(
    `/admin/tour/nodes/${encodeURIComponent(nodeId)}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

/**
 * Save entire Tour Studio scene configuration and hotspots directly to PostgreSQL.
 * POST /api/v1/admin/tour/studio/batch-save
 */
export async function saveTourStudioBatch(scenes: StudioSceneItem[]): Promise<{
  success: boolean;
  message: string;
  savedCount: number;
  nodes: AdminTourNodeItem[];
}> {
  const payload = buildTourStudioBatchPayload(scenes);

  return apiRequest<{
    success: boolean;
    message: string;
    savedCount: number;
    nodes: AdminTourNodeItem[];
  }>("/admin/tour/studio/batch-save", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

/**
 * Publish tour scenes to public Virtual Campus.
 * POST /api/v1/admin/tour/publish
 */
export async function publishTourScenes(nodeIds?: string[]): Promise<{
  success: boolean;
  message: string;
  publishedCount: number;
}> {
  return apiRequest<{ success: boolean; message: string; publishedCount: number }>(
    "/admin/tour/publish",
    {
      method: "POST",
      body: { nodeIds },
      auth: true,
    },
  );
}

/**
 * Unpublish tour scenes back to DRAFT.
 * POST /api/v1/admin/tour/unpublish
 */
export async function unpublishTourScenes(nodeIds?: string[]): Promise<{
  success: boolean;
  message: string;
  unpublishedCount: number;
}> {
  return apiRequest<{
    success: boolean;
    message: string;
    unpublishedCount: number;
  }>("/admin/tour/unpublish", {
    method: "POST",
    body: { nodeIds },
    auth: true,
  });
}

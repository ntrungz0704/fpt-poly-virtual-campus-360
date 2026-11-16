import { apiRequest } from "../auth/api-client";
import type { TourSceneItem, TourHotspotItem } from "@/data/campus-data";

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
  panoramaAsset: {
    id: string;
    originalObjectKey: string;
    optimizedDesktopKey?: string | null;
    thumbnailKey?: string | null;
  };
  location?: {
    id: string;
    code: string;
    name: string;
    building?: { id: string; code: string; name: string };
  };
  hotspots: Array<{
    id: string;
    hotspotType: "INFO" | "SCENE_LINK" | "MEDIA" | "QUIZ_CHECKPOINT";
    yaw: number;
    pitch: number;
    title: string;
    body?: string | null;
  }>;
}

/**
 * Fetch all tour nodes from backend database.
 * GET /api/v1/admin/tour/nodes
 */
export async function fetchAdminTourNodes(): Promise<AdminTourNodeItem[]> {
  return apiRequest<AdminTourNodeItem[]>("/admin/tour/nodes", { auth: true });
}

/**
 * Save entire Tour Studio scene configuration and hotspots directly to PostgreSQL.
 * POST /api/v1/admin/tour/studio/batch-save
 */
export async function saveTourStudioBatch(scenes: TourSceneItem[]): Promise<{
  success: boolean;
  message: string;
  savedCount: number;
}> {
  const payload = {
    scenes: scenes.map((s) => ({
      slug: s.id,
      title: s.name,
      description: s.intro,
      panoramaUrl: s.bgUrl,
      initialYaw: s.initialView.yaw,
      initialPitch: s.initialView.pitch,
      hotspots: s.hotspots.map((h: TourHotspotItem) => ({
        id: h.id.startsWith("hs-") ? undefined : h.id,
        hotspotType: (h.type === "scene" ? "SCENE_LINK" : "INFO") as "SCENE_LINK" | "INFO",
        yaw: h.yaw,
        pitch: h.pitch,
        title: h.label,
        body: h.infoText,
      })),
    })),
  };

  return apiRequest<{ success: boolean; message: string; savedCount: number }>(
    "/admin/tour/studio/batch-save",
    {
      method: "POST",
      body: payload,
      auth: true,
    },
  );
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
  return apiRequest<{ success: boolean; message: string; unpublishedCount: number }>(
    "/admin/tour/unpublish",
    {
      method: "POST",
      body: { nodeIds },
      auth: true,
    },
  );
}

import type { BuildingCode, TourHotspotItem, TourNodeCategory } from "@/data/campus-data";
import type { AdminTourNodeItem, StudioSceneItem } from "./tour-admin-api";

const VALID_BUILDING_CODES: readonly BuildingCode[] = [
  "INNOVATION",
  "TOA-T",
  "TOA-F",
  "TOA-P",
  "SPORTS",
];

const VALID_TOUR_CATEGORIES: readonly TourNodeCategory[] = [
  "exterior",
  "study",
  "lab",
];

function toBuildingCode(raw: string | undefined): BuildingCode {
  if (raw && VALID_BUILDING_CODES.includes(raw as BuildingCode)) {
    return raw as BuildingCode;
  }
  return "INNOVATION";
}

function toTourCategory(raw: string | undefined): TourNodeCategory {
  if (raw && VALID_TOUR_CATEGORIES.includes(raw as TourNodeCategory)) {
    return raw as TourNodeCategory;
  }
  return "study";
}

function toStudioStatus(status: AdminTourNodeItem["status"]): "published" | "draft" {
  return status === "PUBLISHED" ? "published" : "draft";
}

/**
 * Maps canonical PostgreSQL AdminTourNodeItem records into Tour Studio UI scenes.
 * Preserves newly created nodes, authoritative publish statuses, and SCENE_LINK edge targets.
 */
export function mapAdminTourNodesToStudioScenes(
  nodes: AdminTourNodeItem[],
): StudioSceneItem[] {
  return nodes.map((node) => {
    const bgUrl =
      node.panoramaAsset?.publicUrl ||
      node.panoramaAsset?.optimizedDesktopKey ||
      node.panoramaAsset?.originalObjectKey ||
      "";
    const thumbUrl =
      node.panoramaAsset?.thumbnailUrl ||
      node.panoramaAsset?.thumbnailKey ||
      bgUrl;

    const hotspots: TourHotspotItem[] = (node.hotspots ?? []).map((h) => ({
      id: h.id,
      label: h.title,
      yaw: h.yaw,
      pitch: h.pitch,
      type: h.hotspotType === "SCENE_LINK" ? "scene" : "info",
      targetSceneId: h.edge?.toNode?.slug ?? undefined,
      infoText: h.body ?? undefined,
    }));

    return {
      id: node.slug,
      nodeId: node.id,
      name: node.title,
      buildingCode: toBuildingCode(node.location?.building?.code),
      buildingLabel: node.location?.building?.name ?? "Khuôn viên QTSC",
      floor: node.location?.floor?.name ?? "Ngoài trời",
      category: toTourCategory(node.category),
      bgUrl,
      thumbUrl,
      intro: node.intro,
      linkedLocationSlug: node.location?.slug ?? node.slug,
      locationId: node.locationId,
      panoramaAssetId: node.panoramaAssetId,
      initialView: {
        yaw: node.initialYaw ?? 0,
        pitch: node.initialPitch ?? 0,
        fov: node.initialFov ?? 70,
      },
      status: toStudioStatus(node.status),
      isEquirectangular2to1: node.panoramaAsset?.isValid2To1 ?? false,
      isAiPlaceholder: node.panoramaAsset?.isAiPlaceholder ?? false,
      isPreviewApproved: node.panoramaAsset?.isPreviewApproved ?? false,
      isValid2To1: node.panoramaAsset?.isValid2To1 ?? false,
      hotspots,
    };
  });
}

/**
 * Resolves the next active scene ID after refreshing from PostgreSQL so
 * currently selected scenes stay focused whenever still present.
 */
export function resolveActiveStudioSceneId(
  scenes: StudioSceneItem[],
  preferredSlug: string | null,
): string {
  if (scenes.length === 0) {
    return "";
  }
  if (preferredSlug && scenes.some((s) => s.id === preferredSlug)) {
    return preferredSlug;
  }
  return scenes[0].id;
}

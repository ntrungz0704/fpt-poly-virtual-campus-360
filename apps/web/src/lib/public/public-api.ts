import type {
  PublicBuildingDetailDto,
  PublicBuildingDto,
  PublicCampusResponseDto,
  PublicEventsResponseDto,
  PublicFloorSummaryDto,
  PublicLocationDetailDto,
  PublicLocationSummaryDto,
  PublicTourNodeDetailDto,
  PublishStatus,
  QuizVerifyRequest,
  QuizVerifyResponse,
  TourNodeSummaryDto,
} from "@fpt-campus/shared";
import { apiRequest } from "../auth/api-client";
import type {
  CampusBuildingItem,
  CampusLocationItem,
  TourSceneItem,
} from "@/data/campus-data";

export interface ListPublicLocationsParams {
  building?: string;
  category?: string;
  q?: string;
}

/**
 * Fetch campus summary, landmarks, origin point, and published buildings list.
 * GET /api/v1/public/campus
 */
export async function fetchPublicCampus(): Promise<PublicCampusResponseDto> {
  return apiRequest<PublicCampusResponseDto>("/public/campus", { auth: false });
}

/**
 * Fetch building detail with floor pins.
 * GET /api/v1/public/buildings/:slug
 */
export async function fetchPublicBuilding(
  slug: string,
): Promise<PublicBuildingDetailDto> {
  return apiRequest<PublicBuildingDetailDto>(
    `/public/buildings/${encodeURIComponent(slug)}`,
    { auth: false },
  );
}

/**
 * Fetch floor summaries for a building.
 * GET /api/v1/public/buildings/:slug/floors
 */
export async function fetchPublicBuildingFloors(
  slug: string,
): Promise<PublicFloorSummaryDto[]> {
  return apiRequest<PublicFloorSummaryDto[]>(
    `/public/buildings/${encodeURIComponent(slug)}/floors`,
    { auth: false },
  );
}

/**
 * List published locations with optional filter criteria.
 * GET /api/v1/public/locations?building=&category=&q=
 */
export async function fetchPublicLocations(
  params?: ListPublicLocationsParams,
): Promise<PublicLocationSummaryDto[]> {
  const query = new URLSearchParams();
  if (params?.building && params.building !== "ALL") {
    query.set("building", params.building);
  }
  if (params?.category && params.category !== "all") {
    query.set("category", params.category);
  }
  if (params?.q?.trim()) {
    query.set("q", params.q.trim());
  }

  const qs = query.toString();
  const path = qs ? `/public/locations?${qs}` : "/public/locations";
  return apiRequest<PublicLocationSummaryDto[]>(path, { auth: false });
}

/**
 * Fetch full location detail including gallery and tourNodes.
 * GET /api/v1/public/locations/:slug
 */
export async function fetchPublicLocationBySlug(
  slug: string,
): Promise<PublicLocationDetailDto> {
  return apiRequest<PublicLocationDetailDto>(
    `/public/locations/${encodeURIComponent(slug)}`,
    { auth: false },
  );
}

/**
 * List all eligible published 360° tour nodes.
 * GET /api/v1/public/tour/nodes
 */
export async function fetchPublicTourNodes(): Promise<TourNodeSummaryDto[]> {
  return apiRequest<TourNodeSummaryDto[]>("/public/tour/nodes", { auth: false });
}

/**
 * Fetch tour node detail with its interactive hotspots and linked location.
 * GET /api/v1/public/tour/nodes/:slug
 */
export async function fetchPublicTourNodeBySlug(
  slug: string,
): Promise<PublicTourNodeDetailDto> {
  return apiRequest<PublicTourNodeDetailDto>(
    `/public/tour/nodes/${encodeURIComponent(slug)}`,
    { auth: false },
  );
}

/**
 * Fetch public Open Day event, sessions, FAQs, and quiz questions.
 * GET /api/v1/public/events
 */
export async function fetchPublicEvents(): Promise<PublicEventsResponseDto> {
  return apiRequest<PublicEventsResponseDto>("/public/events", { auth: false });
}

/**
 * Verify quiz submission statelessly.
 * POST /api/v1/public/quiz/verify
 */
export async function verifyPublicQuiz(
  dto: QuizVerifyRequest,
): Promise<QuizVerifyResponse> {
  return apiRequest<QuizVerifyResponse>("/public/quiz/verify", {
    method: "POST",
    body: dto,
    auth: false,
  });
}

// ============================================================================
// Clean UI Model Adapters (Bridge shared DTOs to existing Web UI components)
// ============================================================================

export function mapTourNodeDetailToScene(
  detail: PublicTourNodeDetailDto,
): TourSceneItem {
  const { node, hotspots } = detail;
  return {
    id: node.slug,
    name: node.title,
    buildingCode: node.buildingCode,
    buildingLabel: node.buildingLabel,
    floor: node.floorLabel,
    category: node.category,
    bgUrl: node.panoramaUrl,
    thumbUrl: node.thumbUrl,
    intro: node.intro,
    linkedLocationSlug: node.linkedLocationSlug,
    initialView: {
      yaw: node.initialYaw,
      pitch: node.initialPitch,
      fov: node.initialFov,
    },
    status:
      (node.status.toLowerCase() as Lowercase<
        Exclude<PublishStatus, "ARCHIVED">
      >) || "published",
    isEquirectangular2to1: true,
    hotspots: hotspots.map((hs) => ({
      id: hs.id,
      label: hs.title,
      yaw: hs.yaw,
      pitch: hs.pitch,
      type:
        hs.hotspotType === "SCENE_LINK"
          ? ("scene" as const)
          : ("info" as const),
      targetSceneId: hs.targetNodeSlug ?? undefined,
      tooltip: hs.body ?? undefined,
    })),
  };
}

export function mapTourNodeSummaryToScene(
  node: TourNodeSummaryDto,
): TourSceneItem {
  return {
    id: node.slug,
    name: node.title,
    buildingCode: node.buildingCode,
    buildingLabel: node.buildingLabel,
    floor: node.floorLabel,
    category: node.category,
    bgUrl: node.panoramaUrl,
    thumbUrl: node.thumbUrl,
    intro: node.intro,
    linkedLocationSlug: node.linkedLocationSlug,
    initialView: {
      yaw: node.initialYaw,
      pitch: node.initialPitch,
      fov: node.initialFov,
    },
    status:
      (node.status.toLowerCase() as Lowercase<
        Exclude<PublishStatus, "ARCHIVED">
      >) || "published",
    isEquirectangular2to1: true,
    hotspots: [],
  };
}

export function mapPublicBuildingToCampusItem(
  b: PublicBuildingDto,
): CampusBuildingItem {
  return {
    code: b.code,
    name: b.name,
    shortName: b.shortName,
    category: b.category,
    categoryLabel: b.categoryLabel,
    floorsLabel: b.floorsLabel,
    summary: b.summary,
    highlights: b.highlights,
    imageUrl: b.coverUrl,
    defaultSceneId: b.defaultNodeSlug ?? "cong-chao-qtsc",
    gisX: b.gisX ?? 50,
    gisY: b.gisY ?? 50,
    lat: b.lat,
    lng: b.lng,
    addressNote: b.addressNote,
    mapIconKey: b.mapIconKey,
    routeWaypoints: b.routeWaypoints,
    statusNote: b.statusNote,
  };
}

export function mapPublicLocationToItem(
  loc: PublicLocationSummaryDto | PublicLocationDetailDto,
): CampusLocationItem {
  return {
    id: loc.id,
    slug: loc.slug,
    code: loc.code,
    name: loc.name,
    buildingCode: loc.buildingCode,
    buildingName: loc.buildingName,
    floor: loc.floorLabel,
    category: loc.category,
    categoryLabel: loc.categoryLabel,
    shortDesc: loc.shortDesc,
    description: loc.description,
    highlights: loc.highlights,
    imageUrl: loc.imageUrl,
    sceneId: loc.primaryNodeSlug,
    status:
      (loc.status.toLowerCase() as Lowercase<
        Exclude<PublishStatus, "ARCHIVED">
      >) || "published",
  };
}

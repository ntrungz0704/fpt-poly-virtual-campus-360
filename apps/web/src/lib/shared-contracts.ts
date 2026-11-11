// ============================================================================
// Phase 2A Shared Contract Mappers (Fallback Mock -> Strict @fpt-campus/shared DTOs)
// Keeps existing UI behavior intact while enforcing Phase 2A v2A.2 contracts.
// ============================================================================

import {
  DEFAULT_ENTRY_NODE_SLUG,
  DEFAULT_QTSC_CAMPUS_CODE,
  type BuildingCode,
  type HotspotType,
  type LocationTypeCode,
  type PublicBuildingDto,
  type PublicCampusResponseDto,
  type PublicEventsResponseDto,
  type PublicLocationSummaryDto,
  type PublicOpenDayEventDto,
  type PublicOpenDayFaqDto,
  type PublicOpenDaySessionDto,
  type PublicQuizQuestionDto,
  type PublicTourNodeDetailDto,
  type PublishStatus,
  type QuizVerifyRequest,
  type QuizVerifyResponse,
  type SessionPeriod,
  type TourEdgeType,
  type TourHotspotDto,
  type TourNodeSummaryDto,
} from "@fpt-campus/shared";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_LOCATIONS,
  OFFICIAL_CAMPUS_INFO,
  OPEN_DAY_FAQ,
  OPEN_DAY_QUIZ_QUESTIONS,
  OPEN_DAY_SESSIONS,
  QTSC_LANDMARKS,
  QTSC_ORIGIN_POINT,
  TOUR_SCENES,
  type CampusBuildingItem,
  type CampusLocationItem,
  type OpenDaySessionItem,
  type TourSceneItem,
} from "@/data/campus-data";

const STATIC_CAMPUS_UUID = "00000000-0000-4000-8000-000000000001";
const STATIC_EVENT_UUID = "00000000-0000-4000-8000-000000000010";

const LOCATION_TYPE_MAP: Record<CampusLocationItem["category"], LocationTypeCode> = {
  common: "LOBBY",
  lab: "LAB",
  studio: "STUDIO",
};

const BUILDING_CODE_NAMES: Record<BuildingCode, string> = {
  INNOVATION: "Tòa Nhà Innovation (Lô 24 QTSC)",
  "TOA-T": "Tòa Nhà T (QTSC 9 · Giảng đường & CNTT)",
  "TOA-F": "Tòa Nhà F (Multimedia & Thiết kế)",
  "TOA-P": "Tòa Nhà P (Khu Học tập Chuyên ngành)",
  SPORTS: "Khu Thể thao & Sân Ngoài trời QTSC",
};

function toPublishStatus(status: "published" | "draft"): PublishStatus {
  return status === "published" ? "PUBLISHED" : "DRAFT";
}

function toSessionPeriod(period: OpenDaySessionItem["period"]): SessionPeriod {
  if (period === "noon") return "NOON";
  if (period === "afternoon") return "AFTERNOON";
  return "MORNING";
}

function toHotspotType(type: TourSceneItem["hotspots"][number]["type"]): HotspotType {
  return type === "scene" ? "SCENE_LINK" : "INFO";
}

function inferEdgeType(sceneSlug: string, targetSlug?: string): TourEdgeType {
  if (sceneSlug === "cong-chao-qtsc" || targetSlug === "cong-chao-qtsc") {
    return "OUTDOOR_LINK";
  }
  return "WALKWAY";
}

export function mapBuildingToPublicDto(item: CampusBuildingItem): PublicBuildingDto {
  const buildingSlug = item.code.toLowerCase();
  const nodeCount = TOUR_SCENES.filter(
    (scene) => scene.buildingCode === item.code && scene.status === "published"
  ).length;

  return {
    id: `bldg-${buildingSlug}`,
    code: item.code,
    slug: buildingSlug,
    name: item.name,
    shortName: item.shortName,
    category: item.category,
    categoryLabel: item.categoryLabel,
    floorsLabel: item.floorsLabel,
    summary: item.summary,
    description: item.summary,
    highlights: item.highlights,
    coverUrl: item.imageUrl,
    defaultNodeSlug: item.defaultSceneId,
    lat: item.lat,
    lng: item.lng,
    addressNote: item.addressNote,
    statusNote: item.statusNote,
    mapIconKey: item.mapIconKey,
    routeWaypoints: item.routeWaypoints,
    gisX: item.gisX,
    gisY: item.gisY,
    floorCount: 1,
    publishedNodeCount: nodeCount,
  };
}

export function getFallbackPublicCampusDto(): PublicCampusResponseDto {
  return {
    campus: {
      id: STATIC_CAMPUS_UUID,
      code: DEFAULT_QTSC_CAMPUS_CODE,
      name: OFFICIAL_CAMPUS_INFO.name,
      address: OFFICIAL_CAMPUS_INFO.address,
      defaultEntryNodeSlug: DEFAULT_ENTRY_NODE_SLUG,
      originPoint: QTSC_ORIGIN_POINT,
      landmarks: QTSC_LANDMARKS,
    },
    buildings: CAMPUS_BUILDINGS.map(mapBuildingToPublicDto),
  };
}

export function mapLocationToPublicSummaryDto(
  loc: CampusLocationItem
): PublicLocationSummaryDto {
  const resolvedTypeCode: LocationTypeCode =
    loc.id === "loc-the-thao"
      ? "SPORTS"
      : loc.id === "loc-thu-vien-so"
        ? "LIBRARY"
        : LOCATION_TYPE_MAP[loc.category];

  return {
    id: loc.id,
    slug: loc.slug,
    code: loc.code,
    name: loc.name,
    buildingCode: loc.buildingCode,
    buildingName: loc.buildingName || BUILDING_CODE_NAMES[loc.buildingCode],
    floorLabel: loc.floor,
    typeCode: resolvedTypeCode,
    category: loc.category,
    categoryLabel: loc.categoryLabel,
    shortDesc: loc.shortDesc,
    description: loc.description,
    highlights: loc.highlights,
    imageUrl: loc.imageUrl,
    primaryNodeSlug: loc.sceneId,
    isPublicAccessible: true,
    restrictionNote: null,
    status: toPublishStatus(loc.status),
  };
}

export function getFallbackPublicLocationsDto(): PublicLocationSummaryDto[] {
  return CAMPUS_LOCATIONS.filter((loc) => loc.status === "published").map(
    mapLocationToPublicSummaryDto
  );
}

export function mapSceneToTourNodeSummaryDto(
  scene: TourSceneItem
): TourNodeSummaryDto {
  return {
    id: scene.id,
    slug: scene.id,
    title: scene.name,
    intro: scene.intro,
    category: scene.category,
    buildingCode: scene.buildingCode,
    buildingLabel: scene.buildingLabel,
    floorLabel: scene.floor,
    thumbUrl: scene.thumbUrl,
    panoramaUrl: scene.bgUrl,
    fallbackMobileUrl: scene.bgUrl,
    initialYaw: scene.initialView.yaw,
    initialPitch: scene.initialView.pitch,
    initialFov: scene.initialView.fov,
    headingOffsetDeg: 0,
    floorPlanId: null,
    floorNormX: null,
    floorNormY: null,
    linkedLocationSlug: scene.linkedLocationSlug,
    status: toPublishStatus(scene.status),
  };
}

export function getFallbackPublicTourNodeDetailDto(
  slug: string
): PublicTourNodeDetailDto | null {
  const scene = TOUR_SCENES.find((s) => s.id === slug && s.status === "published");
  if (!scene) return null;

  const loc = CAMPUS_LOCATIONS.find((l) => l.slug === scene.linkedLocationSlug);
  const siblings = TOUR_SCENES.filter(
    (s) => s.linkedLocationSlug === scene.linkedLocationSlug && s.status === "published"
  ).map((s) => ({ slug: s.id, title: s.name }));

  const hotspots: TourHotspotDto[] = scene.hotspots.map((hs) => {
    const hotspotType = toHotspotType(hs.type);
    return {
      id: hs.id,
      hotspotType,
      edgeType:
        hotspotType === "SCENE_LINK"
          ? inferEdgeType(scene.id, hs.targetSceneId)
          : null,
      yaw: hs.yaw,
      pitch: hs.pitch,
      title: hs.label,
      body: hs.infoText ?? null,
      targetNodeSlug: hs.targetSceneId ?? null,
      targetEntryYaw: null,
      targetEntryPitch: null,
      targetFloorId: null,
      payload: null,
    };
  });

  return {
    node: mapSceneToTourNodeSummaryDto(scene),
    location: {
      id: loc?.id ?? scene.linkedLocationSlug,
      slug: scene.linkedLocationSlug,
      name: loc?.name ?? scene.name,
      typeCode: loc ? LOCATION_TYPE_MAP[loc.category] : "LOBBY",
      buildingCode: scene.buildingCode,
      floorId: null,
      siblingNodes: siblings,
    },
    hotspots,
  };
}

export function getFallbackPublicEventsDto(): PublicEventsResponseDto {
  const event: PublicOpenDayEventDto = {
    id: STATIC_EVENT_UUID,
    eventKey: "open-day-2026-05",
    title: "FPT Polytechnic Open Day — CVPM Quang Trung",
    subtitle: OFFICIAL_CAMPUS_INFO.campusLabel,
    dateLabel: OFFICIAL_CAMPUS_INFO.openDayDateLabel,
    timeLabel: OFFICIAL_CAMPUS_INFO.openDayTimeLabel,
    eventDate: "2026-05-24",
  };

  const sessions: PublicOpenDaySessionDto[] = OPEN_DAY_SESSIONS.map((item, idx) => ({
    id: item.id,
    eventId: STATIC_EVENT_UUID,
    period: toSessionPeriod(item.period),
    timeRange: item.timeRange,
    title: item.title,
    description: item.description,
    buildingCode: item.buildingCode,
    locationLabel: item.locationLabel,
    nodeSlug: item.sceneId ?? null,
    accessType: item.accessType,
    hostUnit: item.hostUnit,
    sortOrder: idx + 1,
  }));

  const faqs: PublicOpenDayFaqDto[] = OPEN_DAY_FAQ.map((faq, idx) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sortOrder: idx + 1,
  }));

  // Public quiz items explicitly omit correctIndex and explanation before verification (OD-08)
  const quizItems: PublicQuizQuestionDto[] = OPEN_DAY_QUIZ_QUESTIONS.map((q) => ({
    id: q.id,
    tourNodeSlug: null,
    questionText: q.question,
    options: q.options,
  }));

  return { event, sessions, faqs, quizItems };
}

export function verifyFallbackQuizStateless(
  req: QuizVerifyRequest
): QuizVerifyResponse {
  const results = req.items.map((attempt) => {
    const matched = OPEN_DAY_QUIZ_QUESTIONS.find((q) => q.id === attempt.questionId);
    if (!matched) {
      return {
        questionId: attempt.questionId,
        selectedIndex: attempt.selectedIndex,
        isCorrect: false,
        correctIndex: -1,
        explanation: "Câu hỏi không tồn tại hoặc chưa được xuất bản.",
      };
    }

    return {
      questionId: matched.id,
      selectedIndex: attempt.selectedIndex,
      isCorrect: attempt.selectedIndex === matched.correctIndex,
      correctIndex: matched.correctIndex,
      explanation: matched.explanation,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  return {
    results,
    correctCount,
    total: results.length,
  };
}

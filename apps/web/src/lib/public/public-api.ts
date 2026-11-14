import type {
  OpenDayTicketDto,
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
  RegisterOpenDayInput,
  TourNodeSummaryDto,
} from "@fpt-campus/shared";
import { apiRequest } from "../auth/api-client";
import {
  TOUR_SCENES,
  type CampusBuildingItem,
  type CampusLocationItem,
  type TourSceneItem,
} from "@/data/campus-data";

export const FALLBACK_OPEN_DAY_EVENTS: PublicEventsResponseDto = {
  event: {
    id: "ev-openday-2026",
    eventKey: "openday-2026",
    title: "FPT Polytechnic Open Day 2026 — Trải nghiệm QTSC 360°",
    subtitle: "Khám phá không gian học tập thực chiến tại CVPM Quang Trung Quận 12",
    dateLabel: "Chủ Nhật, 24/05/2026",
    timeLabel: "08:00 – 16:30",
    eventDate: "2026-05-24T01:00:00.000Z",
  },
  sessions: [
    {
      id: "ses-1",
      eventId: "ev-openday-2026",
      period: "MORNING",
      timeRange: "08:00 – 08:45",
      title: "Đón khách tham quan & Định hướng khuôn viên QTSC",
      description:
        "Đón tiếp học sinh, phụ huynh và khách tham quan tại Sảnh Innovation; hướng dẫn trải nghiệm Bản đồ GIS và hành trình tham quan các khu phòng Lab.",
      buildingCode: "INNOVATION",
      locationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
      nodeSlug: "cong-chao-qtsc",
      accessType: "public",
      hostUnit: "Ban Tổ Chức Open Day",
      sortOrder: 1,
    },
    {
      id: "ses-2",
      eventId: "ev-openday-2026",
      period: "MORNING",
      timeRange: "08:45 – 09:45",
      title: "Phiên Khai mạc & Giới thiệu Không gian Đào tạo Thực hành",
      description:
        "Chia sẻ tổng quan về môi trường học tập theo dự án thực tế tại CVPM Quang Trung Quận 12 và giải đáp chung cho phụ huynh, học sinh.",
      buildingCode: "INNOVATION",
      locationLabel: "Hội trường Đa năng — Tòa Innovation",
      nodeSlug: "sanh-innovation",
      accessType: "public",
      hostUnit: "Ban Điều hành Cơ sở Q.12",
      sortOrder: 2,
    },
    {
      id: "ses-3",
      eventId: "ev-openday-2026",
      period: "MORNING",
      timeRange: "10:00 – 11:30",
      title: "Trải nghiệm Workshop chuyên sâu tại Phòng Lab & Studio iMac",
      description:
        "Hoạt động thực hành trực tiếp theo nhóm nhỏ tại phòng Lab Tòa T và Studio Đồ họa Tòa F theo phân ca trong tài khoản tham dự.",
      buildingCode: "TOA-T",
      locationLabel: "Phòng Lab T-301 & Studio F-402",
      nodeSlug: "lab-it",
      accessType: "invited",
      hostUnit: "Giảng viên Bộ môn CNTT & Đồ họa",
      sortOrder: 3,
    },
    {
      id: "ses-4",
      eventId: "ev-openday-2026",
      period: "NOON",
      timeRange: "11:30 – 13:30",
      title: "Tham quan Thư viện Số, Khu Thể thao & Giao lưu Câu lạc bộ",
      description:
        "Tự do tham quan không gian Co-working Tầng 2 và giao lưu cùng các câu lạc bộ sinh viên tại khuôn viên QTSC.",
      buildingCode: "SPORTS",
      locationLabel: "Thư viện Số T2 & Khu Thể thao",
      nodeSlug: "thu-vien",
      accessType: "public",
      hostUnit: "Công tác Sinh viên Q.12",
      sortOrder: 4,
    },
    {
      id: "ses-5",
      eventId: "ev-openday-2026",
      period: "AFTERNOON",
      timeRange: "13:30 – 15:30",
      title: "Thử thách Khám phá Khuôn viên & Hoạt động Trải nghiệm QTSC",
      description:
        "Người tham dự trải nghiệm các trạm định hướng tại các tòa nhà trọng điểm và ôn tập thông tin khuôn viên qua mini-game tích hợp trong tour 360°.",
      buildingCode: "TOA-F",
      locationLabel: "Tòa F & Không gian Tham dự Trực tuyến",
      nodeSlug: "studio-imac",
      accessType: "invited",
      hostUnit: "Điều phối viên Open Day",
      sortOrder: 5,
    },
    {
      id: "ses-6",
      eventId: "ev-openday-2026",
      period: "AFTERNOON",
      timeRange: "15:30 – 16:30",
      title: "Tổng kết phiên trải nghiệm & Trao đổi riêng cùng cố vấn",
      description:
        "Giải đáp các câu hỏi sau buổi trải nghiệm trực tiếp khuôn viên trước khi kết thúc ngày hội.",
      buildingCode: "INNOVATION",
      locationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
      nodeSlug: "sanh-innovation",
      accessType: "public",
      hostUnit: "Ban Tổ Chức Open Day",
      sortOrder: 6,
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "Tôi có cần tạo tài khoản để tham quan khuôn viên trực tuyến không?",
      answer:
        "Không. Bạn có thể mở Tour 360°, Bản đồ GIS và Danh mục Địa điểm tự do hoàn toàn mà không cần đăng nhập hoặc điền biểu mẫu.",
      sortOrder: 1,
    },
    {
      id: "faq-2",
      question: "Tham gia trải nghiệm Open Day và Tham quan 360° có mất phí không?",
      answer:
        "Sự kiện Open Day và nền tảng tham quan khuôn viên trực tuyến 360° hoàn toàn miễn phí cho tất cả học sinh, phụ huynh và khách tham quan.",
      sortOrder: 2,
    },
    {
      id: "faq-3",
      question: "Địa chỉ cơ sở QTSC Quận 12 ở đâu và di chuyển bằng xe buýt như thế nào?",
      answer:
        "Cơ sở tọa lạc tại Tòa nhà Innovation, Lô 24, Công viên Phần mềm Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12, TP.HCM. Bạn có thể đi các tuyến xe buýt số 55, 48 hoặc 145 dừng ngay cổng chính Tô Ký.",
      sortOrder: 3,
    },
    {
      id: "faq-4",
      question: "Các ngành đào tạo nào có phòng thực hành chuyên biệt tại cơ sở?",
      answer:
        "Cơ sở có phòng Lab Lập trình CNTT (Tòa T), Studio iMac Đồ họa & Phim (Tòa F), Giảng đường Kinh tế số (Tòa P), Thư viện Số & Co-working (Tòa Innovation).",
      sortOrder: 4,
    },
  ],
  quizItems: [
    {
      id: "qz-1",
      tourNodeSlug: "cong-chao-qtsc",
      questionText: "Cơ sở FPT Polytechnic tại CVPM Quang Trung nằm ở quận nào của TP.HCM?",
      options: ["Quận 10", "Quận 12", "Quận Bình Thạnh", "Quận Gò Vấp"],
    },
    {
      id: "qz-2",
      tourNodeSlug: "thu-vien",
      questionText: "Thư viện Số & Không gian Co-working nằm tại tầng mấy của Tòa Innovation?",
      options: ["Tầng Trệt (G)", "Tầng 1", "Tầng 2", "Tầng 4"],
    },
    {
      id: "qz-3",
      tourNodeSlug: "studio-imac",
      questionText: "Studio Thiết kế Đồ họa trang bị hệ thống máy tính nào?",
      options: ["Hệ thống máy iMac", "Máy trạm PC Windows", "Laptop Dell XPS", "Máy tính bảng iPad Pro"],
    },
    {
      id: "qz-4",
      tourNodeSlug: "lab-it",
      questionText: "Phòng thực hành Lập trình CNTT T-301 thuộc tòa nhà nào?",
      options: ["Tòa Innovation", "Tòa Nhà T", "Tòa Nhà F", "Tòa Nhà P"],
    },
  ],
};

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
  try {
    const res = await apiRequest<TourNodeSummaryDto[]>("/public/tour/nodes", { auth: false });
    if (res && res.length > 0) return res;
  } catch {
    // API offline -> fall back to built-in scenes
  }
  return TOUR_SCENES.map((scene, idx) => ({
    id: `node-${idx + 1}`,
    slug: scene.id,
    title: scene.name,
    buildingCode: scene.buildingCode,
    buildingLabel: scene.buildingLabel,
    floorLabel: scene.floor,
    category: scene.category,
    panoramaUrl: scene.bgUrl,
    thumbUrl: scene.thumbUrl,
    fallbackMobileUrl: scene.bgUrl,
    intro: scene.intro,
    initialYaw: scene.initialView.yaw,
    initialPitch: scene.initialView.pitch,
    initialFov: scene.initialView.fov,
    headingOffsetDeg: 0,
    status: "PUBLISHED" as const,
    floorPlanId: null,
    floorNormX: null,
    floorNormY: null,
    linkedLocationSlug: scene.linkedLocationSlug ?? "sanh-innovation",
  }));
}

/**
 * Fetch tour node detail with its interactive hotspots and linked location.
 * GET /api/v1/public/tour/nodes/:slug
 */
export async function fetchPublicTourNodeBySlug(
  slug: string,
): Promise<PublicTourNodeDetailDto> {
  try {
    return await apiRequest<PublicTourNodeDetailDto>(
      `/public/tour/nodes/${encodeURIComponent(slug)}`,
      { auth: false },
    );
  } catch {
    // API offline -> fall back
  }
  const scene = TOUR_SCENES.find((s) => s.id === slug) ?? TOUR_SCENES[0];
  return {
    node: {
      id: "node-" + scene.id,
      slug: scene.id,
      title: scene.name,
      buildingCode: scene.buildingCode,
      buildingLabel: scene.buildingLabel,
      floorLabel: scene.floor,
      category: scene.category,
      panoramaUrl: scene.bgUrl,
      thumbUrl: scene.thumbUrl,
      fallbackMobileUrl: scene.bgUrl,
      intro: scene.intro,
      initialYaw: scene.initialView.yaw,
      initialPitch: scene.initialView.pitch,
      initialFov: scene.initialView.fov,
      headingOffsetDeg: 0,
      status: "PUBLISHED" as const,
      floorPlanId: null,
      floorNormX: null,
      floorNormY: null,
      linkedLocationSlug: scene.linkedLocationSlug ?? "sanh-innovation",
    },
    location: {
      id: "loc-" + scene.id,
      slug: scene.linkedLocationSlug ?? "sanh-innovation",
      name: scene.name,
      typeCode: "LOBBY",
      buildingCode: scene.buildingCode,
      floorId: null,
      siblingNodes: [],
    },
    hotspots: scene.hotspots.map((hs) => ({
      id: hs.id,
      yaw: hs.yaw,
      pitch: hs.pitch,
      title: hs.label,
      hotspotType: hs.targetSceneId ? ("SCENE_LINK" as const) : ("INFO" as const),
      edgeType: "DOORWAY" as const,
      targetNodeSlug: hs.targetSceneId ?? null,
      targetEntryYaw: null,
      targetEntryPitch: null,
      targetFloorId: null,
      body: null,
      payload: null,
    })),
  };
}

/**
 * Fetch public Open Day event, sessions, FAQs, and quiz questions.
 * GET /api/v1/public/events
 */
export async function fetchPublicEvents(): Promise<PublicEventsResponseDto> {
  try {
    const res = await apiRequest<PublicEventsResponseDto>("/public/events", { auth: false });
    if (res && res.event) return res;
  } catch {
    // API offline -> fall back
  }
  return FALLBACK_OPEN_DAY_EVENTS;
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

/**
 * Register attendee for Open Day event (M3C).
 * POST /api/v1/public/events/register
 */
export async function registerPublicOpenDay(
  input: RegisterOpenDayInput,
): Promise<OpenDayTicketDto> {
  return apiRequest<OpenDayTicketDto>("/public/events/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

/**
 * Lookup registered ticket by unique ticket code (M3C).
 * GET /api/v1/public/events/tickets/:ticketCode
 */
export async function fetchPublicTicketByCode(
  ticketCode: string,
): Promise<OpenDayTicketDto> {
  return apiRequest<OpenDayTicketDto>(
    `/public/events/tickets/${encodeURIComponent(ticketCode.trim().toUpperCase())}`,
    { auth: false },
  );
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

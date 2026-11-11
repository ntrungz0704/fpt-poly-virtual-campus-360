// ============================================================================
// FPT Polytechnic Virtual Campus 360° (QTSC District 12)
// Phase 2A-1 — Idempotent PostgreSQL Seed (FK-Ordered, Argon2id, OD-01..OD-10)
//
// IMPORTANT DATA PROVENANCE NOTICE (D-02 / R-03 / R-06):
// - QTSC campus GPS coordinates, buildings, locations, and Open Day records in
//   this seed are INITIAL DEVELOPMENT SEED DATA derived from the static app
//   prototype — NOT yet field-survey verified for production (Phase 2C).
// - All 5 PANORAMA_2_1 assets are AI-generated 16:9 (1376x768) renders
//   stretched/edge-blended to 2048x1024 (2:1) SYNTHETIC PLACEHOLDERS for dev.
//   Therefore: isValid2To1=true reflects pixel container ratio ONLY;
//   isPreviewApproved=false; and all 5 placeholder TourNodes are seeded as DRAFT.
// ============================================================================

import crypto from "node:crypto";
import dotenv from "dotenv";
import argon2 from "argon2";
import type {
  BuildingCategory,
  MapBuildingIconKey,
  MediaKind,
  Prisma,
  PrismaClient as PrismaClientType,
  SessionPeriod,
  TourEdgeType,
} from "@prisma/client";

if (process.env.PRISMA_SEED_SKIP_DOTENV !== "1") {
  dotenv.config({ quiet: true });
}

// SHA-256 digests of banned leaked/legacy passwords (compared without storing plaintext)
const FORBIDDEN_PASSWORD_SHA256 = new Set<string>([
  "f95b7163c36e12b2012a55b8dc6a975bf5a5f7f80de31ac50f2b8ed209ca6456",
  "b0b4ac0a9bb50af169fbc0ab4ea815675cd14596f4f46056e164d5e2231b7c4e",
]);

function assertValidBootstrapPassword(raw: string | undefined): string {
  const password = raw?.trim() ?? "";
  if (!password) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD is required in environment and cannot be empty.",
    );
  }
  const digest = crypto.createHash("sha256").update(password).digest("hex");
  const lowerDigest = crypto
    .createHash("sha256")
    .update(password.toLowerCase())
    .digest("hex");
  if (
    FORBIDDEN_PASSWORD_SHA256.has(digest) ||
    FORBIDDEN_PASSWORD_SHA256.has(lowerDigest)
  ) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD matches a forbidden leaked credential and was rejected.",
    );
  }
  if (password.startsWith("CHANGE_ME_")) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD still uses an example placeholder; provide a real secret.",
    );
  }
  if (password.length < 12) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters long.",
    );
  }
  return password;
}

const ROLES_DATA = [
  {
    code: "SUPER_ADMIN",
    name: "Quản trị viên Hệ thống",
    description:
      "Toàn quyền cấu hình hệ thống, quản lý tài khoản, RBAC, dữ liệu campus và xuất bản tour.",
  },
  {
    code: "TOUR_EDITOR",
    name: "Biên tập viên Tour 360° & Mặt bằng",
    description:
      "Quản lý tòa nhà, tầng, mặt bằng 2D, địa điểm, media và đồ thị Tour 360°.",
  },
  {
    code: "EVENT_OPERATOR",
    name: "Điều phối viên Sự kiện Open Day",
    description:
      "Quản lý lịch trình Open Day, FAQ, Quiz định hướng và cấp tài khoản khách mời Open Day.",
  },
] as const;

const PERMISSIONS_DATA = [
  { code: "campus:write", description: "Tạo/cập nhật khuôn viên và tòa nhà" },
  { code: "floorplan:write", description: "Upload và căn chỉnh mặt bằng tầng" },
  { code: "location:write", description: "Quản lý địa điểm và phân loại không gian" },
  { code: "media:upload", description: "Tải lên và duyệt tệp ảnh 2D / Panorama 2:1" },
  { code: "tour:write", description: "Biên tập TourNode, TourEdge và Hotspot 360°" },
  { code: "tour:publish", description: "Kiểm duyệt đồ thị và xuất bản Tour 360°" },
  { code: "users:manage", description: "Quản lý tài khoản nội bộ và phân quyền RBAC" },
  {
    code: "users:provision_openday",
    description: "Cấp phát và import tài khoản khách mời Open Day",
  },
  { code: "events:write", description: "Quản lý sự kiện, lịch trình, FAQ và Quiz Open Day" },
  { code: "audit:read", description: "Tra cứu nhật ký kiểm toán hệ thống (Audit Logs)" },
] as const;

const ROLE_PERMISSION_MAP: Record<string, readonly string[]> = {
  SUPER_ADMIN: PERMISSIONS_DATA.map((p) => p.code),
  TOUR_EDITOR: [
    "campus:write",
    "floorplan:write",
    "location:write",
    "media:upload",
    "tour:write",
    "tour:publish",
  ],
  EVENT_OPERATOR: ["events:write", "users:provision_openday"],
};

const LOCATION_TYPES_DATA = [
  {
    code: "CLASSROOM",
    filterGroup: "common",
    label: "Phòng học / Hội trường",
    iconName: "school",
    isInterFloorConnector: false,
  },
  {
    code: "LAB",
    filterGroup: "lab",
    label: "Phòng Lab CNTT",
    iconName: "computer",
    isInterFloorConnector: false,
  },
  {
    code: "STUDIO",
    filterGroup: "studio",
    label: "Studio & Multimedia",
    iconName: "palette",
    isInterFloorConnector: false,
  },
  {
    code: "HALLWAY",
    filterGroup: "common",
    label: "Hành lang",
    iconName: "view_agenda",
    isInterFloorConnector: false,
  },
  {
    code: "ELEVATOR",
    filterGroup: "common",
    label: "Thang máy",
    iconName: "elevator",
    isInterFloorConnector: true,
  },
  {
    code: "STAIRS",
    filterGroup: "common",
    label: "Cầu thang bộ",
    iconName: "stairs",
    isInterFloorConnector: true,
  },
  {
    code: "RESTROOM",
    filterGroup: "common",
    label: "Nhà vệ sinh",
    iconName: "wc",
    isInterFloorConnector: false,
  },
  {
    code: "LIBRARY",
    filterGroup: "common",
    label: "Thư viện Số",
    iconName: "menu_book",
    isInterFloorConnector: false,
  },
  {
    code: "LOBBY",
    filterGroup: "common",
    label: "Sảnh Đón Tiếp",
    iconName: "meeting_room",
    isInterFloorConnector: false,
  },
  {
    code: "SPORTS",
    filterGroup: "common",
    label: "Tiện ích & Thể thao",
    iconName: "sports_soccer",
    isInterFloorConnector: false,
  },
  {
    code: "RESTRICTED_AREA",
    filterGroup: "common",
    label: "Khu vực hạn chế",
    iconName: "lock",
    isInterFloorConnector: false,
  },
] as const;

interface MediaSeedEntry {
  key: string;
  assetKind: MediaKind;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: bigint;
  sha256Checksum: string;
  originalWidth: number;
  originalHeight: number;
  isValid2To1: boolean;
  isPreviewApproved: boolean;
  cameraMetadata: Prisma.InputJsonValue;
  originalObjectKey: string;
  optimizedDesktopKey: string;
  optimizedMobileKey: string | null;
  thumbnailKey: string;
}

const PHOTO_2D_DEV_METADATA: Prisma.InputJsonValue = {
  orientation: "landscape",
  assetOrigin: "AI_GENERATED_DEVELOPMENT_PLACEHOLDER",
  isRealQtscCapture: false,
  dataProvenance: "INITIAL_DEV_SEED_UNVERIFIED_QTSC",
};

const MEDIA_ASSETS_DATA: readonly MediaSeedEntry[] = [
  {
    key: "pano-courtyard",
    assetKind: "PANORAMA_2_1",
    originalFilename: "campus-courtyard-360.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 477371n,
    sha256Checksum:
      "d0e9add7e38d3abaff67af1d27f56927a1140f6c91b789cb73cb4d40900bb594",
    originalWidth: 2048,
    originalHeight: 1024,
    isValid2To1: true,
    isPreviewApproved: false,
    cameraMetadata: {
      assetOrigin: "AI_GENERATED_SYNTHETIC_PLACEHOLDER",
      sourceFormat: "AI_16_9_STRETCHED_TO_2_1",
      sourceDimensions: "1376x768",
      containerDimensions: "2048x1024",
      isTrueEquirectangular360x180: false,
      isRealQtscCapture: false,
      hasExif: false,
      hasGpanoXmp: false,
      projectionStatus: "UNVERIFIED_SYNTHETIC_PLACEHOLDER",
      requiresReal360ReplacementBeforeGoLive: true,
      placeholderNote:
        "AI-generated 16:9 courtyard render stretched/blended to 2:1 container for Phase 2A dev; not a 360x180 camera capture.",
    },
    originalObjectKey: "/images/panoramas/campus-courtyard-360.jpg",
    optimizedDesktopKey: "/images/panoramas/campus-courtyard-360.jpg",
    optimizedMobileKey: "/images/panoramas/campus-courtyard-360.jpg",
    thumbnailKey: "/images/locations/building-innovation.jpg",
  },
  {
    key: "pano-auditorium",
    assetKind: "PANORAMA_2_1",
    originalFilename: "auditorium-360.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 397578n,
    sha256Checksum:
      "facd64dc26f2b183e747cfabdf5c7be51ff6226456bc7d228c4ac231f2950e9b",
    originalWidth: 2048,
    originalHeight: 1024,
    isValid2To1: true,
    isPreviewApproved: false,
    cameraMetadata: {
      assetOrigin: "AI_GENERATED_SYNTHETIC_PLACEHOLDER",
      sourceFormat: "AI_16_9_RECTILINEAR_STRETCHED_TO_2_1",
      sourceDimensions: "1376x768",
      containerDimensions: "2048x1024",
      isTrueEquirectangular360x180: false,
      isRealQtscCapture: false,
      hasExif: false,
      hasGpanoXmp: false,
      projectionStatus: "UNVERIFIED_RECTILINEAR_PLACEHOLDER",
      requiresReal360ReplacementBeforeGoLive: true,
      placeholderNote:
        "Rectilinear 16:9 AI hall render shared with locations/auditorium-hall.jpg and resized to 2:1; lacks spherical 360x180 wrap.",
    },
    originalObjectKey: "/images/panoramas/auditorium-360.jpg",
    optimizedDesktopKey: "/images/panoramas/auditorium-360.jpg",
    optimizedMobileKey: "/images/panoramas/auditorium-360.jpg",
    thumbnailKey: "/images/locations/auditorium-hall.jpg",
  },
  {
    key: "pano-library",
    assetKind: "PANORAMA_2_1",
    originalFilename: "library-360.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 400694n,
    sha256Checksum:
      "ff61132ed57d9f079418695b1172072beae348983fb075e720667e0101e43433",
    originalWidth: 2048,
    originalHeight: 1024,
    isValid2To1: true,
    isPreviewApproved: false,
    cameraMetadata: {
      assetOrigin: "AI_GENERATED_SYNTHETIC_PLACEHOLDER",
      sourceFormat: "AI_16_9_STRETCHED_TO_2_1",
      sourceDimensions: "1376x768",
      containerDimensions: "2048x1024",
      isTrueEquirectangular360x180: false,
      isRealQtscCapture: false,
      hasExif: false,
      hasGpanoXmp: false,
      projectionStatus: "UNVERIFIED_SYNTHETIC_PLACEHOLDER",
      requiresReal360ReplacementBeforeGoLive: true,
      placeholderNote:
        "AI-generated 16:9 library render stretched/blended to 2:1 container for Phase 2A dev; not a 360x180 camera capture.",
    },
    originalObjectKey: "/images/panoramas/library-360.jpg",
    optimizedDesktopKey: "/images/panoramas/library-360.jpg",
    optimizedMobileKey: "/images/panoramas/library-360.jpg",
    thumbnailKey: "/images/locations/library-reading.jpg",
  },
  {
    key: "pano-lab-it",
    assetKind: "PANORAMA_2_1",
    originalFilename: "it-lab-360.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 317163n,
    sha256Checksum:
      "37a09a47bbd706ffb3ec36fe252de5cf1eaf285e8dac2706d5c14863fad390dc",
    originalWidth: 2048,
    originalHeight: 1024,
    isValid2To1: true,
    isPreviewApproved: false,
    cameraMetadata: {
      assetOrigin: "AI_GENERATED_SYNTHETIC_PLACEHOLDER",
      sourceFormat: "AI_16_9_STRETCHED_TO_2_1",
      sourceDimensions: "1376x768",
      containerDimensions: "2048x1024",
      isTrueEquirectangular360x180: false,
      isRealQtscCapture: false,
      hasExif: false,
      hasGpanoXmp: false,
      projectionStatus: "UNVERIFIED_SYNTHETIC_PLACEHOLDER",
      requiresReal360ReplacementBeforeGoLive: true,
      placeholderNote:
        "AI-generated 16:9 lab render stretched/blended to 2:1 container (contains distorted AI wall text and seam discontinuities); dev placeholder only.",
    },
    originalObjectKey: "/images/panoramas/it-lab-360.jpg",
    optimizedDesktopKey: "/images/panoramas/it-lab-360.jpg",
    optimizedMobileKey: "/images/panoramas/it-lab-360.jpg",
    thumbnailKey: "/images/locations/lab-it.jpg",
  },
  {
    key: "pano-studio-imac",
    assetKind: "PANORAMA_2_1",
    originalFilename: "imac-studio-360.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 344948n,
    sha256Checksum:
      "fbab55dc2257eb12981fbe37043c19549ed3f8b6bce31d008def115fb618c142",
    originalWidth: 2048,
    originalHeight: 1024,
    isValid2To1: true,
    isPreviewApproved: false,
    cameraMetadata: {
      assetOrigin: "AI_GENERATED_SYNTHETIC_PLACEHOLDER",
      sourceFormat: "AI_16_9_STRETCHED_TO_2_1",
      sourceDimensions: "1376x768",
      containerDimensions: "2048x1024",
      isTrueEquirectangular360x180: false,
      isRealQtscCapture: false,
      hasExif: false,
      hasGpanoXmp: false,
      projectionStatus: "UNVERIFIED_SYNTHETIC_PLACEHOLDER",
      requiresReal360ReplacementBeforeGoLive: true,
      placeholderNote:
        "AI-generated 16:9 studio render stretched/blended to 2:1 container with +/-180 deg seam mismatch; dev placeholder only.",
    },
    originalObjectKey: "/images/panoramas/imac-studio-360.jpg",
    optimizedDesktopKey: "/images/panoramas/imac-studio-360.jpg",
    optimizedMobileKey: "/images/panoramas/imac-studio-360.jpg",
    thumbnailKey: "/images/locations/studio-imac.jpg",
  },
  {
    key: "photo-innovation",
    assetKind: "PHOTO_2D",
    originalFilename: "building-innovation.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 311718n,
    sha256Checksum:
      "0b365cfe6948f689eaf3bebe840d76ec71400d676aaeba1e58042d7f69a008bd",
    originalWidth: 1280,
    originalHeight: 720,
    isValid2To1: false,
    isPreviewApproved: true,
    cameraMetadata: PHOTO_2D_DEV_METADATA,
    originalObjectKey: "/images/locations/building-innovation.jpg",
    optimizedDesktopKey: "/images/locations/building-innovation.jpg",
    optimizedMobileKey: null,
    thumbnailKey: "/images/locations/building-innovation.jpg",
  },
  {
    key: "photo-auditorium",
    assetKind: "PHOTO_2D",
    originalFilename: "auditorium-hall.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 208411n,
    sha256Checksum:
      "76791067d60f9e15323c0e857ea1434ea4f08a6a0facf2bfa59fdbffadf58f2c",
    originalWidth: 1280,
    originalHeight: 720,
    isValid2To1: false,
    isPreviewApproved: true,
    cameraMetadata: PHOTO_2D_DEV_METADATA,
    originalObjectKey: "/images/locations/auditorium-hall.jpg",
    optimizedDesktopKey: "/images/locations/auditorium-hall.jpg",
    optimizedMobileKey: null,
    thumbnailKey: "/images/locations/auditorium-hall.jpg",
  },
  {
    key: "photo-library",
    assetKind: "PHOTO_2D",
    originalFilename: "library-reading.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 192862n,
    sha256Checksum:
      "2201c1479dbdf66e9d3f0c8bad8778d3d19d0133c9530a6c0e883e80105bade7",
    originalWidth: 1280,
    originalHeight: 720,
    isValid2To1: false,
    isPreviewApproved: true,
    cameraMetadata: PHOTO_2D_DEV_METADATA,
    originalObjectKey: "/images/locations/library-reading.jpg",
    optimizedDesktopKey: "/images/locations/library-reading.jpg",
    optimizedMobileKey: null,
    thumbnailKey: "/images/locations/library-reading.jpg",
  },
  {
    key: "photo-lab-it",
    assetKind: "PHOTO_2D",
    originalFilename: "lab-it.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 170968n,
    sha256Checksum:
      "5f77102615043258a9c55bf6807a13f9f2e295f9ab8331203db592f9e99fb02b",
    originalWidth: 1280,
    originalHeight: 720,
    isValid2To1: false,
    isPreviewApproved: true,
    cameraMetadata: PHOTO_2D_DEV_METADATA,
    originalObjectKey: "/images/locations/lab-it.jpg",
    optimizedDesktopKey: "/images/locations/lab-it.jpg",
    optimizedMobileKey: null,
    thumbnailKey: "/images/locations/lab-it.jpg",
  },
  {
    key: "photo-studio-imac",
    assetKind: "PHOTO_2D",
    originalFilename: "studio-imac.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 180931n,
    sha256Checksum:
      "79cfbd26dfc140d7f9052c91cc4119beaa26b3ff186d131b790ad518b0c9b03d",
    originalWidth: 1280,
    originalHeight: 720,
    isValid2To1: false,
    isPreviewApproved: true,
    cameraMetadata: PHOTO_2D_DEV_METADATA,
    originalObjectKey: "/images/locations/studio-imac.jpg",
    optimizedDesktopKey: "/images/locations/studio-imac.jpg",
    optimizedMobileKey: null,
    thumbnailKey: "/images/locations/studio-imac.jpg",
  },
  {
    key: "photo-sports",
    assetKind: "PHOTO_2D",
    originalFilename: "sports-complex.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 313369n,
    sha256Checksum:
      "87ad930fa529e66abc86c27f64885c1a4674aba3c19779fe0bc7d5842407ff20",
    originalWidth: 1280,
    originalHeight: 720,
    isValid2To1: false,
    isPreviewApproved: true,
    cameraMetadata: PHOTO_2D_DEV_METADATA,
    originalObjectKey: "/images/locations/sports-complex.jpg",
    optimizedDesktopKey: "/images/locations/sports-complex.jpg",
    optimizedMobileKey: null,
    thumbnailKey: "/images/locations/sports-complex.jpg",
  },
];

interface BuildingSeedEntry {
  code: string;
  slug: string;
  name: string;
  shortName: string;
  category: BuildingCategory;
  categoryLabel: string;
  floorsLabel: string;
  summary: string;
  description: string;
  highlightsJson: string[];
  lat: number;
  lng: number;
  gisX: number;
  gisY: number;
  addressNote: string;
  statusNote: string;
  mapIconKey: MapBuildingIconKey;
  routeWaypointsJson: [number, number][];
  coverMediaKey: string;
  defaultNodeSlug: string | null;
  sortOrder: number;
  floors: Array<{ code: string; name: string; levelIndex: number }>;
}

// R-06: Initial QTSC development seed data (WGS84 lat/lng, floor labels, building specs)
// copied from prototype data; NOT yet field-survey verified (scheduled for Phase 2C).
const BUILDINGS_DATA: readonly BuildingSeedEntry[] = [
  {
    code: "INNOVATION",
    slug: "toa-nha-innovation",
    name: "Tòa Nhà Innovation (Lô 24 QTSC)",
    shortName: "Tòa Innovation",
    category: "ACADEMIC",
    categoryLabel: "Trung tâm & Hội trường",
    floorsLabel: "Tầng Trệt – Tầng 4",
    summary:
      "Khu vực điều hành trung tâm, sảnh đón tiếp Open Day, Thư viện số mở và Hội trường đa năng.",
    description:
      "Trung tâm điều hành và đón tiếp chính của FPT Polytechnic tại Công viên Phần mềm Quang Trung (Lô 24), quy tụ Sảnh Đón Tiếp Open Day tầng trệt, Hội trường đa năng tầng 1 và Thư viện Số Co-working tầng 2.",
    highlightsJson: [
      "Sảnh Đón Tiếp & Cổng Check-in Open Day",
      "Thư viện Số & Không gian Co-working",
      "Hội trường Đa năng tổ chức sự kiện",
    ],
    lat: 10.852935,
    lng: 106.629409,
    gisX: 50,
    gisY: 42,
    addressNote:
      "Lô 24, Đường Khu Trung tâm, CVPM Quang Trung, P. Trung Mỹ Tây, Q.12",
    statusNote: "Điểm check-in Open Day chính",
    mapIconKey: "INNOVATION",
    routeWaypointsJson: [
      [10.852825, 106.62669],
      [10.85318, 106.62735],
      [10.8531, 106.62845],
      [10.852935, 106.629409],
    ],
    coverMediaKey: "photo-innovation",
    defaultNodeSlug: "sanh-innovation",
    sortOrder: 1,
    floors: [
      { code: "G", name: "Tầng Trệt", levelIndex: 0 },
      { code: "F1", name: "Tầng 1 — Hội trường Đa năng", levelIndex: 1 },
      { code: "F2", name: "Tầng 2 — Thư viện Số & Co-working", levelIndex: 2 },
    ],
  },
  {
    code: "TOA-T",
    slug: "toa-nha-t",
    name: "Tòa Nhà T (QTSC 9 · Giảng đường & CNTT)",
    shortName: "Tòa Nhà T",
    category: "LAB",
    categoryLabel: "Phòng Lab & Xưởng",
    floorsLabel: "Khối giảng đường & Lab",
    summary:
      "Khối phòng học lý thuyết và hệ thống phòng Lab thực hành Công nghệ Thông tin, Phát triển Phần mềm.",
    description:
      "Khối giảng đường và phòng máy thực hành chuyên ngành Công nghệ Thông tin tại Tòa QTSC Building 9, bố trí các cụm máy màn hình đôi phục vụ lập trình Web/Mobile và dự án phần mềm.",
    highlightsJson: [
      "Phòng Lab Lập trình & Phát triển Web/Mobile",
      "Không gian thực hành nhóm theo dự án",
      "Khu vực tự học & hỗ trợ kỹ thuật",
    ],
    lat: 10.853888,
    lng: 106.626167,
    gisX: 28,
    gisY: 64,
    addressNote:
      "Tòa QTSC Building 9, 42 Đường số 3 / Đường Tô Ký, CVPM Quang Trung, Q.12",
    statusNote: "Cụm phòng máy CNTT · Mặt tiền Tô Ký",
    mapIconKey: "IT_BUILDING",
    routeWaypointsJson: [
      [10.852825, 106.62669],
      [10.85315, 106.62685],
      [10.85358, 106.62648],
      [10.853888, 106.626167],
    ],
    coverMediaKey: "photo-lab-it",
    defaultNodeSlug: "lab-it",
    sortOrder: 2,
    floors: [{ code: "F3", name: "Tầng 3 — Cụm Phòng Lab CNTT", levelIndex: 3 }],
  },
  {
    code: "TOA-F",
    slug: "toa-nha-f",
    name: "Tòa Nhà F (Multimedia & Thiết kế)",
    shortName: "Tòa Nhà F",
    category: "LAB",
    categoryLabel: "Phòng Lab & Xưởng",
    floorsLabel: "Khối studio & thực hành",
    summary:
      "Không gian thực hành Thiết kế Đồ họa, Dựng phim và Truyền thông Đa phương tiện.",
    description:
      "Không gian thực hành Thiết kế Đồ họa, dựng phim và truyền thông đa phương tiện tại Khu Nam CVPM Quang Trung, trang bị hệ thống Studio iMac chuyên dụng.",
    highlightsJson: [
      "Studio thực hành máy iMac chuyên dụng",
      "Phòng xử lý hậu kỳ & thuyết trình đồ án",
      "Khu trưng bày sản phẩm thiết kế sinh viên",
    ],
    lat: 10.8519,
    lng: 106.62825,
    gisX: 57,
    gisY: 67,
    addressNote:
      "Đường số 14, Khu Nam CVPM Quang Trung (gần Cầu vượt Quang Trung), Q.12",
    statusNote: "Cụm Studio Đồ họa · Gần Cầu vượt",
    mapIconKey: "DESIGN_STUDIO",
    routeWaypointsJson: [
      [10.852825, 106.62669],
      [10.85258, 106.62742],
      [10.8519, 106.62825],
    ],
    coverMediaKey: "photo-studio-imac",
    defaultNodeSlug: "studio-imac",
    sortOrder: 3,
    floors: [
      { code: "F4", name: "Tầng 4 — Studio Đồ họa iMac", levelIndex: 4 },
    ],
  },
  {
    code: "TOA-P",
    slug: "toa-nha-p",
    name: "Tòa Nhà P (Khu Học tập Chuyên ngành)",
    shortName: "Tòa Nhà P",
    category: "ACADEMIC",
    categoryLabel: "Đào tạo chuyên ngành",
    floorsLabel: "Khối phòng học mở rộng",
    summary:
      "Khu giảng đường chuyên đề kinh tế số, không gian trao đổi nhóm và lớp học thực hành ứng dụng.",
    description:
      "Khu giảng đường phía Bắc CVPM Quang Trung dành cho các học phần chuyên đề kinh tế số, sinh hoạt câu lạc bộ và hội thảo ứng dụng.",
    highlightsJson: [
      "Giảng đường mô phỏng tình huống doanh nghiệp",
      "Không gian sinh hoạt câu lạc bộ & hội thảo nhỏ",
    ],
    lat: 10.85485,
    lng: 106.6301,
    gisX: 72,
    gisY: 28,
    addressNote:
      "Đường số 12 – 13, Khu Giảng đường phía Bắc, CVPM Quang Trung, Q.12",
    statusNote: "Khu giảng đường phía Bắc QTSC",
    mapIconKey: "ACADEMIC_HALL",
    routeWaypointsJson: [
      [10.852825, 106.62669],
      [10.85322, 106.62735],
      [10.85395, 106.62855],
      [10.85458, 106.62958],
      [10.85485, 106.6301],
    ],
    coverMediaKey: "photo-library",
    defaultNodeSlug: "thu-vien",
    sortOrder: 4,
    floors: [{ code: "F1", name: "Tầng 1 — Khu Giảng đường Mở rộng", levelIndex: 1 }],
  },
  {
    code: "SPORTS",
    slug: "khu-the-thao-qtsc",
    name: "Khu Thể thao & Sân Ngoài trời QTSC",
    shortName: "Khu Thể thao",
    category: "FACILITY",
    categoryLabel: "Tiện ích & Thể thao",
    floorsLabel: "Khuôn viên ngoài trời",
    summary:
      "Tổ hợp sân cỏ nhân tạo, sân bóng rổ và mảng xanh kết nối giao lưu sinh viên ngoài trời.",
    description:
      "Khu thể thao và sân ngoài trời trong khuôn viên QTSC Quận 12 phục vụ hoạt động rèn luyện thể chất, sân bóng đá mini, bóng rổ và ngoại khóa Open Day.",
    highlightsJson: [
      "Sân bóng đá mini & sân bóng rổ ngoài trời",
      "Sân tập kết và hoạt động ngoại khóa Open Day",
    ],
    lat: 10.85348,
    lng: 106.63082,
    gisX: 80,
    gisY: 57,
    addressNote:
      "Sân Thể thao QTSC, gần Đường số 16 & Công viên Trung tâm, Q.12",
    statusNote: "Hoạt động thể chất & ngoại khóa",
    mapIconKey: "SPORTS",
    routeWaypointsJson: [
      [10.852825, 106.62669],
      [10.85318, 106.62735],
      [10.85328, 106.62905],
      [10.85348, 106.63082],
    ],
    coverMediaKey: "photo-sports",
    defaultNodeSlug: null, // OD-02: No own 360 scene yet -> keep null cleanly
    sortOrder: 5,
    floors: [],
  },
];

const LOCATIONS_DATA = [
  {
    code: "INV-01",
    slug: "sanh-innovation",
    name: "Sảnh Đón Tiếp Tòa Nhà Innovation",
    buildingCode: "INNOVATION",
    floorCode: "G",
    locationTypeCode: "LOBBY",
    categoryLabel: "Không gian Chung",
    shortSummary:
      "Khu vực đón tiếp khách tham quan, check-in Open Day và định hướng khuôn viên.",
    description:
      "Điểm dừng chân đầu tiên khi bước vào cơ sở CVPM Quang Trung. Tại đây diễn ra hoạt động đón tiếp khách tham quan Open Day và hướng dẫn định hướng di chuyển tới các tòa nhà, phòng Lab.",
    highlightsJson: [
      "Quầy đón tiếp & hướng dẫn lịch trình Open Day",
      "Khu vực sảnh mở kết nối trực tiếp lối lên Hội trường",
      "Điểm tập trung đoàn tham quan trải nghiệm",
    ],
    coverMediaKey: "photo-innovation",
    primaryNodeSlug: "cong-chao-qtsc",
  },
  {
    code: "INV-201",
    slug: "thu-vien-so-t2",
    name: "Thư viện Số & Không gian Co-working",
    buildingCode: "INNOVATION",
    floorCode: "F2",
    locationTypeCode: "LIBRARY",
    categoryLabel: "Không gian Tri thức",
    shortSummary:
      "Khu tự học yên tĩnh kết hợp bàn làm việc nhóm và cabin trao đổi dự án.",
    description:
      "Không gian học tập mở dành cho sinh viên tra cứu tài liệu số, đọc sách chuyên ngành và họp nhóm theo mô hình Co-working với ánh sáng tự nhiên rộng mở.",
    highlightsJson: [
      "Khu bàn tự học cá nhân và bàn làm việc nhóm",
      "Các cabin kính kín cho buổi thảo luận đồ án",
      "Quầy hỗ trợ tài nguyên học tập số",
    ],
    coverMediaKey: "photo-library",
    primaryNodeSlug: "thu-vien",
  },
  {
    code: "INV-101",
    slug: "hoi-truong-innovation",
    name: "Hội trường Đa năng Innovation",
    buildingCode: "INNOVATION",
    floorCode: "F1",
    locationTypeCode: "CLASSROOM",
    categoryLabel: "Sự kiện & Hội thảo",
    shortSummary:
      "Không gian hội trường bậc thang phục vụ khai mạc Open Day và tọa đàm chuyên đề.",
    description:
      "Hội trường lớn với hệ thống ghế ngồi bậc thang, màn hình trình chiếu trung tâm và hệ thống âm thanh phục vụ lễ khai mạc Open Day, hội thảo định hướng nghề nghiệp cùng doanh nghiệp.",
    highlightsJson: [
      "Bố cục ghế bậc thang quan sát rõ từ mọi hàng",
      "Màn hình sân khấu phục vụ trình chiếu & tọa đàm",
      "Kết nối thuận tiện với Sảnh Đón Tiếp tầng trệt",
    ],
    coverMediaKey: "photo-auditorium",
    primaryNodeSlug: "sanh-innovation",
  },
  {
    code: "T-301",
    slug: "lab-lap-trinh-t301",
    name: "Phòng Thực hành Lập trình & Công nghệ",
    buildingCode: "TOA-T",
    floorCode: "F3",
    locationTypeCode: "LAB",
    categoryLabel: "Phòng Lab CNTT",
    shortSummary:
      "Phòng thực hành lập trình phần mềm, web và phát triển ứng dụng theo dự án.",
    description:
      "Phòng máy chuyên ngành thuộc Tòa Nhà T, bố trí các cụm máy tính cấu hình thực hành lập trình Web, Mobile và kiểm thử phần mềm để sinh viên thao tác trực tiếp theo bài thực hành.",
    highlightsJson: [
      "Cụm bàn máy tính màn hình đôi thuận tiện code & debug",
      "Màn hình trình chiếu cho giảng viên hướng dẫn trực tiếp",
      "Vách kính hành lang thông thoáng, ánh sáng đồng đều",
    ],
    coverMediaKey: "photo-lab-it",
    primaryNodeSlug: "lab-it",
  },
  {
    code: "F-402",
    slug: "studio-imac-f402",
    name: "Studio Thiết kế Đồ họa iMac",
    buildingCode: "TOA-F",
    floorCode: "F4",
    locationTypeCode: "STUDIO",
    categoryLabel: "Studio & Multimedia",
    shortSummary:
      "Không gian thực hành thiết kế đồ họa, chỉnh sửa hình ảnh và dựng phim.",
    description:
      "Studio thực hành dành riêng cho các lớp Thiết kế Đồ họa và Truyền thông Đa phương tiện với bàn làm việc sáng tạo và dàn máy tính đồng bộ màn hình sắc nét.",
    highlightsJson: [
      "Hệ thống máy trạm all-in-one phục vụ thiết kế & dựng hình",
      "Hệ thống đèn trần tiêu chuẩn cho studio sáng tạo",
      "Khu vực bàn nhóm nhận xét sản phẩm trực quan",
    ],
    coverMediaKey: "photo-studio-imac",
    primaryNodeSlug: "studio-imac",
  },
  {
    code: "SPO-01",
    slug: "khu-the-thao-qtsc",
    name: "Tổ hợp Thể thao & Sân ngoài trời",
    buildingCode: "SPORTS",
    floorCode: null, // Campus outdoor location
    locationTypeCode: "SPORTS",
    categoryLabel: "Tiện ích & Thể thao",
    shortSummary:
      "Sân bóng đá mini cỏ nhân tạo, sân bóng rổ và không gian giao lưu sinh viên.",
    description:
      "Khu rèn luyện thể chất và sinh hoạt câu lạc bộ thể thao ngay trong khuôn viên QTSC Quận 12, bao quanh bởi cây xanh thoáng mát.",
    highlightsJson: [
      "Sân bóng đá mini mặt cỏ nhân tạo",
      "Sân bóng rổ & khu sinh hoạt tập thể ngoài trời",
      "Kết nối trực tiếp trục đi bộ nội khu QTSC",
    ],
    coverMediaKey: "photo-sports",
    primaryNodeSlug: null, // OD-02: Explicitly NULL — never cross-wire another building's panorama
  },
] as const;

const TOUR_NODES_DATA = [
  {
    slug: "cong-chao-qtsc",
    title: "Toàn cảnh Khuôn viên QTSC",
    intro:
      "Góc nhìn toàn cảnh sân trung tâm tại CVPM Quang Trung, kết nối Tòa Innovation, Tòa T, Tòa F và mảng xanh khuôn viên.",
    category: "exterior",
    locationSlug: "sanh-innovation",
    panoramaKey: "pano-courtyard",
    initialYaw: 0,
    initialPitch: 2,
    initialFov: 68,
    sortOrder: 1,
  },
  {
    slug: "sanh-innovation",
    title: "Hội trường Đa năng Innovation",
    intro:
      "Hội trường chính nơi diễn ra phần khai mạc Open Day, chia sẻ định hướng và các buổi giao lưu chuyên đề.",
    category: "study",
    locationSlug: "hoi-truong-innovation",
    panoramaKey: "pano-auditorium",
    initialYaw: 5,
    initialPitch: 0,
    initialFov: 68,
    sortOrder: 2,
  },
  {
    slug: "thu-vien",
    title: "Thư viện Số & Co-working Space",
    intro:
      "Không gian tự học ánh sáng tự nhiên với khu đọc sách, bàn làm việc nhóm và các cabin thảo luận yên tĩnh.",
    category: "study",
    locationSlug: "thu-vien-so-t2",
    panoramaKey: "pano-library",
    initialYaw: 0,
    initialPitch: 0,
    initialFov: 68,
    sortOrder: 3,
  },
  {
    slug: "lab-it",
    title: "Phòng Thực hành Lập trình CNTT",
    intro:
      "Phòng Lab thực hành chuyên ngành Công nghệ Thông tin, Lập trình Web, Mobile và Dự án phần mềm.",
    category: "lab",
    locationSlug: "lab-lap-trinh-t301",
    panoramaKey: "pano-lab-it",
    initialYaw: 0,
    initialPitch: -2,
    initialFov: 68,
    sortOrder: 4,
  },
  {
    slug: "studio-imac",
    title: "Studio Thiết kế Đồ họa iMac",
    intro:
      "Studio thực hành Thiết kế Đồ họa và Multimedia với hệ thống máy iMac đồng bộ và đèn trần chuyên dụng.",
    category: "lab",
    locationSlug: "studio-imac-f402",
    panoramaKey: "pano-studio-imac",
    initialYaw: 0,
    initialPitch: 0,
    initialFov: 68,
    sortOrder: 5,
  },
] as const;

interface SceneHotspotLinkSeed {
  fromSlug: string;
  toSlug: string;
  edgeType: TourEdgeType;
  label: string;
  yaw: number;
  pitch: number;
  isOneWayApproved?: boolean;
  oneWayApprovalReason?: string | null;
}

const SCENE_LINK_HOTSPOTS_DATA: readonly SceneHotspotLinkSeed[] = [
  {
    fromSlug: "cong-chao-qtsc",
    toSlug: "thu-vien",
    edgeType: "OUTDOOR_LINK",
    label: "Vào Thư viện Số (Tòa Innovation)",
    yaw: 15,
    pitch: 4,
    isOneWayApproved: true,
    oneWayApprovalReason: "Lối tắt trực tiếp từ sân trung tâm vào thư viện",
  },
  {
    fromSlug: "cong-chao-qtsc",
    toSlug: "lab-it",
    edgeType: "OUTDOOR_LINK",
    label: "Đi tới Phòng Lab CNTT (Tòa T)",
    yaw: -48,
    pitch: 2,
  },
  {
    fromSlug: "cong-chao-qtsc",
    toSlug: "studio-imac",
    edgeType: "OUTDOOR_LINK",
    label: "Khám phá Studio iMac (Tòa F)",
    yaw: 65,
    pitch: 0,
  },
  {
    fromSlug: "sanh-innovation",
    toSlug: "thu-vien",
    edgeType: "STAIRS",
    label: "Lên Thư viện Số Tầng 2",
    yaw: -42,
    pitch: 5,
  },
  {
    fromSlug: "sanh-innovation",
    toSlug: "cong-chao-qtsc",
    edgeType: "DOORWAY",
    label: "Ra Toàn cảnh Khuôn viên",
    yaw: 140,
    pitch: 0,
    isOneWayApproved: true,
    oneWayApprovalReason: "Điều hướng chính về cổng chào QTSC",
  },
  {
    fromSlug: "thu-vien",
    toSlug: "lab-it",
    edgeType: "OUTDOOR_LINK",
    label: "Sang Phòng Lab Lập trình",
    yaw: 48,
    pitch: -2,
    isOneWayApproved: true,
    oneWayApprovalReason: "Tuyến tham quan nối tiếp sang khối Lab CNTT",
  },
  {
    fromSlug: "thu-vien",
    toSlug: "sanh-innovation",
    edgeType: "STAIRS",
    label: "Xuống Hội trường Innovation",
    yaw: -115,
    pitch: 2,
  },
  {
    fromSlug: "lab-it",
    toSlug: "studio-imac",
    edgeType: "OUTDOOR_LINK",
    label: "Chuyển sang Studio Đồ họa iMac",
    yaw: 60,
    pitch: 0,
    isOneWayApproved: true,
    oneWayApprovalReason: "Tuyến tham quan liên tòa Tòa T -> Tòa F",
  },
  {
    fromSlug: "lab-it",
    toSlug: "cong-chao-qtsc",
    edgeType: "OUTDOOR_LINK",
    label: "Quay lại Toàn cảnh Khuôn viên",
    yaw: -135,
    pitch: 3,
  },
  {
    fromSlug: "studio-imac",
    toSlug: "thu-vien",
    edgeType: "OUTDOOR_LINK",
    label: "Sang Thư viện Số Co-working",
    yaw: -52,
    pitch: 2,
    isOneWayApproved: true,
    oneWayApprovalReason: "Tuyến tham quan từ Tòa F về Thư viện Innovation",
  },
  {
    fromSlug: "studio-imac",
    toSlug: "cong-chao-qtsc",
    edgeType: "OUTDOOR_LINK",
    label: "Về Sân Trung tâm QTSC",
    yaw: 130,
    pitch: 0,
  },
];

const INFO_HOTSPOTS_DATA = [
  {
    nodeSlug: "cong-chao-qtsc",
    title: "Điểm tập trung Open Day",
    body: "Cổng chào sân trung tâm kết nối các tòa nhà đào tạo trong bán kính 150m.",
    yaw: -15,
    pitch: -6,
  },
  {
    nodeSlug: "sanh-innovation",
    title: "Sân khấu Khai mạc",
    body: "Nơi tổ chức lễ đón khách mời Open Day và phiên giao lưu doanh nghiệp.",
    yaw: 22,
    pitch: -2,
  },
  {
    nodeSlug: "thu-vien",
    title: "Khu Cabin Thảo luận nhóm",
    body: "Các buồng kính cách âm giúp nhóm sinh viên họp đồ án tập trung.",
    yaw: -36,
    pitch: 3,
  },
  {
    nodeSlug: "lab-it",
    title: "Cụm máy thực hành màn hình đôi",
    body: "Bố trí theo dãy giúp giảng viên dễ hỗ trợ trực tiếp trong giờ thực hành.",
    yaw: 8,
    pitch: -8,
  },
  {
    nodeSlug: "studio-imac",
    title: "Hệ thống Đèn Studio & Bàn nhóm",
    body: "Không gian phục vụ môn Thiết kế Đồ họa, Dựng phim & Nhiếp ảnh số.",
    yaw: 0,
    pitch: 14,
  },
] as const;

interface SessionSeedEntry {
  sortOrder: number;
  title: string;
  sessionPeriod: SessionPeriod;
  startTimeLabel: string;
  endTimeLabel: string;
  timeRangeLabel: string;
  customLocationLabel: string;
  hostUnit: string;
  isPublic: boolean;
  description: string;
  buildingCode: string;
  locationSlug: string | null;
  tourNodeSlug: string;
}

const OPEN_DAY_SESSIONS_DATA: readonly SessionSeedEntry[] = [
  {
    sortOrder: 1,
    title: "Đón khách tham quan & Định hướng khuôn viên QTSC",
    sessionPeriod: "MORNING",
    startTimeLabel: "08:00",
    endTimeLabel: "08:45",
    timeRangeLabel: "08:00 – 08:45",
    customLocationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
    hostUnit: "Ban Tổ Chức Open Day",
    isPublic: true,
    description:
      "Đón tiếp học sinh, phụ huynh và khách tham quan tự do tại Sảnh Innovation; hướng dẫn trải nghiệm Bản đồ GIS và hành trình tham quan các khu phòng Lab.",
    buildingCode: "INNOVATION",
    locationSlug: "sanh-innovation",
    tourNodeSlug: "cong-chao-qtsc",
  },
  {
    sortOrder: 2,
    title: "Phiên Khai mạc & Giới thiệu Không gian Đào tạo Thực hành",
    sessionPeriod: "MORNING",
    startTimeLabel: "08:45",
    endTimeLabel: "09:45",
    timeRangeLabel: "08:45 – 09:45",
    customLocationLabel: "Hội trường Đa năng — Tòa Innovation",
    hostUnit: "Ban Điều hành Cơ sở Q.12",
    isPublic: true,
    description:
      "Chia sẻ tổng quan về môi trường học tập theo dự án thực tế tại CVPM Quang Trung Quận 12 và giải đáp chung cho phụ huynh, học sinh.",
    buildingCode: "INNOVATION",
    locationSlug: "hoi-truong-innovation",
    tourNodeSlug: "sanh-innovation",
  },
  {
    sortOrder: 3,
    title: "Trải nghiệm Workshop chuyên sâu tại Phòng Lab & Studio iMac",
    sessionPeriod: "MORNING",
    startTimeLabel: "10:00",
    endTimeLabel: "11:30",
    timeRangeLabel: "10:00 – 11:30",
    customLocationLabel: "Phòng Lab T-301 & Studio F-402",
    hostUnit: "Giảng viên Bộ môn CNTT & Đồ họa",
    isPublic: false,
    description:
      "Hoạt động thực hành trực tiếp theo nhóm nhỏ tại phòng Lab Tòa T và Studio Đồ họa Tòa F theo phân ca trong tài khoản tham dự.",
    buildingCode: "TOA-T",
    locationSlug: "lab-lap-trinh-t301",
    tourNodeSlug: "lab-it",
  },
  {
    sortOrder: 4,
    title: "Tham quan Thư viện Số, Khu Thể thao & Giao lưu Câu lạc bộ",
    sessionPeriod: "NOON",
    startTimeLabel: "11:30",
    endTimeLabel: "13:30",
    timeRangeLabel: "11:30 – 13:30",
    customLocationLabel: "Thư viện Số T2 & Khu Thể thao",
    hostUnit: "Công tác Sinh viên Q.12",
    isPublic: true,
    description:
      "Tự do tham quan không gian Co-working Tầng 2 và giao lưu cùng các câu lạc bộ sinh viên tại khuôn viên QTSC.",
    buildingCode: "SPORTS",
    locationSlug: "khu-the-thao-qtsc",
    tourNodeSlug: "thu-vien",
  },
  {
    sortOrder: 5,
    title: "Thử thách Khám phá Khuôn viên & Hoạt động Trải nghiệm QTSC",
    sessionPeriod: "AFTERNOON",
    startTimeLabel: "13:30",
    endTimeLabel: "15:30",
    timeRangeLabel: "13:30 – 15:30",
    customLocationLabel: "Tòa F & Không gian Tham dự Trực tuyến",
    hostUnit: "Điều phối viên Open Day",
    isPublic: false,
    description:
      "Người tham dự trải nghiệm các trạm định hướng tại các tòa nhà trọng điểm và ôn tập thông tin khuôn viên qua mini-game tích hợp trong tour 360°.",
    buildingCode: "TOA-F",
    locationSlug: "studio-imac-f402",
    tourNodeSlug: "studio-imac",
  },
  {
    sortOrder: 6,
    title: "Tổng kết phiên trải nghiệm & Trao đổi riêng cùng cố vấn",
    sessionPeriod: "AFTERNOON",
    startTimeLabel: "15:30",
    endTimeLabel: "16:30",
    timeRangeLabel: "15:30 – 16:30",
    customLocationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
    hostUnit: "Ban Tổ Chức Open Day",
    isPublic: true,
    description:
      "Giải đáp các câu hỏi sau buổi trải nghiệm trực tiếp khuôn viên trước khi kết thúc ngày hội.",
    buildingCode: "INNOVATION",
    locationSlug: "sanh-innovation",
    tourNodeSlug: "sanh-innovation",
  },
];

const OPEN_DAY_FAQS_DATA = [
  {
    sortOrder: 1,
    question:
      "Tôi có cần tạo tài khoản để tham quan khuôn viên trực tuyến không?",
    answer:
      "Không. Bạn có thể mở Tour 360°, Bản đồ GIS và Danh mục Địa điểm tự do hoàn toàn mà không cần đăng nhập hoặc điền biểu mẫu.",
  },
  {
    sortOrder: 2,
    question:
      "Tham gia trải nghiệm Open Day và Tham quan 360° có cần tài khoản không?",
    answer:
      "Khách tham quan tự do không cần đăng ký hoặc đăng nhập để xem lịch Open Day công khai (/events), Bản đồ GIS (/map) và Tham quan 360° (/campus).",
  },
  {
    sortOrder: 3,
    question:
      "Khi nào áp dụng tài khoản mời Open Day (kích hoạt trực tiếp / Email-SMS)?",
    answer:
      "Quy trình cấp tài khoản cho nhân sự quản trị và khách mời Open Day (qua liên kết kích hoạt dùng một lần hoặc lời mời Email/SMS) sẽ được tích hợp ở giai đoạn Backend Auth tiếp theo.",
  },
  {
    sortOrder: 4,
    question:
      "Địa điểm tổ chức trực tiếp tại đâu và cần thông tin tuyển sinh chính thức thì xem ở đâu?",
    answer:
      "Sự kiện diễn ra tại Tòa nhà Innovation, Lô 24, Công viên Phần mềm Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12, TP.HCM. Các thông tin về ngành học, học phí và hồ sơ tuyển sinh chính thức được đăng tải đầy đủ tại website chính thức caodang.fpt.edu.vn.",
  },
] as const;

const OPEN_DAY_QUIZ_ITEMS_DATA = [
  {
    sortOrder: 1,
    tourNodeSlug: "cong-chao-qtsc",
    questionText:
      "Cơ sở FPT Polytechnic tại CVPM Quang Trung nằm ở quận nào của TP.HCM?",
    optionsJson: ["Quận 10", "Quận 12", "Quận Bình Thạnh", "Quận 7"],
    correctIndex: 1,
    explanation:
      "Cơ sở tọa lạc tại Tòa nhà Innovation, Lô 24, CVPM Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12.",
  },
  {
    sortOrder: 2,
    tourNodeSlug: "sanh-innovation",
    questionText:
      "Khu vực nào tại khuôn viên QTSC phục vụ check-in Open Day và Hội trường đa năng?",
    optionsJson: [
      "Tòa Nhà Innovation",
      "Khu Thể thao QTSC",
      "Cổng phụ phía Tây",
      "Bãi giữ xe",
    ],
    correctIndex: 0,
    explanation:
      "Tòa Nhà Innovation là trung tâm đón tiếp, có Sảnh check-in tầng trệt, Hội trường tầng 1 và Thư viện Số tầng 2.",
  },
  {
    sortOrder: 3,
    tourNodeSlug: "studio-imac",
    questionText:
      "Không gian Studio thực hành Thiết kế Đồ họa iMac đặt tại tòa nhà nào trong bản đồ?",
    optionsJson: ["Tòa Nhà P", "Tòa Nhà F", "Sân Thể thao", "Tòa Nhà T"],
    correctIndex: 1,
    explanation:
      "Studio Thiết kế Đồ họa iMac F-402 nằm tại Tầng 4 của Tòa Nhà F.",
  },
] as const;

async function seed() {
  const bootstrapPassword = assertValidBootstrapPassword(
    process.env.ADMIN_BOOTSTRAP_PASSWORD,
  );

  // Import PrismaClient dynamically AFTER bootstrap password validation so
  // Prisma's automatic .env loader cannot bypass PRISMA_SEED_SKIP_DOTENV=1.
  const { PrismaClient } = await import("@prisma/client");
  const prisma: PrismaClientType = new PrismaClient();
  try {
    // Only hash when creating bootstrap admin, or verify we preserve existing Admin password on re-seed.
    const preExistingAdmin = await prisma.user.findFirst({
      where: { username: "admin", deletedAt: null },
      select: { id: true },
    });

    const bootstrapPasswordHash = preExistingAdmin
      ? null
      : await argon2.hash(bootstrapPassword, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 1,
        });

  const summary = await prisma.$transaction(async (tx) => {
    // 1. Roles, Permissions, RolePermissions, Admin User, UserRoles, LocationTypes
    const roleIdByCode = new Map<string, string>();
    for (const roleSpec of ROLES_DATA) {
      const role = await tx.role.upsert({
        where: { code: roleSpec.code },
        update: { name: roleSpec.name, description: roleSpec.description },
        create: {
          code: roleSpec.code,
          name: roleSpec.name,
          description: roleSpec.description,
        },
      });
      roleIdByCode.set(roleSpec.code, role.id);
    }

    const permissionIdByCode = new Map<string, string>();
    for (const permSpec of PERMISSIONS_DATA) {
      const perm = await tx.permission.upsert({
        where: { code: permSpec.code },
        update: { description: permSpec.description },
        create: { code: permSpec.code, description: permSpec.description },
      });
      permissionIdByCode.set(permSpec.code, perm.id);
    }

    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
      const roleId = roleIdByCode.get(roleCode)!;
      for (const permCode of permCodes) {
        const permissionId = permissionIdByCode.get(permCode)!;
        await tx.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        });
      }
    }

    let adminUser = await tx.user.findFirst({
      where: { username: "admin", deletedAt: null },
    });

    let adminCreated = false;
    if (!adminUser) {
      adminUser = await tx.user.create({
        data: {
          username: "admin",
          fullName: "Quản trị viên Hệ thống",
          email: "admin@fpt.edu.vn",
          phone: null,
          userType: "ADMIN",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "BOOTSTRAP",
          passwordHash: bootstrapPasswordHash!,
          mustChangePassword: true,
        },
      });
      adminCreated = true;
    } else {
      // Idempotent metadata check ONLY — never overwrite existing passwordHash or mustChangePassword
      adminUser = await tx.user.update({
        where: { id: adminUser.id },
        data: {
          fullName: "Quản trị viên Hệ thống",
          email: "admin@fpt.edu.vn",
          userType: "ADMIN",
        },
      });
    }

    const superAdminRoleId = roleIdByCode.get("SUPER_ADMIN")!;
    await tx.userRole.upsert({
      where: {
        userId_roleId: { userId: adminUser.id, roleId: superAdminRoleId },
      },
      update: {},
      create: { userId: adminUser.id, roleId: superAdminRoleId },
    });

    if (adminCreated) {
      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          actorUsername: adminUser.username,
          action: "SYSTEM_BOOTSTRAP_SEED",
          resourceType: "user",
          resourceId: adminUser.id,
          diffJson: {
            note: "Initial Phase 2A-1 bootstrap admin created (secret excluded)",
            mustChangePassword: true,
          },
        },
      });
    }

    const locationTypeIdByCode = new Map<string, string>();
    for (const ltSpec of LOCATION_TYPES_DATA) {
      const lt = await tx.locationType.upsert({
        where: { code: ltSpec.code },
        update: {
          filterGroup: ltSpec.filterGroup,
          label: ltSpec.label,
          iconName: ltSpec.iconName,
          isInterFloorConnector: ltSpec.isInterFloorConnector,
        },
        create: {
          code: ltSpec.code,
          filterGroup: ltSpec.filterGroup,
          label: ltSpec.label,
          iconName: ltSpec.iconName,
          isInterFloorConnector: ltSpec.isInterFloorConnector,
        },
      });
      locationTypeIdByCode.set(ltSpec.code, lt.id);
    }

    // 2. Campus QTSC (default_entry_node_id = NULL initially), MediaAssets, Buildings, Floors
    let campus = await tx.campus.findFirst({
      where: { code: "QTSC-Q12", deletedAt: null },
    });
    const campusPayload = {
      code: "QTSC-Q12",
      name: "Trường Cao đẳng FPT Polytechnic — Cơ sở TP.HCM (CVPM Quang Trung)",
      address:
        "Tòa nhà Innovation, Lô 24, Công viên Phần mềm Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12, TP.HCM",
      originPointJson: {
        lat: 10.852825,
        lng: 106.62669,
        label: "Cổng chính QTSC (Tô Ký)",
        addressNote:
          "Đường Tô Ký, Lối vào chính Công viên Phần mềm Quang Trung, Q.12",
      },
      landmarksJson: [],
      status: "PUBLISHED" as const,
    };
    campus = campus
      ? await tx.campus.update({ where: { id: campus.id }, data: campusPayload })
      : await tx.campus.create({
          data: { ...campusPayload, defaultEntryNodeId: null },
        });

    const mediaIdByKey = new Map<string, string>();
    for (const mSpec of MEDIA_ASSETS_DATA) {
      const existingMedia = await tx.mediaAsset.findFirst({
        where: {
          originalObjectKey: mSpec.originalObjectKey,
          deletedAt: null,
        },
      });
      const mediaPayload = {
        assetKind: mSpec.assetKind,
        originalFilename: mSpec.originalFilename,
        mimeType: mSpec.mimeType,
        fileSizeBytes: mSpec.fileSizeBytes,
        sha256Checksum: mSpec.sha256Checksum,
        originalWidth: mSpec.originalWidth,
        originalHeight: mSpec.originalHeight,
        isValid2To1: mSpec.isValid2To1,
        isPreviewApproved: mSpec.isPreviewApproved,
        originalObjectKey: mSpec.originalObjectKey,
        optimizedDesktopKey: mSpec.optimizedDesktopKey,
        optimizedMobileKey: mSpec.optimizedMobileKey,
        thumbnailKey: mSpec.thumbnailKey,
        cameraMetadata: mSpec.cameraMetadata,
        processingStatus: "READY" as const,
        processingError: null,
        uploadedBy: adminUser.id,
      };
      const media = existingMedia
        ? await tx.mediaAsset.update({
            where: { id: existingMedia.id },
            data: mediaPayload,
          })
        : await tx.mediaAsset.create({ data: mediaPayload });
      mediaIdByKey.set(mSpec.key, media.id);
    }

    const buildingIdByCode = new Map<string, string>();
    const floorIdByBuildingAndCode = new Map<string, string>();
    for (const bSpec of BUILDINGS_DATA) {
      const existingBldg = await tx.building.findFirst({
        where: { campusId: campus.id, code: bSpec.code, deletedAt: null },
      });
      const bldgPayload = {
        campusId: campus.id,
        code: bSpec.code,
        slug: bSpec.slug,
        name: bSpec.name,
        shortName: bSpec.shortName,
        category: bSpec.category,
        categoryLabel: bSpec.categoryLabel,
        floorsLabel: bSpec.floorsLabel,
        summary: bSpec.summary,
        description: bSpec.description,
        highlightsJson: bSpec.highlightsJson,
        lat: bSpec.lat,
        lng: bSpec.lng,
        gisX: bSpec.gisX,
        gisY: bSpec.gisY,
        addressNote: bSpec.addressNote,
        statusNote: bSpec.statusNote,
        mapIconKey: bSpec.mapIconKey,
        routeWaypointsJson: bSpec.routeWaypointsJson,
        coverMediaId: mediaIdByKey.get(bSpec.coverMediaKey)!,
        sortOrder: bSpec.sortOrder,
        status: "PUBLISHED" as const,
      };
      const building = existingBldg
        ? await tx.building.update({
            where: { id: existingBldg.id },
            data: bldgPayload,
          })
        : await tx.building.create({
            data: { ...bldgPayload, defaultNodeId: null },
          });
      buildingIdByCode.set(bSpec.code, building.id);

      for (const fSpec of bSpec.floors) {
        const existingFloor = await tx.floor.findFirst({
          where: {
            buildingId: building.id,
            code: fSpec.code,
            deletedAt: null,
          },
        });
        const floorPayload = {
          buildingId: building.id,
          code: fSpec.code,
          name: fSpec.name,
          levelIndex: fSpec.levelIndex,
          activeFloorPlanId: null,
          requiresFloorPlan: false, // OD-10: no fake FloorPlans
          status: "PUBLISHED" as const,
        };
        const floor = existingFloor
          ? await tx.floor.update({
              where: { id: existingFloor.id },
              data: floorPayload,
            })
          : await tx.floor.create({ data: floorPayload });
        floorIdByBuildingAndCode.set(`${bSpec.code}:${fSpec.code}`, floor.id);
      }
    }

    // 3. Locations (primaryNodeId = NULL initially) & LocationMedia
    const locationIdBySlug = new Map<string, string>();
    for (const locSpec of LOCATIONS_DATA) {
      const buildingId = buildingIdByCode.get(locSpec.buildingCode)!;
      const floorId = locSpec.floorCode
        ? floorIdByBuildingAndCode.get(
            `${locSpec.buildingCode}:${locSpec.floorCode}`,
          )!
        : null;
      const locationTypeId = locationTypeIdByCode.get(locSpec.locationTypeCode)!;
      const existingLoc = await tx.location.findFirst({
        where: { slug: locSpec.slug, deletedAt: null },
      });
      const locPayload = {
        buildingId,
        floorId,
        locationTypeId,
        categoryLabel: locSpec.categoryLabel,
        code: locSpec.code,
        slug: locSpec.slug,
        name: locSpec.name,
        shortSummary: locSpec.shortSummary,
        description: locSpec.description,
        highlightsJson: locSpec.highlightsJson,
        isPublicAccessible: true,
        restrictionNote: null,
        status: "PUBLISHED" as const,
      };
      const location = existingLoc
        ? await tx.location.update({
            where: { id: existingLoc.id },
            data: locPayload,
          })
        : await tx.location.create({
            data: { ...locPayload, primaryNodeId: null },
          });
      locationIdBySlug.set(locSpec.slug, location.id);

      const coverMediaId = mediaIdByKey.get(locSpec.coverMediaKey)!;
      await tx.locationMedia.upsert({
        where: {
          locationId_mediaAssetId: {
            locationId: location.id,
            mediaAssetId: coverMediaId,
          },
        },
        update: { isCover: true, sortOrder: 1, caption: locSpec.name },
        create: {
          locationId: location.id,
          mediaAssetId: coverMediaId,
          isCover: true,
          sortOrder: 1,
          caption: locSpec.name,
        },
      });
    }

    // 4. TourNodes (floorPlanId = NULL per OD-10; status = DRAFT per D-02/R-03), TourEdges, Hotspots
    const tourNodeIdBySlug = new Map<string, string>();
    for (const nodeSpec of TOUR_NODES_DATA) {
      const existingNode = await tx.tourNode.findFirst({
        where: { slug: nodeSpec.slug, deletedAt: null },
      });
      const nodePayload = {
        slug: nodeSpec.slug,
        title: nodeSpec.title,
        intro: nodeSpec.intro,
        category: nodeSpec.category,
        locationId: locationIdBySlug.get(nodeSpec.locationSlug)!,
        floorPlanId: null, // OD-10: floorPlanId nullable without fake FloorPlan
        panoramaAssetId: mediaIdByKey.get(nodeSpec.panoramaKey)!,
        floorNormX: null,
        floorNormY: null,
        needsRealignment: false,
        headingOffsetDeg: 0,
        initialYaw: nodeSpec.initialYaw,
        initialPitch: nodeSpec.initialPitch,
        initialFov: nodeSpec.initialFov,
        isTerminalApproved: false,
        terminalApprovalReason: null,
        sortOrder: nodeSpec.sortOrder,
        // D-02 / R-03: Placeholder AI panoramas are unapproved; keep nodes non-public (DRAFT)
        // until replaced with verified 360x180 QTSC photography.
        status: "DRAFT" as const,
      };
      const tourNode = existingNode
        ? await tx.tourNode.update({
            where: { id: existingNode.id },
            data: nodePayload,
          })
        : await tx.tourNode.create({ data: nodePayload });
      tourNodeIdBySlug.set(nodeSpec.slug, tourNode.id);
    }

    for (const linkSpec of SCENE_LINK_HOTSPOTS_DATA) {
      const fromNodeId = tourNodeIdBySlug.get(linkSpec.fromSlug)!;
      const toNodeId = tourNodeIdBySlug.get(linkSpec.toSlug)!;
      const edge = await tx.tourEdge.upsert({
        where: {
          fromNodeId_toNodeId_edgeType: {
            fromNodeId,
            toNodeId,
            edgeType: linkSpec.edgeType,
          },
        },
        update: {
          label: linkSpec.label,
          isOneWayApproved: linkSpec.isOneWayApproved ?? false,
          oneWayApprovalReason: linkSpec.oneWayApprovalReason ?? null,
        },
        create: {
          fromNodeId,
          toNodeId,
          edgeType: linkSpec.edgeType,
          label: linkSpec.label,
          isOneWayApproved: linkSpec.isOneWayApproved ?? false,
          oneWayApprovalReason: linkSpec.oneWayApprovalReason ?? null,
        },
      });

      await tx.hotspot.upsert({
        where: { edgeId: edge.id },
        update: {
          nodeId: fromNodeId,
          hotspotType: "SCENE_LINK",
          yaw: linkSpec.yaw,
          pitch: linkSpec.pitch,
          title: linkSpec.label,
          body: null,
        },
        create: {
          nodeId: fromNodeId,
          hotspotType: "SCENE_LINK",
          edgeId: edge.id,
          yaw: linkSpec.yaw,
          pitch: linkSpec.pitch,
          title: linkSpec.label,
          body: null,
        },
      });
    }

    for (const infoSpec of INFO_HOTSPOTS_DATA) {
      const nodeId = tourNodeIdBySlug.get(infoSpec.nodeSlug)!;
      const existingInfo = await tx.hotspot.findFirst({
        where: {
          nodeId,
          hotspotType: "INFO",
          title: infoSpec.title,
        },
      });
      if (existingInfo) {
        await tx.hotspot.update({
          where: { id: existingInfo.id },
          data: {
            yaw: infoSpec.yaw,
            pitch: infoSpec.pitch,
            body: infoSpec.body,
            edgeId: null,
          },
        });
      } else {
        await tx.hotspot.create({
          data: {
            nodeId,
            hotspotType: "INFO",
            edgeId: null,
            yaw: infoSpec.yaw,
            pitch: infoSpec.pitch,
            title: infoSpec.title,
            body: infoSpec.body,
          },
        });
      }
    }

    // 5. Reverse FK Updates (Campus defaultEntryNode, Building defaultNode, Location primaryNode)
    await tx.campus.update({
      where: { id: campus.id },
      data: { defaultEntryNodeId: tourNodeIdBySlug.get("cong-chao-qtsc")! },
    });

    for (const bSpec of BUILDINGS_DATA) {
      const buildingId = buildingIdByCode.get(bSpec.code)!;
      await tx.building.update({
        where: { id: buildingId },
        data: {
          defaultNodeId: bSpec.defaultNodeSlug
            ? tourNodeIdBySlug.get(bSpec.defaultNodeSlug)!
            : null,
        },
      });
    }

    for (const locSpec of LOCATIONS_DATA) {
      const locationId = locationIdBySlug.get(locSpec.slug)!;
      await tx.location.update({
        where: { id: locationId },
        data: {
          primaryNodeId: locSpec.primaryNodeSlug
            ? tourNodeIdBySlug.get(locSpec.primaryNodeSlug)!
            : null,
        },
      });
    }

    // 6. Open Day Events, Sessions, FAQs & Orientation Quiz Items (OD-03, OD-08)
    // R-06: Initial QTSC development seed schedules/FAQs/quizzes — pending field/stakeholder verification.
    const existingEvent = await tx.openDayEvent.findFirst({
      where: { eventKey: "open-day-2026-qtsc", deletedAt: null },
    });
    const eventPayload = {
      campusId: campus.id,
      eventKey: "open-day-2026-qtsc",
      title: "Ngày hội Trải nghiệm Open Day FPT Polytechnic QTSC 2026",
      subtitle:
        "Khám phá không gian học tập thực hành theo dự án tại Công viên Phần mềm Quang Trung Quận 12",
      dateLabel: "Chủ Nhật, 24/05/2026",
      timeLabel: "08:00 – 16:30",
      eventDate: new Date("2026-05-24T00:00:00.000Z"),
      isDefault: true,
      status: "PUBLISHED" as const,
    };
    const event = existingEvent
      ? await tx.openDayEvent.update({
          where: { id: existingEvent.id },
          data: eventPayload,
        })
      : await tx.openDayEvent.create({ data: eventPayload });

    for (const sSpec of OPEN_DAY_SESSIONS_DATA) {
      const existingSession = await tx.openDaySession.findFirst({
        where: {
          eventId: event.id,
          sortOrder: sSpec.sortOrder,
          deletedAt: null,
        },
      });
      const sessionPayload = {
        eventId: event.id,
        campusId: campus.id,
        buildingId: buildingIdByCode.get(sSpec.buildingCode)!,
        locationId: sSpec.locationSlug
          ? locationIdBySlug.get(sSpec.locationSlug)!
          : null,
        tourNodeId: tourNodeIdBySlug.get(sSpec.tourNodeSlug)!,
        title: sSpec.title,
        sessionPeriod: sSpec.sessionPeriod,
        startTimeLabel: sSpec.startTimeLabel,
        endTimeLabel: sSpec.endTimeLabel,
        timeRangeLabel: sSpec.timeRangeLabel,
        customLocationLabel: sSpec.customLocationLabel,
        hostUnit: sSpec.hostUnit,
        isPublic: sSpec.isPublic,
        description: sSpec.description,
        sortOrder: sSpec.sortOrder,
        status: "PUBLISHED" as const,
      };
      if (existingSession) {
        await tx.openDaySession.update({
          where: { id: existingSession.id },
          data: sessionPayload,
        });
      } else {
        await tx.openDaySession.create({ data: sessionPayload });
      }
    }

    for (const faqSpec of OPEN_DAY_FAQS_DATA) {
      const existingFaq = await tx.openDayFaq.findFirst({
        where: {
          campusId: campus.id,
          sortOrder: faqSpec.sortOrder,
          deletedAt: null,
        },
      });
      const faqPayload = {
        eventId: event.id,
        campusId: campus.id,
        question: faqSpec.question,
        answer: faqSpec.answer,
        sortOrder: faqSpec.sortOrder,
        status: "PUBLISHED" as const,
      };
      if (existingFaq) {
        await tx.openDayFaq.update({
          where: { id: existingFaq.id },
          data: faqPayload,
        });
      } else {
        await tx.openDayFaq.create({ data: faqPayload });
      }
    }

    for (const qSpec of OPEN_DAY_QUIZ_ITEMS_DATA) {
      const existingQuiz = await tx.openDayQuizItem.findFirst({
        where: {
          sortOrder: qSpec.sortOrder,
          deletedAt: null,
        },
      });
      const quizPayload = {
        tourNodeId: tourNodeIdBySlug.get(qSpec.tourNodeSlug)!,
        questionText: qSpec.questionText,
        optionsJson: qSpec.optionsJson,
        correctIndex: qSpec.correctIndex,
        explanation: qSpec.explanation,
        sortOrder: qSpec.sortOrder,
        status: "PUBLISHED" as const,
      };
      if (existingQuiz) {
        await tx.openDayQuizItem.update({
          where: { id: existingQuiz.id },
          data: quizPayload,
        });
      } else {
        await tx.openDayQuizItem.create({ data: quizPayload });
      }
    }

    return {
      adminCreated,
      counts: {
        users: await tx.user.count({ where: { deletedAt: null } }),
        roles: await tx.role.count(),
        permissions: await tx.permission.count(),
        rolePermissions: await tx.rolePermission.count(),
        locationTypes: await tx.locationType.count(),
        campuses: await tx.campus.count({ where: { deletedAt: null } }),
        buildings: await tx.building.count({ where: { deletedAt: null } }),
        floors: await tx.floor.count({ where: { deletedAt: null } }),
        floorPlans: await tx.floorPlan.count(),
        mediaAssets: await tx.mediaAsset.count({ where: { deletedAt: null } }),
        locations: await tx.location.count({ where: { deletedAt: null } }),
        locationMedia: await tx.locationMedia.count(),
        tourNodes: await tx.tourNode.count({ where: { deletedAt: null } }),
        tourEdges: await tx.tourEdge.count(),
        hotspots: await tx.hotspot.count(),
        openDayEvents: await tx.openDayEvent.count({
          where: { deletedAt: null },
        }),
        openDaySessions: await tx.openDaySession.count({
          where: { deletedAt: null },
        }),
        openDayFaqs: await tx.openDayFaq.count({ where: { deletedAt: null } }),
        openDayQuizItems: await tx.openDayQuizItem.count({
          where: { deletedAt: null },
        }),
      },
    };
  });

    console.log(
      JSON.stringify(
        {
          status: "OK",
          adminAction: summary.adminCreated
            ? "CREATED_BOOTSTRAP_ADMIN"
            : "PRESERVED_EXISTING_ADMIN_PASSWORD",
          counts: summary.counts,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error("[seed] Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

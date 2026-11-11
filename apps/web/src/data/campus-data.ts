// ============================================================================
// Canonical QTSC District 12 Data Registry (Single Source of Truth)
// Synchronized with @fpt-campus/shared Phase 2A v2A.2 Contracts (OD-01 -> OD-10)
// ============================================================================

import {
  computeRouteDistanceMeters,
  formatDistanceEstimate,
  haversineDistanceMeters,
  type BuildingCategory,
  type BuildingCode,
  type CampusGeoPoint,
  type CampusLandmarkItem,
  type CampusOfficialStaticInfo,
  type GeoLatLngTuple,
  type LocationCategoryGroup,
  type LocationCategoryKey,
  type MapBuildingIconKey,
  type PublishStatus,
  type TourNodeCategory,
} from "@fpt-campus/shared";

export {
  computeRouteDistanceMeters,
  formatDistanceEstimate,
  haversineDistanceMeters,
};

export type {
  BuildingCategory,
  BuildingCode,
  CampusGeoPoint,
  CampusLandmarkItem,
  LocationCategoryGroup,
  LocationCategoryKey,
  MapBuildingIconKey,
  TourNodeCategory,
};

export type CampusOfficialInfo = CampusOfficialStaticInfo;

export const OFFICIAL_CAMPUS_INFO: CampusOfficialInfo = {
  name: "Trường Cao đẳng FPT Polytechnic — Cơ sở TP.HCM (CVPM Quang Trung)",
  shortName: "FPT Polytechnic TP.HCM",
  campusLabel: "CVPM Quang Trung · Quận 12",
  address:
    "Tòa nhà Innovation, Lô 24, Công viên Phần mềm Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12, TP.HCM",
  ward: "Phường Trung Mỹ Tây",
  district: "Quận 12",
  city: "TP.HCM",
  coordinatesLabel: "10.8529° N, 106.6285° E",
  officialSiteUrl: "https://caodang.fpt.edu.vn",
  officialContactUrl: "https://caodang.fpt.edu.vn/lien-he",
  officialAdmissionsUrl: "https://caodang.fpt.edu.vn/dang-ky-truc-tuyen",
  officialMajorsUrl: "https://caodang.fpt.edu.vn/nganh-hoc",
  openDayDateLabel: "Chủ Nhật, 24/05/2026",
  openDayTimeLabel: "08:00 – 16:30",
  supportHours: "Thứ 2 – Thứ 7 (07:30 – 17:30)",
};

/** Cổng chính CVPM Quang Trung trên đường Tô Ký (OSM barrier/gate verified) */
export const QTSC_ORIGIN_POINT: CampusGeoPoint = {
  lat: 10.852825,
  lng: 106.62669,
  label: "Cổng chính QTSC (Tô Ký)",
  addressNote: "Đường Tô Ký, Lối vào chính Công viên Phần mềm Quang Trung, Q.12",
};

/** Các điểm mốc giao thông bổ sung ngoài lớp nền OSM (OSM đã hiển thị Cầu vượt Quang Trung & Tô Ký) */
export const QTSC_LANDMARKS: CampusLandmarkItem[] = [];

export interface CampusBuildingItem {
  code: BuildingCode;
  name: string;
  shortName: string;
  category: BuildingCategory;
  categoryLabel: string;
  floorsLabel: string;
  summary: string;
  highlights: string[];
  imageUrl: string;
  defaultSceneId: string;
  /** Percentage position on QTSC Light GIS Canvas (0-100) */
  gisX: number;
  gisY: number;
  /** Real WGS84 coordinates aligned with OpenStreetMap QTSC */
  lat: number;
  lng: number;
  addressNote: string;
  mapIconKey: MapBuildingIconKey;
  /** Walking polyline waypoints from QTSC_ORIGIN_POINT along internal QTSC roads */
  routeWaypoints: GeoLatLngTuple[];
  statusNote: string;
}

export const CAMPUS_BUILDINGS: CampusBuildingItem[] = [
  {
    code: "INNOVATION",
    name: "Tòa Nhà Innovation (Lô 24 QTSC)",
    shortName: "Tòa Innovation",
    category: "academic",
    categoryLabel: "Trung tâm & Hội trường",
    floorsLabel: "Tầng Trệt – Tầng 4",
    summary:
      "Khu vực điều hành trung tâm, sảnh đón tiếp Open Day, Thư viện số mở và Hội trường đa năng.",
    highlights: [
      "Sảnh Đón Tiếp & Cổng Check-in Open Day",
      "Thư viện Số & Không gian Co-working",
      "Hội trường Đa năng tổ chức sự kiện",
    ],
    imageUrl: "/images/locations/building-innovation.jpg",
    defaultSceneId: "sanh-innovation",
    gisX: 50,
    gisY: 42,
    lat: 10.852935,
    lng: 106.629409,
    addressNote: "Lô 24, Đường Khu Trung tâm, CVPM Quang Trung, P. Trung Mỹ Tây, Q.12",
    mapIconKey: "innovation",
    routeWaypoints: [
      [10.852825, 106.62669],
      [10.85318, 106.62735],
      [10.8531, 106.62845],
      [10.852935, 106.629409],
    ],
    statusNote: "Điểm check-in Open Day chính",
  },
  {
    code: "TOA-T",
    name: "Tòa Nhà T (QTSC 9 · Giảng đường & CNTT)",
    shortName: "Tòa Nhà T",
    category: "lab",
    categoryLabel: "Phòng Lab & Xưởng",
    floorsLabel: "Khối giảng đường & Lab",
    summary:
      "Khối phòng học lý thuyết và hệ thống phòng Lab thực hành Công nghệ Thông tin, Phát triển Phần mềm.",
    highlights: [
      "Phòng Lab Lập trình & Phát triển Web/Mobile",
      "Không gian thực hành nhóm theo dự án",
      "Khu vực tự học & hỗ trợ kỹ thuật",
    ],
    imageUrl: "/images/locations/lab-it.jpg",
    defaultSceneId: "lab-it",
    gisX: 28,
    gisY: 64,
    lat: 10.853888,
    lng: 106.626167,
    addressNote: "Tòa QTSC Building 9, 42 Đường số 3 / Đường Tô Ký, CVPM Quang Trung, Q.12",
    mapIconKey: "it-building",
    routeWaypoints: [
      [10.852825, 106.62669],
      [10.85315, 106.62685],
      [10.85358, 106.62648],
      [10.853888, 106.626167],
    ],
    statusNote: "Cụm phòng máy CNTT · Mặt tiền Tô Ký",
  },
  {
    code: "TOA-F",
    name: "Tòa Nhà F (Multimedia & Thiết kế)",
    shortName: "Tòa Nhà F",
    category: "lab",
    categoryLabel: "Phòng Lab & Xưởng",
    floorsLabel: "Khối studio & thực hành",
    summary:
      "Không gian thực hành Thiết kế Đồ họa, Dựng phim và Truyền thông Đa phương tiện.",
    highlights: [
      "Studio thực hành máy iMac chuyên dụng",
      "Phòng xử lý hậu kỳ & thuyết trình đồ án",
      "Khu trưng bày sản phẩm thiết kế sinh viên",
    ],
    imageUrl: "/images/locations/studio-imac.jpg",
    defaultSceneId: "studio-imac",
    gisX: 57,
    gisY: 67,
    lat: 10.8519,
    lng: 106.62825,
    addressNote: "Đường số 14, Khu Nam CVPM Quang Trung (gần Cầu vượt Quang Trung), Q.12",
    mapIconKey: "design-studio",
    routeWaypoints: [
      [10.852825, 106.62669],
      [10.85258, 106.62742],
      [10.8519, 106.62825],
    ],
    statusNote: "Cụm Studio Đồ họa · Gần Cầu vượt",
  },
  {
    code: "TOA-P",
    name: "Tòa Nhà P (Khu Học tập Chuyên ngành)",
    shortName: "Tòa Nhà P",
    category: "academic",
    categoryLabel: "Đào tạo chuyên ngành",
    floorsLabel: "Khối phòng học mở rộng",
    summary:
      "Khu giảng đường chuyên đề kinh tế số, không gian trao đổi nhóm và lớp học thực hành ứng dụng.",
    highlights: [
      "Giảng đường mô phỏng tình huống doanh nghiệp",
      "Không gian sinh hoạt câu lạc bộ & hội thảo nhỏ",
    ],
    imageUrl: "/images/locations/library-reading.jpg",
    defaultSceneId: "thu-vien",
    gisX: 72,
    gisY: 28,
    lat: 10.85485,
    lng: 106.6301,
    addressNote: "Đường số 12 – 13, Khu Giảng đường phía Bắc, CVPM Quang Trung, Q.12",
    mapIconKey: "academic-hall",
    routeWaypoints: [
      [10.852825, 106.62669],
      [10.85322, 106.62735],
      [10.85395, 106.62855],
      [10.85458, 106.62958],
      [10.85485, 106.6301],
    ],
    statusNote: "Khu giảng đường phía Bắc QTSC",
  },
  {
    code: "SPORTS",
    name: "Khu Thể thao & Sân Ngoài trời QTSC",
    shortName: "Khu Thể thao",
    category: "facility",
    categoryLabel: "Tiện ích & Thể thao",
    floorsLabel: "Khuôn viên ngoài trời",
    summary:
      "Tổ hợp sân cỏ nhân tạo, sân bóng rổ và mảng xanh kết nối giao lưu sinh viên ngoài trời.",
    highlights: [
      "Sân bóng đá mini & sân bóng rổ ngoài trời",
      "Sân tập kết và hoạt động ngoại khóa Open Day",
    ],
    imageUrl: "/images/locations/sports-complex.jpg",
    defaultSceneId: "cong-chao-qtsc",
    gisX: 80,
    gisY: 57,
    lat: 10.85348,
    lng: 106.63082,
    addressNote: "Sân Thể thao QTSC, gần Đường số 16 & Công viên Trung tâm, Q.12",
    mapIconKey: "sports",
    routeWaypoints: [
      [10.852825, 106.62669],
      [10.85318, 106.62735],
      [10.85328, 106.62905],
      [10.85348, 106.63082],
    ],
    statusNote: "Hoạt động thể chất & ngoại khóa",
  },
];

export interface CampusLocationItem {
  id: string;
  slug: string;
  code: string;
  name: string;
  buildingCode: BuildingCode;
  buildingName: string;
  floor: string;
  category: LocationCategoryGroup;
  categoryLabel: string;
  shortDesc: string;
  description: string;
  highlights: string[];
  imageUrl: string;
  sceneId: string | null;
  status: Lowercase<Exclude<PublishStatus, "ARCHIVED">>;
}

export const CAMPUS_LOCATIONS: CampusLocationItem[] = [
  {
    id: "loc-sanh-innovation",
    slug: "sanh-innovation",
    code: "INV-01",
    name: "Sảnh Đón Tiếp Tòa Nhà Innovation",
    buildingCode: "INNOVATION",
    buildingName: "Tòa Innovation",
    floor: "Tầng Trệt",
    category: "common",
    categoryLabel: "Không gian Chung",
    shortDesc: "Khu vực đón tiếp khách tham quan, check-in Open Day và định hướng khuôn viên.",
    description:
      "Điểm dừng chân đầu tiên khi bước vào cơ sở CVPM Quang Trung. Tại đây diễn ra hoạt động đón tiếp khách tham quan Open Day và hướng dẫn định hướng di chuyển tới các tòa nhà, phòng Lab.",
    highlights: [
      "Quầy đón tiếp & hướng dẫn lịch trình Open Day",
      "Khu vực sảnh mở kết nối trực tiếp lối lên Hội trường",
      "Điểm tập trung đoàn tham quan trải nghiệm",
    ],
    imageUrl: "/images/locations/building-innovation.jpg",
    sceneId: "cong-chao-qtsc",
    status: "published",
  },
  {
    id: "loc-thu-vien-so",
    slug: "thu-vien-so-t2",
    code: "INV-201",
    name: "Thư viện Số & Không gian Co-working",
    buildingCode: "INNOVATION",
    buildingName: "Tòa Innovation",
    floor: "Tầng 2",
    category: "common",
    categoryLabel: "Không gian Tri thức",
    shortDesc: "Khu tự học yên tĩnh kết hợp bàn làm việc nhóm và cabin trao đổi dự án.",
    description:
      "Không gian học tập mở dành cho sinh viên tra cứu tài liệu số, đọc sách chuyên ngành và họp nhóm theo mô hình Co-working với ánh sáng tự nhiên rộng mở.",
    highlights: [
      "Khu bàn tự học cá nhân và bàn làm việc nhóm",
      "Các cabin kính kín cho buổi thảo luận đồ án",
      "Quầy hỗ trợ tài nguyên học tập số",
    ],
    imageUrl: "/images/locations/library-reading.jpg",
    sceneId: "thu-vien",
    status: "published",
  },
  {
    id: "loc-hoi-truong",
    slug: "hoi-truong-innovation",
    code: "INV-101",
    name: "Hội trường Đa năng Innovation",
    buildingCode: "INNOVATION",
    buildingName: "Tòa Innovation",
    floor: "Tầng 1",
    category: "common",
    categoryLabel: "Sự kiện & Hội thảo",
    shortDesc: "Không gian hội trường bậc thang phục vụ khai mạc Open Day và tọa đàm chuyên đề.",
    description:
      "Hội trường lớn với hệ thống ghế ngồi bậc thang, màn hình trình chiếu trung tâm và hệ thống âm thanh phục vụ lễ khai mạc Open Day, hội thảo định hướng nghề nghiệp cùng doanh nghiệp.",
    highlights: [
      "Bố cục ghế bậc thang quan sát rõ từ mọi hàng",
      "Màn hình sân khấu phục vụ trình chiếu & tọa đàm",
      "Kết nối thuận tiện với Sảnh Đón Tiếp tầng trệt",
    ],
    imageUrl: "/images/locations/auditorium-hall.jpg",
    sceneId: "sanh-innovation",
    status: "published",
  },
  {
    id: "loc-lab-it",
    slug: "lab-lap-trinh-t301",
    code: "T-301",
    name: "Phòng Thực hành Lập trình & Công nghệ",
    buildingCode: "TOA-T",
    buildingName: "Tòa Nhà T",
    floor: "Tầng 3",
    category: "lab",
    categoryLabel: "Phòng Lab CNTT",
    shortDesc: "Phòng thực hành lập trình phần mềm, web và phát triển ứng dụng theo dự án.",
    description:
      "Phòng máy chuyên ngành thuộc Tòa Nhà T, bố trí các cụm máy tính cấu hình thực hành lập trình Web, Mobile và kiểm thử phần mềm để sinh viên thao tác trực tiếp theo bài thực hành.",
    highlights: [
      "Cụm bàn máy tính màn hình đôi thuận tiện code & debug",
      "Màn hình trình chiếu cho giảng viên hướng dẫn trực tiếp",
      "Vách kính hành lang thông thoáng, ánh sáng đồng đều",
    ],
    imageUrl: "/images/locations/lab-it.jpg",
    sceneId: "lab-it",
    status: "published",
  },
  {
    id: "loc-studio-imac",
    slug: "studio-imac-f402",
    code: "F-402",
    name: "Studio Thiết kế Đồ họa iMac",
    buildingCode: "TOA-F",
    buildingName: "Tòa Nhà F",
    floor: "Tầng 4",
    category: "studio",
    categoryLabel: "Studio & Multimedia",
    shortDesc: "Không gian thực hành thiết kế đồ họa, chỉnh sửa hình ảnh và dựng phim.",
    description:
      "Studio thực hành dành riêng cho các lớp Thiết kế Đồ họa và Truyền thông Đa phương tiện với bàn làm việc sáng tạo và dàn máy tính đồng bộ màn hình sắc nét.",
    highlights: [
      "Hệ thống máy trạm all-in-one phục vụ thiết kế & dựng hình",
      "Hệ thống đèn trần tiêu chuẩn cho studio sáng tạo",
      "Khu vực bàn nhóm nhận xét sản phẩm trực quan",
    ],
    imageUrl: "/images/locations/studio-imac.jpg",
    sceneId: "studio-imac",
    status: "published",
  },
  {
    id: "loc-the-thao",
    slug: "khu-the-thao-qtsc",
    code: "SPO-01",
    name: "Tổ hợp Thể thao & Sân ngoài trời",
    buildingCode: "SPORTS",
    buildingName: "Khu Thể thao",
    floor: "Khuôn viên ngoài trời",
    category: "common",
    categoryLabel: "Tiện ích & Thể thao",
    shortDesc: "Sân bóng đá mini cỏ nhân tạo, sân bóng rổ và không gian giao lưu sinh viên.",
    description:
      "Khu rèn luyện thể chất và sinh hoạt câu lạc bộ thể thao ngay trong khuôn viên QTSC Quận 12, bao quanh bởi cây xanh thoáng mát.",
    highlights: [
      "Sân bóng đá mini mặt cỏ nhân tạo",
      "Sân bóng rổ & khu sinh hoạt tập thể ngoài trời",
      "Kết nối trực tiếp trục đi bộ nội khu QTSC",
    ],
    imageUrl: "/images/locations/sports-complex.jpg",
    sceneId: null,
    status: "published",
  },
];

export interface TourHotspotItem {
  id: string;
  label: string;
  yaw: number;
  pitch: number;
  type: "scene" | "info";
  targetSceneId?: string;
  infoText?: string;
}

export interface TourSceneItem {
  id: string;
  name: string;
  buildingCode: BuildingCode;
  buildingLabel: string;
  floor: string;
  category: TourNodeCategory;
  bgUrl: string;
  thumbUrl: string;
  intro: string;
  linkedLocationSlug: string;
  initialView: { yaw: number; pitch: number; fov: number };
  status: Lowercase<Exclude<PublishStatus, "ARCHIVED">>;
  isEquirectangular2to1: boolean;
  hotspots: TourHotspotItem[];
}

export const TOUR_SCENES: TourSceneItem[] = [
  {
    id: "cong-chao-qtsc",
    name: "Toàn cảnh Khuôn viên QTSC",
    buildingCode: "INNOVATION",
    buildingLabel: "Khuôn viên QTSC Q.12",
    floor: "Ngoài trời",
    category: "exterior",
    bgUrl: "/images/panoramas/campus-courtyard-360.jpg",
    thumbUrl: "/images/locations/building-innovation.jpg",
    intro:
      "Góc nhìn toàn cảnh sân trung tâm tại CVPM Quang Trung, kết nối Tòa Innovation, Tòa T, Tòa F và mảng xanh khuôn viên.",
    linkedLocationSlug: "sanh-innovation",
    initialView: { yaw: 0, pitch: 2, fov: 68 },
    status: "published",
    isEquirectangular2to1: true,
    hotspots: [
      {
        id: "hs-to-library",
        label: "Vào Thư viện Số (Tòa Innovation)",
        yaw: 15,
        pitch: 4,
        type: "scene",
        targetSceneId: "thu-vien",
      },
      {
        id: "hs-to-lab",
        label: "Đi tới Phòng Lab CNTT (Tòa T)",
        yaw: -48,
        pitch: 2,
        type: "scene",
        targetSceneId: "lab-it",
      },
      {
        id: "hs-to-studio",
        label: "Khám phá Studio iMac (Tòa F)",
        yaw: 65,
        pitch: 0,
        type: "scene",
        targetSceneId: "studio-imac",
      },
      {
        id: "hs-info-courtyard",
        label: "Điểm tập trung Open Day",
        yaw: -15,
        pitch: -6,
        type: "info",
        infoText: "Cổng chào sân trung tâm kết nối các tòa nhà đào tạo trong bán kính 150m.",
      },
    ],
  },
  {
    id: "sanh-innovation",
    name: "Hội trường Đa năng Innovation",
    buildingCode: "INNOVATION",
    buildingLabel: "Tòa Innovation",
    floor: "Tầng 1",
    category: "study",
    bgUrl: "/images/panoramas/auditorium-360.jpg",
    thumbUrl: "/images/locations/auditorium-hall.jpg",
    intro:
      "Hội trường chính nơi diễn ra phần khai mạc Open Day, chia sẻ định hướng và các buổi giao lưu chuyên đề.",
    linkedLocationSlug: "hoi-truong-innovation",
    initialView: { yaw: 5, pitch: 0, fov: 68 },
    status: "published",
    isEquirectangular2to1: true,
    hotspots: [
      {
        id: "hs-audit-lib",
        label: "Lên Thư viện Số Tầng 2",
        yaw: -42,
        pitch: 5,
        type: "scene",
        targetSceneId: "thu-vien",
      },
      {
        id: "hs-audit-out",
        label: "Ra Toàn cảnh Khuôn viên",
        yaw: 140,
        pitch: 0,
        type: "scene",
        targetSceneId: "cong-chao-qtsc",
      },
      {
        id: "hs-audit-info",
        label: "Sân khấu Khai mạc",
        yaw: 22,
        pitch: -2,
        type: "info",
        infoText: "Nơi tổ chức lễ đón khách mời Open Day và phiên giao lưu doanh nghiệp.",
      },
    ],
  },
  {
    id: "thu-vien",
    name: "Thư viện Số & Co-working Space",
    buildingCode: "INNOVATION",
    buildingLabel: "Tòa Innovation",
    floor: "Tầng 2",
    category: "study",
    bgUrl: "/images/panoramas/library-360.jpg",
    thumbUrl: "/images/locations/library-reading.jpg",
    intro:
      "Không gian tự học ánh sáng tự nhiên với khu đọc sách, bàn làm việc nhóm và các cabin thảo luận yên tĩnh.",
    linkedLocationSlug: "thu-vien-so-t2",
    initialView: { yaw: 0, pitch: 0, fov: 68 },
    status: "published",
    isEquirectangular2to1: true,
    hotspots: [
      {
        id: "hs-lib-lab",
        label: "Sang Phòng Lab Lập trình",
        yaw: 48,
        pitch: -2,
        type: "scene",
        targetSceneId: "lab-it",
      },
      {
        id: "hs-lib-audit",
        label: "Xuống Hội trường Innovation",
        yaw: -115,
        pitch: 2,
        type: "scene",
        targetSceneId: "sanh-innovation",
      },
      {
        id: "hs-lib-pods",
        label: "Khu Cabin Thảo luận nhóm",
        yaw: -36,
        pitch: 3,
        type: "info",
        infoText: "Các buồng kính cách âm giúp nhóm sinh viên họp đồ án tập trung.",
      },
    ],
  },
  {
    id: "lab-it",
    name: "Phòng Thực hành Lập trình CNTT",
    buildingCode: "TOA-T",
    buildingLabel: "Tòa Nhà T",
    floor: "Tầng 3",
    category: "lab",
    bgUrl: "/images/panoramas/it-lab-360.jpg",
    thumbUrl: "/images/locations/lab-it.jpg",
    intro:
      "Phòng Lab thực hành chuyên ngành Công nghệ Thông tin, Lập trình Web, Mobile và Dự án phần mềm.",
    linkedLocationSlug: "lab-lap-trinh-t301",
    initialView: { yaw: 0, pitch: -2, fov: 68 },
    status: "published",
    isEquirectangular2to1: true,
    hotspots: [
      {
        id: "hs-lab-studio",
        label: "Chuyển sang Studio Đồ họa iMac",
        yaw: 60,
        pitch: 0,
        type: "scene",
        targetSceneId: "studio-imac",
      },
      {
        id: "hs-lab-courtyard",
        label: "Quay lại Toàn cảnh Khuôn viên",
        yaw: -135,
        pitch: 3,
        type: "scene",
        targetSceneId: "cong-chao-qtsc",
      },
      {
        id: "hs-lab-desk",
        label: "Cụm máy thực hành màn hình đôi",
        yaw: 8,
        pitch: -8,
        type: "info",
        infoText: "Bố trí theo dãy giúp giảng viên dễ hỗ trợ trực tiếp trong giờ thực hành.",
      },
    ],
  },
  {
    id: "studio-imac",
    name: "Studio Thiết kế Đồ họa iMac",
    buildingCode: "TOA-F",
    buildingLabel: "Tòa Nhà F",
    floor: "Tầng 4",
    category: "lab",
    bgUrl: "/images/panoramas/imac-studio-360.jpg",
    thumbUrl: "/images/locations/studio-imac.jpg",
    intro:
      "Studio thực hành Thiết kế Đồ họa và Multimedia với hệ thống máy iMac đồng bộ và đèn trần chuyên dụng.",
    linkedLocationSlug: "studio-imac-f402",
    initialView: { yaw: 0, pitch: 0, fov: 68 },
    status: "published",
    isEquirectangular2to1: true,
    hotspots: [
      {
        id: "hs-studio-lib",
        label: "Sang Thư viện Số Co-working",
        yaw: -52,
        pitch: 2,
        type: "scene",
        targetSceneId: "thu-vien",
      },
      {
        id: "hs-studio-courtyard",
        label: "Về Sân Trung tâm QTSC",
        yaw: 130,
        pitch: 0,
        type: "scene",
        targetSceneId: "cong-chao-qtsc",
      },
      {
        id: "hs-studio-rig",
        label: "Hệ thống Đèn Studio & Bàn nhóm",
        yaw: 0,
        pitch: 14,
        type: "info",
        infoText: "Không gian phục vụ môn Thiết kế Đồ họa, Dựng phim & Nhiếp ảnh số.",
      },
    ],
  },
];

export interface OpenDaySessionItem {
  id: string;
  timeRange: string;
  period: "morning" | "noon" | "afternoon";
  title: string;
  description: string;
  buildingCode: BuildingCode;
  locationLabel: string;
  sceneId?: string;
  accessType: "public" | "invited";
  hostUnit: string;
}

export const OPEN_DAY_SESSIONS: OpenDaySessionItem[] = [
  {
    id: "od-01",
    timeRange: "08:00 – 08:45",
    period: "morning",
    title: "Đón khách tham quan & Định hướng khuôn viên QTSC",
    description:
      "Đón tiếp học sinh, phụ huynh và khách tham quan tự do tại Sảnh Innovation; hướng dẫn trải nghiệm Bản đồ GIS và hành trình tham quan các khu phòng Lab.",
    buildingCode: "INNOVATION",
    locationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
    sceneId: "cong-chao-qtsc",
    accessType: "public",
    hostUnit: "Ban Tổ Chức Open Day",
  },
  {
    id: "od-02",
    timeRange: "08:45 – 09:45",
    period: "morning",
    title: "Phiên Khai mạc & Giới thiệu Không gian Đào tạo Thực hành",
    description:
      "Chia sẻ tổng quan về môi trường học tập theo dự án thực tế tại CVPM Quang Trung Quận 12 và giải đáp chung cho phụ huynh, học sinh.",
    buildingCode: "INNOVATION",
    locationLabel: "Hội trường Đa năng — Tòa Innovation",
    sceneId: "sanh-innovation",
    accessType: "public",
    hostUnit: "Ban Điều hành Cơ sở Q.12",
  },
  {
    id: "od-03",
    timeRange: "10:00 – 11:30",
    period: "morning",
    title: "Trải nghiệm Workshop chuyên sâu tại Phòng Lab & Studio iMac",
    description:
      "Hoạt động thực hành trực tiếp theo nhóm nhỏ tại phòng Lab Tòa T và Studio Đồ họa Tòa F theo phân ca trong tài khoản tham dự.",
    buildingCode: "TOA-T",
    locationLabel: "Phòng Lab T-301 & Studio F-402",
    sceneId: "lab-it",
    accessType: "invited",
    hostUnit: "Giảng viên Bộ môn CNTT & Đồ họa",
  },
  {
    id: "od-04",
    timeRange: "11:30 – 13:30",
    period: "noon",
    title: "Tham quan Thư viện Số, Khu Thể thao & Giao lưu Câu lạc bộ",
    description:
      "Tự do tham quan không gian Co-working Tầng 2 và giao lưu cùng các câu lạc bộ sinh viên tại khuôn viên QTSC.",
    buildingCode: "SPORTS",
    locationLabel: "Thư viện Số T2 & Khu Thể thao",
    sceneId: "thu-vien",
    accessType: "public",
    hostUnit: "Công tác Sinh viên Q.12",
  },
  {
    id: "od-05",
    timeRange: "13:30 – 15:30",
    period: "afternoon",
    title: "Thử thách Khám phá Khuôn viên & Hoạt động Trải nghiệm QTSC",
    description:
      "Người tham dự trải nghiệm các trạm định hướng tại các tòa nhà trọng điểm và ôn tập thông tin khuôn viên qua mini-game tích hợp trong tour 360°.",
    buildingCode: "TOA-F",
    locationLabel: "Tòa F & Không gian Tham dự Trực tuyến",
    sceneId: "studio-imac",
    accessType: "invited",
    hostUnit: "Điều phối viên Open Day",
  },
  {
    id: "od-06",
    timeRange: "15:30 – 16:30",
    period: "afternoon",
    title: "Tổng kết phiên trải nghiệm & Trao đổi riêng cùng cố vấn",
    description:
      "Giải đáp các câu hỏi sau buổi trải nghiệm trực tiếp khuôn viên trước khi kết thúc ngày hội.",
    buildingCode: "INNOVATION",
    locationLabel: "Sảnh Đón Tiếp — Tòa Innovation",
    sceneId: "sanh-innovation",
    accessType: "public",
    hostUnit: "Ban Tổ Chức Open Day",
  },
];

export interface OpenDayFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const OPEN_DAY_FAQ: OpenDayFaqItem[] = [
  {
    id: "faq-1",
    question: "Tôi có cần tạo tài khoản để tham quan khuôn viên trực tuyến không?",
    answer:
      "Không. Bạn có thể mở Tour 360°, Bản đồ GIS và Danh mục Địa điểm tự do hoàn toàn mà không cần đăng nhập hoặc điền biểu mẫu.",
  },
  {
    id: "faq-2",
    question: "Tham gia trải nghiệm Open Day và Tham quan 360° có cần tài khoản không?",
    answer:
      "Khách tham quan tự do không cần đăng ký hoặc đăng nhập để xem lịch Open Day công khai (/events), Bản đồ GIS (/map) và Tham quan 360° (/campus).",
  },
  {
    id: "faq-3",
    question: "Khi nào áp dụng tài khoản mời Open Day (kích hoạt trực tiếp / Email-SMS)?",
    answer:
      "Quy trình cấp tài khoản cho nhân sự quản trị và khách mời Open Day (qua liên kết kích hoạt dùng một lần hoặc lời mời Email/SMS) sẽ được tích hợp ở giai đoạn Backend Auth tiếp theo.",
  },
  {
    id: "faq-4",
    question: "Địa điểm tổ chức trực tiếp tại đâu và cần thông tin tuyển sinh chính thức thì xem ở đâu?",
    answer:
      `Sự kiện diễn ra tại ${OFFICIAL_CAMPUS_INFO.address}. Các thông tin về ngành học, học phí và hồ sơ tuyển sinh chính thức được đăng tải đầy đủ tại website chính thức caodang.fpt.edu.vn.`,
  },
];

export interface OpenDayQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const OPEN_DAY_QUIZ_QUESTIONS: OpenDayQuizQuestion[] = [
  {
    id: "q-1",
    question: "Cơ sở FPT Polytechnic tại CVPM Quang Trung nằm ở quận nào của TP.HCM?",
    options: ["Quận 10", "Quận 12", "Quận Bình Thạnh", "Quận 7"],
    correctIndex: 1,
    explanation:
      "Cơ sở tọa lạc tại Tòa nhà Innovation, Lô 24, CVPM Quang Trung, Đường Tô Ký, Phường Trung Mỹ Tây, Quận 12.",
  },
  {
    id: "q-2",
    question: "Khu vực nào tại khuôn viên QTSC phục vụ check-in Open Day và Hội trường đa năng?",
    options: ["Tòa Nhà Innovation", "Khu Thể thao QTSC", "Cổng phụ phía Tây", "Bãi giữ xe"],
    correctIndex: 0,
    explanation:
      "Tòa Nhà Innovation là trung tâm đón tiếp, có Sảnh check-in tầng trệt, Hội trường tầng 1 và Thư viện Số tầng 2.",
  },
  {
    id: "q-3",
    question: "Không gian Studio thực hành Thiết kế Đồ họa iMac đặt tại tòa nhà nào trong bản đồ?",
    options: ["Tòa Nhà P", "Tòa Nhà F", "Sân Thể thao", "Tòa Nhà T"],
    correctIndex: 1,
    explanation:
      "Studio Thiết kế Đồ họa iMac F-402 nằm tại Tầng 4 của Tòa Nhà F.",
  },
];

export interface MediaAssetAdminItem {
  id: string;
  filename: string;
  url: string;
  kind: "panorama_2_1" | "photo_2d";
  dimensions: string;
  ratioValid: boolean;
  sizeLabel: string;
  usedBy: string[];
  updatedAt: string;
}

export const INITIAL_MEDIA_ASSETS: MediaAssetAdminItem[] = [
  {
    id: "med-01",
    filename: "campus-courtyard-360.jpg",
    url: "/images/panoramas/campus-courtyard-360.jpg",
    kind: "panorama_2_1",
    dimensions: "2048 × 1024 (2:1)",
    ratioValid: true,
    sizeLabel: "640 KB",
    usedBy: ["Scene: cong-chao-qtsc"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-02",
    filename: "auditorium-360.jpg",
    url: "/images/panoramas/auditorium-360.jpg",
    kind: "panorama_2_1",
    dimensions: "2048 × 1024 (2:1)",
    ratioValid: true,
    sizeLabel: "580 KB",
    usedBy: ["Scene: sanh-innovation"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-03",
    filename: "library-360.jpg",
    url: "/images/panoramas/library-360.jpg",
    kind: "panorama_2_1",
    dimensions: "2048 × 1024 (2:1)",
    ratioValid: true,
    sizeLabel: "610 KB",
    usedBy: ["Scene: thu-vien"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-04",
    filename: "it-lab-360.jpg",
    url: "/images/panoramas/it-lab-360.jpg",
    kind: "panorama_2_1",
    dimensions: "2048 × 1024 (2:1)",
    ratioValid: true,
    sizeLabel: "545 KB",
    usedBy: ["Scene: lab-it"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-05",
    filename: "imac-studio-360.jpg",
    url: "/images/panoramas/imac-studio-360.jpg",
    kind: "panorama_2_1",
    dimensions: "2048 × 1024 (2:1)",
    ratioValid: true,
    sizeLabel: "570 KB",
    usedBy: ["Scene: studio-imac"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-06",
    filename: "building-innovation.jpg",
    url: "/images/locations/building-innovation.jpg",
    kind: "photo_2d",
    dimensions: "1280 × 720 (16:9)",
    ratioValid: true,
    sizeLabel: "240 KB",
    usedBy: ["Location: sanh-innovation", "Building: INNOVATION"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-07",
    filename: "lab-it.jpg",
    url: "/images/locations/lab-it.jpg",
    kind: "photo_2d",
    dimensions: "1280 × 720 (16:9)",
    ratioValid: true,
    sizeLabel: "215 KB",
    usedBy: ["Location: lab-lap-trinh-t301", "Building: TOA-T"],
    updatedAt: "11/11/2026",
  },
  {
    id: "med-08",
    filename: "studio-imac.jpg",
    url: "/images/locations/studio-imac.jpg",
    kind: "photo_2d",
    dimensions: "1280 × 720 (16:9)",
    ratioValid: true,
    sizeLabel: "210 KB",
    usedBy: ["Location: studio-imac-f402", "Building: TOA-F"],
    updatedAt: "11/11/2026",
  },
];

export interface AdminParticipantUser {
  id: string;
  accountCode: string;
  fullName: string;
  contactChannel: string;
  role: "participant" | "operator" | "admin";
  eventBatch: string;
  passwordStatus: "must_change" | "updated" | "locked";
  checkedIn: boolean;
  ticketCode: string;
}

export const INITIAL_ADMIN_USERS: AdminParticipantUser[] = [
  {
    id: "usr-admin",
    accountCode: "admin",
    fullName: "Quản trị viên Hệ thống",
    contactChannel: "admin@fpt.edu.vn",
    role: "admin",
    eventBatch: "Quản trị Virtual Campus",
    passwordStatus: "updated",
    checkedIn: false,
    ticketCode: "ADMIN-QTSC-01",
  },
];

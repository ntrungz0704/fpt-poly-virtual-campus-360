import type {
  AlignmentStatus,
  FloorPlanFormat,
  GeoLatLngTuple,
  ISO8601Timestamp,
  NormCoord2D,
  ProcessingStatus,
  PublishStatus,
  StorageDriver,
  UploadTargetType,
  UUID,
} from "./common.js";
import type { LocationCategoryGroup } from "./location.js";

export type BuildingCode =
  | "INNOVATION"
  | "TOA-T"
  | "TOA-F"
  | "TOA-P"
  | "SPORTS";

export type BuildingCategory = "academic" | "lab" | "facility";

export type MapBuildingIconKey =
  | "innovation"
  | "it-building"
  | "design-studio"
  | "academic-hall"
  | "sports";

export interface CampusGeoPoint {
  lat: number;
  lng: number;
  label: string;
  addressNote: string;
}

export interface CampusLandmarkItem {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
}

/** Institutional reference info kept in static web config for MVP (OD-03 Option B). */
export interface CampusOfficialStaticInfo {
  name: string;
  shortName: string;
  campusLabel: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  coordinatesLabel: string;
  officialSiteUrl: string;
  officialContactUrl: string;
  officialAdmissionsUrl: string;
  officialMajorsUrl: string;
  openDayDateLabel: string;
  openDayTimeLabel: string;
  supportHours: string;
}

export interface PublicCampusSummaryDto {
  id: UUID;
  code: string;
  name: string;
  address: string;
  defaultEntryNodeSlug: string | null;
  originPoint: CampusGeoPoint;
  landmarks: CampusLandmarkItem[];
}

export interface PublicBuildingDto {
  id: UUID;
  code: BuildingCode;
  slug: string;
  name: string;
  shortName: string;
  category: BuildingCategory;
  categoryLabel: string;
  floorsLabel: string;
  summary: string;
  description: string;
  highlights: string[];
  coverUrl: string;
  defaultNodeSlug: string | null;
  lat: number;
  lng: number;
  addressNote: string;
  statusNote: string;
  mapIconKey: MapBuildingIconKey;
  routeWaypoints: GeoLatLngTuple[];
  gisX: number | null;
  gisY: number | null;
  floorCount: number;
  publishedNodeCount: number;
}

export interface PublicCampusResponseDto {
  campus: PublicCampusSummaryDto;
  buildings: PublicBuildingDto[];
}

export interface FloorPlanDto {
  id: UUID;
  version: number;
  sourceFormat: FloorPlanFormat;
  renderUrl: string;
  thumbUrl: string | null;
  renderWidth: number | null;
  renderHeight: number | null;
  northOffsetDeg: number;
  processingStatus: ProcessingStatus;
}

export interface PublicFloorNodePinDto {
  id: UUID;
  slug: string;
  title: string;
  locationId: UUID;
  floorPlanId: UUID | null;
  floorNormX: number | null;
  floorNormY: number | null;
  headingOffsetDeg: number;
  thumbUrl: string;
}

export interface PublicFloorLocationPinDto {
  id: UUID;
  slug: string;
  code: string;
  name: string;
  shortDesc: string;
  category: LocationCategoryGroup;
  categoryLabel: string;
  floorNormX: number | null;
  floorNormY: number | null;
  floorPolygonNorm: NormCoord2D[] | null;
  isPublicAccessible: boolean;
  restrictionNote: string | null;
  primaryNodeSlug: string | null;
}

export interface PublicFloorSummaryDto {
  id: UUID;
  code: string;
  name: string;
  levelIndex: number;
  requiresFloorPlan: boolean;
  activeFloorPlan: FloorPlanDto | null;
  locations: PublicFloorLocationPinDto[];
  nodes: PublicFloorNodePinDto[];
}

export interface PublicBuildingDetailDto {
  building: PublicBuildingDto;
  floors: PublicFloorSummaryDto[];
}

export interface UpsertBuildingInput {
  code: BuildingCode;
  slug: string;
  name: string;
  shortName: string;
  category: BuildingCategory;
  categoryLabel: string;
  floorsLabel: string;
  summary: string;
  description: string;
  highlights: string[];
  lat: number;
  lng: number;
  addressNote: string;
  statusNote: string;
  mapIconKey: MapBuildingIconKey;
  routeWaypoints: GeoLatLngTuple[];
  gisX?: number | null;
  gisY?: number | null;
  coverMediaId?: UUID | null;
  defaultNodeId?: UUID | null;
  sortOrder?: number;
  status?: PublishStatus;
}

export interface FloorPlanPresignRequest {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  sourcePageNumber?: number;
  replaceMode: "INITIAL" | "NEW_VERSION";
}

export interface FloorPlanPresignResponse {
  floorPlanId: UUID;
  version: number;
  storageDriver: StorageDriver;
  uploadUrl: string;
  targetType?: UploadTargetType;
  uploadToken?: string;
  maxSizeBytes?: number;
  expiresAt?: ISO8601Timestamp;
}

export interface FloorPlanStatusDto {
  id: UUID;
  floorId: UUID;
  version: number;
  sourceFormat: FloorPlanFormat;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  renderUrl: string | null;
  thumbUrl: string | null;
  renderWidth: number | null;
  renderHeight: number | null;
  alignmentStatus: AlignmentStatus | null;
  nodesPendingRealignmentCount: number;
}

export interface AdminCampusDto extends PublicCampusSummaryDto {
  defaultEntryNodeId: UUID | null;
  status: PublishStatus;
  updatedAt: ISO8601Timestamp;
}

export interface UpdateCampusInput {
  name?: string;
  address?: string;
  defaultEntryNodeId?: UUID | null;
  originPoint?: CampusGeoPoint;
  landmarks?: CampusLandmarkItem[];
  status?: PublishStatus;
}

export interface AdminBuildingDto extends PublicBuildingDto {
  campusId: UUID;
  coverMediaId: UUID | null;
  defaultNodeId: UUID | null;
  sortOrder: number;
  status: PublishStatus;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface AdminFloorDto {
  id: UUID;
  buildingId: UUID;
  code: string;
  name: string;
  levelIndex: number;
  requiresFloorPlan: boolean;
  activeFloorPlanId: UUID | null;
  activeFloorPlan: FloorPlanDto | null;
  status: PublishStatus;
  sortOrder: number;
  nodeCount: number;
  nodesPendingRealignmentCount: number;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface CreateFloorInput {
  code: string;
  name: string;
  levelIndex: number;
  requiresFloorPlan?: boolean;
  sortOrder?: number;
  status?: PublishStatus;
}

export interface UpdateFloorInput {
  code?: string;
  name?: string;
  levelIndex?: number;
  requiresFloorPlan?: boolean;
  sortOrder?: number;
  status?: PublishStatus;
}

export interface FloorPlanAlignmentSnapshotItem {
  nodeId?: UUID;
  locationId?: UUID;
  oldNormX: number;
  oldNormY: number;
}

export interface FloorPlanAlignmentOverlayDto {
  floorId: UUID;
  newFloorPlan: FloorPlanDto;
  previousFloorPlan: FloorPlanDto | null;
  alignmentStatus: AlignmentStatus;
  snapshots: FloorPlanAlignmentSnapshotItem[];
}

export interface ConfirmFloorPlanAlignmentRequest {
  nodes: Array<{
    nodeId: UUID;
    floorNormX: number;
    floorNormY: number;
  }>;
  locations?: Array<{
    locationId: UUID;
    floorNormX: number;
    floorNormY: number;
  }>;
}

export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const earthRadiusMeters = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeRouteDistanceMeters(points: GeoLatLngTuple[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistanceMeters(
      { lat: points[i - 1][0], lng: points[i - 1][1] },
      { lat: points[i][0], lng: points[i][1] }
    );
  }
  return Math.round(total);
}

export function formatDistanceEstimate(
  meters: number,
  usingGps: boolean
): {
  distanceText: string;
  durationText: string;
  combinedText: string;
} {
  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1);
    const bikeMins = Math.max(2, Math.round(meters / 350));
    const walkOrRide = usingGps
      ? `${bikeMins} phút di chuyển`
      : `${Math.round(meters / 75)} phút đi bộ`;
    return {
      distanceText: `~${km} km`,
      durationText: walkOrRide,
      combinedText: `~${km} km · ~${walkOrRide}`,
    };
  }
  const rounded = Math.max(20, Math.round(meters / 10) * 10);
  const walkMins = Math.max(1, Math.round(rounded / 75));
  return {
    distanceText: `~${rounded} m`,
    durationText: `${walkMins} phút đi bộ`,
    combinedText: `~${rounded} m · ~${walkMins} phút đi bộ`,
  };
}

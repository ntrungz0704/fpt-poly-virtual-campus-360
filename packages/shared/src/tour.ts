import type { BuildingCode } from "./campus.js";
import type {
  MediaKind,
  ProcessingStatus,
  PublishStatus,
  StorageDriver,
  UUID,
} from "./common.js";
import type { LocationTypeCode } from "./location.js";

export type TourNodeCategory = "exterior" | "study" | "lab";

export type HotspotType = "SCENE_LINK" | "INFO" | "QUIZ_TRIGGER";

export type TourEdgeType =
  | "WALKWAY"
  | "DOORWAY"
  | "STAIRS"
  | "ELEVATOR"
  | "OUTDOOR_LINK";

export type TourValidationSeverity = "ERROR" | "WARNING";

export type TourValidationRuleCode =
  | "VAL_UNPLACED_NODE"
  | "VAL_MEDIA_NOT_READY"
  | "VAL_NODE_REALLIGN_PENDING"
  | "VAL_DEAD_END_NODE"
  | "VAL_ISOLATED_COMPONENT"
  | "VAL_ONE_WAY_LINK"
  | "VAL_CROSS_FLOOR_INVALID";

export type TourValidationScope = "NODE" | "FLOOR" | "BUILDING" | "CAMPUS";

export interface TourHotspotDto {
  id: UUID;
  hotspotType: HotspotType;
  edgeType: TourEdgeType | null;
  yaw: number;
  pitch: number;
  title: string;
  body: string | null;
  targetNodeSlug: string | null;
  targetEntryYaw: number | null;
  targetEntryPitch: number | null;
  targetFloorId: UUID | null;
  payload: Record<string, unknown> | null;
}

export interface TourNodeSiblingDto {
  slug: string;
  title: string;
}

export interface TourNodeSummaryDto {
  id: UUID;
  slug: string;
  title: string;
  intro: string;
  category: TourNodeCategory;
  buildingCode: BuildingCode;
  buildingLabel: string;
  floorLabel: string;
  thumbUrl: string;
  panoramaUrl: string;
  fallbackMobileUrl: string | null;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  headingOffsetDeg: number;
  floorPlanId: UUID | null;
  floorNormX: number | null;
  floorNormY: number | null;
  linkedLocationSlug: string;
  status: PublishStatus;
}

export interface PublicTourNodeDetailDto {
  node: TourNodeSummaryDto;
  location: {
    id: UUID;
    slug: string;
    name: string;
    typeCode: LocationTypeCode;
    buildingCode: BuildingCode;
    floorId: UUID | null;
    siblingNodes: TourNodeSiblingDto[];
  };
  hotspots: TourHotspotDto[];
}

export interface TourValidationIssueDto {
  rule: TourValidationRuleCode;
  severity: TourValidationSeverity;
  message: string;
  nodeId?: UUID;
  nodeSlug?: string;
  edgeId?: UUID;
  approvedException?: boolean;
}

export interface TourValidationReportDto {
  isPublishable: boolean;
  summary: {
    errors: number;
    warnings: number;
    approvedExceptions: number;
  };
  issues: TourValidationIssueDto[];
}

export interface CreateTourNodeHotspotInput {
  hotspotType: HotspotType;
  yaw: number;
  pitch: number;
  title: string;
  body?: string | null;
  targetNodeId?: UUID | null;
  edgeType?: TourEdgeType;
  targetEntryYaw?: number | null;
  targetEntryPitch?: number | null;
  isOneWayApproved?: boolean;
  oneWayApprovalReason?: string | null;
  createReverseEdge?: boolean;
  reverseHotspot?: {
    yaw: number;
    pitch: number;
    title: string;
  };
  payload?: Record<string, unknown> | null;
}

export interface MediaPresignRequest {
  assetKind: MediaKind;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  declaredWidth: number;
  declaredHeight: number;
  sha256: string;
}

export interface MediaPresignResponse {
  assetId: UUID;
  storageDriver: StorageDriver;
  uploadUrl: string;
}

export interface MediaAssetSummaryDto {
  id: UUID;
  assetKind: MediaKind;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  originalWidth: number;
  originalHeight: number;
  isValid2To1: boolean;
  isPreviewApproved: boolean;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  optimizedDesktopUrl: string | null;
  optimizedMobileUrl: string | null;
  thumbnailUrl: string | null;
}

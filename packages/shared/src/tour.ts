import type { BuildingCode } from "./campus.js";
import type {
  ISO8601Timestamp,
  MediaKind,
  ProcessingStatus,
  PublishStatus,
  StorageDriver,
  UploadTargetType,
  UUID,
} from "./common.js";
import type { LocationTypeCode } from "./location.js";

export const TOUR_INITIAL_FOV_MIN = 30 as const;
export const TOUR_INITIAL_FOV_MAX = 100 as const;

export const TOUR_AI_PLACEHOLDER_ORIGIN =
  "AI_GENERATED_SYNTHETIC_PLACEHOLDER" as const;
export const AI_PLACEHOLDER_BLOCKED_ERROR_CODE =
  "AI_PLACEHOLDER_BLOCKED" as const;
export const AI_PLACEHOLDER_BLOCKED_HTTP_STATUS = 422 as const;

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
  targetType?: UploadTargetType;
  uploadToken?: string;
  maxSizeBytes?: number;
  expiresAt?: ISO8601Timestamp;
}

export interface UploadTokenSummaryDto {
  id: UUID;
  jti: UUID;
  subjectUserId: UUID;
  targetType: UploadTargetType;
  mediaAssetId: UUID | null;
  floorPlanId: UUID | null;
  objectKey: string;
  expectedMimeType: string;
  maxSizeBytes: number;
  expiresAt: ISO8601Timestamp;
  usedAt: ISO8601Timestamp | null;
  revokedAt: ISO8601Timestamp | null;
  createdAt: ISO8601Timestamp;
}

export interface MediaAssetFilterQuery {
  assetKind?: MediaKind;
  processingStatus?: ProcessingStatus;
  isPreviewApproved?: boolean;
  page?: number;
  limit?: number;
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

export interface AdminMediaAssetDto extends MediaAssetSummaryDto {
  sha256Checksum: string;
  cameraMetadata: Record<string, unknown> | null;
  isAiPlaceholder: boolean;
  uploadedBy: UUID;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface UpsertTourNodeInput {
  slug: string;
  title: string;
  intro: string;
  category: TourNodeCategory;
  locationId: UUID;
  panoramaAssetId: UUID;
  floorPlanId?: UUID | null;
  floorNormX?: number | null;
  floorNormY?: number | null;
  headingOffsetDeg?: number;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
  isTerminalApproved?: boolean;
  terminalApprovalReason?: string | null;
  sortOrder?: number;
  status?: PublishStatus;
}

export type UpdateTourNodeInput = Partial<UpsertTourNodeInput> & {
  needsRealignment?: boolean;
};

export interface AdminTourNodeDto extends TourNodeSummaryDto {
  locationId: UUID;
  panoramaAssetId: UUID;
  needsRealignment: boolean;
  isTerminalApproved: boolean;
  terminalApprovalReason: string | null;
  sortOrder: number;
  isAiPlaceholder: boolean;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface UpdateHotspotInput {
  yaw?: number;
  pitch?: number;
  title?: string;
  body?: string | null;
  edgeType?: TourEdgeType;
  targetEntryYaw?: number | null;
  targetEntryPitch?: number | null;
  isOneWayApproved?: boolean;
  oneWayApprovalReason?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface TourValidateRequest {
  scope: TourValidationScope;
  targetId: UUID;
}

export interface PublishTourResultDto {
  published: boolean;
  scope: TourValidationScope;
  targetId: UUID;
  validationReport: TourValidationReportDto;
}

export interface AiPlaceholderGoLiveEvaluation {
  isAiPlaceholder: boolean;
  isGoLiveBlocked: boolean;
  validationIssue: TourValidationIssueDto | null;
  publishErrorCode: typeof AI_PLACEHOLDER_BLOCKED_ERROR_CODE | null;
  publishHttpStatus: typeof AI_PLACEHOLDER_BLOCKED_HTTP_STATUS | null;
}

/** Checks camera_metadata markers used by AI synthetic 360 placeholders before Go-Live. */
export function isAiPlaceholderCameraMetadata(
  cameraMetadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!cameraMetadata || typeof cameraMetadata !== "object") {
    return false;
  }
  return (
    cameraMetadata.requiresReal360ReplacementBeforeGoLive === true ||
    cameraMetadata.assetOrigin === TOUR_AI_PLACEHOLDER_ORIGIN ||
    cameraMetadata.isRealQtscCapture === false
  );
}

/**
 * Implements DEC-M1-A: preserves the 7 canonical TourValidationRuleCode values,
 * mapping synthetic AI placeholders to VAL_MEDIA_NOT_READY (ERROR) and blocking Go-Live
 * publish with AI_PLACEHOLDER_BLOCKED (HTTP 422).
 */
export function evaluateAiPlaceholderGoLiveStatus(input: {
  nodeId?: UUID;
  nodeSlug?: string;
  cameraMetadata?: Record<string, unknown> | null;
}): AiPlaceholderGoLiveEvaluation {
  const isAiPlaceholder = isAiPlaceholderCameraMetadata(input.cameraMetadata);
  if (!isAiPlaceholder) {
    return {
      isAiPlaceholder: false,
      isGoLiveBlocked: false,
      validationIssue: null,
      publishErrorCode: null,
      publishHttpStatus: null,
    };
  }

  return {
    isAiPlaceholder: true,
    isGoLiveBlocked: true,
    validationIssue: {
      rule: "VAL_MEDIA_NOT_READY",
      severity: "ERROR",
      nodeId: input.nodeId,
      nodeSlug: input.nodeSlug,
      message:
        "MediaAsset là ảnh AI synthetic placeholder; bắt buộc thay thế bằng ảnh panorama 360° QTSC thật và phê duyệt preview trước khi Go-Live.",
    },
    publishErrorCode: AI_PLACEHOLDER_BLOCKED_ERROR_CODE,
    publishHttpStatus: AI_PLACEHOLDER_BLOCKED_HTTP_STATUS,
  };
}

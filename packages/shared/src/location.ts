import type { BuildingCode } from "./campus.js";
import type {
  ISO8601Timestamp,
  NormCoord2D,
  PublishStatus,
  UUID,
} from "./common.js";

export type LocationTypeCode =
  | "CLASSROOM"
  | "LAB"
  | "STUDIO"
  | "HALLWAY"
  | "ELEVATOR"
  | "STAIRS"
  | "RESTROOM"
  | "LIBRARY"
  | "LOBBY"
  | "SPORTS"
  | "RESTRICTED_AREA";

export type LocationCategoryKey = "all" | "lab" | "studio" | "common";

export type LocationCategoryGroup = Exclude<LocationCategoryKey, "all">;

export interface MediaGalleryItemDto {
  id: UUID;
  url: string;
  thumbUrl: string | null;
  isCover: boolean;
  caption: string | null;
}

export interface PublicLocationSummaryDto {
  id: UUID;
  slug: string;
  code: string;
  name: string;
  buildingCode: BuildingCode;
  buildingName: string;
  floorLabel: string;
  typeCode: LocationTypeCode;
  category: LocationCategoryGroup;
  categoryLabel: string;
  shortDesc: string;
  description: string;
  highlights: string[];
  imageUrl: string;
  primaryNodeSlug: string | null;
  isPublicAccessible: boolean;
  restrictionNote: string | null;
  status: PublishStatus;
}

export interface PublicLocationDetailDto extends PublicLocationSummaryDto {
  gallery: MediaGalleryItemDto[];
  tourNodes: Array<{
    id: UUID;
    slug: string;
    title: string;
    thumbUrl: string;
  }>;
}

export interface UpsertLocationInput {
  buildingId: UUID;
  floorId?: UUID | null;
  locationTypeId: UUID;
  code: string;
  slug: string;
  name: string;
  categoryLabel: string;
  shortDesc: string;
  description: string;
  highlights: string[];
  floorNormX?: number | null;
  floorNormY?: number | null;
  floorPolygonNorm?: NormCoord2D[] | null;
  isPublicAccessible?: boolean;
  restrictionNote?: string | null;
  primaryNodeId?: UUID | null;
  status?: PublishStatus;
}

export interface LocationTypeDto {
  id: UUID;
  code: LocationTypeCode;
  filterGroup: LocationCategoryGroup;
  label: string;
  iconName: string;
  isInterFloorConnector: boolean;
}

export interface AdminLocationSummaryDto extends PublicLocationSummaryDto {
  buildingId: UUID;
  floorId: UUID | null;
  locationTypeId: UUID;
  floorNormX: number | null;
  floorNormY: number | null;
  floorPolygonNorm: NormCoord2D[] | null;
  primaryNodeId: UUID | null;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface AdminLocationMediaLinkDto {
  id: UUID;
  mediaAssetId: UUID;
  sortOrder: number;
  isCover: boolean;
  caption: string | null;
  url: string | null;
  thumbUrl: string | null;
}

export interface AdminLocationDetailDto extends AdminLocationSummaryDto {
  mediaLinks: AdminLocationMediaLinkDto[];
  tourNodes: Array<{
    id: UUID;
    slug: string;
    title: string;
    status: PublishStatus;
  }>;
}

export interface LocationMediaLinkItemInput {
  mediaAssetId: UUID;
  sortOrder: number;
  isCover?: boolean;
  caption?: string | null;
}

export interface UpdateLocationMediaInput {
  items: LocationMediaLinkItemInput[];
}

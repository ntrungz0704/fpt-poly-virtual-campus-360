import type { BuildingCode } from "./campus.js";
import type { NormCoord2D, PublishStatus, UUID } from "./common.js";

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

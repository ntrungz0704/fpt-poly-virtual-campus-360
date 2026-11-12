export type UUID = string;
export type ISO8601Timestamp = string;

export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ProcessingStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type FloorPlanFormat = "PNG" | "JPG" | "SVG" | "PDF";

export type MediaKind = "PANORAMA_2_1" | "PHOTO_2D" | "THUMBNAIL";

export type AlignmentStatus = "PENDING_REVIEW" | "CONFIRMED";

export type StorageDriver = "local" | "s3";

export type UploadTargetType = "MEDIA_ASSET" | "FLOOR_PLAN";

export interface NormCoord2D {
  x: number;
  y: number;
}

export type GeoLatLngTuple = [number, number];

export const DEFAULT_QTSC_CAMPUS_CODE = "QTSC-Q12" as const;
export const DEFAULT_ENTRY_NODE_SLUG = "cong-chao-qtsc" as const;

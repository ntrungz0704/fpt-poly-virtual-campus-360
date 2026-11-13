import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type {
  BuildingCode,
  PublishStatus,
  SessionPeriod,
  UUID,
} from "@fpt-campus/shared";

export const PUBLISH_STATUSES: readonly PublishStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];

export const SESSION_PERIODS: readonly SessionPeriod[] = [
  "MORNING",
  "NOON",
  "AFTERNOON",
];

function trimIfString(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeEventKey(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function trimStringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((item) => (typeof item === "string" ? item.trim() : item));
}

export interface OpenDayLookupBuildingDto {
  id: UUID;
  code: BuildingCode;
  name: string;
  shortName: string;
  status: PublishStatus;
}

export interface OpenDayLookupTourNodeDto {
  id: UUID;
  slug: string;
  title: string;
  buildingCode: BuildingCode;
  floorName: string | null;
  status: PublishStatus;
}

export class AdminEventsQueryDto {
  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => trimIfString(value))
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class UpsertOpenDayEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Transform(({ value }) => normalizeEventKey(value))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "eventKey chỉ gồm chữ thường, chữ số và dấu gạch nối (VD: open-day-2026-qtsc).",
  })
  eventKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => trimIfString(value))
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => trimIfString(value))
  subtitle?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => trimIfString(value))
  dateLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => trimIfString(value))
  timeLabel!: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class PatchOpenDayEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @Transform(({ value }) => normalizeEventKey(value))
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "eventKey chỉ gồm chữ thường, chữ số và dấu gạch nối (VD: open-day-2026-qtsc).",
  })
  eventKey?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => trimIfString(value))
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => trimIfString(value))
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => trimIfString(value))
  dateLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => trimIfString(value))
  timeLabel?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class UpsertOpenDaySessionDto {
  @IsOptional()
  @IsUUID()
  buildingId?: string | null;

  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @IsOptional()
  @IsUUID()
  tourNodeId?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => trimIfString(value))
  title!: string;

  @IsIn(SESSION_PERIODS)
  sessionPeriod!: SessionPeriod;

  @IsString()
  @MinLength(1)
  @MaxLength(24)
  @Transform(({ value }) => trimIfString(value))
  startTimeLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(24)
  @Transform(({ value }) => trimIfString(value))
  endTimeLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => trimIfString(value))
  customLocationLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }) => trimIfString(value))
  hostUnit!: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Transform(({ value }) => trimIfString(value))
  description!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class PatchOpenDaySessionDto {
  @IsOptional()
  @IsUUID()
  buildingId?: string | null;

  @IsOptional()
  @IsUUID()
  locationId?: string | null;

  @IsOptional()
  @IsUUID()
  tourNodeId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => trimIfString(value))
  title?: string;

  @IsOptional()
  @IsIn(SESSION_PERIODS)
  sessionPeriod?: SessionPeriod;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  @Transform(({ value }) => trimIfString(value))
  startTimeLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  @Transform(({ value }) => trimIfString(value))
  endTimeLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => trimIfString(value))
  customLocationLabel?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }) => trimIfString(value))
  hostUnit?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Transform(({ value }) => trimIfString(value))
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class UpsertOpenDayFaqDto {
  @IsOptional()
  @IsUUID()
  eventId?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(280)
  @Transform(({ value }) => trimIfString(value))
  question!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Transform(({ value }) => trimIfString(value))
  answer!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class PatchOpenDayFaqDto {
  @IsOptional()
  @IsUUID()
  eventId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  @Transform(({ value }) => trimIfString(value))
  question?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Transform(({ value }) => trimIfString(value))
  answer?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class UpsertOpenDayQuizItemDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  tourNodeId?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(280)
  @Transform(({ value }) => trimIfString(value))
  questionText!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @Transform(({ value }) => trimStringArray(value))
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(240, { each: true })
  options!: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  correctIndex!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }) => trimIfString(value))
  explanation!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class PatchOpenDayQuizItemDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  tourNodeId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  @Transform(({ value }) => trimIfString(value))
  questionText?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @Transform(({ value }) => trimStringArray(value))
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(240, { each: true })
  options?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  correctIndex?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(({ value }) => trimIfString(value))
  explanation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @IsIn(PUBLISH_STATUSES)
  status?: PublishStatus;
}

export class AdminEventParticipationsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => trimIfString(value))
  search?: string;

  @IsOptional()
  @IsIn(["INVITED", "CONFIRMED", "CHECKED_IN", "CANCELLED"])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class CheckInTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  ticketCode!: string;
}

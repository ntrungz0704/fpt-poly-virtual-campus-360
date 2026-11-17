import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateTourNodeDto {
  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsString()
  intro!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  buildingCode?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsUUID()
  panoramaAssetId!: string;

  @IsOptional()
  @IsNumber()
  initialYaw?: number;

  @IsOptional()
  @IsNumber()
  initialPitch?: number;

  @IsOptional()
  @IsNumber()
  initialFov?: number;
}

export class UpdateTourNodeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  intro?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  panoramaAssetId?: string;

  @IsOptional()
  @IsNumber()
  initialYaw?: number;

  @IsOptional()
  @IsNumber()
  initialPitch?: number;

  @IsOptional()
  @IsNumber()
  initialFov?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export class SaveHotspotDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum(["INFO", "SCENE_LINK", "MEDIA", "QUIZ_CHECKPOINT"])
  hotspotType!: "INFO" | "SCENE_LINK" | "MEDIA" | "QUIZ_CHECKPOINT";

  @IsNumber()
  yaw!: number;

  @IsNumber()
  pitch!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsUUID()
  targetNodeId?: string;

  @IsOptional()
  @IsString()
  targetNodeSlug?: string;
}

export class BatchStudioSceneDto {
  @IsOptional()
  @IsUUID()
  nodeId?: string;

  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  panoramaAssetId?: string;

  @IsOptional()
  @IsString()
  panoramaUrl?: string;

  @IsOptional()
  @IsNumber()
  initialYaw?: number;

  @IsOptional()
  @IsNumber()
  initialPitch?: number;

  @IsOptional()
  @IsNumber()
  initialFov?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveHotspotDto)
  hotspots?: SaveHotspotDto[];
}

export class BatchTourStudioDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchStudioSceneDto)
  scenes!: BatchStudioSceneDto[];
}

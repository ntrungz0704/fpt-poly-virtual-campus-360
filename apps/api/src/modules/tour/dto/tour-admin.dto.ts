import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
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
  @IsString()
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
}

export class BatchStudioSceneDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

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
  @IsArray()
  @Type(() => SaveHotspotDto)
  hotspots?: SaveHotspotDto[];
}

export class BatchTourStudioDto {
  @IsArray()
  @Type(() => BatchStudioSceneDto)
  scenes!: BatchStudioSceneDto[];
}

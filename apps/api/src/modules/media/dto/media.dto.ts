import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export enum MediaKindEnum {
  PANORAMA_2_1 = "PANORAMA_2_1",
  PHOTO_2D = "PHOTO_2D",
  THUMBNAIL = "THUMBNAIL",
}

export enum ProcessingStatusEnum {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
}

export class CreatePresignDto {
  @IsEnum(MediaKindEnum, {
    message: "assetKind must be PANORAMA_2_1, PHOTO_2D, or THUMBNAIL",
  })
  assetKind!: MediaKindEnum;

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @Matches(/^image\/(jpeg|png|webp)$/, {
    message: "mimeType must be image/jpeg, image/png, or image/webp",
  })
  mimeType!: string;

  @IsInt()
  @IsPositive()
  @Max(52_428_800, {
    message: "fileSizeBytes must not exceed 50MB (52,428,800 bytes)",
  })
  fileSizeBytes!: number;

  @IsInt()
  @IsPositive()
  @Min(1)
  declaredWidth!: number;

  @IsInt()
  @IsPositive()
  @Min(1)
  declaredHeight!: number;

  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: "sha256 must be a 64-character hexadecimal string",
  })
  sha256!: string;
}

export class CompleteUploadDto {
  @IsUUID("4", { message: "token must be a valid UUID v4" })
  token!: string;

  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: "sha256Checksum must be a 64-character hexadecimal string",
  })
  sha256Checksum!: string;
}

export class MediaFilterDto {
  @IsOptional()
  @IsEnum(MediaKindEnum)
  assetKind?: MediaKindEnum;

  @IsOptional()
  @IsEnum(ProcessingStatusEnum)
  processingStatus?: ProcessingStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

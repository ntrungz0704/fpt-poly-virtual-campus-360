import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import type { LocationCategoryKey, LocationTypeCode } from "@fpt-campus/shared";

const LOCATION_TYPE_CODES: readonly LocationTypeCode[] = [
  "CLASSROOM",
  "LAB",
  "STUDIO",
  "HALLWAY",
  "ELEVATOR",
  "STAIRS",
  "RESTROOM",
  "LIBRARY",
  "LOBBY",
  "SPORTS",
  "RESTRICTED_AREA",
];

export class PublicLocationsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  buildingCode?: string;

  @IsOptional()
  @IsIn(["all", "lab", "studio", "common"])
  category?: LocationCategoryKey;

  @IsOptional()
  @IsIn(LOCATION_TYPE_CODES)
  typeCode?: LocationTypeCode;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class PublicTourNodeQueryDto {
  @IsOptional()
  @IsIn(["desktop", "mobile"])
  quality?: "desktop" | "mobile";
}

export class PublicEventsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  eventKey?: string;
}

export class QuizVerifyAnswerItemDto {
  @IsUUID()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(20)
  selectedIndex!: number;
}

export class QuizVerifyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuizVerifyAnswerItemDto)
  items!: QuizVerifyAnswerItemDto[];
}

import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
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

export class RegisterOpenDayDto {
  @IsUUID("4")
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^0[1-9][0-9]{8}$|^[+]?[0-9]{9,15}$/, {
    message: "Số điện thoại không hợp lệ (yêu cầu định dạng số điện thoại Việt Nam 10 chữ số)",
  })
  phone!: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  sessionIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

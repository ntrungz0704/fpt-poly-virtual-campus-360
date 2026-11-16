import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import type { QuizAttemptStatus } from "@fpt-campus/shared";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  major?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;
}

export class CreateLinkRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  studentIdentifier!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  relationship?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string | null;
}

export class RespondLinkDto {
  @IsNotEmpty()
  @IsIn(["APPROVE", "REJECT"])
  action!: "APPROVE" | "REJECT";
}

export class StudentQuizHistoryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @IsUUID("4")
  @IsOptional()
  quizConfigId?: string;

  @IsEnum(["IN_PROGRESS", "SUBMITTED", "EXPIRED"])
  @IsOptional()
  status?: QuizAttemptStatus;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  passed?: boolean;
}


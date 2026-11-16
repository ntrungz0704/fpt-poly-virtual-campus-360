import { Transform, Type } from "class-transformer";
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
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from "class-validator";
import type { QuizAttemptStatus } from "@fpt-campus/shared";

function hasControlChars(str: string): boolean {
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

@ValidatorConstraint({ name: "isSafeAvatarUrl", async: false })
export class IsSafeAvatarUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === null || value === undefined || value === "") {
      return true;
    }
    if (typeof value !== "string") {
      return false;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return true;
    }
    if (hasControlChars(trimmed) || trimmed.includes("\\")) {
      return false;
    }
    if (trimmed.startsWith("/")) {
      return !trimmed.startsWith("//");
    }
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return "avatarUrl chỉ chấp nhận đường dẫn http(s):// hoặc đường dẫn nội bộ bắt đầu bằng '/'.";
  }
}

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
  @Validate(IsSafeAvatarUrlConstraint)
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

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  passed?: boolean;
}


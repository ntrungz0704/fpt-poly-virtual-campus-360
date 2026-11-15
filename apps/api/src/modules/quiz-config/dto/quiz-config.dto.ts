import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type {
  AdminQuizAttemptListQueryDto,
  CreateQuizConfigInputDto,
  ManageQuizQuestionsInputDto,
  QuizAttemptStatus,
  QuizConfigFilterQuery,
  QuizConfigStatus,
  UpdateQuizConfigInputDto,
} from "@fpt-campus/shared";

export class CreateQuizConfigDto implements CreateQuizConfigInputDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID("4")
  @IsOptional()
  eventId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  @IsOptional()
  timeLimitMinutes?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxAttempts?: number;

  @IsBoolean()
  @IsOptional()
  isShuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  isShuffleOptions?: boolean;

  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayUnique()
  @IsOptional()
  questionIds?: string[];
}

export class UpdateQuizConfigDto implements UpdateQuizConfigInputDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID("4")
  @IsOptional()
  eventId?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  @IsOptional()
  timeLimitMinutes?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxAttempts?: number;

  @IsBoolean()
  @IsOptional()
  isShuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  isShuffleOptions?: boolean;
}

export class ManageQuizQuestionsDto implements ManageQuizQuestionsInputDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayUnique({ message: "Danh sách câu hỏi không được chứa ID trùng lặp." })
  @ArrayNotEmpty({ message: "Cần tối thiểu 1 câu hỏi để cập nhật danh sách." })
  questionIds!: string[];
}

export class QuizConfigQueryDto implements QuizConfigFilterQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(["DRAFT", "PUBLISHED", "ARCHIVED"])
  @IsOptional()
  status?: QuizConfigStatus;

  @IsUUID("4")
  @IsOptional()
  eventId?: string;
}

export class AdminQuizAttemptQueryDto implements AdminQuizAttemptListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsUUID("4")
  @IsOptional()
  quizConfigId?: string;

  @IsEnum(["IN_PROGRESS", "SUBMITTED", "EXPIRED"])
  @IsOptional()
  status?: QuizAttemptStatus;

  @IsString()
  @IsOptional()
  search?: string;
}


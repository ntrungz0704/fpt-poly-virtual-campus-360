import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type {
  QuestionDifficulty,
  QuestionReviewStatus,
} from "@fpt-campus/shared";

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  questionText!: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex!: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  topic?: string;

  @IsEnum(["EASY", "MEDIUM", "HARD"])
  @IsOptional()
  difficulty?: QuestionDifficulty;

  @IsEnum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"])
  @IsOptional()
  status?: QuestionReviewStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(2000)
  questionText?: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  options?: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  @IsOptional()
  correctIndex?: number;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  topic?: string;

  @IsEnum(["EASY", "MEDIUM", "HARD"])
  @IsOptional()
  difficulty?: QuestionDifficulty;

  @IsEnum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"])
  @IsOptional()
  status?: QuestionReviewStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateQuestionStatusDto {
  @IsEnum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"])
  status!: QuestionReviewStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

export class QuestionQueryDto {
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

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsEnum(["EASY", "MEDIUM", "HARD"])
  difficulty?: QuestionDifficulty;

  @IsOptional()
  @IsEnum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"])
  status?: QuestionReviewStatus;

  @IsOptional()
  @IsString()
  tag?: string;
}

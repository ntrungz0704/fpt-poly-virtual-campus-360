import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import type {
  QuestionDifficulty,
  QuestionImportPreviewRowDto,
  QuestionReviewStatus,
} from "@fpt-campus/shared";

export class QuestionImportRowItemDto implements Partial<QuestionImportPreviewRowDto> {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rowNumber?: number;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  correctIndex?: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  difficulty?: QuestionDifficulty;

  @IsOptional()
  @IsString()
  status?: QuestionReviewStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  validationStatus?: "VALID" | "INVALID" | "DUPLICATE";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  validationErrors?: string[];
}

export class QuestionImportConfirmDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionImportRowItemDto)
  rows!: QuestionImportRowItemDto[];
}

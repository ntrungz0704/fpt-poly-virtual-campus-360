import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import type {
  QuizAnswerSubmissionDto,
  SubmitQuizInputDto,
  SpinWheelInputDto,
} from "@fpt-campus/shared";

export class QuizAnswerItemDto implements QuizAnswerSubmissionDto {
  @IsUUID("4", { message: "questionId phải là UUID hợp lệ" })
  questionId!: string;

  @Type(() => Number)
  @IsInt({ message: "selectedIndex phải là số nguyên" })
  @Min(0, { message: "selectedIndex không được âm" })
  @Max(10, { message: "selectedIndex không hợp lệ" })
  selectedIndex!: number;
}

export class SubmitQuizDto implements SubmitQuizInputDto {
  @IsUUID("4", { message: "eventId phải là UUID hợp lệ" })
  eventId!: string;

  @IsString({ message: "attendeeName phải là chuỗi" })
  @IsNotEmpty({ message: "attendeeName không được để trống" })
  @MinLength(2, { message: "attendeeName phải có ít nhất 2 ký tự" })
  @MaxLength(160, { message: "attendeeName không được vượt quá 160 ký tự" })
  attendeeName!: string;

  @IsOptional()
  @IsString({ message: "ticketCode phải là chuỗi" })
  @MaxLength(64, { message: "ticketCode không được vượt quá 64 ký tự" })
  ticketCode?: string;

  @IsArray({ message: "items phải là một mảng câu trả lời" })
  @ArrayMinSize(1, { message: "Cần ít nhất một câu trả lời để nộp bài" })
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  items!: QuizAnswerItemDto[];
}

export class SpinWheelDto implements SpinWheelInputDto {
  @IsString({ message: "attendeeName phải là chuỗi" })
  @IsNotEmpty({ message: "attendeeName không được để trống" })
  @MinLength(2, { message: "attendeeName phải có ít nhất 2 ký tự" })
  @MaxLength(160, { message: "attendeeName không được vượt quá 160 ký tự" })
  attendeeName!: string;

  @IsOptional()
  @IsString({ message: "ticketCode phải là chuỗi" })
  @MaxLength(64, { message: "ticketCode không được vượt quá 64 ký tự" })
  ticketCode?: string;
}

export class GamificationProfileQueryDto {
  @IsOptional()
  @IsString()
  ticketCode?: string;

  @IsOptional()
  @IsString()
  attendeeName?: string;
}

export class LeaderboardQueryDto {
  @IsOptional()
  @IsString()
  ticketCode?: string;

  @IsOptional()
  @IsString()
  attendeeName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

import { Transform, Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : undefined))
  actor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : undefined))
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : undefined))
  resourceType?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

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

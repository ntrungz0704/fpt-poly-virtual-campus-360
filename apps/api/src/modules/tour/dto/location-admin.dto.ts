import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { Transform } from "class-transformer";

export class AdminUpsertLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(48)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  buildingCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  floor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sceneId?: string;

  @IsOptional()
  @IsIn(["published", "draft", "PUBLISHED", "DRAFT"])
  status?: string;
}

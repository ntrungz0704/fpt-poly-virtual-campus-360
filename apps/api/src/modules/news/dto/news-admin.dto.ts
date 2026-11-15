import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateNewsArticleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(240)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  tag?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  excerpt!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  @IsOptional()
  coverMediaId?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  relatedSceneId?: string;

  @IsEnum(["DRAFT", "PUBLISHED"])
  @IsOptional()
  status?: "DRAFT" | "PUBLISHED";
}

export class UpdateNewsArticleDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(240)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  tag?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID()
  @IsOptional()
  coverMediaId?: string | null;

  @IsString()
  @IsOptional()
  coverImageUrl?: string | null;

  @IsString()
  @IsOptional()
  relatedSceneId?: string | null;

  @IsEnum(["DRAFT", "PUBLISHED"])
  @IsOptional()
  status?: "DRAFT" | "PUBLISHED";
}

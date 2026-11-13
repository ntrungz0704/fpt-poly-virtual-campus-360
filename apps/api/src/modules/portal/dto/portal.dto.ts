import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

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

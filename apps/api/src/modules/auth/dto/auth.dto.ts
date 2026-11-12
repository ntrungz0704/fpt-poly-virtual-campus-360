import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  identifier!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(12, {
    message: "Mật khẩu mới phải có tối thiểu 12 ký tự.",
  })
  @MaxLength(128)
  newPassword!: string;
}

export class ActivateValidateDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  token!: string;
}

export class ActivateCompleteDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  token!: string;

  @IsString()
  @MinLength(12, {
    message: "Mật khẩu kích hoạt phải có tối thiểu 12 ký tự.",
  })
  @MaxLength(128)
  newPassword!: string;
}

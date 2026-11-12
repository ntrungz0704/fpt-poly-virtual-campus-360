import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type {
  AccountStatus,
  ActivationStatus,
  InvitationChannel,
  ProvisioningMethod,
  RoleCode,
  UserType,
} from "@fpt-campus/shared";

const USER_TYPES: readonly Exclude<UserType, "ADMIN">[] = [
  "STAFF",
  "STUDENT",
  "PARENT",
];
const ALL_USER_TYPES: readonly UserType[] = [
  "ADMIN",
  "STAFF",
  "STUDENT",
  "PARENT",
];
const ACCOUNT_STATUSES: readonly AccountStatus[] = [
  "ACTIVE",
  "LOCKED",
  "SUSPENDED",
  "ARCHIVED",
];
const ACTIVATION_STATUSES: readonly ActivationStatus[] = [
  "PENDING_ACTIVATION",
  "INVITATION_SENT",
  "ACTIVATED",
  "EXPIRED",
  "REVOKED",
];
const PROVISIONING_METHODS: readonly ProvisioningMethod[] = [
  "BOOTSTRAP",
  "ADMIN_DIRECT",
  "EMAIL_SMS_INVITATION",
];
const NON_BOOTSTRAP_METHODS: readonly Exclude<ProvisioningMethod, "BOOTSTRAP">[] =
  ["ADMIN_DIRECT", "EMAIL_SMS_INVITATION"];
const CHANNELS: readonly InvitationChannel[] = ["DIRECT_LINK", "EMAIL", "SMS"];
const ROLE_CODES: readonly RoleCode[] = [
  "SUPER_ADMIN",
  "TOUR_EDITOR",
  "EVENT_OPERATOR",
];

export class AdminUsersQueryDto {
  @IsOptional()
  @IsIn(ALL_USER_TYPES)
  userType?: UserType;

  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  accountStatus?: AccountStatus;

  @IsOptional()
  @IsIn(ACTIVATION_STATUSES)
  activationStatus?: ActivationStatus;

  @IsOptional()
  @IsIn(PROVISIONING_METHODS)
  provisioningMethod?: ProvisioningMethod;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : undefined))
  openDayEventKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : undefined))
  q?: string;

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

export class AdminCreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  fullName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: "username chỉ hỗ trợ chữ cái, số, dấu chấm, gạch dưới và gạch nối.",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  username?: string | null;

  @IsIn(USER_TYPES, {
    message: "userType phải là STAFF, STUDENT hoặc PARENT.",
  })
  userType!: Exclude<UserType, "ADMIN">;

  @IsIn(NON_BOOTSTRAP_METHODS)
  provisioningMethod!: Exclude<ProvisioningMethod, "BOOTSTRAP">;

  @IsIn(CHANNELS)
  channel!: InvitationChannel;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(ROLE_CODES, { each: true })
  roleCodes?: RoleCode[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  eventKeys?: string[];
}

export class AdminUpdateUserStatusDto {
  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  accountStatus?: AccountStatus;

  @IsOptional()
  @IsBoolean()
  resetActivation?: boolean;
}

export class AdminResendInvitationDto {
  @IsOptional()
  @IsIn(CHANNELS)
  channel?: InvitationChannel;
}

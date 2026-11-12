import type { ISO8601Timestamp, UUID } from "./common.js";
import type { EventParticipationSummaryDto } from "./events.js";

export type UserType = "ADMIN" | "STAFF" | "STUDENT" | "PARENT";

export type RoleCode = "SUPER_ADMIN" | "TOUR_EDITOR" | "EVENT_OPERATOR";

export type PermissionCode =
  | "campus:write"
  | "floorplan:write"
  | "location:write"
  | "media:upload"
  | "tour:write"
  | "tour:publish"
  | "users:manage"
  | "users:provision_openday"
  | "events:write"
  | "audit:read";

export type AccountStatus = "ACTIVE" | "LOCKED" | "SUSPENDED" | "ARCHIVED";

export type ActivationStatus =
  | "PENDING_ACTIVATION"
  | "INVITATION_SENT"
  | "ACTIVATED"
  | "EXPIRED"
  | "REVOKED";

export type ProvisioningMethod =
  | "BOOTSTRAP"
  | "ADMIN_DIRECT"
  | "EMAIL_SMS_INVITATION";

export type InvitationChannel = "DIRECT_LINK" | "EMAIL" | "SMS";

export type InvitationStatus =
  | "INVITATION_PENDING"
  | "SENT"
  | "EXPIRED"
  | "ACTIVATED"
  | "FAILED";

export interface AuthUserProfileDto {
  id: UUID;
  username: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  userType: UserType;
  accountStatus: AccountStatus;
  activationStatus: ActivationStatus;
  provisioningMethod: ProvisioningMethod;
  mustChangePassword: boolean;
  roles: RoleCode[];
  permissions: PermissionCode[];
  eventParticipations?: EventParticipationSummaryDto[];
}

export interface LoginRequest {
  /** Accepts Admin/Staff username, lowercase email, or normalized phone (OD-04). */
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUserProfileDto;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ActivateValidateRequest {
  token: string;
}

export interface ActivateValidateResponse {
  valid: boolean;
  fullName: string | null;
  channel: InvitationChannel | null;
  expiresAt: ISO8601Timestamp | null;
}

export interface ActivateCompleteRequest {
  token: string;
  newPassword: string;
}

export interface AdminCreateUserRequest {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  userType: Exclude<UserType, "ADMIN">;
  provisioningMethod: Exclude<ProvisioningMethod, "BOOTSTRAP">;
  channel: InvitationChannel;
  roleCodes?: RoleCode[];
  eventKeys?: string[];
}

export type ImportRowResolutionStatus = "VALID" | "DUPLICATE_UPDATE" | "INVALID";

export interface UserImportPreviewRowDto {
  rowNumber: number;
  fullName: string;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
  userType: "STUDENT" | "PARENT";
  status: ImportRowResolutionStatus;
  errorCode: string | null;
  note: string | null;
}

export interface UserImportPreviewResponse {
  totalRows: number;
  validCount: number;
  duplicateUpdateCount: number;
  invalidCount: number;
  rows: UserImportPreviewRowDto[];
}

export interface UserImportConfirmRequest {
  defaultUserType: "STUDENT" | "PARENT";
  provisioningMethod: Exclude<ProvisioningMethod, "BOOTSTRAP">;
  channel: InvitationChannel;
  eventKey: string;
  rows: Array<{
    rowNumber: number;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    userType?: "STUDENT" | "PARENT";
  }>;
}

export interface UserImportConfirmResultDto {
  batchId: UUID;
  totalRows: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  rowResults: Array<{
    rowNumber: number;
    outcome: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
    reasonCode: string | null;
  }>;
}

export interface AdminUserListItemDto {
  id: UUID;
  username: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  userType: UserType;
  accountStatus: AccountStatus;
  activationStatus: ActivationStatus;
  provisioningMethod: ProvisioningMethod;
  mustChangePassword: boolean;
  lastLoginAt: ISO8601Timestamp | null;
  createdAt: ISO8601Timestamp;
  roles: RoleCode[];
  eventParticipations: EventParticipationSummaryDto[];
}

export interface AdminInvitationSummaryDto {
  id: UUID;
  channel: InvitationChannel;
  status: InvitationStatus;
  expiresAt: ISO8601Timestamp;
  sentAt: ISO8601Timestamp | null;
  resendCount: number;
  /** Returned strictly ONCE when provisioningMethod === "ADMIN_DIRECT"; always null for EMAIL_SMS_INVITATION. */
  activationToken: string | null;
}

export interface AdminCreateUserResponse {
  user: AdminUserListItemDto;
  invitation: AdminInvitationSummaryDto;
}

export interface AdminUpdateUserStatusRequest {
  accountStatus?: AccountStatus;
  resetActivation?: boolean;
}

export interface AdminResendInvitationRequest {
  channel?: InvitationChannel;
}

export interface AuditLogEntryDto {
  id: UUID;
  actorUserId: UUID | null;
  actorUsername: string | null;
  action: string;
  resourceType: string | null;
  resourceId: UUID | null;
  diffJson: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: ISO8601Timestamp;
}

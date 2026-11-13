import type { ISO8601Timestamp, UUID } from "./common.js";
import type { AccountStatus, UserType } from "./auth.js";

// ============================================================================
// 1. Student Profile Contracts
// ============================================================================

export interface StudentProfileDto {
  id: UUID;
  fullName: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  studentCode: string | null;
  major: string | null;
  avatarUrl: string | null;
  bio: string | null;
  userType: UserType;
  accountStatus: AccountStatus;
  totalXp: number;
  ticketCount: number;
  approvedParentCount: number;
  createdAt: ISO8601Timestamp;
}

export interface UpdateStudentProfileRequest {
  phone?: string | null;
  major?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

// ============================================================================
// 2. Portal Tickets & Schedule Contracts
// ============================================================================

export interface PortalTicketSessionDto {
  id: UUID;
  title: string;
  timeRange: string;
  location: string;
}

export interface PortalTicketDto {
  id: UUID;
  ticketCode: string;
  eventId: UUID;
  eventTitle: string;
  eventDateLabel: string;
  eventTimeLabel: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  participationStatus: string;
  registeredAt: ISO8601Timestamp;
  checkedInAt: ISO8601Timestamp | null;
  qrPayload: string;
  sessions: PortalTicketSessionDto[];
}

export interface PortalScheduleItemDto {
  id: UUID;
  title: string;
  eventTitle: string;
  dateLabel: string;
  timeRangeLabel: string;
  customLocationLabel: string;
  hostUnit: string;
  period: string;
  description: string;
  isRegistered: boolean;
}

// ============================================================================
// 3. Portal Gamification & Progress Contracts
// ============================================================================

export interface PortalProgressLedgerItemDto {
  id: UUID;
  amountXp: number;
  source: string;
  createdAt: ISO8601Timestamp;
}

export interface PortalProgressSpinItemDto {
  id: UUID;
  rewardLabel: string;
  awardedXp: number;
  rewardType: string;
  createdAt: ISO8601Timestamp;
}

export interface PortalProgressDto {
  totalXp: number;
  level: number;
  rank: number | null;
  availableSpins: number;
  quizAttemptsCount: number;
  recentXpLedgers: PortalProgressLedgerItemDto[];
  recentSpins: PortalProgressSpinItemDto[];
}

// ============================================================================
// 4. Parent Portal & Linking Contracts
// ============================================================================

export type LinkStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ParentStudentSummaryDto {
  linkId: UUID;
  studentId: UUID;
  studentName: string;
  studentEmail: string | null;
  studentCode: string | null;
  major: string | null;
  status: LinkStatus;
  relationship: string | null;
  totalXp: number;
  ticketsCount: number;
  lastActive: ISO8601Timestamp | null;
}

export interface ParentStudentDetailDto {
  student: StudentProfileDto;
  linkStatus: LinkStatus;
  relationship: string | null;
  tickets: PortalTicketDto[];
  gamification: PortalProgressDto;
}

export interface CreateLinkRequest {
  studentIdentifier: string; // student email or studentCode
  relationship?: string | null;
  notes?: string | null;
}

export interface RespondLinkRequest {
  action: "APPROVE" | "REJECT";
}

export interface StudentLinkRequestItemDto {
  linkId: UUID;
  parentId: UUID;
  parentName: string;
  parentEmail: string | null;
  parentPhone: string | null;
  relationship: string | null;
  status: LinkStatus;
  createdAt: ISO8601Timestamp;
}

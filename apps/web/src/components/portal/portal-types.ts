export interface PortalParticipantPreview {
  accountCode: string;
  fullName: string;
  role: "admin" | "staff" | "student" | "parent";
  eventBatch: string;
  ticketCode: string;
  activationPending?: boolean;
  updatedAt?: string;
}

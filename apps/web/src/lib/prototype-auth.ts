export interface PrototypeParticipantSession {
  accountCode: string;
  fullName: string;
  role: "admin" | "participant" | "operator";
  eventBatch: string;
  ticketCode: string;
  mustChangePassword: boolean;
  updatedPasswordAt?: string;
}

const SESSION_KEY = "fpoly_vc_admin_session_v1";

const ADMIN_ACCOUNT_CONFIG = {
  username: "admin",
  password: "Fpoly@2026",
  session: {
    accountCode: "admin",
    fullName: "Quản trị viên Hệ thống",
    role: "admin",
    eventBatch: "Quản trị Virtual Campus · QTSC Q.12",
    ticketCode: "ADMIN-QTSC-01",
    mustChangePassword: false,
  } satisfies PrototypeParticipantSession,
};

export function authenticateAdminAccount(
  rawUsername: string,
  rawPassword: string
): PrototypeParticipantSession | null {
  const username = rawUsername.trim().toLowerCase();
  if (
    username === ADMIN_ACCOUNT_CONFIG.username &&
    rawPassword === ADMIN_ACCOUNT_CONFIG.password
  ) {
    return ADMIN_ACCOUNT_CONFIG.session;
  }
  return null;
}

export function readPrototypeSession(): PrototypeParticipantSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PrototypeParticipantSession;
  } catch {
    return null;
  }
}

export function writePrototypeSession(session: PrototypeParticipantSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota errors in restricted mode
  }
}

export function clearPrototypeSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

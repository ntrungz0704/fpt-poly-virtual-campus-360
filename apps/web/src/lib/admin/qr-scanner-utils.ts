import type { CheckInResultDto, CheckInStatusCode } from "@fpt-campus/shared";
import { ApiClientError } from "../auth/api-client";

export interface CheckInOutcomeView {
  kind: CheckInStatusCode | "FORBIDDEN" | "NETWORK_ERROR";
  ticketCode: string;
  message: string;
  attendeeName: string | null;
  eventTitle: string | null;
  checkedInAt: string | null;
  xpReward?: CheckInResultDto["xpReward"];
  receivedAt: string;
}

/**
 * Extract canonical ticketCode from raw QR payload, JSON, URL query string, or manual entry.
 */
export function extractTicketCodeFromQr(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  // 1. JSON payload e.g. {"ticketCode":"OD26-A1B2-C3D4"}
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const candidate = parsed.ticketCode ?? parsed.code ?? parsed.ticket;
      if (typeof candidate === "string" && candidate.trim()) {
        return extractTicketCodeFromQr(candidate);
      }
    } catch {
      // Fallback to string parsing
    }
  }

  // 2. URL payload e.g. https://.../tickets?ticketCode=OD26-... or /OD26-...
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const paramCode =
        url.searchParams.get("ticketCode") ?? url.searchParams.get("code");
      if (paramCode && paramCode.trim()) {
        return extractTicketCodeFromQr(paramCode);
      }
    } catch {
      // Keep raw string
    }
  }

  let normalized = trimmed.toUpperCase();
  if (normalized.startsWith("TICKET:")) {
    normalized = normalized.slice("TICKET:".length).trim();
  }
  return normalized;
}

/**
 * Prevent continuous duplicate submissions from live camera detection of the same QR frame.
 */
export function shouldAcceptScanDetection(
  code: string,
  lastScan: { code: string; atMs: number } | null,
  nowMs: number,
  cooldownMs = 3500,
): boolean {
  if (!code) {
    return false;
  }
  if (!lastScan) {
    return true;
  }
  if (lastScan.code !== code) {
    return true;
  }
  return nowMs - lastScan.atMs >= cooldownMs;
}

export function buildSuccessOutcome(res: CheckInResultDto): CheckInOutcomeView {
  return {
    kind: "CHECKED_IN_SUCCESS",
    ticketCode: res.ticket.ticketCode,
    message: res.message,
    attendeeName: res.ticket.attendeeName || null,
    eventTitle: res.ticket.eventTitle || null,
    checkedInAt: res.checkedInAt,
    xpReward: res.xpReward,
    receivedAt: new Date().toISOString(),
  };
}

export function classifyCheckInError(
  error: unknown,
  scannedCode: string,
): CheckInOutcomeView {
  const receivedAt = new Date().toISOString();

  if (error instanceof ApiClientError) {
    const firstDetail = (error.details?.[0] ?? {}) as Record<string, unknown>;
    const attendeeName =
      typeof firstDetail.attendeeName === "string"
        ? firstDetail.attendeeName
        : null;
    const eventTitle =
      typeof firstDetail.ticketEventTitle === "string"
        ? firstDetail.ticketEventTitle
        : typeof firstDetail.eventTitle === "string"
          ? firstDetail.eventTitle
          : null;
    const checkedInAt =
      typeof firstDetail.checkedInAt === "string"
        ? firstDetail.checkedInAt
        : null;

    let kind: CheckInOutcomeView["kind"] = "INVALID_TICKET";
    const errorCode = String(error.code);
    switch (errorCode) {
      case "ALREADY_CHECKED_IN":
        kind = "ALREADY_CHECKED_IN";
        break;
      case "INVALID_TICKET":
        kind = "INVALID_TICKET";
        break;
      case "CANCELLED_TICKET":
        kind = "CANCELLED_TICKET";
        break;
      case "EVENT_MISMATCH":
        kind = "EVENT_MISMATCH";
        break;
      case "INVALID_EVENT_STATUS":
        kind = "INVALID_EVENT_STATUS";
        break;
      case "INVALID_TICKET_STATUS":
        kind = "INVALID_TICKET_STATUS";
        break;
      case "FORBIDDEN":
      case "UNAUTHORIZED":
        kind = "FORBIDDEN";
        break;
      default:
        kind = "INVALID_TICKET";
        break;
    }

    return {
      kind,
      ticketCode: scannedCode,
      message: error.message,
      attendeeName,
      eventTitle,
      checkedInAt,
      receivedAt,
    };
  }

  return {
    kind: "NETWORK_ERROR",
    ticketCode: scannedCode,
    message:
      error instanceof Error && error.message
        ? error.message
        : "Không thể kết nối tới máy chủ để xác nhận check-in.",
    attendeeName: null,
    eventTitle: null,
    checkedInAt: null,
    receivedAt,
  };
}

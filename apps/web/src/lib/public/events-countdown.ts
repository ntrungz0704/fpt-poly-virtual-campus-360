export type CountdownStatus =
  | "UPCOMING"
  | "HAPPENING_OR_PAST"
  | "UNANNOUNCED";

export interface EventCountdownState {
  status: CountdownStatus;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
}

/**
 * Calculates countdown units from now until eventDate.
 * Enforces non-negative values and explicit unannounced state when date is absent.
 */
export function calculateEventCountdown(
  eventDate: string | null | undefined,
  nowMs: number = Date.now(),
): EventCountdownState {
  if (!eventDate || !eventDate.trim()) {
    return {
      status: "UNANNOUNCED",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Thời gian sự kiện chưa công bố",
    };
  }

  const parsed = new Date(eventDate);
  const targetMs = parsed.getTime();
  if (Number.isNaN(targetMs)) {
    return {
      status: "UNANNOUNCED",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Thời gian sự kiện chưa công bố",
    };
  }

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    return {
      status: "HAPPENING_OR_PAST",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Sự kiện đang diễn ra hoặc đã đến giờ đón khách",
    };
  }

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    status: "UPCOMING",
    days,
    hours,
    minutes,
    seconds,
    label: `Còn ${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`,
  };
}

/** Formats a countdown numeric unit to a 2-digit string. */
export function formatCountdownUnit(val: number): string {
  const safe = Math.max(0, Math.floor(val));
  return String(safe).padStart(2, "0");
}

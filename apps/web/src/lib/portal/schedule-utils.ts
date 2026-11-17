export type SchedulePeriodFilter =
  | "ALL"
  | "REGISTERED"
  | "MORNING"
  | "NOON"
  | "AFTERNOON";

export interface ScheduleFilterOption {
  id: SchedulePeriodFilter;
  label: string;
}

export interface SchedulePeriodMeta {
  label: string;
  variant: "brand" | "warning" | "neutral";
}

export const SCHEDULE_FILTER_OPTIONS: ReadonlyArray<ScheduleFilterOption> = [
  { id: "ALL", label: "Tất cả" },
  { id: "REGISTERED", label: "Đã đăng ký" },
  { id: "MORNING", label: "Buổi sáng" },
  { id: "NOON", label: "Buổi trưa" },
  { id: "AFTERNOON", label: "Buổi chiều" },
];

const PERIOD_META_MAP: Record<string, SchedulePeriodMeta> = {
  MORNING: { label: "Sáng", variant: "brand" },
  NOON: { label: "Trưa", variant: "warning" },
  AFTERNOON: { label: "Chiều", variant: "neutral" },
};

/** Normalizes a period enum code for consistent label mapping and filtering. */
export function normalizeSchedulePeriod(
  period: string | null | undefined,
): string {
  return (period ?? "").trim().toUpperCase();
}

/** Resolves human-readable Vietnamese badge label and tone for a schedule period. */
export function getSchedulePeriodMeta(
  period: string | null | undefined,
): SchedulePeriodMeta {
  const normalized = normalizeSchedulePeriod(period);
  if (normalized && PERIOD_META_MAP[normalized]) {
    return PERIOD_META_MAP[normalized];
  }
  const fallbackLabel = period?.trim();
  return {
    label: fallbackLabel || "Chưa rõ",
    variant: "neutral",
  };
}

/** Filters schedule sessions by ALL, REGISTERED, or MORNING / NOON / AFTERNOON. */
export function filterScheduleItems<
  T extends { period?: string | null; isRegistered?: boolean },
>(
  items: readonly T[] | null | undefined,
  filterPeriod: SchedulePeriodFilter | string,
): T[] {
  if (!items || items.length === 0) {
    return [];
  }
  if (filterPeriod === "ALL") {
    return [...items];
  }
  if (filterPeriod === "REGISTERED") {
    return items.filter((item) => Boolean(item.isRegistered));
  }
  const expected = normalizeSchedulePeriod(filterPeriod);
  return items.filter(
    (item) => normalizeSchedulePeriod(item.period) === expected,
  );
}

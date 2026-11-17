import type {
  AdminOverviewMetricsDto,
  AuditLogEntryDto,
  AuthUserProfileDto,
} from "@fpt-campus/shared";

export interface DashboardMetricCardItem {
  id: "tour" | "openday" | "locations" | "users";
  label: string;
  value: string;
  unit: string;
  note: string;
  href: string;
  icon: string;
  tone: "positive" | "neutral" | "muted";
}

export interface FormattedAuditActivityRow {
  id: string;
  title: string;
  actionCode: string;
  actorLabel: string;
  timestampLabel: string;
  badgeLabel: string;
  badgeVariant: "neutral" | "brand" | "success" | "warning";
}

export function hasAuditReadPermission(
  user: AuthUserProfileDto | null | undefined,
): boolean {
  return Boolean(user?.permissions.includes("audit:read"));
}

export function areAllOverviewMetricsZero(
  metrics: AdminOverviewMetricsDto,
): boolean {
  return (
    metrics.tourNodesTotal === 0 &&
    metrics.hotspotsTotal === 0 &&
    metrics.locationsTotal === 0 &&
    metrics.approvedPanoramasCount === 0 &&
    metrics.openDayEventsPublished === 0 &&
    metrics.eventRegistrationsActive === 0 &&
    metrics.activeUsersTotal === 0
  );
}

/**
 * Converts canonical PostgreSQL dashboard counts into UI cards.
 * Never fabricates fallback metrics; displays `0` for zero counts and `N/A` for undefined ratios.
 */
export function mapOverviewMetricsToCards(
  metrics: AdminOverviewMetricsDto,
): DashboardMetricCardItem[] {
  const hasTourNodes = metrics.tourNodesTotal > 0;
  const hasLocations = metrics.locationsTotal > 0;
  const hasUsers = metrics.activeUsersTotal > 0;

  return [
    {
      id: "tour",
      label: "Cảnh 360° & Hotspots",
      value: hasTourNodes
        ? `${metrics.tourNodesPublished} / ${metrics.tourNodesTotal}`
        : "0",
      unit: hasTourNodes
        ? `đã xuất bản · ${metrics.hotspotsTotal} hotspot`
        : "cảnh 360° trong CSDL",
      note: !hasTourNodes
        ? "N/A · Chưa có dữ liệu cảnh 360°"
        : metrics.tourNodesPublished > 0
          ? "Đang đồng bộ từ PostgreSQL (tour_nodes)"
          : "Các cảnh hiện đang ở chế độ Nháp (DRAFT)",
      href: "/admin/virtual-tour",
      icon: "view_in_ar",
      tone: !hasTourNodes
        ? "muted"
        : metrics.tourNodesPublished > 0
          ? "positive"
          : "neutral",
    },
    {
      id: "openday",
      label: "Đăng ký & Check-in Open Day",
      value: metrics.eventRegistrationsActive.toLocaleString("vi-VN"),
      unit: `lượt đăng ký · ${metrics.openDayEventsPublished} sự kiện công khai`,
      note:
        metrics.checkInRatePercent !== null
          ? `Đã check-in ${metrics.eventRegistrationsCheckedIn.toLocaleString("vi-VN")} lượt (${metrics.checkInRatePercent}%)`
          : "Tỷ lệ check-in: N/A (chưa có lượt đăng ký)",
      href: "/admin/events",
      icon: "confirmation_number",
      tone: metrics.eventRegistrationsActive > 0 ? "positive" : "muted",
    },
    {
      id: "locations",
      label: "Địa điểm GIS & Media 2:1",
      value: hasLocations
        ? `${metrics.locationsPublished} / ${metrics.locationsTotal}`
        : "0",
      unit: `${metrics.approvedPanoramasCount} ảnh 2:1 đã duyệt`,
      note: !hasLocations
        ? "N/A · Chưa có địa điểm trong CSDL"
        : metrics.approvedPanoramasCount > 0
          ? "Đồng bộ thực từ locations & media_assets"
          : "Chưa có panorama 2:1 đạt chuẩn duyệt",
      href: "/admin/locations",
      icon: "apartment",
      tone: !hasLocations
        ? "muted"
        : metrics.locationsPublished > 0
          ? "positive"
          : "neutral",
    },
    {
      id: "users",
      label: "Tài khoản Hệ thống",
      value: hasUsers
        ? `${metrics.activatedUsersTotal} / ${metrics.activeUsersTotal}`
        : "0",
      unit: "tài khoản đã kích hoạt",
      note:
        metrics.activationRatePercent !== null
          ? `Tỷ lệ kích hoạt: ${metrics.activationRatePercent}% (${metrics.activeUsersTotal} tài khoản ACTIVE)`
          : "Tỷ lệ kích hoạt: N/A",
      href: "/admin/users",
      icon: "manage_accounts",
      tone: !hasUsers
        ? "muted"
        : metrics.activatedUsersTotal > 0
          ? "positive"
          : "neutral",
    },
  ];
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Đăng nhập hệ thống thành công",
  LOGIN_FAILED: "Đăng nhập thất bại",
  SYSTEM_BOOTSTRAP_SEED: "Khởi tạo dữ liệu nền ban đầu",
  USER_LOGIN: "Đăng nhập tài khoản",
  USER_LOGOUT: "Đăng xuất phiên làm việc",
  USER_PASSWORD_CHANGE: "Đổi mật khẩu tài khoản",
  USER_CREATE: "Tạo tài khoản mới",
  USER_STATUS_UPDATE: "Cập nhật trạng thái tài khoản",
  USER_IMPORT_CONFIRM: "Import danh sách tài khoản hàng loạt",
  TOUR_NODE_CREATE: "Tạo cảnh tham quan 360°",
  TOUR_NODE_UPDATE: "Cập nhật thông số cảnh 360°",
  TOUR_NODE_DELETE: "Xóa mềm cảnh tham quan 360°",
  TOUR_STUDIO_BATCH_SAVE: "Lưu cấu hình cảnh & hotspot Tour Studio",
  TOUR_PUBLISH: "Xuất bản cảnh Tour 360°",
  TOUR_UNPUBLISH: "Chuyển cảnh Tour 360° về Nháp",
  HOTSPOT_SAVE: "Cập nhật hotspot trên cảnh 360°",
  HOTSPOT_DELETE: "Xóa hotspot trên cảnh 360°",
  LOCATION_CREATE: "Tạo địa điểm GIS mới",
  LOCATION_UPDATE: "Cập nhật thông tin địa điểm GIS",
  LOCATION_DELETE: "Xóa mềm địa điểm GIS",
  MEDIA_UPLOAD: "Tải lên tài nguyên Media",
  MEDIA_APPROVE: "Duyệt hiển thị tài nguyên Media",
  EVENT_CREATE: "Tạo sự kiện Open Day",
  EVENT_UPDATE: "Cập nhật sự kiện Open Day",
  EVENT_CHECKIN: "Check-in vé tham dự Open Day",
  NEWS_CREATE: "Tạo bài viết Tin tức",
  NEWS_UPDATE: "Cập nhật bài viết Tin tức",
  NEWS_PUBLISH: "Xuất bản bài viết Tin tức",
  NEWS_UNPUBLISH: "Gỡ xuất bản bài viết Tin tức",
};

const RESOURCE_BADGE_MAP: Record<
  string,
  { label: string; variant: "neutral" | "brand" | "success" | "warning" }
> = {
  TOURNODE: { label: "Tour 360°", variant: "brand" },
  TOURSTUDIO: { label: "Tour Studio", variant: "brand" },
  HOTSPOT: { label: "Hotspot", variant: "brand" },
  LOCATION: { label: "Địa điểm GIS", variant: "success" },
  MEDIAASSET: { label: "Media 2:1", variant: "neutral" },
  OPENDAYEVENT: { label: "Open Day", variant: "warning" },
  EVENTPARTICIPATION: { label: "Check-in QR", variant: "success" },
  USER: { label: "Tài khoản", variant: "neutral" },
  NEWSARTICLE: { label: "Tin tức", variant: "neutral" },
  SYSTEM: { label: "Hệ thống", variant: "neutral" },
};

export function formatAuditTimestampVi(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAuditLogActivityRow(
  entry: AuditLogEntryDto,
): FormattedAuditActivityRow {
  const actionTitle =
    AUDIT_ACTION_LABELS[entry.action] || `Thao tác ${entry.action}`;
  const resourceSuffix = entry.resourceId
    ? ` (#${entry.resourceId.slice(0, 8)})`
    : "";
  const normalizedResource = entry.resourceType?.trim().toUpperCase();
  const resourceMeta = normalizedResource
    ? RESOURCE_BADGE_MAP[normalizedResource] ?? {
        label: entry.resourceType!.trim(),
        variant: "neutral" as const,
      }
    : { label: "Hệ thống", variant: "neutral" as const };

  return {
    id: entry.id,
    title: `${actionTitle}${resourceSuffix}`,
    actionCode: entry.action,
    actorLabel:
      entry.actorUsername?.trim() ||
      (entry.actorUserId ? `User ${entry.actorUserId.slice(0, 8)}` : "Hệ thống"),
    timestampLabel: formatAuditTimestampVi(entry.createdAt),
    badgeLabel: resourceMeta.label,
    badgeVariant: resourceMeta.variant,
  };
}

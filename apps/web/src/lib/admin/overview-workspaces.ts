import type { AuthUserProfileDto } from "@fpt-campus/shared";
import { hasRequiredAdminPathPermission } from "../auth/auth-routing";

export interface AdminQuickWorkspaceItem {
  href: string;
  icon: string;
  title: string;
  desc: string;
}

export const ADMIN_QUICK_WORKSPACES: ReadonlyArray<AdminQuickWorkspaceItem> = [
  {
    href: "/admin/locations",
    icon: "location_on",
    title: "Địa điểm & Tọa độ GIS",
    desc: "Sửa mô tả phòng học, gắn scene 360° và cập nhật trạng thái hiển thị.",
  },
  {
    href: "/admin/virtual-tour",
    icon: "360",
    title: "Biên tập Tour 360°",
    desc: "Chọn cảnh, click đặt hotspot trực tiếp trên panorama và nối luồng di chuyển.",
  },
  {
    href: "/admin/events",
    icon: "event",
    title: "Sự kiện Open Day",
    desc: "Quản lý phiên sự kiện sáng/trưa/chiều, FAQ và Quiz định hướng.",
  },
  {
    href: "/admin/questions",
    icon: "help_outline",
    title: "Ngân hàng câu hỏi",
    desc: "Biên tập câu hỏi định hướng, phương án trả lời và đáp án trắc nghiệm.",
  },
  {
    href: "/admin/news",
    icon: "article",
    title: "Tin tức & Cẩm nang",
    desc: "Soạn bài viết campus, cẩm nang tân sinh viên và trạng thái xuất bản.",
  },
  {
    href: "/admin/media",
    icon: "perm_media",
    title: "Thư viện Media 2:1",
    desc: "Tải ảnh toàn cảnh, kiểm tra tỷ lệ equirectangular 2:1 và cảnh liên kết.",
  },
  {
    href: "/admin/users",
    icon: "group",
    title: "Tài khoản & Import",
    desc: "Cấp tài khoản, import bảng danh sách và gửi lời mời kích hoạt.",
  },
];

/** Filters dashboard quick workspace shortcuts through the canonical RBAC path policy. */
export function getVisibleAdminQuickWorkspaces(
  user: AuthUserProfileDto | null,
): AdminQuickWorkspaceItem[] {
  return ADMIN_QUICK_WORKSPACES.filter((ws) =>
    hasRequiredAdminPathPermission(user, ws.href),
  );
}

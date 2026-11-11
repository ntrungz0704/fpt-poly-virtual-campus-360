import React from "react";
import Link from "next/link";
import { INITIAL_ADMIN_USERS, OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { AdminDashboardMetrics, AdminRecentActivityLog } from "@/components/admin";
import { Badge } from "@/components/ui";

export const metadata = {
  title: "Điều hành Hệ thống | FPT Polytechnic Virtual Campus Admin",
};

const QUICK_WORKSPACES = [
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
    title: "Open Day (Preview)",
    desc: "Xem trước quản lý phiên sự kiện sáng/trưa/chiều và danh sách tham dự.",
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
    title: "Tài khoản & Import (Preview)",
    desc: "Xem trước quy trình cấp tài khoản, import bảng danh sách và gửi lời mời kích hoạt.",
  },
];

export default function AdminDashboardPage() {
  const lockedAccounts = INITIAL_ADMIN_USERS.filter(
    (u) => u.passwordStatus === "locked"
  );
  const firstLoginPending = INITIAL_ADMIN_USERS.filter(
    (u) => u.passwordStatus === "must_change"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="type-label text-primary">Khuôn viên QTSC Quận 12</p>
          <h1 className="type-h1 text-on-surface mt-1">
            Tổng quan Vận hành Virtual Campus
          </h1>
          <p className="type-body-sm text-secondary mt-1">
            Đợt sự kiện đang cấu hình:{" "}
            <strong className="text-on-surface">{OFFICIAL_CAMPUS_INFO.openDayDateLabel}</strong> (
            {OFFICIAL_CAMPUS_INFO.openDayTimeLabel})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/campus"
            className="ui-btn ui-btn-outline min-h-[40px] px-3.5 py-2 text-xs font-semibold"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              visibility
            </span>
            <span>Xem bản công khai</span>
          </Link>
          <Link
            href="/admin/virtual-tour"
            className="ui-btn ui-btn-primary min-h-[40px] px-3.5 py-2 text-xs font-bold"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              add_location_alt
            </span>
            <span>Biên tập Hotspot 360°</span>
          </Link>
        </div>
      </div>

      {/* Real Operational Counters */}
      <AdminDashboardMetrics />

      {/* Action Queue + Workspace Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 ui-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-h3 text-on-surface">Việc cần xử lý hôm nay</h2>
            <Badge variant="brand">{firstLoginPending.length + lockedAccounts.length} mục</Badge>
          </div>

          <div className="space-y-3">
            {firstLoginPending.length === 0 && lockedAccounts.length === 0 ? (
              <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface">
                    Giao diện Preview vận hành nội bộ (chưa kết nối Auth Backend)
                  </p>
                  <p className="text-xs text-secondary">
                    Chưa phát sinh tài khoản chờ kích hoạt hoặc tài khoản tạm khóa trong danh sách Preview.
                  </p>
                </div>
                <Link
                  href="/admin/users"
                  className="text-xs font-bold text-primary hover:underline shrink-0 min-h-[36px] inline-flex items-center"
                >
                  Tài khoản
                </Link>
              </div>
            ) : (
              <>
                {firstLoginPending.length > 0 && (
                  <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-on-surface">
                        {firstLoginPending.length} tài khoản đang ở trạng thái chờ kích hoạt
                      </p>
                      <p className="text-xs text-secondary">
                        Kiểm tra danh sách và chuẩn bị gửi lại lời mời kích hoạt trước giờ khai mạc.
                      </p>
                    </div>
                    <Link
                      href="/admin/users"
                      className="text-xs font-bold text-primary hover:underline shrink-0 min-h-[36px] inline-flex items-center"
                    >
                      Mở danh sách
                    </Link>
                  </div>
                )}

                {lockedAccounts.length > 0 && (
                  <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-on-surface">
                        {lockedAccounts.length} tài khoản đang ở trạng thái tạm khóa
                      </p>
                      <p className="text-xs text-secondary">
                        Rà soát trạng thái kích hoạt và xử lý yêu cầu mở khóa tài khoản (Preview).
                      </p>
                    </div>
                    <Link
                      href="/admin/users"
                      className="text-xs font-bold text-primary hover:underline shrink-0 min-h-[36px] inline-flex items-center"
                    >
                      Kiểm tra
                    </Link>
                  </div>
                )}
              </>
            )}

            <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-on-surface">
                  Kiểm tra tỷ lệ 2:1 toàn bộ ảnh 360°
                </p>
                <p className="text-xs text-secondary">
                  5/5 ảnh panorama hiện đạt chuẩn equirectangular 2048×1024 nội bộ.
                </p>
              </div>
              <Link
                href="/admin/media"
                className="text-xs font-bold text-primary hover:underline shrink-0 min-h-[36px] inline-flex items-center"
              >
                Kho Media
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_WORKSPACES.map((ws) => (
            <Link
              key={ws.href}
              href={ws.href}
              className="ui-card ui-card-hover p-5 flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                  {ws.icon}
                </span>
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-on-surface">{ws.title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{ws.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <AdminRecentActivityLog />
    </div>
  );
}

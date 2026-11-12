"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminDashboardMetrics, AdminRecentActivityLog } from "@/components/admin";
import { Badge } from "@/components/ui";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import {
  getPrimaryRoleLabel,
  hasRequiredAdminPathPermission,
} from "@/lib/auth/auth-routing";

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
    title: "Sự kiện Open Day",
    desc: "Quản lý phiên sự kiện sáng/trưa/chiều, FAQ và Quiz định hướng.",
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

export function AdminOverviewContent() {
  const { user } = useAuth();
  const visibleWorkspaces = QUICK_WORKSPACES.filter((ws) =>
    hasRequiredAdminPathPermission(user, ws.href),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="admin-overview">
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
            href="/portal"
            className="ui-btn ui-btn-primary min-h-[40px] px-3.5 py-2 text-xs font-bold"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              account_circle
            </span>
            <span>Cổng Thành viên</span>
          </Link>
        </div>
      </div>

      {/* Operational Counters */}
      <AdminDashboardMetrics />

      {/* Authenticated Operator Session Summary + Workspace Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 ui-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-h3 text-on-surface">Phiên quản trị hiện tại</h2>
            <Badge variant="brand">
              {user ? `${user.permissions.length} quyền` : "Đã xác thực"}
            </Badge>
          </div>

          {user && (
            <div className="space-y-3">
              <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3.5 space-y-1.5">
                <p className="text-xs font-bold text-on-surface">
                  {user.fullName} ({user.username || user.email || user.id})
                </p>
                <p className="text-xs text-secondary">
                  Vai trò: <strong className="text-on-surface">{getPrimaryRoleLabel(user)}</strong>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="neutral">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-surface-container bg-surface-container-low/50 p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-on-surface">
                    Bảo mật tài khoản quản trị
                  </p>
                  <p className="text-xs text-secondary">
                    Có thể cập nhật mật khẩu định kỳ và thu hồi phiên đăng nhập ở các thiết bị khác.
                  </p>
                </div>
                <Link
                  href="/change-password"
                  className="text-xs font-bold text-primary hover:underline shrink-0 min-h-[36px] inline-flex items-center"
                >
                  Đổi mật khẩu
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleWorkspaces.map((ws) => (
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

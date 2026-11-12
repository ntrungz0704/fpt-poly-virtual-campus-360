"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge, Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import {
  canAccessAdmin,
  getPrimaryRoleLabel,
  getUserTypeLabel,
} from "@/lib/auth/auth-routing";

export default function ParticipantPortalPage() {
  const { user, refreshUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function syncMe() {
      const me = await refreshUser();
      if (!active) return;
      if (!me) {
        setSyncError("Không thể đồng bộ thông tin tài khoản từ máy chủ.");
      } else {
        setSyncError(null);
      }
    }
    void syncMe();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  if (syncing && !user) {
    return <LoadingState label="Đang tải hồ sơ tài khoản..." className="max-w-3xl mx-auto" />;
  }

  if (!user) {
    return (
      <ErrorState
        title="Không thể tải thông tin tài khoản"
        description={syncError ?? "Phiên đăng nhập không khả dụng."}
        actionLabel="Thử lại"
        onAction={() => {
          setSyncing(true);
          void refreshUser().finally(() => setSyncing(false));
        }}
        className="max-w-xl mx-auto"
      />
    );
  }

  const participations = user.eventParticipations ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="portal-dashboard">
      <section className="ui-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">{getUserTypeLabel(user.userType)}</Badge>
              <Badge variant="success">
                {user.accountStatus === "ACTIVE" ? "Đang hoạt động" : user.accountStatus}
              </Badge>
              {user.roles.map((role) => (
                <Badge key={role} variant="neutral">
                  {role}
                </Badge>
              ))}
            </div>
            <h1 className="type-h1 text-on-surface" data-testid="portal-user-fullname">
              Xin chào, {user.fullName}
            </h1>
            <p className="type-body-sm text-secondary">
              Cổng thông tin tài khoản xác thực thực tế tại khuôn viên{" "}
              <strong className="text-on-surface">{OFFICIAL_CAMPUS_INFO.campusLabel}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canAccessAdmin(user) && (
              <Link
                href="/admin"
                className="ui-btn ui-btn-primary min-h-[42px] px-4 py-2 text-xs"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  admin_panel_settings
                </span>
                <span>Mở Quản trị</span>
              </Link>
            )}
            <Link
              href="/change-password"
              className="ui-btn ui-btn-outline min-h-[42px] px-4 py-2 text-xs"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                lock_reset
              </span>
              <span>Đổi mật khẩu</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              icon="refresh"
              loading={syncing}
              onClick={() => {
                setSyncing(true);
                void refreshUser().finally(() => setSyncing(false));
              }}
            >
              Đồng bộ /me
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-surface-container-low text-xs">
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Vai trò chính</p>
            <p className="font-bold text-on-surface">{getPrimaryRoleLabel(user)}</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Tài khoản đăng nhập</p>
            <p className="font-mono font-bold text-on-surface truncate">
              {user.username || user.email || user.phone || user.id}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Email / Số điện thoại</p>
            <p className="font-semibold text-on-surface truncate">
              {user.email || user.phone || "Chưa gắn liên hệ"}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3.5 space-y-1">
            <p className="text-secondary font-medium">Trạng thái kích hoạt</p>
            <p className="font-bold text-on-surface">{user.activationStatus}</p>
          </div>
        </div>
      </section>

      <section className="ui-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="type-h3 text-on-surface">Sự kiện Open Day của bạn</h2>
            <p className="type-body-sm text-secondary mt-0.5">
              Dữ liệu tham dự đồng bộ trực tiếp từ API <code className="font-mono text-xs">/auth/me</code>.
            </p>
          </div>
          <Badge variant="brand">{participations.length} sự kiện</Badge>
        </div>

        {participations.length === 0 ? (
          <EmptyState
            icon="event_available"
            title="Chưa có đăng ký sự kiện gắn với tài khoản này"
            description="Bạn có thể xem lịch trình Open Day công khai hoặc trải nghiệm khuôn viên QTSC 360° bất kỳ lúc nào."
            actionLabel="Xem lịch Open Day"
            actionHref="/events"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participations.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-surface-container bg-surface-container-low/50 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-semibold text-primary">
                    {item.eventKey}
                  </span>
                  <Badge variant="brand">{item.participationStatus}</Badge>
                </div>
                <h3 className="text-sm font-bold text-on-surface">{item.eventTitle}</h3>
                <p className="text-xs text-secondary">
                  Ngày diễn ra: {item.eventDate ?? "Theo thông báo Open Day"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/campus"
          className="ui-card ui-card-hover p-5 flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              360
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-on-surface">Tham quan 360°</h3>
            <p className="text-xs text-secondary">Khám phá không gian học tập thực tế ảo QTSC.</p>
          </div>
        </Link>
        <Link
          href="/map"
          className="ui-card ui-card-hover p-5 flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              map
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-on-surface">Bản đồ GIS</h3>
            <p className="text-xs text-secondary">Tra cứu tòa nhà, phòng Lab và lộ trình di chuyển.</p>
          </div>
        </Link>
        <Link
          href="/events"
          className="ui-card ui-card-hover p-5 flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              event
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-on-surface">Lịch Open Day</h3>
            <p className="text-xs text-secondary">Xem toàn bộ khung giờ hoạt động công khai.</p>
          </div>
        </Link>
      </section>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface StateFeedbackProps {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}

export function LoadingState({
  label = "Đang tải dữ liệu...",
  variant = "spinner",
  rows = 3,
  className,
}: {
  label?: string;
  variant?: "spinner" | "skeleton";
  rows?: number;
  className?: string;
}) {
  if (variant === "skeleton") {
    return (
      <div
        role="status"
        aria-label={label}
        className={cn("ui-card p-5 space-y-3 animate-pulse", className)}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 rounded bg-surface-container",
              i === 0 ? "w-2/3" : i === rows - 1 ? "w-1/2" : "w-full"
            )}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div role="status" className={cn("ui-state-box ui-state-loading flex flex-col items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="w-7 h-7 border-[3px] border-primary-container border-t-transparent rounded-full animate-spin"
      />
      <p className="text-sm font-semibold text-on-surface">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon = "inbox",
  actionLabel,
  onAction,
  actionHref,
  className,
}: StateFeedbackProps) {
  return (
    <div className={cn("ui-state-box ui-state-empty flex flex-col items-center gap-2.5", className)}>
      <div className="w-11 h-11 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-center text-secondary">
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
          {icon}
        </span>
      </div>
      <h3 className="type-h3 text-on-surface mt-0.5">{title}</h3>
      {description && (
        <p className="type-body-sm text-secondary max-w-md">{description}</p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-2">
          {actionHref ? (
            <Link href={actionHref} className="ui-btn ui-btn-outline min-h-[40px] px-4 py-2 text-xs">
              {actionLabel}
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Không thể tải nội dung",
  description,
  icon = "error_outline",
  actionLabel = "Thử lại",
  onAction,
  actionHref,
  className,
}: StateFeedbackProps) {
  return (
    <div role="alert" className={cn("ui-state-box ui-state-error flex flex-col items-center gap-2.5", className)}>
      <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center text-error">
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
          {icon}
        </span>
      </div>
      <h3 className="type-h3">{title}</h3>
      {description && (
        <p className="type-body-sm opacity-90 max-w-md">{description}</p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-2">
          {actionHref ? (
            <Link href={actionHref} className="ui-btn ui-btn-danger min-h-[40px] px-4 py-2 text-xs">
              {actionLabel}
            </Link>
          ) : (
            <Button variant="danger" size="sm" onClick={onAction} icon="refresh">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function NotFoundState({
  title = "Không tìm thấy nội dung yêu cầu",
  description = "Đường dẫn không tồn tại hoặc dữ liệu này chưa được xuất bản trong khuôn viên QTSC Quận 12.",
  icon = "travel_explore",
  actionLabel = "Quay lại danh mục",
  actionHref = "/locations",
  secondaryLabel = "Về Trang chủ",
  secondaryHref = "/",
  className,
}: Partial<StateFeedbackProps>) {
  return (
    <div className={cn("ui-state-box bg-surface-container-lowest flex flex-col items-center gap-3 py-10 px-5", className)}>
      <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
        <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
          {icon}
        </span>
      </div>
      <h2 className="type-h2 text-on-surface">{title}</h2>
      <p className="type-body-sm text-secondary max-w-md">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <Link href={actionHref} className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2.5 text-sm">
          {actionLabel}
        </Link>
        {secondaryLabel && secondaryHref && (
          <Link href={secondaryHref} className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2.5 text-sm">
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function AuthGateState({
  title = "Khu vực tài khoản đang chờ triển khai",
  description = "Chức năng tài khoản và xác thực sẽ được tích hợp ở giai đoạn Backend tiếp theo. Khách tham quan có thể trải nghiệm Tham quan 360° và xem lịch Open Day công khai tự do không cần đăng nhập.",
  actionLabel = "Tham quan 360° tự do",
  actionHref = "/campus",
  secondaryLabel = "Xem lịch Open Day công khai",
  secondaryHref = "/events",
  className,
}: Partial<StateFeedbackProps>) {
  return (
    <div className={cn("ui-card p-6 sm:p-8 max-w-xl mx-auto text-center flex flex-col items-center gap-3", className)}>
      <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
        <span aria-hidden="true" className="material-symbols-outlined text-[24px]">
          lock_person
        </span>
      </div>
      <h1 className="type-h2 text-on-surface">{title}</h1>
      <p className="type-body-sm text-secondary max-w-md leading-relaxed">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2 w-full sm:w-auto">
        <Link href={actionHref} className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2.5 text-sm w-full sm:w-auto">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            login
          </span>
          <span>{actionLabel}</span>
        </Link>
        {secondaryLabel && secondaryHref && (
          <Link href={secondaryHref} className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2.5 text-sm w-full sm:w-auto">
            <span>{secondaryLabel}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

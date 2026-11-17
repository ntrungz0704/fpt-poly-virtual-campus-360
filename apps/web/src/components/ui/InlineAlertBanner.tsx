"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InlineAlertBannerProps {
  variant?: "error" | "success";
  message: string;
  onDismiss?: () => void;
  dismissLabel?: string;
  testId?: string;
  className?: string;
}

const BANNER_TONE_STYLES = {
  error: {
    container:
      "border-error bg-error-container text-on-error-container",
    iconColor: "text-error",
    iconName: "error",
    role: "alert" as const,
    ariaLive: "assertive" as const,
    defaultDismissLabel: "Đóng thông báo lỗi",
  },
  success: {
    container:
      "border-emerald-300 bg-emerald-50 text-emerald-950",
    iconColor: "text-emerald-600",
    iconName: "check_circle",
    role: "status" as const,
    ariaLive: "polite" as const,
    defaultDismissLabel: "Đóng thông báo",
  },
};

/** Accessible inline status/error banner with optional keyboard-friendly dismiss button. */
export function InlineAlertBanner({
  variant = "error",
  message,
  onDismiss,
  dismissLabel,
  testId,
  className,
}: InlineAlertBannerProps) {
  if (!message) {
    return null;
  }

  const tone = BANNER_TONE_STYLES[variant];
  const resolvedDismissLabel = dismissLabel ?? tone.defaultDismissLabel;

  return (
    <div
      role={tone.role}
      aria-live={tone.ariaLive}
      data-testid={testId}
      className={cn(
        "rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-start gap-2.5",
        tone.container,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "material-symbols-outlined text-[18px] shrink-0 mt-0.5",
          tone.iconColor,
        )}
      >
        {tone.iconName}
      </span>
      <span className="flex-1 leading-relaxed font-medium">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={resolvedDismissLabel}
          className="inline-flex items-center justify-center w-8 h-8 -my-1 -mr-1.5 rounded-lg hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shrink-0 cursor-pointer transition-colors"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
            close
          </span>
        </button>
      )}
    </div>
  );
}

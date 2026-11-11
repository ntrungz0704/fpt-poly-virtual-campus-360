"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface StatusToastProps {
  open: boolean;
  type?: ToastType;
  message: string;
  onClose: () => void;
  durationMs?: number;
}

const STYLES: Record<ToastType, { box: string; icon: string }> = {
  success: {
    box: "bg-success-container border-success text-on-success-container",
    icon: "check_circle",
  },
  error: {
    box: "bg-error-container border-error text-on-error-container",
    icon: "error",
  },
  warning: {
    box: "bg-warning-container border-warning text-on-warning-container",
    icon: "warning",
  },
  info: {
    box: "bg-surface-container-lowest border-surface-variant text-on-surface",
    icon: "info",
  },
};

export function StatusToast({
  open,
  type = "info",
  message,
  onClose,
  durationMs = 3600,
}: StatusToastProps) {
  useEffect(() => {
    if (!open || durationMs <= 0) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open || !message) return null;

  const tone = STYLES[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-[60] animate-fadeIn pointer-events-none flex justify-end"
    >
      <div
        className={cn(
          "pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elevation-2",
          tone.box
        )}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] shrink-0">
          {tone.icon}
        </span>
        <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="w-8 h-8 -mr-1 rounded-lg hover:bg-black/5 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
            close
          </span>
        </button>
      </div>
    </div>
  );
}

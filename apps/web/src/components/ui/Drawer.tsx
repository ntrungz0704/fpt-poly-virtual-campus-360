"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  responsiveBottomOnMobile?: boolean;
  nonBlocking?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  description,
  side = "right",
  responsiveBottomOnMobile = false,
  nonBlocking = false,
  children,
  footer,
  className,
}: DrawerProps) {
  const headerCaption = subtitle ?? description;
  useEffect(() => {
    if (!open || nonBlocking) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, nonBlocking]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sideClass = responsiveBottomOnMobile
    ? `inset-x-0 bottom-0 max-h-[46vh] rounded-t-2xl w-full ${
        nonBlocking ? "md:top-16 md:h-[calc(100%-4rem)]" : "md:inset-y-0 md:h-full"
      } md:bottom-auto md:max-h-none md:rounded-none md:w-full md:max-w-[380px] ` +
      (side === "left" ? "md:left-0 md:right-auto" : "md:right-0 md:left-auto")
    : side === "bottom"
    ? "inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl w-full"
    : side === "left"
    ? "inset-y-0 left-0 w-full max-w-[380px] h-full"
    : "inset-y-0 right-0 w-full max-w-[380px] h-full";

  const panel = (
    <div
      role="dialog"
      aria-modal={!nonBlocking}
      aria-label={title}
      className={cn(
        "fixed z-50 bg-surface-container-lowest border border-surface-container shadow-elevation-3 flex flex-col overflow-hidden",
        sideClass,
        className
      )}
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-surface-container flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          {headerCaption && (
            <span className="type-caption uppercase text-primary block mb-0.5 truncate">
              {headerCaption}
            </span>
          )}
          <h2 className="type-h3 text-on-surface leading-snug truncate">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng thông tin"
          className="w-11 h-11 -mr-2 -my-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center shrink-0 cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
            close
          </span>
        </button>
      </div>

      <div className="p-4 sm:p-5 overflow-y-auto flex-1 scrollbar-thin">{children}</div>

      {footer && (
        <div className="px-4 sm:px-5 py-3 bg-surface-container-low border-t border-surface-container flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );

  if (nonBlocking) {
    return panel;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-on-surface/55 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {panel}
    </div>
  );
}

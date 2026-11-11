"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      prevFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-backdrop animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "ui-modal-panel flex flex-col max-h-[90vh] focus:outline-none",
          SIZE_CLASSES[size]
        )}
      >
        <div className="px-5 py-4 border-b border-surface-container flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="type-h3 text-on-surface leading-snug">{title}</h2>
            {description && (
              <p className="type-body-sm text-secondary mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="w-11 h-11 -mr-2 -my-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              close
            </span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 bg-surface-container-low border-t border-surface-container flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

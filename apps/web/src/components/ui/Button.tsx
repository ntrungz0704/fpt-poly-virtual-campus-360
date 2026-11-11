"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconRight?: string;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "ui-btn-primary",
  secondary: "ui-btn-secondary",
  outline: "ui-btn-outline",
  ghost: "ui-btn-ghost",
  danger: "ui-btn-danger",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 py-1.5 text-xs",
  md: "min-h-[44px] px-4 py-2.5 text-sm",
  lg: "min-h-[48px] px-6 py-3 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "ui-btn",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
          />
        ) : (
          icon && (
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] shrink-0">
              {icon}
            </span>
          )
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && (
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] shrink-0">
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

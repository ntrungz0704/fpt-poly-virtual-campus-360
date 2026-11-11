import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "brand"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-surface-container-low text-secondary border border-surface-container",
  primary: "ui-badge-primary",
  brand: "ui-badge-primary",
  secondary: "bg-surface-container text-on-surface",
  success: "ui-badge-success",
  warning: "ui-badge-warning",
  error: "ui-badge-error",
  info: "ui-badge-info",
};

export function Badge({
  variant = "neutral",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn("ui-badge", VARIANT_CLASSES[variant], className)} {...props}>
      {icon && (
        <span aria-hidden="true" className="material-symbols-outlined text-[14px] shrink-0">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

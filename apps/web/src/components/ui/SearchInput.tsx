"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  onClear?: () => void;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ label, value, onClear, containerClassName, className, id, placeholder = "Tìm kiếm...", ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={fieldId} className="type-label text-on-surface">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[19px] text-secondary absolute left-3 pointer-events-none"
          >
            search
          </span>
          <input
            ref={ref}
            id={fieldId}
            type="search"
            value={value}
            placeholder={placeholder}
            className={cn("ui-input pl-10 pr-10", className)}
            {...props}
          />
          {hasValue && onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="w-10 h-10 right-0.5 absolute rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

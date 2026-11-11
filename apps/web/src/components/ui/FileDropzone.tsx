"use client";

import React, { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  label?: string;
  accept?: string;
  helperText?: string;
  error?: string;
  onFilesSelected: (files: FileList | File[]) => void;
  multiple?: boolean;
  className?: string;
}

export function FileDropzone({
  label,
  accept,
  helperText,
  error,
  onFilesSelected,
  multiple = false,
  className,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="type-label text-on-surface">
          {label}
        </label>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-5 sm:p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[132px]",
          dragging
            ? "border-primary-container bg-primary-fixed/30"
            : error
            ? "border-error bg-error-container/30"
            : "border-surface-variant bg-surface-container-low/60 hover:border-primary-container hover:bg-surface-container-low"
        )}
      >
        <div className="w-11 h-11 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center justify-center text-primary">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
            upload_file
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="type-label text-on-surface">
            Kéo thả tệp vào đây hoặc <span className="text-primary underline">chọn từ máy</span>
          </p>
          {helperText && <p className="type-body-sm text-secondary">{helperText}</p>}
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFilesSelected(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}

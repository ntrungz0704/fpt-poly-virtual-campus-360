"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface BaseFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, required, containerClassName, className, id, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    const messageId = error || helperText ? `${fieldId}-desc` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={fieldId}
            className="font-label-md text-label-md text-on-surface flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={messageId}
          className={cn("ui-input", error && "ui-input-error", className)}
          {...props}
        />
        {error ? (
          <p id={messageId} className="text-xs font-medium text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="text-xs text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, required, containerClassName, className, id, children, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    const messageId = error || helperText ? `${fieldId}-desc` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={fieldId}
            className="font-label-md text-label-md text-on-surface flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={messageId}
          className={cn("ui-select", error && "ui-input-error", className)}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p id={messageId} className="text-xs font-medium text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="text-xs text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, required, containerClassName, className, id, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    const messageId = error || helperText ? `${fieldId}-desc` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={fieldId}
            className="font-label-md text-label-md text-on-surface flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={messageId}
          className={cn("ui-textarea min-h-[104px]", error && "ui-input-error", className)}
          {...props}
        />
        {error ? (
          <p id={messageId} className="text-xs font-medium text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="text-xs text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Badge, Button, LoadingState } from "@/components/ui";
import { authApi, formatAuthErrorMessage } from "@/lib/auth/api-client";
import {
  getPrimaryRoleLabel,
  resolvePostAuthRoute,
  sanitizeInternalNextPath,
  validateNewPasswordClient,
  type PasswordValidationErrors,
} from "@/lib/auth/auth-routing";

function PasswordInputField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  autoComplete,
  disabled,
  show,
  onToggleShow,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  autoComplete: string;
  disabled?: boolean;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}) {
  const messageId = error || helperText ? `${id}-desc` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-label-md text-label-md text-on-surface flex items-center gap-1"
      >
        <span>{label}</span>
        <span className="text-error" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={messageId}
          onChange={(e) => onChange(e.target.value)}
          className={`ui-input pr-12 ${error ? "ui-input-error" : ""}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[19px]">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
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

function ChangePasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PasswordValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const safeNext = sanitizeInternalNextPath(searchParams.get("next"));

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto">
        <LoadingState label="Đang tải thông tin tài khoản..." />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validation = validateNewPasswordClient(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    setFieldErrors(validation.fieldErrors);
    setServerError(null);
    if (!validation.valid) {
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      const updatedUser = await refreshUser();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Đổi mật khẩu thành công. Đang chuyển hướng vào hệ thống...");

      if (updatedUser) {
        router.replace(resolvePostAuthRoute(updatedUser, safeNext));
      } else {
        router.replace("/login");
      }
    } catch (error) {
      setServerError(
        formatAuthErrorMessage(
          error,
          "Không thể cập nhật mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4 flex items-center justify-between gap-4">
        {user.mustChangePassword ? (
          <Badge variant="warning">Bắt buộc đổi mật khẩu lần đầu</Badge>
        ) : (
          <Link
            href={resolvePostAuthRoute(user, safeNext)}
            className="inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              arrow_back
            </span>
            <span>Quay lại không gian làm việc</span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="sm"
          icon="logout"
          onClick={() => {
            void logout().then(() => router.replace("/login"));
          }}
        >
          Đăng xuất
        </Button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-9 border border-surface-container shadow-elevation-2 relative overflow-hidden space-y-6">
        {/* Top Brand Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary" />

        {/* Brand Header with Preserved Logo */}
        <div className="text-center pt-2">
          <img
            src="/images/fpt-logo-official.png"
            alt="FPT Polytechnic"
            className="h-8 w-auto mx-auto object-contain mb-3"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <Badge variant="brand">{getPrimaryRoleLabel(user)}</Badge>
            <span className="text-xs font-mono text-secondary">
              {user.username || user.email || user.phone}
            </span>
          </div>
          <h1 className="type-h2 text-on-surface">
            {user.mustChangePassword
              ? "Đổi Mật Khẩu Khởi Tạo Bắt Buộc"
              : "Cập Nhật Mật Khẩu Mới"}
          </h1>
          <p className="type-body-sm text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
            {user.mustChangePassword
              ? `Xin chào ${user.fullName}. Để đảm bảo an toàn, bạn cần thiết lập mật khẩu mới trước khi truy cập hệ thống.`
              : `Cập nhật mật khẩu cho tài khoản ${user.fullName}.`}
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            data-testid="change-password-error"
            className="rounded-xl border border-error/40 bg-error-container px-4 py-3 text-xs sm:text-sm text-on-error-container flex items-start gap-2.5"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-error mt-0.5 shrink-0"
            >
              error
            </span>
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            data-testid="change-password-success"
            className="rounded-xl border border-success/40 bg-success-container px-4 py-3 text-xs sm:text-sm text-on-success-container flex items-start gap-2.5"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-success mt-0.5 shrink-0"
            >
              check_circle
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordInputField
            id="current-password"
            name="currentPassword"
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu hiện tại"
            disabled={submitting}
            value={currentPassword}
            onChange={setCurrentPassword}
            error={fieldErrors.currentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((prev) => !prev)}
          />

          <PasswordInputField
            id="new-password"
            name="newPassword"
            label="Mật khẩu mới"
            autoComplete="new-password"
            placeholder="Tối thiểu 12 ký tự, khác mật khẩu cũ"
            helperText="Yêu cầu tối thiểu 12 ký tự (tối đa 128 ký tự), không chỉ gồm khoảng trắng."
            disabled={submitting}
            value={newPassword}
            onChange={setNewPassword}
            error={fieldErrors.newPassword}
            show={showNew}
            onToggleShow={() => setShowNew((prev) => !prev)}
          />

          <PasswordInputField
            id="confirm-password"
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            disabled={submitting}
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={fieldErrors.confirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((prev) => !prev)}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon="lock_reset"
            className="mt-2"
          >
            {submitting ? "Đang cập nhật mật khẩu..." : "Xác nhận đổi mật khẩu"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ChangePasswordForm() {
  return (
    <ProtectedRoute allowMustChangePassword>
      <ChangePasswordInner />
    </ProtectedRoute>
  );
}

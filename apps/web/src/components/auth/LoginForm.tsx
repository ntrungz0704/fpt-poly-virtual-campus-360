"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Input, LoadingState } from "@/components/ui";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { formatAuthErrorMessage } from "@/lib/auth/api-client";
import {
  resolvePostAuthRoute,
  sanitizeInternalNextPath,
} from "@/lib/auth/auth-routing";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, login, ensureSessionChecked } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rawNext = searchParams.get("next");
  const safeNext = sanitizeInternalNextPath(rawNext);
  const reason = searchParams.get("reason");

  useEffect(() => {
    // If user already holds an active refresh cookie when opening /login directly,
    // hydrate cleanly once so we don't show the login screen to an active session.
    if (status === "unauthenticated") {
      void ensureSessionChecked();
    }
  }, [status, ensureSessionChecked]);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(resolvePostAuthRoute(user, safeNext));
    }
  }, [status, user, safeNext, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập/email/SĐT và mật khẩu.");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const authenticatedUser = await login({
        identifier: trimmedIdentifier,
        password,
      });
      setPassword("");
      router.replace(resolvePostAuthRoute(authenticatedUser, safeNext));
    } catch (error) {
      setErrorMessage(
        formatAuthErrorMessage(
          error,
          "Thông tin đăng nhập không hợp lệ hoặc tài khoản đang bị khóa.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && user)) {
    return (
      <div className="w-full max-w-md mx-auto">
        <LoadingState label="Đang kiểm tra phiên đăng nhập..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            arrow_back
          </span>
          <span>Về Trang chủ</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-primary">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            verified_user
          </span>
          <span>Cổng xác thực chung</span>
        </span>
      </div>

      <div className="ui-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {OFFICIAL_CAMPUS_INFO.shortName} · {OFFICIAL_CAMPUS_INFO.campusLabel}
          </p>
          <h1 className="type-h2 text-on-surface">Đăng nhập Virtual Campus</h1>
          <p className="type-body-sm text-secondary leading-relaxed">
            Dành cho Sinh viên, Phụ huynh tham dự Open Day và Cán bộ quản trị hệ thống.
            Khách tham quan tự do không cần tài khoản để xem{" "}
            <Link href="/campus" className="text-primary font-semibold hover:underline">
              Tour 360°
            </Link>{" "}
            hoặc{" "}
            <Link href="/map" className="text-primary font-semibold hover:underline">
              Bản đồ GIS
            </Link>
            .
          </p>
        </div>

        {reason === "auth_required" && !errorMessage && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-amber-700 mt-0.5 shrink-0"
            >
              info
            </span>
            <span>Vui lòng đăng nhập để tiếp tục truy cập khu vực tài khoản.</span>
          </div>
        )}

        {reason === "expired" && !errorMessage && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-amber-700 mt-0.5 shrink-0"
            >
              schedule
            </span>
            <span>Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            data-testid="login-error"
            className="rounded-xl border border-error/40 bg-error-container px-4 py-3 text-xs sm:text-sm text-on-error-container flex items-start gap-2.5"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px] text-error mt-0.5 shrink-0"
            >
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="login-identifier"
            name="identifier"
            label="Tên đăng nhập, Email hoặc Số điện thoại"
            placeholder="Nhập username, email hoặc SĐT đã được cấp"
            autoComplete="username"
            required
            disabled={submitting}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="font-label-md text-label-md text-on-surface flex items-center gap-1"
            >
              <span>Mật khẩu</span>
              <span className="text-error" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu của bạn"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ui-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={submitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[19px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon="login"
            className="mt-2"
          >
            {submitting ? "Đang xác thực..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-2 text-xs text-secondary leading-relaxed">
          <p className="font-semibold text-on-surface flex items-center gap-1.5">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">
              shield
            </span>
            <span>Lưu ý bảo mật tài khoản</span>
          </p>
          <p>
            Hệ thống không mở tự đăng ký công khai. Tài khoản mới kích hoạt hoặc tài khoản có yêu cầu
            đổi mật khẩu lần đầu sẽ được chuyển sang bước cập nhật mật khẩu trước khi vào hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
}

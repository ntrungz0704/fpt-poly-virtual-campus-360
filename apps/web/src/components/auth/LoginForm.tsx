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
          <span>FPT Edu SSO</span>
        </span>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-9 border border-surface-container shadow-elevation-2 relative overflow-hidden space-y-6">
        {/* Top Brand Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary" />

        {/* Brand Header with Preserved Logo */}
        <div className="text-center pt-2">
          <img
            src="/images/fpt-logo-official.png"
            alt="FPT Polytechnic"
            className="h-9 w-auto mx-auto object-contain mb-3"
          />
          <h1 className="type-h2 text-on-surface">Đăng Nhập Tập Trung</h1>
          <p className="type-body-sm text-secondary mt-1">
            Cổng Virtual Campus, Student Portal &amp; Hệ thống Quản trị QTSC
          </p>
        </div>

        {/* Role Quick Selector Pills */}
        <div>
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-2 text-center">
            Chọn nhanh vai trò trải nghiệm:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setIdentifier("student@fpt.edu.vn");
                setPassword("FptPoly@2026");
                setErrorMessage(null);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                identifier === "student@fpt.edu.vn"
                  ? "border-primary bg-primary-fixed text-primary"
                  : "border-surface-container bg-surface-container-low text-secondary hover:border-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Sinh viên</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier("parent@fpt.edu.vn");
                setPassword("FptPoly@2026");
                setErrorMessage(null);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                identifier === "parent@fpt.edu.vn"
                  ? "border-primary bg-primary-fixed text-primary"
                  : "border-surface-container bg-surface-container-low text-secondary hover:border-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">family_restroom</span>
              <span>Phụ huynh</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier("admin@fpt.edu.vn");
                setPassword("FptPoly@2026");
                setErrorMessage(null);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                identifier === "admin@fpt.edu.vn"
                  ? "border-primary bg-primary-fixed text-primary"
                  : "border-surface-container bg-surface-container-low text-secondary hover:border-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              <span>Quản trị viên</span>
            </button>
          </div>
        </div>

        {reason === "auth_required" && !errorMessage && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-amber-700 mt-0.5 shrink-0">
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
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-amber-700 mt-0.5 shrink-0">
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
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-error mt-0.5 shrink-0">
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
            placeholder="Nhập username, email hoặc SĐT"
            autoComplete="username"
            required
            disabled={submitting}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="font-label-md text-label-md text-on-surface flex items-center justify-between"
            >
              <div className="flex items-center gap-1">
                <span>Mật khẩu</span>
                <span className="text-error" aria-hidden="true">*</span>
              </div>
              <a href="#" className="text-xs font-semibold text-primary hover:underline">
                Quên mật khẩu?
              </a>
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
            {submitting ? "Đang xác thực..." : "Đăng nhập hệ thống"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-container" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface-container-lowest px-3 text-secondary font-semibold">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={() => {
            setIdentifier("student@fpt.edu.vn");
            setPassword("FptPoly@2026");
            setErrorMessage(null);
          }}
          className="w-full py-3 px-4 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold transition flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Đăng nhập qua Google (@fpt.edu.vn)</span>
        </button>

        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-1.5 text-xs text-secondary leading-relaxed">
          <p className="font-semibold text-on-surface flex items-center gap-1.5">
            <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">
              shield
            </span>
            <span>Bảo mật &amp; Quy định truy cập</span>
          </p>
          <p>
            Tài khoản mới kích hoạt hoặc tài khoản yêu cầu đổi mật khẩu lần đầu sẽ tự động chuyển sang trang đổi mật khẩu theo tiêu chuẩn ISO 27001 FPT Education.
          </p>
        </div>
      </div>
    </div>
  );
}

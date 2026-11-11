"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import {
  authenticateAdminAccount,
  PrototypeParticipantSession,
  writePrototypeSession,
} from "@/lib/prototype-auth";
import { Button, Input } from "@/components/ui";

type AuthScreenMode = "login" | "first_login_change_password";

function resolveSafeNextPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return "/admin";
  }
  return nextParam;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  const [mode, setMode] = useState<AuthScreenMode>("login");
  const [accountCode, setAccountCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingSession, setPendingSession] = useState<PrototypeParticipantSession | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!accountCode.trim() || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ tên tài khoản và mật khẩu quản trị.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const matched = authenticateAdminAccount(accountCode, password);
      if (!matched) {
        setErrorMsg("Tên tài khoản hoặc mật khẩu quản trị không chính xác.");
        return;
      }

      if (matched.mustChangePassword) {
        setPendingSession(matched);
        setMode("first_login_change_password");
        return;
      }

      writePrototypeSession(matched);
      router.push(nextPath);
    }, 250);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới cần tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận chưa trùng khớp.");
      return;
    }
    if (!pendingSession) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const updated: PrototypeParticipantSession = {
        ...pendingSession,
        mustChangePassword: false,
        updatedPasswordAt: new Date().toLocaleTimeString("vi-VN"),
      };
      writePrototypeSession(updated);
      router.push(nextPath);
    }, 250);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="ui-card p-6 sm:p-8 shadow-elevation-2 space-y-6">
        {mode === "login" ? (
          <>
            <div className="space-y-1.5">
              <p className="type-label text-primary">Cổng Quản trị · QTSC Q.12</p>
              <h1 className="type-h1 text-on-surface">Đăng nhập Quản trị</h1>
              <p className="type-body-sm text-secondary leading-relaxed">
                Dành riêng cho Quản trị viên và nhân sự được cấp quyền vận hành Virtual Campus. Không hỗ trợ tự đăng ký công khai.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-error-container border border-error p-3.5 text-xs text-on-error-container flex items-start gap-2.5"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  error
                </span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <Input
                label="Tài khoản quản trị"
                placeholder="Nhập tên tài khoản"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                autoComplete="username"
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="login-password" className="type-label text-on-surface">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelp((prev) => !prev)}
                    className="text-xs font-semibold text-primary hover:underline min-h-[36px] px-1 cursor-pointer"
                  >
                    Hỗ trợ truy cập?
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị"
                    autoComplete="current-password"
                    className="ui-input pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="w-11 h-11 absolute right-0 rounded-lg text-secondary hover:text-on-surface flex items-center justify-center cursor-pointer"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {showHelp && (
                <div className="rounded-xl bg-surface-container-low border border-surface-container p-4 text-xs text-secondary space-y-1.5">
                  <p className="font-bold text-on-surface">Hỗ trợ tài khoản quản trị</p>
                  <p className="leading-relaxed">
                    Tài khoản quản trị do đơn vị vận hành cấp trực tiếp. Nếu bị khóa hoặc cần cấp lại mật khẩu, vui lòng liên hệ phụ trách kỹ thuật cơ sở CVPM Quang Trung.
                  </p>
                  <p className="text-[11px] text-secondary">
                    Thời gian hỗ trợ: {OFFICIAL_CAMPUS_INFO.supportHours}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full"
                icon="login"
              >
                {isSubmitting ? "Đang xác thực..." : "Đăng nhập Quản trị"}
              </Button>
            </form>

            <div className="pt-4 border-t border-surface-container-low text-center space-y-2">
              <p className="text-xs text-secondary">
                Bạn chỉ muốn tham quan khuôn viên trực tuyến?
              </p>
              <Link
                href="/campus"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline min-h-[36px]"
              >
                <span>Mở Tour 360° Tự do không cần tài khoản</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          </>
        ) : (
          /* First Login Forced Password Change Screen */
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-container text-on-warning-container text-[11px] font-bold">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  password
                </span>
                <span>Bảo mật lần đăng nhập đầu tiên</span>
              </span>
              <h1 className="type-h2 text-on-surface pt-1">Thiết lập mật khẩu cá nhân</h1>
              <p className="type-body-sm text-secondary">
                Chào <strong>{pendingSession?.fullName}</strong> ({pendingSession?.accountCode}). Bạn đang dùng mật khẩu tạm do Admin cấp; vui lòng đặt mật khẩu mới để tiếp tục.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-error-container border border-error p-3 text-xs text-on-error-container"
              >
                {errorMsg}
              </div>
            )}

            <Input
              label="Mật khẩu mới"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setMode("login");
                  setPendingSession(null);
                  setErrorMsg(null);
                }}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                className="flex-1"
                icon="check_circle"
              >
                Lưu mật khẩu &amp; Tiếp tục
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-80 ui-card animate-pulse" />}>
      <LoginFormContent />
    </Suspense>
  );
}

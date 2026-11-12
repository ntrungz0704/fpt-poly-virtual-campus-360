import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LoadingState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Đổi mật khẩu | Virtual Campus FPT Polytechnic QTSC",
  description:
    "Cập nhật mật khẩu tài khoản cho hệ thống Virtual Campus FPT Polytechnic QTSC Quận 12.",
};

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto">
          <LoadingState label="Đang kiểm tra trạng thái tài khoản..." />
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}

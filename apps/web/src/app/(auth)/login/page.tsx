import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Đăng nhập | Virtual Campus FPT Polytechnic QTSC",
  description:
    "Cổng đăng nhập thống nhất cho Sinh viên, Phụ huynh Open Day và Quản trị viên Virtual Campus FPT Polytechnic QTSC Quận 12.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto">
          <LoadingState label="Đang tải biểu mẫu đăng nhập..." />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

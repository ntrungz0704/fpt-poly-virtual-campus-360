import React from "react";
import { NotFoundState } from "@/components/ui";

export default function GlobalNotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <NotFoundState
          title="Không tìm thấy trang yêu cầu (404)"
          description="Đường dẫn bạn truy cập không tồn tại hoặc không thuộc khuôn viên số FPT Polytechnic QTSC Quận 12."
          actionLabel="Về Trang chủ"
          actionHref="/"
          secondaryLabel="Mở Tour 360°"
          secondaryHref="/campus"
        />
      </div>
    </div>
  );
}

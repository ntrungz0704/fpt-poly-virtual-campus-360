import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export function QuizLeaderboard() {
  return (
    <div className="ui-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="type-h3 text-on-surface">Hoạt động Open Day theo tài khoản mời</h3>
          <p className="type-body-sm text-secondary mt-1">
            Bảng ghi nhận điểm thử thách trong ngày hội được mở trực tiếp tại Không gian Tham dự Open Day.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
            passkey
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-surface-container-low border border-surface-container p-4 text-xs text-secondary space-y-2">
        <p className="font-semibold text-on-surface">
          Sự kiện sắp tới: {OFFICIAL_CAMPUS_INFO.openDayDateLabel}
        </p>
        <p>
          Nếu bạn đã được Ban Tổ Chức gửi thông tin đăng nhập qua Zalo hoặc Email, hãy đăng nhập để xem lịch cá nhân và thẻ QR Check-in.
        </p>
      </div>

      <Link
        href="/campus"
        className="group ui-btn ui-btn-primary w-full min-h-[44px] text-xs font-bold"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
          360
        </span>
        <span>Khám phá Tour 360° QTSC</span>
      </Link>
    </div>
  );
}

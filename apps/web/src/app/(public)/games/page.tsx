import React from "react";
import { GamesClientView } from "./GamesClientView";

export const metadata = {
  title: "Đấu Trường Khám Phá & Đổi Thưởng | FPT Polytechnic Virtual Campus",
  description:
    "Thử thách trắc nghiệm hiểu biết khuôn viên QTSC Quận 12, tích lũy điểm XP, quay vòng may mắn nhận quà và tranh tài trên Bảng vàng.",
};

export default function GamesPage() {
  return (
    <div className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <GamesClientView />
      </div>
    </div>
  );
}

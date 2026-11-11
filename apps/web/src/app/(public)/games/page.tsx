import React from "react";
import { OPEN_DAY_QUIZ_QUESTIONS, OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { CampusQuizStepper, QuizLeaderboard } from "@/components/quiz";
import { Badge } from "@/components/ui";

export const metadata = {
  title: "Tìm hiểu Khuôn viên QTSC | FPT Polytechnic Virtual Campus",
  description:
    "Bộ câu hỏi nhanh giúp làm quen với các tòa nhà và không gian thực hành tại cơ sở CVPM Quang Trung Quận 12.",
};

export default function GamesPage() {
  return (
    <div className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 border-b border-surface-container pb-6">
          <Badge variant="brand">Làm quen khuôn viên QTSC</Badge>
          <h1 className="type-h1 text-on-surface">
            Câu hỏi nhanh Khám phá {OFFICIAL_CAMPUS_INFO.campusLabel}
          </h1>
          <p className="type-body text-secondary max-w-2xl">
            Ôn tập nhanh vị trí các tòa nhà và phòng Lab trước khi tham gia Open Day. Hoạt động chính thức của khách mời được mở trong cổng Open Day sau khi đăng nhập.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <CampusQuizStepper questions={OPEN_DAY_QUIZ_QUESTIONS} />
          </div>
          <div className="lg:col-span-4">
            <QuizLeaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}

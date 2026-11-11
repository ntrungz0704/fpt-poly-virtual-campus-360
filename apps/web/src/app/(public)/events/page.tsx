import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { Badge } from "@/components/ui";
import { OpenDayScheduleTimeline, EventPillarGrid } from "@/components/events";
import { BlurText, FadeContent } from "@/components/animations";

export const metadata = {
  title: "FPoly Open Day tại CVPM Quang Trung | FPT Polytechnic Virtual Campus",
  description:
    "Lịch trình công khai Open Day QTSC Quận 12, hướng dẫn di chuyển khuôn viên và các phiên trải nghiệm thực tế.",
};

export default function EventsPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Open Day Clean Editorial Header */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl rb-desktop-rise">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">Sự kiện tại QTSC Quận 12</Badge>
              <span className="text-xs font-mono text-slate-300">
                {OFFICIAL_CAMPUS_INFO.openDayDateLabel} · {OFFICIAL_CAMPUS_INFO.openDayTimeLabel}
              </span>
            </div>

            <h1 className="type-h1 sm:text-4xl text-white">
              FPoly Open Day — Trải nghiệm Không gian Thực hành
            </h1>
            <p className="type-body text-slate-300 leading-relaxed">
              Địa điểm: {OFFICIAL_CAMPUS_INFO.address}. Khách tham quan tự do theo dõi lịch trình bên dưới
              và định hướng trước vị trí các khu vực bằng Bản đồ GIS &amp; Tham quan 360°.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 rb-desktop-rise-delay">
            <Link
              href="/campus"
              className="ui-btn ui-btn-primary min-h-[46px] px-5 py-2.5 text-sm font-bold"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                360
              </span>
              <span>Khám phá khuôn viên 360°</span>
            </Link>
            <Link
              href="/map?building=INNOVATION"
              className="ui-btn min-h-[46px] px-5 py-2.5 text-sm font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/15"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                map
              </span>
              <span>Bản đồ khu đón tiếp</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-14">
        {/* Schedule Section */}
        <section aria-labelledby="schedule-heading" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="type-label text-primary">Thời khóa biểu ngày hội</p>
              <BlurText
                as="h2"
                id="schedule-heading"
                text="Lịch trình dự kiến Open Day"
                className="type-h2 text-on-surface"
              />
            </div>

            <FadeContent delay={0.1}>
              <p className="text-xs text-secondary">
                Cần tư vấn ngành học hoặc đăng ký tuyển sinh?{" "}
                <a
                  href={OFFICIAL_CAMPUS_INFO.officialAdmissionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  Truy cập caodang.fpt.edu.vn
                </a>
              </p>
            </FadeContent>
          </div>

          <OpenDayScheduleTimeline />
        </section>

        <EventPillarGrid />
      </div>
    </div>
  );
}

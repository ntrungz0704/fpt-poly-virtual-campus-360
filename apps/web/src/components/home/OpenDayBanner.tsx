import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { AnimatedContent, BlurText, SpotlightCard } from "@/components/animations";

export function OpenDayBanner() {
  return (
    <section
      aria-labelledby="openday-preview-heading"
      className="py-14 sm:py-16 bg-surface"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={26} scale={0.985}>
          <SpotlightCard
            spotlightColor="rgba(243, 111, 33, 0.22)"
            className="rounded-2xl bg-slate-900 text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 border border-slate-800 shadow-elevation-2"
          >
            <div className="space-y-3 max-w-2xl relative z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-orange-200 text-xs font-bold">
                <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                  calendar_today
                </span>
                <span>
                  {OFFICIAL_CAMPUS_INFO.openDayDateLabel} · {OFFICIAL_CAMPUS_INFO.openDayTimeLabel}
                </span>
              </div>

              <BlurText
                as="h2"
                id="openday-preview-heading"
                text="FPoly Open Day tại CVPM Quang Trung"
                className="type-h1 text-white"
              />
              <p className="type-body text-slate-300">
                Xem lịch trình sự kiện công khai và bản đồ khu vực đón tiếp. Khách mời đã được Ban Tổ Chức
                cấp tài khoản có thể đăng nhập để nhận thẻ Check-in QR và lịch trình cá nhân.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-20">
              <Link
                href="/events"
                className="group ui-btn ui-btn-primary min-h-[46px] px-5 py-2.5 text-sm font-bold"
              >
                <span>Xem lịch Open Day</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                  arrow_forward
                </span>
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
          </SpotlightCard>
        </AnimatedContent>
      </div>
    </section>
  );
}

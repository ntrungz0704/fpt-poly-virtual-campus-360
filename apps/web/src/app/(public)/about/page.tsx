import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CAMPUS_BUILDINGS,
  CAMPUS_LOCATIONS,
  OFFICIAL_CAMPUS_INFO,
  OPEN_DAY_SESSIONS,
  TOUR_SCENES,
} from "@/data/campus-data";
import { Badge } from "@/components/ui";
import {
  AnimatedContent,
  BlurText,
  CountUp,
  SpotlightCard,
} from "@/components/animations";

export const metadata = {
  title: "Giới thiệu Khuôn viên QTSC Quận 12 | FPT Polytechnic Virtual Campus",
  description:
    "Tổng quan về không gian đào tạo thực hành FPT Polytechnic cơ sở Công viên Phần mềm Quang Trung (Quận 12) và hai chế độ trải nghiệm Virtual Campus.",
};

export default function AboutPage() {
  return (
    <div className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4 rb-desktop-rise">
            <Badge variant="brand">{OFFICIAL_CAMPUS_INFO.campusLabel}</Badge>
            <h1 className="type-h1 text-on-surface">
              Không gian trải nghiệm số tại CVPM Quang Trung
            </h1>
            <p className="type-body text-secondary leading-relaxed">
              Virtual Campus là nền tảng giúp học sinh, phụ huynh và khách mời quan sát trực quan
              kiến trúc, phòng thực hành và đường đi nội khu của cơ sở {OFFICIAL_CAMPUS_INFO.shortName} trước khi đến trực tiếp.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/campus"
                className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2 text-sm font-bold"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  360
                </span>
                <span>Mở Tour 360° ngay</span>
              </Link>
              <a
                href={OFFICIAL_CAMPUS_INFO.officialMajorsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-btn ui-btn-outline min-h-[44px] px-5 py-2 text-sm font-semibold"
              >
                <span>Ngành học tại caodang.fpt.edu.vn</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  open_in_new
                </span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 rb-desktop-rise-delay">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-surface-container bg-surface-container shadow-elevation-1">
              <Image
                src="/images/locations/building-innovation.jpg"
                alt="Khuôn viên FPT Polytechnic tại CVPM Quang Trung"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Campus Scale Quick Stats (Desktop CountUp via React Bits) */}
        <section aria-label="Quy mô không gian số QTSC">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tòa nhà & Khu vực GIS", value: CAMPUS_BUILDINGS.length, icon: "domain" },
              { label: "Không gian học tập số hóa", value: CAMPUS_LOCATIONS.length, icon: "meeting_room" },
              { label: "Điểm nhìn Panorama 360°", value: TOUR_SCENES.length, icon: "360" },
              { label: "Khung giờ Open Day", value: OPEN_DAY_SESSIONS.length, icon: "event_available" },
            ].map((stat, idx) => (
              <AnimatedContent key={stat.label} delay={idx * 0.06} distance={20}>
                <SpotlightCard className="ui-card ui-card-hover p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 relative z-20">
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                      {stat.icon}
                    </span>
                  </div>
                  <div className="min-w-0 relative z-20">
                    <div className="font-display text-2xl font-extrabold text-on-surface leading-none">
                      <CountUp to={stat.value} duration={1.1} delay={idx * 0.08} />
                    </div>
                    <p className="text-xs font-medium text-secondary mt-1 truncate">{stat.label}</p>
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        </section>

        {/* Two Experience Modes */}
        <section aria-labelledby="modes-heading" className="space-y-5">
          <BlurText
            as="h2"
            id="modes-heading"
            text="Hai chế độ tham quan rõ ràng"
            className="type-h2 text-on-surface"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedContent distance={24} className="h-full">
              <SpotlightCard className="ui-card ui-card-hover p-6 h-full space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center relative z-20">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                    public
                  </span>
                </div>
                <h3 className="type-h3 text-on-surface relative z-20">1. Tham quan Tự do (Công khai)</h3>
                <p className="type-body-sm text-secondary leading-relaxed relative z-20">
                  Không yêu cầu đăng ký hay đăng nhập. Bất kỳ ai đều có thể xoay toàn cảnh 360°,
                  mở Bản đồ GIS khuôn viên và xem thông tin các phòng Lab, Studio, Hội trường.
                </p>
                <Link
                  href="/map"
                  className="ui-cta-link text-xs min-h-[36px] relative z-20"
                >
                  <span>Mở Bản đồ GIS Khuôn viên</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                    arrow_forward
                  </span>
                </Link>
              </SpotlightCard>
            </AnimatedContent>

            <AnimatedContent delay={0.1} distance={24} className="h-full">
              <SpotlightCard className="ui-card ui-card-hover p-6 h-full space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center relative z-20">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                    passkey
                  </span>
                </div>
                <h3 className="type-h3 text-on-surface relative z-20">2. Trải nghiệm Open Day công khai</h3>
                <p className="type-body-sm text-secondary leading-relaxed relative z-20">
                  Lịch sự kiện chung, hướng dẫn di chuyển khuôn viên và thử thách định hướng 360° hiển thị công khai tại mục Open Day.
                  Quy trình kích hoạt tài khoản mời cho các chương trình chuyên biệt sẽ được mở khi Backend Auth hoàn tất.
                </p>
                <Link
                  href="/events"
                  className="ui-cta-link text-xs min-h-[36px] relative z-20"
                >
                  <span>Xem thông tin Open Day</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                    arrow_forward
                  </span>
                </Link>
              </SpotlightCard>
            </AnimatedContent>
          </div>
        </section>

        {/* Campus Buildings Overview */}
        <section aria-labelledby="buildings-heading" className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <BlurText
              as="h2"
              id="buildings-heading"
              text="Các khu vực chính tại CVPM Quang Trung"
              className="type-h2 text-on-surface"
            />
            <Link
              href="/locations"
              className="ui-cta-link text-sm"
            >
              <span>Xem danh sách phòng</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAMPUS_BUILDINGS.map((b, idx) => (
              <AnimatedContent key={b.code} delay={idx * 0.06} distance={22} className="h-full">
                <SpotlightCard className="ui-card ui-card-hover p-5 h-full space-y-2.5">
                  <div className="flex items-center justify-between gap-2 relative z-20">
                    <Badge variant="brand">{b.categoryLabel}</Badge>
                    <span className="text-xs font-mono font-semibold text-secondary">{b.code}</span>
                  </div>
                  <h3 className="type-h3 text-on-surface relative z-20">{b.name}</h3>
                  <p className="type-body-sm text-secondary relative z-20">{b.summary}</p>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

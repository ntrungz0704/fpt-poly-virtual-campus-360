import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import {
  AnimatedContent,
  BlurText,
  FadeContent,
  SpotlightCard,
} from "@/components/animations";

const ORIENTATION_WAYS = [
  {
    icon: "360",
    title: "Tham quan 360° toàn cảnh",
    description:
      "Chuyển đổi liền mạch từ cổng chính QTSC vào sảnh Innovation, thư viện số, phòng Lab CNTT và studio đồ họa.",
    href: "/campus",
    cta: "Mở Tour 360°",
  },
  {
    icon: "map",
    title: "Bản đồ khuôn viên GIS",
    description:
      "Định vị nhanh vị trí các khối nhà Innovation, Tòa T, Tòa F, Tòa P và khu thể thao trong khuôn viên Lô 24.",
    href: "/map",
    cta: "Mở Bản đồ GIS",
  },
  {
    icon: "meeting_room",
    title: "Danh mục không gian học tập",
    description:
      "Tìm kiếm và xem thông tin tổng quan từng phòng thực hành, hội trường, thư viện trước khi bước vào tham quan.",
    href: "/locations",
    cta: "Xem Địa điểm",
  },
];

export function CampusOrientationSection() {
  return (
    <section
      aria-labelledby="orientation-heading"
      className="py-14 sm:py-16 bg-surface border-b border-surface-container"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeContent blur={false}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div className="space-y-2 max-w-2xl">
              <p className="type-label text-primary">Định hướng không gian thực tế</p>
              <BlurText
                as="h2"
                id="orientation-heading"
                text="Một khuôn viên số, ba lối khám phá trực quan"
                className="type-h1 text-on-surface"
              />
              <p className="type-body text-secondary">
                {OFFICIAL_CAMPUS_INFO.address}.
              </p>
            </div>

            <a
              href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-cta-link text-sm font-semibold min-h-[44px] self-start lg:self-auto shrink-0 whitespace-nowrap"
            >
              <span>Website chính thức FPT Polytechnic</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                open_in_new
              </span>
            </a>
          </div>
        </FadeContent>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ORIENTATION_WAYS.map((item, idx) => (
            <AnimatedContent
              key={item.href}
              delay={idx * 0.08}
              distance={24}
              className="h-full"
            >
              <SpotlightCard className="ui-card ui-card-hover p-6 h-full flex flex-col justify-between gap-5">
                <div className="space-y-3 relative z-20">
                  <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                      {item.icon}
                    </span>
                  </div>
                  <h3 className="type-h3 text-on-surface">{item.title}</h3>
                  <p className="type-body-sm text-secondary">{item.description}</p>
                </div>
                <Link
                  href={item.href}
                  className="ui-cta-link text-sm min-h-[44px] self-start relative z-20"
                >
                  <span>{item.cta}</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </Link>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}

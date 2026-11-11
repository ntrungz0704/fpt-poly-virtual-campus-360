import React from "react";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import {
  CAMPUS_GUIDE_ARTICLES,
  FeaturedArticleCard,
  NewsArticleGrid,
} from "@/components/news";
import { FadeContent } from "@/components/animations";

export const metadata = {
  title: "Bản tin Hướng dẫn Trải nghiệm QTSC | FPT Polytechnic Virtual Campus",
  description:
    "Tổng hợp hướng dẫn tham quan Virtual Campus 360° và lịch trình Open Day tại cơ sở CVPM Quang Trung Quận 12.",
};

export default function NewsPage() {
  const [featured, ...rest] = CAMPUS_GUIDE_ARTICLES;

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-surface-container">
          <div className="space-y-2 max-w-2xl rb-desktop-rise">
            <p className="type-label text-primary">Thông tin trải nghiệm QTSC</p>
            <h1 className="type-h1 text-on-surface">
              Cẩm nang Tham quan &amp; Sự kiện Open Day
            </h1>
            <p className="type-body text-secondary">
              Hướng dẫn sử dụng nền tảng tham quan 360° và Bản đồ GIS tại cơ sở{" "}
              {OFFICIAL_CAMPUS_INFO.campusLabel}.
            </p>
          </div>

          <a
            href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2 text-xs font-semibold shrink-0 self-start md:self-auto rb-desktop-rise-delay"
          >
            <span>Tin tức chính thức tại caodang.fpt.edu.vn</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              open_in_new
            </span>
          </a>
        </div>

        {/* Option A bridge notice */}
        <FadeContent delay={0.08}>
          <div className="rounded-xl bg-info-container/40 border border-surface-container px-4 py-3.5 text-xs sm:text-sm text-on-surface-variant flex items-start gap-2.5">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
              info
            </span>
            <span>
              Chuyên mục này chỉ cung cấp thông tin định hướng không gian QTSC và Open Day. Mọi thông báo tuyển sinh, quy chế và tin tức toàn trường được đăng chính thức tại{" "}
              <a
                href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                caodang.fpt.edu.vn
              </a>
              .
            </span>
          </div>
        </FadeContent>

        {featured && <FeaturedArticleCard article={featured} />}
        {rest.length > 0 && <NewsArticleGrid articles={rest} />}
      </div>
    </div>
  );
}

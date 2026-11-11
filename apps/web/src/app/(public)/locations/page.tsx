import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { LocationsExplorer } from "@/components/locations";

export const metadata = {
  title: "Danh mục Không gian & Địa điểm | FPT Polytechnic Virtual Campus QTSC",
  description:
    "Tra cứu nhanh các sảnh đón tiếp, thư viện số, hội trường, phòng Lab CNTT và studio tại cơ sở CVPM Quang Trung, Quận 12.",
};

interface LocationsPageProps {
  searchParams: Promise<{ building?: string }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const { building } = await searchParams;

  return (
    <div className="bg-surface min-h-screen">
      <section className="bg-surface-container-low border-b border-surface-container py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl rb-desktop-rise">
            <nav aria-label="Breadcrumb" className="text-xs font-medium text-secondary flex items-center gap-1.5">
              <Link href="/" className="hover:text-primary">
                Trang chủ
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-on-surface font-semibold">Địa điểm khuôn viên</span>
            </nav>

            <h1 className="type-h1 text-on-surface">
              Không gian học tập &amp; Tiện ích QTSC
            </h1>
            <p className="type-body text-secondary">
              Danh mục phòng học, phòng Lab thực hành, studio và điểm check-in tại{" "}
              {OFFICIAL_CAMPUS_INFO.campusLabel}. Chọn một địa điểm để xem chi tiết hoặc mở góc nhìn 360°.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 rb-desktop-rise-delay">
            <Link
              href="/map"
              className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2 text-sm"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                map
              </span>
              <span>Xem Bản đồ GIS</span>
            </Link>
            <Link
              href="/campus"
              className="ui-btn ui-btn-primary min-h-[44px] px-4 py-2 text-sm"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                360
              </span>
              <span>Mở Tour 360°</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <LocationsExplorer initialBuildingParam={building} />
      </section>
    </div>
  );
}

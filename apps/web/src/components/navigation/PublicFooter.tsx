"use client";

import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";

export function PublicFooter() {
  return (
    <footer className="w-full bg-on-surface border-t border-white/10 pt-12 pb-8 text-inverse-on-surface">
      <div className="ui-container flex flex-col gap-9">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: Virtual Campus Identity */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-white shrink-0">
                <img
                  src="/images/fpt-logo-official.png"
                  alt="FPT Polytechnic"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-base font-bold text-white leading-tight">
                  Virtual Campus 360°
                </span>
                <span className="type-caption uppercase text-primary-fixed-dim">
                  {OFFICIAL_CAMPUS_INFO.shortName}
                </span>
              </div>
            </div>

            <p className="type-body-sm text-slate-300 leading-relaxed">
              Sản phẩm trải nghiệm không gian khuôn viên trực tuyến tại Công viên Phần mềm Quang Trung (Quận 12) dành cho học sinh, phụ huynh và khách mời Open Day.
            </p>
          </div>

          {/* Column 2: Core Virtual Campus Routes */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h3 className="type-caption uppercase text-primary-fixed-dim">
              Trải nghiệm Không gian
            </h3>
            <nav aria-label="Liên kết trải nghiệm" className="flex flex-col gap-2 type-body-sm text-slate-300">
              <Link href="/campus" className="hover:text-white transition-colors py-0.5">
                Tham quan tự do 360°
              </Link>
              <Link href="/map" className="hover:text-white transition-colors py-0.5">
                Bản đồ GIS Khuôn viên QTSC
              </Link>
              <Link href="/locations" className="hover:text-white transition-colors py-0.5">
                Danh mục Địa điểm & Phòng Lab
              </Link>
              <Link href="/events" className="hover:text-white transition-colors py-0.5">
                Lịch trình Open Day
              </Link>
              <Link href="/about" className="hover:text-white transition-colors py-0.5">
                Giới thiệu trải nghiệm
              </Link>
            </nav>
          </div>

          {/* Column 3: Official Website Links */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h3 className="type-caption uppercase text-primary-fixed-dim">
              Thông tin Chính thức
            </h3>
            <div className="flex flex-col gap-2 type-body-sm text-slate-300">
              <a
                href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors py-0.5 inline-flex items-center gap-1"
              >
                <span>Trang chủ trường</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  open_in_new
                </span>
              </a>
              <a
                href={OFFICIAL_CAMPUS_INFO.officialMajorsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors py-0.5 inline-flex items-center gap-1"
              >
                <span>Ngành đào tạo</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  open_in_new
                </span>
              </a>
              <a
                href={OFFICIAL_CAMPUS_INFO.officialAdmissionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors py-0.5 inline-flex items-center gap-1"
              >
                <span>Đăng ký tuyển sinh</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  open_in_new
                </span>
              </a>
              <a
                href={OFFICIAL_CAMPUS_INFO.officialContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors py-0.5 inline-flex items-center gap-1"
              >
                <span>Liên hệ cơ sở</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
                  open_in_new
                </span>
              </a>
            </div>
          </div>

          {/* Column 4: Canonical Campus Address */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h3 className="type-caption uppercase text-primary-fixed-dim">
              Địa chỉ Cơ sở Quận 12
            </h3>
            <div className="flex flex-col gap-2.5 type-body-sm text-slate-300 leading-relaxed">
              <p>{OFFICIAL_CAMPUS_INFO.address}</p>
              <div className="pt-1 flex flex-wrap gap-2">
                <Link
                  href="/campus"
                  className="ui-btn ui-btn-primary min-h-[40px] px-4 py-2 text-xs"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                    360
                  </span>
                  <span>Tham quan 360° tự do</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="text-center sm:text-left">
            © 2026 {OFFICIAL_CAMPUS_INFO.name}.
          </p>
          <div className="flex items-center gap-5">
            <a
              href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              caodang.fpt.edu.vn
            </a>
            <Link href="/contact" className="hover:text-white transition-colors">
              Chỉ đường & Hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

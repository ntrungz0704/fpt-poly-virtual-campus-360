import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import { Badge } from "@/components/ui";
import { AnimatedContent, SpotlightCard } from "@/components/animations";

export const metadata = {
  title: "Chỉ dẫn Cơ sở QTSC & Liên hệ Chính thức | FPT Polytechnic Virtual Campus",
  description:
    "Địa chỉ chính xác tại Công viên Phần mềm Quang Trung Quận 12, giờ đón tiếp khách tham quan và liên kết cổng tuyển sinh chính thức caodang.fpt.edu.vn.",
};

export default function ContactPage() {
  return (
    <div className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-2 border-b border-surface-container pb-6 rb-desktop-rise">
          <Badge variant="brand">Chỉ dẫn cơ sở trực tiếp</Badge>
          <h1 className="type-h1 text-on-surface">
            Địa điểm &amp; Hỗ trợ Tham quan QTSC Quận 12
          </h1>
          <p className="type-body text-secondary max-w-2xl">
            Virtual Campus là nền tảng tham quan khuôn viên trực tuyến. Các nhu cầu tư vấn tuyển sinh
            hoặc nộp hồ sơ trực tuyến được tiếp nhận qua website chính thức của nhà trường.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campus Address Card */}
          <AnimatedContent direction="horizontal" reverse distance={20} className="h-full">
            <SpotlightCard className="rounded-2xl h-full">
              <div className="ui-card p-6 space-y-4 h-full">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                    location_on
                  </span>
                </div>
                <h2 className="type-h2 text-on-surface">Địa chỉ khuôn viên QTSC</h2>
                <p className="type-body-sm text-on-surface-variant leading-relaxed">
                  {OFFICIAL_CAMPUS_INFO.address}
                </p>
                <dl className="space-y-2 text-xs text-secondary pt-2 border-t border-surface-container-low">
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-on-surface">Giờ đón tiếp tham quan:</dt>
                    <dd>{OFFICIAL_CAMPUS_INFO.supportHours}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-on-surface">Tọa độ tham chiếu:</dt>
                    <dd className="font-mono">{OFFICIAL_CAMPUS_INFO.coordinatesLabel}</dd>
                  </div>
                </dl>
                <div className="pt-2">
                  <Link
                    href="/map"
                    className="ui-btn ui-btn-outline w-full min-h-[44px] text-xs font-bold"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                      map
                    </span>
                    <span>Mở Bản đồ Nội khu GIS</span>
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>

          {/* Official Admissions Bridge Card */}
          <AnimatedContent direction="horizontal" distance={20} delay={0.08} className="h-full">
            <SpotlightCard className="rounded-2xl h-full">
              <div className="ui-card p-6 space-y-4 bg-surface-container-low/50 h-full">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
                    support_agent
                  </span>
                </div>
                <h2 className="type-h2 text-on-surface">Cổng Tư vấn &amp; Tuyển sinh Chính thức</h2>
                <p className="type-body-sm text-secondary leading-relaxed">
                  Để đăng ký tư vấn ngành học, hỏi thông tin học phí hoặc gửi biểu mẫu liên hệ chính thức,
                  vui lòng truy cập trực tiếp hệ thống của Trường Cao đẳng FPT Polytechnic.
                </p>

                <div className="space-y-2.5 pt-2">
                  <a
                    href={OFFICIAL_CAMPUS_INFO.officialContactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-btn ui-btn-primary w-full min-h-[44px] text-xs font-bold"
                  >
                    <span>Tới trang Liên hệ caodang.fpt.edu.vn</span>
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                      open_in_new
                    </span>
                  </a>
                  <a
                    href={OFFICIAL_CAMPUS_INFO.officialAdmissionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-btn ui-btn-outline w-full min-h-[44px] text-xs font-semibold"
                  >
                    <span>Đăng ký Tư vấn Trực tuyến chính thức</span>
                    <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                      open_in_new
                    </span>
                  </a>
                </div>
              </div>
            </SpotlightCard>
          </AnimatedContent>
        </div>
      </div>
    </div>
  );
}

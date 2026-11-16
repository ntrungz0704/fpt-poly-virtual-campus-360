import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CAMPUS_BUILDINGS,
  OFFICIAL_CAMPUS_INFO,
} from "@/data/campus-data";
import { Badge } from "@/components/ui";

export const metadata = {
  title: "Giới thiệu FPT Polytechnic TP.HCM | Virtual Campus 360°",
  description:
    "Tìm hiểu lịch sử, triết lý đào tạo Thực học - Thực nghiệp, cơ sở vật chất công nghệ cao tại CVPM Quang Trung Quận 12 và hệ sinh thái số Virtual Campus 360°.",
};

export default function AboutPage() {
  return (
    <div className="bg-surface min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-fixed text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>{OFFICIAL_CAMPUS_INFO.campusLabel}</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
              Thực học — Thực nghiệp: <span className="text-primary">Định nghĩa lại</span> Giáo dục Nghề nghiệp
            </h1>
            <p className="type-body text-secondary leading-relaxed">
              Trường Cao đẳng FPT Polytechnic cơ sở TP.HCM đặt tại Công viên Phần mềm Quang Trung (Quận 12).
              Chúng tôi tiên phong kiến tạo môi trường học tập chuẩn doanh nghiệp kết hợp nền tảng số hóa Virtual Campus 360° toàn diện.
            </p>

            <div className="pt-2 flex flex-wrap gap-3.5">
              <Link
                href="/campus"
                className="ui-btn ui-btn-primary min-h-[46px] px-6 text-sm font-bold shadow-md shadow-orange-500/20"
              >
                <span className="material-symbols-outlined text-[19px]">360</span>
                <span>Khám phá Tour 360°</span>
              </Link>
              <Link
                href="/contact"
                className="ui-btn ui-btn-outline min-h-[46px] px-5 text-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[19px]">call</span>
                <span>Tư vấn xét tuyển</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-surface-container bg-surface-container shadow-elevation-2">
              <Image
                src="/images/locations/building-innovation.jpg"
                alt="Khuôn viên FPT Polytechnic tại CVPM Quang Trung"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <span className="text-xs font-bold text-primary-fixed uppercase tracking-wider block mb-1">Tòa nhà Innovation — Tòa T</span>
                  <p className="text-sm font-semibold text-slate-200">Trung tâm nghiên cứu AI, Robotics và Lab thực hành đa phương tiện</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Pillars of Practical Training */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="brand">Phương pháp đào tạo</Badge>
            <h2 className="type-h1 text-on-surface">Ba Trụ Cột Đào Tạo Thực Chiến</h2>
            <p className="type-body-sm text-secondary">
              Mô hình học tập theo dự án thực tế (Project-based Learning) chuẩn bị hành trang vững chắc cho sinh viên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ui-card p-7 space-y-4 rounded-3xl border border-surface-container hover:shadow-elevation-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
              </div>
              <h3 className="type-h3 text-on-surface">Thực hành chiếm 70%</h3>
              <p className="type-body-sm text-secondary leading-relaxed">
                Sinh viên học thông qua làm đồ án thực tế cùng giảng viên và doanh nghiệp. Nói không với lý thuyết hàn lâm, rèn luyện kỹ năng thực chiến ngay từ kỳ 1.
              </p>
            </div>

            <div className="ui-card p-7 space-y-4 rounded-3xl border border-surface-container hover:shadow-elevation-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-secondary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">hub</span>
              </div>
              <h3 className="type-h3 text-on-surface">Kết nối 2,000+ Doanh nghiệp</h3>
              <p className="type-body-sm text-secondary leading-relaxed">
                Mạng lưới đối tác công nghệ chiến lược trong và ngoài nước (FPT Software, Viettel, VNPT, Samsung) mở rộng cơ hội thực tập và tuyển dụng trực tiếp.
              </p>
            </div>

            <div className="ui-card p-7 space-y-4 rounded-3xl border border-surface-container hover:shadow-elevation-2 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <h3 className="type-h3 text-on-surface">97.7% Có việc làm</h3>
              <p className="type-body-sm text-secondary leading-relaxed">
                Tỷ lệ sinh viên có việc làm ngay trong năm đầu tiên sau khi tốt nghiệp. Mức thu nhập cạnh tranh tại các công ty công nghệ và agency hàng đầu.
              </p>
            </div>
          </div>
        </section>

        {/* Impressive Stats */}
        <section className="bg-gradient-to-r from-slate-900 via-[#0A2540] to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Hành trình khẳng định vị thế</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">Những Con Số Ấn Tượng</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-primary block mb-1">200K+</span>
              <span className="text-xs text-slate-300">Sinh viên &amp; Cựu sinh viên</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-amber-400 block mb-1">14</span>
              <span className="text-xs text-slate-300">Cơ sở đào tạo toàn quốc</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-emerald-400 block mb-1">97.7%</span>
              <span className="text-xs text-slate-300">Sinh viên có việc làm</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-blue-400 block mb-1">42+</span>
              <span className="text-xs text-slate-300">Điểm nhìn VR 360° số hóa</span>
            </div>
          </div>
        </section>

        {/* Campus Buildings Overview */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge variant="brand">Khuôn viên QTSC Quận 12</Badge>
              <h2 className="type-h1 text-on-surface mt-1">Cơ Sở Vật Chất &amp; Không Gian Học Tập</h2>
            </div>
            <Link href="/locations" className="ui-cta-link text-sm font-bold flex items-center gap-1">
              <span>Xem toàn bộ phòng thực hành</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAMPUS_BUILDINGS.map((b) => (
              <div key={b.code} className="ui-card p-6 space-y-3 rounded-3xl border border-surface-container hover:shadow-elevation-1 transition">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="brand">{b.categoryLabel}</Badge>
                  <span className="text-xs font-mono font-semibold text-secondary">{b.code}</span>
                </div>
                <h3 className="type-h3 text-on-surface">{b.name}</h3>
                <p className="type-body-sm text-secondary leading-relaxed">{b.summary}</p>
                <div className="pt-2">
                  <Link href={`/locations`} className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                    <span>Xem vị trí và ảnh phòng</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 360 Call-To-Action Banner */}
        <section className="bg-gradient-to-tr from-primary/10 via-surface-container to-primary/5 rounded-3xl p-8 sm:p-12 border border-primary/20 text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse">view_in_ar</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-on-surface">
            Trải Nghiệm Toàn Cảnh Campus Trong Không Gian 360°
          </h2>
          <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
            Quan sát giảng đường, xưởng phần mềm và phòng lab hiện đại tại CVPM Quang Trung trước khi đến trực tiếp.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/campus" className="ui-btn ui-btn-primary min-h-[46px] px-6 text-sm font-bold">
              <span>Bật Tour 360° Ngay</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

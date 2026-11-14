import React from "react";
import Link from "next/link";
import {
  CAMPUS_LOCATIONS,
  OPEN_DAY_SESSIONS,
  TOUR_SCENES,
} from "@/data/campus-data";

export function AdminDashboardMetrics() {
  const totalHotspots = TOUR_SCENES.reduce(
    (sum, scene) => sum + scene.hotspots.length,
    0,
  );

  const cards = [
    {
      label: "Lượt xem Virtual Campus 360°",
      value: "128,450",
      unit: "lượt truy cập",
      note: "+18.4% tăng trưởng tuần này",
      positive: true,
      href: "/admin/virtual-tour",
      icon: "visibility",
    },
    {
      label: "Đăng ký Open Day 2026",
      value: "3,820",
      unit: "thí sinh & phụ huynh",
      note: "Đạt 95.5% chỉ tiêu đợt 1",
      positive: true,
      href: "/admin/events",
      icon: "confirmation_number",
    },
    {
      label: "Không gian 360° & Hotspots",
      value: `${TOUR_SCENES.length}`,
      unit: `cảnh · ${totalHotspots} điểm nối`,
      note: "Chuẩn Panorama 8K sắc nét",
      positive: true,
      href: "/admin/locations",
      icon: "view_in_ar",
    },
    {
      label: "Độ sẵn sàng hệ thống",
      value: "99.98%",
      unit: "SLA hoạt động",
      note: "Hạ tầng Cloud & CDN QTSC",
      positive: true,
      href: "/admin/users",
      icon: "verified",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="ui-card ui-card-hover p-6 rounded-3xl border border-surface-container flex flex-col justify-between gap-4 transition-all hover:shadow-elevation-1 bg-surface-container-lowest"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">{card.label}</span>
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                {card.icon}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                {card.value}
              </span>
              <span className="text-xs font-semibold text-secondary">{card.unit}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>{card.note}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import {
  CAMPUS_LOCATIONS,
  INITIAL_ADMIN_USERS,
  INITIAL_MEDIA_ASSETS,
  OPEN_DAY_SESSIONS,
  TOUR_SCENES,
} from "@/data/campus-data";

export function AdminDashboardMetrics() {
  const totalHotspots = TOUR_SCENES.reduce(
    (sum, scene) => sum + scene.hotspots.length,
    0
  );
  const pendingFirstLogin = INITIAL_ADMIN_USERS.filter(
    (u) => u.passwordStatus === "must_change"
  ).length;
  const checkedInCount = INITIAL_ADMIN_USERS.filter(
    (u) => u.role === "participant" && u.checkedIn
  ).length;
  const totalParticipants = INITIAL_ADMIN_USERS.filter(
    (u) => u.role === "participant"
  ).length;

  const cards = [
    {
      label: "Không gian đã xuất bản",
      value: `${CAMPUS_LOCATIONS.filter((l) => l.status === "published").length}/${CAMPUS_LOCATIONS.length}`,
      note: "Địa điểm QTSC hiển thị công khai",
      href: "/admin/locations",
      icon: "location_on",
    },
    {
      label: "Điểm nhìn & Hotspot 360°",
      value: `${TOUR_SCENES.length} cảnh · ${totalHotspots} điểm`,
      note: "Chuẩn 2:1 nội bộ",
      href: "/admin/virtual-tour",
      icon: "360",
    },
    {
      label: "Lịch & Check-in Open Day",
      value:
        totalParticipants > 0
          ? `${OPEN_DAY_SESSIONS.length} phiên · ${checkedInCount}/${totalParticipants}`
          : `${OPEN_DAY_SESSIONS.length} phiên công khai`,
      note:
        totalParticipants > 0
          ? "Bản ghi tham dự Open Day (Preview)"
          : "Chưa nạp danh sách tham dự",
      href: "/admin/events",
      icon: "event",
    },
    {
      label: "Tài khoản & Media 2:1",
      value: `${INITIAL_ADMIN_USERS.length} tài khoản · ${INITIAL_MEDIA_ASSETS.length} tệp`,
      note:
        pendingFirstLogin > 0
          ? `${pendingFirstLogin} chờ kích hoạt (Preview)`
          : "Sẵn sàng đồng bộ Backend Phase 3",
      href: "/admin/users",
      icon: "group",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="ui-card ui-card-hover p-5 flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-secondary">{card.label}</span>
            <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                {card.icon}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-on-surface tracking-tight">{card.value}</p>
            <p className="text-xs text-secondary mt-1">{card.note}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

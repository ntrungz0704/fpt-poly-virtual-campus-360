"use client";

import React from "react";
import Link from "next/link";
import { CampusBuildingItem } from "@/data/campus-data";
import { Badge, Drawer } from "@/components/ui";

interface BuildingDetailDrawerProps {
  building: CampusBuildingItem | null;
  distanceSummary?: string;
  originLabel?: string;
  onClose: () => void;
}

export function BuildingDetailDrawer({
  building,
  distanceSummary,
  originLabel,
  onClose,
}: BuildingDetailDrawerProps) {
  return (
    <Drawer
      open={Boolean(building)}
      onClose={onClose}
      title={building?.name ?? "Thông tin tòa nhà"}
      description={
        building ? `${building.code} · ${building.floorsLabel}` : undefined
      }
      side="right"
      responsiveBottomOnMobile={true}
      nonBlocking={true}
      className="z-[1100]"
    >
      {building && (
        <div className="space-y-5 text-on-surface">
          <div className="relative h-44 w-full rounded-xl overflow-hidden bg-surface-container border border-surface-container">
            <img
              src={building.imageUrl}
              alt={building.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{building.categoryLabel}</Badge>
            <Badge variant="neutral">{building.statusNote}</Badge>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5">
            <div className="flex items-start gap-2 text-xs text-slate-700">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5"
              >
                location_on
              </span>
              <span>{building.addressNote}</span>
            </div>
            {distanceSummary && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0"
                >
                  directions_walk
                </span>
                <span>
                  {originLabel ? `Từ ${originLabel}: ` : "Ước tính: "}
                  {distanceSummary}
                </span>
              </div>
            )}
          </div>

          <p className="type-body-sm text-secondary leading-relaxed">
            {building.summary}
          </p>

          <div className="space-y-2.5 pt-2 border-t border-surface-container-low">
            <h3 className="type-label text-on-surface">Hạng mục bên trong</h3>
            <ul className="space-y-2">
              {building.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs sm:text-sm text-on-surface-variant"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[17px] text-primary shrink-0 mt-0.5"
                  >
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-surface-container-low flex flex-col gap-2.5">
            <Link
              href={`/campus?scene=${encodeURIComponent(building.defaultSceneId)}`}
              className="ui-btn ui-btn-primary w-full min-h-[44px] text-xs font-bold"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                360
              </span>
              <span>Mở Tour 360° tòa này</span>
            </Link>

            <Link
              href={`/locations?building=${encodeURIComponent(building.code)}`}
              className="ui-btn ui-btn-outline w-full min-h-[44px] text-xs font-semibold"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                meeting_room
              </span>
              <span>Xem danh sách phòng</span>
            </Link>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-btn ui-btn-outline w-full min-h-[44px] text-xs font-semibold text-sky-700 border-sky-200 hover:bg-sky-50"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                directions
              </span>
              <span>Chỉ đường Google Maps</span>
            </a>
          </div>
        </div>
      )}
    </Drawer>
  );
}

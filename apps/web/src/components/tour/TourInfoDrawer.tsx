"use client";

import React from "react";
import Link from "next/link";
import { TourSceneItem } from "@/data/campus-data";
import { Drawer } from "@/components/ui";

interface TourInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  scene: TourSceneItem;
  onSelectScene: (sceneId: string) => void;
}

export function TourInfoDrawer({
  open,
  onClose,
  scene,
  onSelectScene,
}: TourInfoDrawerProps) {
  const sceneLinks = scene.hotspots.filter((h) => h.type === "scene" && h.targetSceneId);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={scene.name}
      description={`${scene.buildingLabel} · ${scene.floor}`}
      side="left"
      responsiveBottomOnMobile={true}
      nonBlocking={true}
    >
      <div className="space-y-5 text-on-surface">
        <div className="relative h-40 w-full rounded-xl overflow-hidden bg-surface-container border border-surface-container">
          <img
            src={scene.thumbUrl}
            alt={scene.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2">
          <h3 className="type-label text-primary">Mô tả không gian</h3>
          <p className="type-body-sm text-secondary leading-relaxed">{scene.intro}</p>
        </div>

        {sceneLinks.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-surface-container-low">
            <h3 className="type-label text-on-surface">Di chuyển nhanh từ đây</h3>
            <div className="space-y-2">
              {sceneLinks.map((hs) => (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => {
                    if (hs.targetSceneId) {
                      onSelectScene(hs.targetSceneId);
                    }
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-surface-container bg-surface-container-low/60 hover:border-primary hover:bg-primary-fixed/30 flex items-center justify-between gap-2 text-left text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                >
                  <span className="truncate">{hs.label}</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary shrink-0">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-surface-container-low flex flex-col gap-2.5">
          <Link
            href={`/locations/${scene.linkedLocationSlug}`}
            className="ui-btn ui-btn-primary w-full min-h-[44px] text-xs font-bold"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
              meeting_room
            </span>
            <span>Xem hồ sơ địa điểm</span>
          </Link>
          <Link
            href={`/map?building=${encodeURIComponent(scene.buildingCode)}`}
            className="ui-btn ui-btn-outline w-full min-h-[44px] text-xs font-semibold"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[17px]">
              map
            </span>
            <span>Định vị trên Bản đồ GIS</span>
          </Link>
        </div>
      </div>
    </Drawer>
  );
}

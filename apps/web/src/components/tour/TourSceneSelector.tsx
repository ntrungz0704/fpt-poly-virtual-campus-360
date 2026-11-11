"use client";

import React from "react";
import { TourSceneItem } from "@/data/campus-data";
import { cn } from "@/lib/utils";

interface TourSceneSelectorProps {
  scenes: TourSceneItem[];
  currentSceneId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelectScene: (sceneId: string) => void;
  onPrevScene: () => void;
  onNextScene: () => void;
}

export function TourSceneSelector({
  scenes,
  currentSceneId,
  expanded,
  onToggleExpand,
  onSelectScene,
  onPrevScene,
  onNextScene,
}: TourSceneSelectorProps) {
  const currentIndex = Math.max(
    0,
    scenes.findIndex((s) => s.id === currentSceneId)
  );
  const currentScene = scenes[currentIndex];

  if (!expanded) {
    return (
      <div
        data-panorama-control
        className="pointer-events-auto flex items-center gap-1.5 glass-hud-dark border border-white/15 rounded-full p-1.5 shadow-elevation-2 text-white"
      >
        <button
          type="button"
          onClick={onPrevScene}
          aria-label="Cảnh trước"
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          className="min-h-[40px] px-3 py-1.5 rounded-full hover:bg-white/10 flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[17px] text-primary-container">
            photo_library
          </span>
          <span className="max-w-[160px] sm:max-w-[220px] truncate">
            {currentScene?.name} ({currentIndex + 1}/{scenes.length})
          </span>
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
            expand_less
          </span>
        </button>

        <button
          type="button"
          onClick={onNextScene}
          aria-label="Cảnh tiếp theo"
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-panorama-control
      className="pointer-events-auto w-full max-w-[860px] glass-hud-dark border border-white/15 rounded-2xl p-2.5 shadow-elevation-3 text-white space-y-2"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary-container">
            tour
          </span>
          <span>
            Lộ trình tham quan ({currentIndex + 1}/{scenes.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevScene}
            aria-label="Điểm dừng trước"
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>
          <button
            type="button"
            onClick={onNextScene}
            aria-label="Điểm dừng tiếp theo"
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label="Thu gọn thanh chọn cảnh"
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              expand_more
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {scenes.map((scene) => {
          const active = scene.id === currentSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelectScene(scene.id)}
              className={cn(
                "group shrink-0 w-36 sm:w-40 rounded-xl overflow-hidden border text-left transition-all cursor-pointer",
                active
                  ? "border-primary-container ring-2 ring-primary-container/50 bg-white/15"
                  : "border-white/15 bg-white/5 hover:border-white/40"
              )}
            >
              <div className="relative h-14 w-full bg-slate-900 overflow-hidden">
                <img
                  src={scene.thumbUrl}
                  alt={scene.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[11px] font-bold text-white truncate">{scene.name}</p>
                <p className="text-[10px] text-white/70 truncate">{scene.buildingLabel}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

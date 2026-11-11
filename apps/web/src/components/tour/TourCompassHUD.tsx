"use client";

import React from "react";

interface TourCompassHUDProps {
  yaw: number;
  fov: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function TourCompassHUD({
  yaw,
  fov,
  onZoomIn,
  onZoomOut,
  onResetView,
}: TourCompassHUDProps) {
  const normalizedYaw = Math.round(((yaw % 360) + 360) % 360);
  const zoomPercent = Math.round((75 / Math.max(fov, 1)) * 100);

  return (
    <div
      data-panorama-control
      className="pointer-events-auto flex flex-col items-center gap-1.5 p-1.5 rounded-2xl glass-hud-dark border border-white/15 shadow-elevation-2 text-white"
    >
      <button
        type="button"
        onClick={onResetView}
        title={`Hướng nhìn ${normalizedYaw}° — Đặt lại góc nhìn mặc định`}
        aria-label="La bàn — đặt lại góc nhìn mặc định"
        className="w-11 h-11 rounded-xl hover:bg-white/10 flex flex-col items-center justify-center transition-colors cursor-pointer"
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[18px] text-primary-container transition-transform duration-150"
          style={{ transform: `rotate(${normalizedYaw}deg)` }}
        >
          explore
        </span>
        <span className="text-[9px] font-mono text-white/80 leading-none mt-0.5">
          {normalizedYaw}°
        </span>
      </button>

      <div className="w-6 h-px bg-white/15" aria-hidden="true" />

      <button
        type="button"
        onClick={onZoomIn}
        title="Phóng to góc nhìn"
        aria-label="Phóng to góc nhìn 360"
        className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
          add
        </span>
      </button>

      <span className="text-[10px] font-mono text-white/75 select-none">
        {zoomPercent}%
      </span>

      <button
        type="button"
        onClick={onZoomOut}
        title="Thu nhỏ góc nhìn"
        aria-label="Thu nhỏ góc nhìn 360"
        className="w-11 h-11 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
          remove
        </span>
      </button>
    </div>
  );
}

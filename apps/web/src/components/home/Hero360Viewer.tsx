"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OFFICIAL_CAMPUS_INFO, TOUR_SCENES } from "@/data/campus-data";
import { PanoramaStage } from "@/components/tour/PanoramaStage";

const HERO_SCENE =
  TOUR_SCENES.find((s) => s.id === "cong-chao-qtsc") ?? TOUR_SCENES[0];

const AUTO_ROTATE_RESUME_MS = 3000;

export function Hero360Viewer() {
  const router = useRouter();
  const [dragState, setDragState] = useState<"auto" | "dragging" | "cooldown">("auto");
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleHotspotScene = (sceneId: string) => {
    router.push(`/campus?scene=${encodeURIComponent(sceneId)}`);
  };

  const handleInteractionChange = (isDragging: boolean) => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    if (isDragging) {
      setDragState("dragging");
      return;
    }

    setDragState("cooldown");
    resumeTimerRef.current = setTimeout(() => {
      setDragState("auto");
      resumeTimerRef.current = null;
    }, AUTO_ROTATE_RESUME_MS);
  };

  return (
    <section
      aria-label="Không gian 360 độ Khuôn viên FPT Polytechnic QTSC"
      className="relative w-full h-[calc(100vh-64px)] min-h-[540px] max-h-[760px] bg-slate-950 overflow-hidden"
    >
      {/* Interactive Panorama Stage — auto-rotates, yields on drag, resumes 3s after release */}
      <div className="absolute inset-0">
        <PanoramaStage
          scene={HERO_SCENE}
          autoRotate={true}
          autoRotateSpeed={0.025}
          autoRotateResumeDelayMs={AUTO_ROTATE_RESUME_MS}
          onInteractionChange={handleInteractionChange}
          enableWheelZoom={false}
          showHotspots={false}
          onSelectScene={handleHotspotScene}
        />
      </div>

      {/* Editorial bottom scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent z-10"
      />

      {/* Top-Left Anchor (1): Campus identity pill */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 sm:top-6 sm:left-6 z-20 flex items-center justify-between gap-3 home-hero-enter">
        <div className="glass-hud-dark text-white px-3.5 py-2 rounded-full inline-flex items-center gap-2 text-xs font-semibold border border-white/15">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary-container">
            location_on
          </span>
          <span>{OFFICIAL_CAMPUS_INFO.campusLabel}</span>
        </div>

        {/* Top-Right Anchor (2): Quiet 360 drag & auto-resume cue */}
        <div className="hidden sm:inline-flex glass-hud-dark text-white/90 px-3.5 py-2 rounded-full items-center gap-1.5 text-xs font-medium border border-white/15">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary-container">
            360
          </span>
          <span>
            {dragState === "dragging"
              ? "Đang xoay góc nhìn"
              : dragState === "cooldown"
              ? "Tự xoay lại sau 3s..."
              : "Kéo để xoay toàn cảnh"}
          </span>
        </div>
      </div>

      {/* Bottom Foreground Content */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-7 sm:pb-10 pt-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3 pointer-events-auto">
            <h1 className="type-display text-white drop-shadow-sm home-hero-enter">
              Tham quan Khuôn viên QTSC 360°
            </h1>
            <p className="type-body-lg text-white/85 max-w-xl home-hero-enter-delay-1">
              Trải nghiệm trực tiếp các tòa nhà, phòng Lab và không gian học tập tại
              FPT Polytechnic Quận 12 mà không cần đăng nhập.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 home-hero-enter-delay-2">
              <Link
                href="/campus"
                className="group ui-btn ui-btn-primary min-h-[46px] px-5 py-2.5 text-sm font-bold shadow-elevation-2"
              >
                <span>Bắt đầu tham quan tự do</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                  arrow_forward
                </span>
              </Link>
              <Link
                href="/events"
                className="ui-btn min-h-[46px] px-5 py-2.5 text-sm font-semibold glass-hud-dark text-white border border-white/25 hover:bg-slate-900/90"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  event_available
                </span>
                <span>Khám phá Open Day</span>
              </Link>
            </div>
          </div>

          <div className="pointer-events-auto self-start lg:self-end home-hero-enter-delay-2">
            <Link
              href="/map"
              className="group glass-hud-dark hover:bg-slate-900/95 text-white px-4 py-2.5 rounded-xl border border-white/20 inline-flex items-center gap-2.5 text-xs font-semibold transition-colors min-h-[44px]"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary-container transition-transform group-hover:scale-110">
                map
              </span>
              <span>Xem Bản đồ GIS Khuôn viên</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

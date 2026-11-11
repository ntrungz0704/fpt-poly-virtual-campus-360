"use client";

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { TOUR_SCENES, TourSceneItem } from "@/data/campus-data";
import { PanoramaStage, PanoramaStageHandle } from "./PanoramaStage";
import { TourCompassHUD } from "./TourCompassHUD";
import { TourSceneSelector } from "./TourSceneSelector";
import { TourInfoDrawer } from "./TourInfoDrawer";

interface VirtualTourViewerProps {
  initialSceneId?: string;
}

function subscribeMediaQuery(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(max-width: 767px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

export function VirtualTourViewer({ initialSceneId }: VirtualTourViewerProps) {
  const publishedScenes = TOUR_SCENES.filter((s) => s.status === "published");
  const validInitial =
    publishedScenes.find((s) => s.id === initialSceneId) ?? publishedScenes[0];

  const isMobileViewport = useSyncExternalStore(
    subscribeMediaQuery,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );

  const [currentScene, setCurrentScene] = useState<TourSceneItem>(validInitial);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectorPref, setSelectorPref] = useState<boolean | null>(null);
  const selectorExpanded = selectorPref ?? !isMobileViewport;
  const [hideUi, setHideUi] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraReadout, setCameraReadout] = useState({
    yaw: validInitial.initialView.yaw,
    pitch: validInitial.initialView.pitch,
    fov: validInitial.initialView.fov,
  });

  const stageRef = useRef<PanoramaStageHandle>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleSelectScene = useCallback(
    (sceneId: string) => {
      const found = publishedScenes.find((s) => s.id === sceneId);
      if (found) {
        setCurrentScene(found);
        setCameraReadout({
          yaw: found.initialView.yaw,
          pitch: found.initialView.pitch,
          fov: found.initialView.fov,
        });
      }
    },
    [publishedScenes]
  );

  const handleStepScene = useCallback(
    (dir: -1 | 1) => {
      const idx = publishedScenes.findIndex((s) => s.id === currentScene.id);
      const nextIdx =
        (idx + dir + publishedScenes.length) % publishedScenes.length;
      handleSelectScene(publishedScenes[nextIdx].id);
    },
    [publishedScenes, currentScene.id, handleSelectScene]
  );

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && wrapperRef.current) {
        await wrapperRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if fullscreen blocked by browser policy
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden"
    >
      {/* Full-bleed Shared WebGL Engine (>= 90% Viewport Unobstructed) */}
      <PanoramaStage
        ref={stageRef}
        scene={currentScene}
        onSelectScene={handleSelectScene}
        onCameraMove={setCameraReadout}
        hideUi={hideUi}
        autoRotate={autoRotate}
        autoRotateSpeed={0.03}
        autoRotateResumeDelayMs={3000}
        enableWheelZoom={true}
        showHotspots={true}
      />

      {/* Minimal Top HUD Layer */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-start justify-between gap-2">
        {/* Top-Left Capsule: Scene Identity + Info Drawer Toggle */}
        {!hideUi ? (
          <div
            data-panorama-control
            className="pointer-events-auto glass-hud-dark border border-white/15 rounded-2xl px-3.5 py-2 flex items-center gap-3 shadow-elevation-2 text-white max-w-[calc(100%-150px)] sm:max-w-md"
          >
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {currentScene.name}
              </p>
              <p className="text-[11px] text-white/75 truncate">
                {currentScene.buildingLabel} · {currentScene.floor}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              aria-expanded={drawerOpen}
              aria-label="Mở thông tin không gian"
              className="shrink-0 min-h-[40px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                info
              </span>
              <span className="hidden sm:inline">Thông tin</span>
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Top-Right Compact Controls: Auto-rotate, Hide UI, Fullscreen */}
        <div
          data-panorama-control
          className="pointer-events-auto glass-hud-dark border border-white/15 rounded-2xl p-1 flex items-center gap-1 shadow-elevation-2 text-white shrink-0"
        >
          {!hideUi && (
            <button
              type="button"
              onClick={() => setAutoRotate((prev) => !prev)}
              aria-pressed={autoRotate}
              title={autoRotate ? "Tạm dừng tự xoay" : "Bật tự xoay nhẹ"}
              aria-label={autoRotate ? "Tạm dừng tự xoay" : "Bật tự xoay nhẹ"}
              className={`min-h-[40px] min-w-[40px] px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                autoRotate ? "bg-primary text-white" : "hover:bg-white/10 text-white/90"
              }`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                360
              </span>
              <span className="hidden md:inline">Xoay</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setHideUi((prev) => !prev)}
            aria-pressed={hideUi}
            title={hideUi ? "Hiện thanh điều khiển" : "Ẩn thanh điều khiển"}
            aria-label={hideUi ? "Hiện thanh điều khiển" : "Ẩn thanh điều khiển"}
            className={`min-h-[40px] min-w-[40px] px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              hideUi ? "bg-primary text-white" : "hover:bg-white/10 text-white/90"
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              {hideUi ? "visibility" : "visibility_off"}
            </span>
            <span className="hidden sm:inline">{hideUi ? "Hiện UI" : "Ẩn UI"}</span>
          </button>

          {!hideUi && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/90 transition-colors cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Row */}
      {!hideUi && (
        <>
          {/* Left Compact Zoom + Compass */}
          <div className="pointer-events-none absolute left-3 sm:left-4 bottom-20 sm:bottom-4 z-20">
            <TourCompassHUD
              yaw={cameraReadout.yaw}
              fov={cameraReadout.fov}
              onZoomIn={() => stageRef.current?.zoomIn()}
              onZoomOut={() => stageRef.current?.zoomOut()}
              onResetView={() => stageRef.current?.resetView()}
            />
          </div>

          {/* Center-Bottom Collapsible Scene Selector */}
          <div className="pointer-events-none absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-20 sm:right-20 z-20 flex justify-center">
            <TourSceneSelector
              scenes={publishedScenes}
              currentSceneId={currentScene.id}
              expanded={selectorExpanded}
              onToggleExpand={() => setSelectorPref((prev) => !(prev ?? !isMobileViewport))}
              onSelectScene={handleSelectScene}
              onPrevScene={() => handleStepScene(-1)}
              onNextScene={() => handleStepScene(1)}
            />
          </div>
        </>
      )}

      {/* On-Demand Info Drawer (Closed by Default) */}
      <TourInfoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        scene={currentScene}
        onSelectScene={handleSelectScene}
      />
    </div>
  );
}

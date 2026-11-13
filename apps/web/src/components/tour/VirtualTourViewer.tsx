"use client";

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { TourSceneItem } from "@/data/campus-data";
import {
  fetchPublicTourNodeBySlug,
  fetchPublicTourNodes,
  mapTourNodeDetailToScene,
  mapTourNodeSummaryToScene,
} from "@/lib/public/public-api";
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
  const isMobileViewport = useSyncExternalStore(
    subscribeMediaQuery,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );

  const [scenes, setScenes] = useState<TourSceneItem[]>([]);
  const [currentScene, setCurrentScene] = useState<TourSceneItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectorPref, setSelectorPref] = useState<boolean | null>(null);
  const selectorExpanded = selectorPref ?? !isMobileViewport;
  const [hideUi, setHideUi] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraReadout, setCameraReadout] = useState({
    yaw: 0,
    pitch: 0,
    fov: 70,
  });

  const stageRef = useRef<PanoramaStageHandle>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneCacheRef = useRef<Map<string, TourSceneItem>>(new Map());

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nodeList = await fetchPublicTourNodes();
        if (cancelled) return;
        if (!nodeList || nodeList.length === 0) {
          setLoadError("Chưa có điểm nhìn 360° nào được công bố.");
          setIsLoading(false);
          return;
        }

        // Initialize initial scene summaries
        const baseScenes = nodeList.map(mapTourNodeSummaryToScene);
        setScenes(baseScenes);

        const targetSlug =
          initialSceneId && nodeList.some((n) => n.slug === initialSceneId)
            ? initialSceneId
            : nodeList[0].slug;

        const detail = await fetchPublicTourNodeBySlug(targetSlug);
        if (cancelled) return;

        const activeScene = mapTourNodeDetailToScene(detail);
        sceneCacheRef.current.set(activeScene.id, activeScene);

        setCurrentScene(activeScene);
        setCameraReadout({
          yaw: activeScene.initialView.yaw,
          pitch: activeScene.initialView.pitch,
          fov: activeScene.initialView.fov,
        });

        // Update active scene in scenes list
        setScenes((prev) =>
          prev.map((s) => (s.id === activeScene.id ? activeScene : s))
        );

        // Prefetch remaining node details in background so transitions are instantaneous
        const remaining = nodeList.filter((n) => n.slug !== targetSlug);
        Promise.all(
          remaining.map(async (item) => {
            try {
              const d = await fetchPublicTourNodeBySlug(item.slug);
              if (cancelled) return;
              const sc = mapTourNodeDetailToScene(d);
              sceneCacheRef.current.set(sc.id, sc);
              setScenes((prev) =>
                prev.map((s) => (s.id === sc.id ? sc : s))
              );
            } catch {
              // Ignore prefetch failure for individual node
            }
          })
        );
      } catch {
        if (!cancelled) {
          setLoadError("Không thể kết nối máy chủ API công khai. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialSceneId, reloadKey]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleSelectScene = useCallback(
    async (sceneId: string) => {
      // Check cache first
      const cached = sceneCacheRef.current.get(sceneId);
      if (cached) {
        setCurrentScene(cached);
        setCameraReadout({
          yaw: cached.initialView.yaw,
          pitch: cached.initialView.pitch,
          fov: cached.initialView.fov,
        });
        return;
      }

      // Fetch detail if not yet in cache
      try {
        const detail = await fetchPublicTourNodeBySlug(sceneId);
        const scene = mapTourNodeDetailToScene(detail);
        sceneCacheRef.current.set(scene.id, scene);
        setCurrentScene(scene);
        setScenes((prev) =>
          prev.map((s) => (s.id === scene.id ? scene : s))
        );
        setCameraReadout({
          yaw: scene.initialView.yaw,
          pitch: scene.initialView.pitch,
          fov: scene.initialView.fov,
        });
      } catch {
        // Fallback to existing scene if available
        const fallback = scenes.find((s) => s.id === sceneId);
        if (fallback) {
          setCurrentScene(fallback);
          setCameraReadout({
            yaw: fallback.initialView.yaw,
            pitch: fallback.initialView.pitch,
            fov: fallback.initialView.fov,
          });
        }
      }
    },
    [scenes]
  );

  const handleStepScene = useCallback(
    (dir: -1 | 1) => {
      if (!currentScene || scenes.length === 0) return;
      const idx = scenes.findIndex((s) => s.id === currentScene.id);
      const nextIdx = (idx + dir + scenes.length) % scenes.length;
      handleSelectScene(scenes[nextIdx].id);
    },
    [scenes, currentScene, handleSelectScene]
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
      {isLoading && !currentScene && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Đang tải không gian 360° từ hệ thống...</p>
        </div>
      )}

      {loadError && !currentScene && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center gap-3">
          <span aria-hidden="true" className="material-symbols-outlined text-4xl text-amber-400">
            error_outline
          </span>
          <p className="text-sm text-slate-300 max-w-sm">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setLoadError(null);
              setReloadKey((k) => k + 1);
            }}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Full-bleed Shared WebGL Engine (>= 90% Viewport Unobstructed) */}
      {currentScene && (
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
      )}

      {/* Minimal Top HUD Layer */}
      {currentScene && (
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
      )}

      {/* Bottom Controls Row */}
      {currentScene && !hideUi && (
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
              scenes={scenes}
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
      {currentScene && (
        <TourInfoDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          scene={currentScene}
          onSelectScene={handleSelectScene}
        />
      )}
    </div>
  );
}

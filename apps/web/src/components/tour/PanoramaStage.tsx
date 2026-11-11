"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { TourHotspotItem, TourSceneItem } from "@/data/campus-data";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ui";

export interface PanoramaStageHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusAngles: (yaw: number, pitch: number, fov?: number) => void;
}

export interface PanoramaStageProps {
  scene: TourSceneItem;
  hotspots?: TourHotspotItem[];
  onSelectScene?: (sceneId: string) => void;
  onSelectHotspot?: (hotspot: TourHotspotItem) => void;
  onSphereClick?: (yaw: number, pitch: number) => void;
  onCameraMove?: (view: { yaw: number; pitch: number; fov: number }) => void;
  hideUi?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateResumeDelayMs?: number;
  onInteractionChange?: (isDragging: boolean) => void;
  enableWheelZoom?: boolean;
  showHotspots?: boolean;
  selectedHotspotId?: string | null;
  className?: string;
  children?: React.ReactNode;
}

const SPHERE_RADIUS = 500;
const HOTSPOT_RADIUS = 460;
const DEFAULT_MAX_PITCH_DEG = 75;

function sphericalToCartesian(yawDeg: number, pitchDeg: number, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - pitchDeg);
  // Shift +180deg so yaw=0 faces the clean horizontal center (u=0.5) instead of texture wrap edge (u=0/1)
  const theta = THREE.MathUtils.degToRad(yawDeg + 180);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Normalizes cropped cylindrical 360° panoramas (aspect > 2.15, e.g. 3:1) onto a 2:1 equirectangular
 * canvas with blurred skylight/floor caps so vertical geometry stays undistorted without tearing.
 */
function preparePanoramaTexture(texture: THREE.Texture): {
  prepared: THREE.Texture;
  maxPitchDeg: number;
} {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const img = texture.image as
    | (CanvasImageSource & { width?: number; height?: number })
    | undefined;
  const w = img?.width ?? 0;
  const h = img?.height ?? 0;

  if (!img || !w || !h || w / h <= 2.15) {
    return { prepared: texture, maxPitchDeg: DEFAULT_MAX_PITCH_DEG };
  }

  try {
    const targetW = Math.min(w, 4096);
    const targetH = Math.round(targetW / 2);
    const bandH = Math.max(1, Math.round((targetW / w) * h));
    const topPad = Math.max(0, Math.floor((targetH - bandH) / 2));
    const botPad = Math.max(0, targetH - bandH - topPad);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { prepared: texture, maxPitchDeg: 48 };
    }

    const srcSampleH = Math.min(48, h);
    ctx.save();
    ctx.filter = "blur(22px)";
    if (topPad > 0) {
      ctx.save();
      ctx.translate(0, topPad + 16);
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, 0, w, srcSampleH, 0, 0, targetW, topPad + 16);
      ctx.restore();

      const topGrad = ctx.createLinearGradient(0, 0, 0, topPad);
      topGrad.addColorStop(0, "rgba(15, 23, 42, 0.28)");
      topGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, targetW, topPad);
    }

    if (botPad > 0) {
      const botStart = topPad + bandH;
      ctx.save();
      ctx.translate(0, botStart - 16);
      ctx.scale(1, -1);
      ctx.drawImage(
        img,
        0,
        Math.max(0, h - srcSampleH),
        w,
        srcSampleH,
        0,
        -(botPad + 16),
        targetW,
        botPad + 16
      );
      ctx.restore();

      const botGrad = ctx.createLinearGradient(0, botStart, 0, targetH);
      botGrad.addColorStop(0, "rgba(15, 23, 42, 0)");
      botGrad.addColorStop(1, "rgba(15, 23, 42, 0.24)");
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, botStart, targetW, botPad);
    }
    ctx.restore();

    ctx.filter = "none";
    ctx.drawImage(img, 0, 0, w, h, 0, topPad, targetW, bandH);

    const paddedTex = new THREE.CanvasTexture(canvas);
    paddedTex.colorSpace = THREE.SRGBColorSpace;
    paddedTex.minFilter = THREE.LinearFilter;
    paddedTex.magFilter = THREE.LinearFilter;
    paddedTex.generateMipmaps = false;
    paddedTex.wrapS = THREE.RepeatWrapping;
    paddedTex.wrapT = THREE.ClampToEdgeWrapping;
    paddedTex.needsUpdate = true;

    texture.dispose();

    const halfBandDeg = ((bandH / targetH) * 180) / 2;
    const maxPitchDeg = Math.round(
      THREE.MathUtils.clamp(halfBandDeg - 12, 22, DEFAULT_MAX_PITCH_DEG)
    );
    return { prepared: paddedTex, maxPitchDeg };
  } catch {
    return { prepared: texture, maxPitchDeg: 48 };
  }
}

export const PanoramaStage = forwardRef<PanoramaStageHandle, PanoramaStageProps>(
  function PanoramaStage(
    {
      scene,
      hotspots,
      onSelectScene,
      onSelectHotspot,
      onSphereClick,
      onCameraMove,
      hideUi = false,
      autoRotate = true,
      autoRotateSpeed = 0.03,
      autoRotateResumeDelayMs = 3000,
      onInteractionChange,
      enableWheelZoom = false,
      showHotspots = true,
      selectedHotspotId = null,
      className,
      children,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasHostRef = useRef<HTMLDivElement>(null);

    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const sphereMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
    const currentTexRef = useRef<THREE.Texture | null>(null);

    const viewRef = useRef({
      yaw: scene.initialView?.yaw ?? 0,
      pitch: scene.initialView?.pitch ?? 2,
      fov: scene.initialView?.fov ?? 75,
    });

    const dragRef = useRef({
      active: false,
      startX: 0,
      startY: 0,
      startYaw: 0,
      startPitch: 0,
      movedDistance: 0,
    });

    const hotspotNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const activeHotspots = hotspots ?? scene.hotspots;
    const hotspotsRef = useRef<TourHotspotItem[]>(activeHotspots);
    hotspotsRef.current = activeHotspots;

    const autoRotateRef = useRef(autoRotate);
    autoRotateRef.current = autoRotate;
    const autoSpeedRef = useRef(autoRotateSpeed);
    autoSpeedRef.current = autoRotateSpeed;
    const autoResumeDelayRef = useRef(autoRotateResumeDelayMs);
    autoResumeDelayRef.current = autoRotateResumeDelayMs;
    const lastDragEndAtRef = useRef<number>(0);
    const pitchLimitRef = useRef<number>(DEFAULT_MAX_PITCH_DEG);
    const onInteractionChangeRef = useRef(onInteractionChange);
    onInteractionChangeRef.current = onInteractionChange;
    const onCameraMoveRef = useRef(onCameraMove);
    onCameraMoveRef.current = onCameraMove;
    const onSphereClickRef = useRef(onSphereClick);
    onSphereClickRef.current = onSphereClick;

    const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
    const [retryNonce, setRetryNonce] = useState(0);
    const [openInfoId, setOpenInfoId] = useState<string | null>(null);

    const setHotspotNodeRef = useCallback(
      (id: string) => (node: HTMLDivElement | null) => {
        if (node) {
          hotspotNodesRef.current.set(id, node);
        } else {
          hotspotNodesRef.current.delete(id);
        }
      },
      []
    );

    useImperativeHandle(
      ref,
      () => ({
        zoomIn() {
          viewRef.current.fov = THREE.MathUtils.clamp(viewRef.current.fov - 10, 42, 95);
          if (cameraRef.current) {
            cameraRef.current.fov = viewRef.current.fov;
            cameraRef.current.updateProjectionMatrix();
          }
          onCameraMoveRef.current?.({ ...viewRef.current });
        },
        zoomOut() {
          viewRef.current.fov = THREE.MathUtils.clamp(viewRef.current.fov + 10, 42, 95);
          if (cameraRef.current) {
            cameraRef.current.fov = viewRef.current.fov;
            cameraRef.current.updateProjectionMatrix();
          }
          onCameraMoveRef.current?.({ ...viewRef.current });
        },
        resetView() {
          viewRef.current = {
            yaw: scene.initialView?.yaw ?? 0,
            pitch: scene.initialView?.pitch ?? 2,
            fov: scene.initialView?.fov ?? 75,
          };
          if (cameraRef.current) {
            cameraRef.current.fov = viewRef.current.fov;
            cameraRef.current.updateProjectionMatrix();
          }
          onCameraMoveRef.current?.({ ...viewRef.current });
        },
        focusAngles(yaw: number, pitch: number, fov?: number) {
          const limit = pitchLimitRef.current;
          viewRef.current.yaw = yaw;
          viewRef.current.pitch = THREE.MathUtils.clamp(pitch, -limit, limit);
          if (fov !== undefined) {
            viewRef.current.fov = THREE.MathUtils.clamp(fov, 42, 95);
            if (cameraRef.current) {
              cameraRef.current.fov = viewRef.current.fov;
              cameraRef.current.updateProjectionMatrix();
            }
          }
          onCameraMoveRef.current?.({ ...viewRef.current });
        },
      }),
      [scene]
    );

    // 1. Mount single shared WebGLRenderer + RAF loop once
    useEffect(() => {
      const host = canvasHostRef.current;
      const container = containerRef.current;
      if (!host || !container) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      } catch {
        setLoadState("error");
        return;
      }

      const width = container.clientWidth || 1280;
      const height = container.clientHeight || 720;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      host.innerHTML = "";
      host.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color(0x0f172a);
      sceneRef.current = threeScene;

      const camera = new THREE.PerspectiveCamera(
        viewRef.current.fov,
        width / Math.max(height, 1),
        0.1,
        1200
      );
      cameraRef.current = camera;

      const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 48);
      geometry.scale(-1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      sphereMatRef.current = material;

      const mesh = new THREE.Mesh(geometry, material);
      threeScene.add(mesh);

      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w <= 0 || h <= 0) return;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
      window.addEventListener("resize", handleResize);

      let frameId = 0;
      let lastReportYaw = viewRef.current.yaw;
      const targetVec = new THREE.Vector3();
      const projVec = new THREE.Vector3();

      const tick = () => {
        frameId = window.requestAnimationFrame(tick);

        const idleElapsed =
          lastDragEndAtRef.current === 0 ||
          performance.now() - lastDragEndAtRef.current >= autoResumeDelayRef.current;

        if (
          autoRotateRef.current &&
          !dragRef.current.active &&
          idleElapsed &&
          !prefersReducedMotion
        ) {
          viewRef.current.yaw = (viewRef.current.yaw + autoSpeedRef.current) % 360;
        }

        const limit = pitchLimitRef.current;
        const clampedPitch = THREE.MathUtils.clamp(viewRef.current.pitch, -limit, limit);
        viewRef.current.pitch = clampedPitch;

        const lookTarget = sphericalToCartesian(viewRef.current.yaw, clampedPitch, SPHERE_RADIUS);
        targetVec.copy(lookTarget);
        camera.lookAt(targetVec);
        camera.updateMatrixWorld();

        renderer.render(threeScene, camera);

        const cW = container.clientWidth;
        const cH = container.clientHeight;
        for (const hs of hotspotsRef.current) {
          const domNode = hotspotNodesRef.current.get(hs.id);
          if (!domNode) continue;

          const worldPos = sphericalToCartesian(hs.yaw, hs.pitch, HOTSPOT_RADIUS);
          projVec.copy(worldPos).project(camera);

          const isVisible = projVec.z < 1;
          if (!isVisible) {
            domNode.style.opacity = "0";
            domNode.style.pointerEvents = "none";
            domNode.style.transform = "translate3d(-9999px, -9999px, 0)";
            continue;
          }

          const screenX = (projVec.x * 0.5 + 0.5) * cW;
          const screenY = (-(projVec.y * 0.5) + 0.5) * cH;
          const offBounds =
            screenX < -40 || screenX > cW + 40 || screenY < -40 || screenY > cH + 40;

          if (offBounds) {
            domNode.style.opacity = "0";
            domNode.style.pointerEvents = "none";
          } else {
            domNode.style.opacity = "1";
            domNode.style.pointerEvents = "auto";
            domNode.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
          }
        }

        if (
          onCameraMoveRef.current &&
          Math.abs(viewRef.current.yaw - lastReportYaw) > 0.6
        ) {
          lastReportYaw = viewRef.current.yaw;
          onCameraMoveRef.current({ ...viewRef.current });
        }
      };

      frameId = window.requestAnimationFrame(tick);

      return () => {
        window.cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        geometry.dispose();
        material.dispose();
        if (currentTexRef.current) {
          currentTexRef.current.dispose();
          currentTexRef.current = null;
        }
        renderer.dispose();
        rendererRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        sphereMatRef.current = null;
      };
    }, []);

    // 2. Swap texture cleanly on scene change without recreating WebGLRenderer
    useEffect(() => {
      if (!sphereMatRef.current) return;
      let cancelled = false;
      setLoadState("loading");
      setOpenInfoId(null);

      viewRef.current = {
        yaw: scene.initialView?.yaw ?? 0,
        pitch: scene.initialView?.pitch ?? 2,
        fov: scene.initialView?.fov ?? 75,
      };
      if (cameraRef.current) {
        cameraRef.current.fov = viewRef.current.fov;
        cameraRef.current.updateProjectionMatrix();
      }
      onCameraMoveRef.current?.({ ...viewRef.current });

      const loader = new THREE.TextureLoader();
      loader.load(
        scene.bgUrl,
        (texture) => {
          if (cancelled) {
            texture.dispose();
            return;
          }
          const { prepared, maxPitchDeg } = preparePanoramaTexture(texture);
          pitchLimitRef.current = maxPitchDeg;
          viewRef.current.pitch = THREE.MathUtils.clamp(
            viewRef.current.pitch,
            -maxPitchDeg,
            maxPitchDeg
          );

          const oldTex = currentTexRef.current;
          currentTexRef.current = prepared;

          if (sphereMatRef.current) {
            sphereMatRef.current.map = prepared;
            sphereMatRef.current.needsUpdate = true;
          }
          if (oldTex && oldTex !== prepared) {
            oldTex.dispose();
          }
          setLoadState("ready");
        },
        undefined,
        () => {
          if (!cancelled) {
            setLoadState("error");
          }
        }
      );

      return () => {
        cancelled = true;
      };
    }, [scene.id, scene.bgUrl, scene.initialView, retryNonce]);

    // 3. Pointer drag, click-to-place-hotspot, and wheel zoom handlers
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-panorama-control]")) {
        return;
      }
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startYaw: viewRef.current.yaw,
        startPitch: viewRef.current.pitch,
        movedDistance: 0,
      };
      onInteractionChangeRef.current?.(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      dragRef.current.movedDistance = Math.hypot(dx, dy);

      const sensitivity = viewRef.current.fov / 420;
      const limit = pitchLimitRef.current;
      viewRef.current.yaw = dragRef.current.startYaw - dx * sensitivity;
      viewRef.current.pitch = THREE.MathUtils.clamp(
        dragRef.current.startPitch + dy * sensitivity,
        -limit,
        limit
      );
      onCameraMoveRef.current?.({ ...viewRef.current });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const wasActive = dragRef.current.active;
      const moved = dragRef.current.movedDistance;
      dragRef.current.active = false;
      if (wasActive) {
        lastDragEndAtRef.current = performance.now();
        onInteractionChangeRef.current?.(false);
      }
      if (wasActive && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      if (
        wasActive &&
        moved < 5 &&
        onSphereClickRef.current &&
        cameraRef.current &&
        containerRef.current &&
        !(e.target as HTMLElement).closest("[data-panorama-control]")
      ) {
        const rect = containerRef.current.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
        const dir = raycaster.ray.direction.clone().normalize();
        const clickedPitch = Number(
          (90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1)))).toFixed(
            1
          )
        );
        const rawTheta = THREE.MathUtils.radToDeg(Math.atan2(dir.z, dir.x));
        const normalizedYaw = ((rawTheta - 180 + 540) % 360) - 180;
        const clickedYaw = Number(normalizedYaw.toFixed(1));
        onSphereClickRef.current(clickedYaw, clickedPitch);
      }
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      if (!enableWheelZoom) return;
      e.preventDefault();
      viewRef.current.fov = THREE.MathUtils.clamp(
        viewRef.current.fov + (e.deltaY > 0 ? 4 : -4),
        42,
        95
      );
      if (cameraRef.current) {
        cameraRef.current.fov = viewRef.current.fov;
        cameraRef.current.updateProjectionMatrix();
      }
      onCameraMoveRef.current?.({ ...viewRef.current });
    };

    const handleRetry = () => {
      setRetryNonce((prev) => prev + 1);
    };

    const handleHotspotClick = (hs: TourHotspotItem) => {
      onSelectHotspot?.(hs);
      if (hs.type === "scene" && hs.targetSceneId && onSelectScene) {
        onSelectScene(hs.targetSceneId);
        return;
      }
      setOpenInfoId((curr) => (curr === hs.id ? null : hs.id));
    };

    return (
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={cn(
          "relative w-full h-full overflow-hidden bg-slate-950 select-none touch-none",
          onSphereClick ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {/* Single Three.js WebGL host */}
        <div
          ref={canvasHostRef}
          className="absolute inset-0 w-full h-full"
          aria-label={`Trình xem 360 độ: ${scene.name}`}
        />

        {/* Subtle loading indicator */}
        {loadState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs pointer-events-none z-20">
            <div className="glass-hud-dark text-white px-4 py-2.5 rounded-full flex items-center gap-2.5 text-xs font-semibold">
              <span className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
              <span>Đang tải góc nhìn 360°...</span>
            </div>
          </div>
        )}

        {/* Fallback UI if texture or WebGL fails */}
        {loadState === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950 z-30">
            <div className="max-w-md w-full">
              <ErrorState
                title="Không thể tải khung cảnh 360°"
                description="Trình duyệt chưa khởi tạo được WebGL hoặc tệp ảnh panorama tạm thời chưa sẵn sàng."
                actionLabel="Thử lại"
                onAction={handleRetry}
              />
            </div>
          </div>
        )}

        {/* Spatial Hotspot Layer */}
        {showHotspots && !hideUi && loadState === "ready" && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {activeHotspots.map((hs) => {
              const isSceneLink = hs.type === "scene";
              const isOpen = openInfoId === hs.id || selectedHotspotId === hs.id;
              return (
                <div
                  key={hs.id}
                  ref={setHotspotNodeRef(hs.id)}
                  data-panorama-control
                  className="absolute top-0 left-0 will-change-transform transition-opacity duration-150"
                  style={{ opacity: 0, pointerEvents: "none" }}
                >
                  <div className="relative flex flex-col items-center">
                    {isOpen && hs.infoText && (
                      <div className="mb-2 w-60 rounded-xl glass-hud-dark text-white p-3 shadow-elevation-3 border border-white/15 pointer-events-auto">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-bold leading-snug">{hs.label}</span>
                          <button
                            type="button"
                            onClick={() => setOpenInfoId(null)}
                            aria-label="Đóng ghi chú hotspot"
                            className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white/75 shrink-0"
                          >
                            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                              close
                            </span>
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed text-white/85">{hs.infoText}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleHotspotClick(hs)}
                      aria-label={hs.label}
                      className={cn(
                        "pointer-events-auto min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold shadow-elevation-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                        isSceneLink
                          ? "bg-primary text-white border border-white/30"
                          : isOpen
                          ? "bg-slate-900 text-white border border-primary-container"
                          : "glass-hud-dark text-white border border-white/25"
                      )}
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        {isSceneLink ? "near_me" : "info"}
                      </span>
                      <span className="whitespace-nowrap max-w-[160px] truncate">{hs.label}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Child HUD / Overlay slots */}
        {children}
      </div>
    );
  }
);

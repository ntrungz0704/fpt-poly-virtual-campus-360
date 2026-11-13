"use client";

import React, { useMemo, useRef, useState } from "react";
import { TOUR_SCENES, TourHotspotItem, TourSceneItem } from "@/data/campus-data";
import { PanoramaStage, PanoramaStageHandle } from "@/components/tour/PanoramaStage";
import {
  Badge,
  Button,
  Input,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

function getInitialScenes(): TourSceneItem[] {
  if (typeof window === "undefined") return TOUR_SCENES;
  try {
    const saved = localStorage.getItem("vc_admin_tour_scenes");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default
  }
  return TOUR_SCENES;
}

export default function AdminVirtualTourPage() {
  const [scenes, setScenes] = useState<TourSceneItem[]>(getInitialScenes);
  const [activeSceneId, setActiveSceneId] = useState<string>(TOUR_SCENES[0].id);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    TOUR_SCENES[0].hotspots[0]?.id ?? null
  );
  const [cameraAngles, setCameraAngles] = useState({ yaw: 0, pitch: 2, fov: 68 });
  const [toast, setToast] = useState({ open: false, message: "" });

  const stageRef = useRef<PanoramaStageHandle>(null);

  const handleSaveTourConfiguration = () => {
    try {
      localStorage.setItem("vc_admin_tour_scenes", JSON.stringify(scenes));
      setToast({
        open: true,
        message: "Đã lưu toàn bộ cấu hình Tour 360° & Hotspot thành công!",
      });
    } catch {
      setToast({
        open: true,
        message: "Không thể lưu vào bộ nhớ cục bộ.",
      });
    }
  };

  const activeScene = useMemo(
    () => scenes.find((s) => s.id === activeSceneId) ?? scenes[0],
    [scenes, activeSceneId]
  );

  const selectedHotspot = useMemo(
    () => activeScene.hotspots.find((h) => h.id === selectedHotspotId) ?? null,
    [activeScene, selectedHotspotId]
  );

  const updateHotspotField = (
    hotspotId: string,
    patch: Partial<TourHotspotItem>
  ) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? {
              ...scene,
              hotspots: scene.hotspots.map((hs) =>
                hs.id === hotspotId ? { ...hs, ...patch } : hs
              ),
            }
          : scene
      )
    );
  };

  const handleSphereClick = (yaw: number, pitch: number) => {
    if (selectedHotspot) {
      updateHotspotField(selectedHotspot.id, { yaw, pitch });
      setToast({
        open: true,
        message: `Đã cập nhật tọa độ "${selectedHotspot.label}" (${yaw}°, ${pitch}°).`,
      });
    } else {
      const created: TourHotspotItem = {
        id: `hs-${Date.now()}`,
        label: "Điểm ghim mới",
        yaw,
        pitch,
        type: "info",
        infoText: "Ghi chú không gian tại vị trí đã chọn.",
      };
      setScenes((prev) =>
        prev.map((scene) =>
          scene.id === activeScene.id
            ? { ...scene, hotspots: [...scene.hotspots, created] }
            : scene
        )
      );
      setSelectedHotspotId(created.id);
      setToast({
        open: true,
        message: `Đã thêm hotspot tại góc (${yaw}°, ${pitch}°).`,
      });
    }
  };

  const handleAddCenterHotspot = () => {
    const created: TourHotspotItem = {
      id: `hs-${Date.now()}`,
      label: "Điểm chuyển cảnh mới",
      yaw: Math.round(cameraAngles.yaw * 10) / 10,
      pitch: Math.round(cameraAngles.pitch * 10) / 10,
      type: "scene",
      targetSceneId: scenes.find((s) => s.id !== activeScene.id)?.id ?? activeScene.id,
    };
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, hotspots: [...scene.hotspots, created] }
          : scene
      )
    );
    setSelectedHotspotId(created.id);
    setToast({ open: true, message: "Đã chèn hotspot ngay tâm góc nhìn." });
  };

  const handleDeleteHotspot = (id: string) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, hotspots: scene.hotspots.filter((h) => h.id !== id) }
          : scene
      )
    );
    if (selectedHotspotId === id) {
      setSelectedHotspotId(null);
    }
    setToast({ open: true, message: "Đã xóa hotspot khỏi cảnh này." });
  };

  const handleSaveInitialView = () => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? {
              ...scene,
              initialView: {
                yaw: Math.round(cameraAngles.yaw),
                pitch: Math.round(cameraAngles.pitch),
                fov: Math.round(cameraAngles.fov),
              },
            }
          : scene
      )
    );
    setToast({ open: true, message: "Đã lưu góc nhìn mở đầu cho cảnh hiện tại." });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Biên tập Tour 360° &amp; Hotspot</h1>
          <p className="type-body-sm text-secondary mt-1">
            Chọn cảnh, click trực tiếp lên không gian 360° để đặt tọa độ hotspot (yaw, pitch).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon="center_focus_strong"
            onClick={handleSaveInitialView}
          >
            Đặt làm góc nhìn mặc định
          </Button>
          <Button
            variant="outline"
            size="md"
            icon="add_location_alt"
            onClick={handleAddCenterHotspot}
          >
            Thêm hotspot ở tâm nhìn
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="save"
            onClick={handleSaveTourConfiguration}
            data-testid="save-tour-btn"
          >
            Lưu cấu hình Tour 360°
          </Button>
        </div>
      </div>

      {/* 3-Pane Operational Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Pane 1: Scene List */}
        <div className="xl:col-span-3 ui-card p-3 space-y-2">
          <p className="px-2 py-1 type-label text-secondary">Danh sách cảnh ({scenes.length})</p>
          <div className="space-y-1.5">
            {scenes.map((scene) => {
              const active = scene.id === activeScene.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => {
                    setActiveSceneId(scene.id);
                    setSelectedHotspotId(scene.hotspots[0]?.id ?? null);
                  }}
                  className={cn(
                    "w-full p-2.5 rounded-xl border text-left transition-colors flex items-center gap-3 cursor-pointer",
                    active
                      ? "bg-primary-fixed/50 border-primary text-on-surface"
                      : "bg-surface border-transparent hover:bg-surface-container-low"
                  )}
                >
                  <img
                    src={scene.thumbUrl}
                    alt={scene.name}
                    className="w-12 h-9 rounded-lg object-cover shrink-0 bg-slate-900"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{scene.name}</p>
                    <p className="text-[11px] text-secondary truncate">
                      {scene.hotspots.length} hotspot · {scene.buildingLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pane 2: Interactive WebGL Panorama Canvas */}
        <div className="xl:col-span-6 ui-card overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-4 py-2.5 border-b border-surface-container bg-surface-container-low flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-on-surface truncate">
              {selectedHotspot
                ? `Click vào ảnh 360° để dời "${selectedHotspot.label}"`
                : "Click vào ảnh 360° để tạo hotspot mới"}
            </span>
            <span className="font-mono text-secondary shrink-0">
              Yaw {cameraAngles.yaw.toFixed(1)}° · Pitch {cameraAngles.pitch.toFixed(1)}°
            </span>
          </div>

          <div className="relative flex-1 min-h-[380px]">
            <PanoramaStage
              ref={stageRef}
              scene={activeScene}
              hotspots={activeScene.hotspots}
              selectedHotspotId={selectedHotspotId}
              onSelectHotspot={(hs) => setSelectedHotspotId(hs.id)}
              onSphereClick={handleSphereClick}
              onCameraMove={setCameraAngles}
              autoRotate={false}
              enableWheelZoom={true}
            />
          </div>
        </div>

        {/* Pane 3: Hotspot Inspector */}
        <div className="xl:col-span-3 ui-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="type-h3 text-on-surface">Hotspot trong cảnh</h2>
            <Badge variant="neutral">{activeScene.hotspots.length}</Badge>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-1">
            {activeScene.hotspots.map((hs) => {
              const selected = hs.id === selectedHotspotId;
              return (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => {
                    setSelectedHotspotId(hs.id);
                    stageRef.current?.focusAngles(hs.yaw, hs.pitch);
                  }}
                  className={cn(
                    "w-full min-h-[40px] px-3 py-2 rounded-lg border text-left text-xs flex items-center justify-between gap-2 cursor-pointer",
                    selected
                      ? "bg-primary-fixed/50 border-primary font-bold text-on-surface"
                      : "bg-surface border-surface-container hover:border-outline-variant"
                  )}
                >
                  <span className="truncate">{hs.label}</span>
                  <span className="font-mono text-[10px] text-secondary shrink-0">
                    {hs.type === "scene" ? "Chuyển cảnh" : "Ghi chú"}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedHotspot ? (
            <div className="pt-3 border-t border-surface-container space-y-3">
              <Input
                label="Nhãn hiển thị"
                value={selectedHotspot.label}
                onChange={(e) =>
                  updateHotspotField(selectedHotspot.id, { label: e.target.value })
                }
              />

              <Select
                label="Loại điểm ghim"
                value={selectedHotspot.type}
                onChange={(e) =>
                  updateHotspotField(selectedHotspot.id, {
                    type: e.target.value as TourHotspotItem["type"],
                  })
                }
              >
                <option value="scene">Chuyển sang cảnh 360° khác</option>
                <option value="info">Hiển thị thẻ thông tin</option>
              </Select>

              {selectedHotspot.type === "scene" ? (
                <Select
                  label="Cảnh đích"
                  value={selectedHotspot.targetSceneId ?? ""}
                  onChange={(e) =>
                    updateHotspotField(selectedHotspot.id, {
                      targetSceneId: e.target.value,
                    })
                  }
                >
                  {scenes.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Textarea
                  label="Nội dung thẻ ghi chú"
                  value={selectedHotspot.infoText ?? ""}
                  onChange={(e) =>
                    updateHotspotField(selectedHotspot.id, {
                      infoText: e.target.value,
                    })
                  }
                />
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Input
                  label="Yaw (°)"
                  type="number"
                  value={selectedHotspot.yaw}
                  onChange={(e) =>
                    updateHotspotField(selectedHotspot.id, {
                      yaw: Number(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label="Pitch (°)"
                  type="number"
                  value={selectedHotspot.pitch}
                  onChange={(e) =>
                    updateHotspotField(selectedHotspot.id, {
                      pitch: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-surface-container">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon="save"
                  className="w-full justify-center"
                  onClick={() => {
                    handleSaveTourConfiguration();
                    setToast({
                      open: true,
                      message: `Đã lưu thông tin điểm ghim "${selectedHotspot.label}" thành công!`,
                    });
                  }}
                  data-testid="save-hotspot-btn"
                >
                  Lưu điểm ghim này
                </Button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon="delete"
                    onClick={() => handleDeleteHotspot(selectedHotspot.id)}
                  >
                    Xóa
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedHotspotId(null)}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-secondary pt-3 border-t border-surface-container">
              Chọn một hotspot trong danh sách hoặc click trực tiếp lên ảnh 360° ở giữa để thêm mới.
            </p>
          )}
        </div>
      </div>

      <StatusToast
        open={toast.open}
        type="success"
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

"use client";

import React, { useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  TOUR_SCENES,
  TourHotspotItem,
  TourSceneItem,
  BuildingCode,
} from "@/data/campus-data";
import type { PanoramaStageHandle } from "@/components/tour/PanoramaStage";

const PanoramaStage = dynamic(
  () =>
    import("@/components/tour/PanoramaStage").then(
      (mod) => mod.PanoramaStage
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Đang tải không gian 360°...</span>
      </div>
    ),
  }
);
import {
  Badge,
  Button,
  Input,
  LoadingState,
  Modal,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  fetchAdminTourNodes,
  saveTourStudioBatch,
  publishTourScenes,
  unpublishTourScenes,
} from "@/lib/admin/tour-admin-api";
import { mediaApi, AdminMediaAssetItem } from "@/lib/auth/api-client";

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
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: "info" | "success" | "error" }>({
    open: false,
    message: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // --- Media Library Picker State ---
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"change_active_panorama" | "create_new_scene">("change_active_panorama");
  const [availablePanoramas, setAvailablePanoramas] = useState<AdminMediaAssetItem[]>([]);
  const [loadingPanoramas, setLoadingPanoramas] = useState(false);

  // --- Create Scene Modal State ---
  const [createSceneOpen, setCreateSceneOpen] = useState(false);
  const [newSceneForm, setNewSceneForm] = useState<{
    name: string;
    buildingCode: BuildingCode;
    buildingLabel: string;
    floor: string;
    intro: string;
    bgUrl: string;
    thumbUrl: string;
  }>({
    name: "",
    buildingCode: "INNOVATION",
    buildingLabel: "Tòa Innovation",
    floor: "Tầng 1",
    intro: "",
    bgUrl: "/images/panoramas/campus-courtyard-360.jpg",
    thumbUrl: "/images/locations/building-innovation.jpg",
  });

  const stageRef = useRef<PanoramaStageHandle>(null);

  // Load latest tour nodes from backend database on mount
  React.useEffect(() => {
    let mounted = true;
    fetchAdminTourNodes()
      .then((nodes) => {
        if (mounted && nodes && nodes.length > 0) {
          setScenes((prevScenes) =>
            prevScenes.map((scene) => {
              const matchedNode = nodes.find((n) => n.slug === scene.id);
              if (!matchedNode) return scene;
              return {
                ...scene,
                name: matchedNode.title,
                intro: matchedNode.intro,
                initialView: {
                  ...scene.initialView,
                  yaw: matchedNode.initialYaw,
                  pitch: matchedNode.initialPitch,
                  fov: matchedNode.initialFov || scene.initialView.fov,
                },
                hotspots:
                  matchedNode.hotspots && matchedNode.hotspots.length > 0
                    ? matchedNode.hotspots.map((h) => ({
                        id: h.id,
                        label: h.title,
                        yaw: h.yaw,
                        pitch: h.pitch,
                        type: (h.hotspotType === "SCENE_LINK" ? "scene" : "info") as "scene" | "info",
                        infoText: h.body ?? undefined,
                      }))
                    : scene.hotspots,
              };
            })
          );
        }
      })
      .catch(() => {
        // Fallback to initial scenes when backend is unreachable
      });
    return () => {
      mounted = false;
    };
  }, []);

  // --- Pre-flight Tour Integrity Check ---
  const tourIntegrity = useMemo(() => {
    const issues: string[] = [];
    const sceneIds = new Set(scenes.map((s) => s.id));

    scenes.forEach((scene) => {
      if (!scene.bgUrl) {
        issues.push(`Cảnh "${scene.name}" chưa có ảnh Panorama 360°.`);
      }
      scene.hotspots.forEach((hs) => {
        if (hs.type === "scene") {
          if (!hs.targetSceneId || !sceneIds.has(hs.targetSceneId)) {
            issues.push(
              `Điểm ghim "${hs.label}" trong cảnh "${scene.name}" trỏ tới cảnh đích không tồn tại.`
            );
          }
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [scenes]);

  // --- Open Media Picker for Panoramas ---
  const handleOpenMediaPicker = useCallback(async (target: "change_active_panorama" | "create_new_scene") => {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
    setLoadingPanoramas(true);

    try {
      const res = await mediaApi.listMedia({ assetKind: "PANORAMA_2_1", limit: 50 });
      setAvailablePanoramas(res.items);
    } catch {
      // If server unreachable, provide default fallback panoramas
      setAvailablePanoramas([]);
    } finally {
      setLoadingPanoramas(false);
    }
  }, []);

  const handleSelectPanorama = (asset: AdminMediaAssetItem) => {
    const url = asset.publicUrl || `/images/panoramas/${asset.originalFilename}`;
    if (mediaPickerTarget === "change_active_panorama") {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === activeSceneId
            ? { ...s, bgUrl: url, thumbUrl: url }
            : s
        )
      );
      setToast({
        open: true,
        message: `Đã cập nhật ảnh 360° cho cảnh hiện tại: "${asset.originalFilename}"`,
        type: "success",
      });
    } else {
      setNewSceneForm((f) => ({ ...f, bgUrl: url, thumbUrl: url }));
      setToast({
        open: true,
        message: `Đã chọn ảnh 360°: "${asset.originalFilename}"`,
        type: "success",
      });
    }
    setMediaPickerOpen(false);
  };

  // --- Handle Create New Scene ---
  const handleCreateNewScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneForm.name.trim()) return;

    const slug = newSceneForm.name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newScene: TourSceneItem = {
      id: slug || `scene-${Date.now()}`,
      name: newSceneForm.name.trim(),
      buildingCode: newSceneForm.buildingCode,
      buildingLabel: newSceneForm.buildingLabel,
      floor: newSceneForm.floor,
      category: "study",
      bgUrl: newSceneForm.bgUrl,
      thumbUrl: newSceneForm.thumbUrl,
      intro: newSceneForm.intro.trim() || `Không gian 360° tại ${newSceneForm.name}.`,
      linkedLocationSlug: slug,
      initialView: { yaw: 0, pitch: 0, fov: 70 },
      status: "draft",
      isEquirectangular2to1: true,
      hotspots: [],
    };

    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newScene.id);
    setSelectedHotspotId(null);
    setCreateSceneOpen(false);
    setToast({
      open: true,
      message: `Đã thêm cảnh 360° mới: "${newScene.name}"!`,
      type: "success",
    });
  };

  // --- Handle Delete Scene ---
  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      setToast({
        open: true,
        message: "Không thể xóa cảnh duy nhất còn lại trong tour.",
        type: "error",
      });
      return;
    }

    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    if (activeSceneId === sceneId) {
      const remaining = scenes.filter((s) => s.id !== sceneId);
      setActiveSceneId(remaining[0].id);
      setSelectedHotspotId(remaining[0].hotspots[0]?.id ?? null);
    }
    setToast({
      open: true,
      message: "Đã gỡ cảnh khỏi Tour 360°.",
      type: "info",
    });
  };

  const handleSaveTourConfiguration = async () => {
    setIsSaving(true);
    try {
      const res = await saveTourStudioBatch(scenes);
      setToast({
        open: true,
        message: `Đã lưu thành công ${res.savedCount} cảnh 360° & Hotspot trực tiếp vào Cơ sở dữ liệu PostgreSQL!`,
        type: "success",
      });
      try {
        localStorage.setItem("vc_admin_tour_scenes", JSON.stringify(scenes));
      } catch {
        // Ignore storage quota
      }
    } catch {
      try {
        localStorage.setItem("vc_admin_tour_scenes", JSON.stringify(scenes));
        setToast({
          open: true,
          message: "Không thể kết nối máy chủ API. Đã lưu bản nháp Tour 360° & Hotspot vào bộ nhớ trình duyệt cục bộ.",
          type: "info",
        });
      } catch {
        setToast({
          open: true,
          message: "Không thể lưu cấu hình tour.",
          type: "error",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishTour = async () => {
    if (!tourIntegrity.isValid) {
      setToast({
        open: true,
        message: `Cảnh báo liên kết: ${tourIntegrity.issues[0]} Vui lòng kiểm tra trước khi xuất bản.`,
        type: "error",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const res = await publishTourScenes();
      setToast({
        open: true,
        message: res.message || "Đã xuất bản thành công toàn bộ cảnh 360° lên cổng công khai Virtual Campus!",
        type: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi xuất bản: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishTour = async () => {
    setIsUnpublishing(true);
    try {
      const res = await unpublishTourScenes();
      setToast({
        open: true,
        message: res.message || "Đã chuyển toàn bộ cảnh về trạng thái Bản nháp (DRAFT).",
        type: "info",
      });
    } catch (err) {
      setToast({
        open: true,
        message: `Lỗi hủy xuất bản: ${err instanceof Error ? err.message : "Thất bại"}`,
        type: "error",
      });
    } finally {
      setIsUnpublishing(false);
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
              hotspots: scene.hotspots.map((h) =>
                h.id === hotspotId ? { ...h, ...patch } : h
              ),
            }
          : scene
      )
    );
  };

  const handleSphereClick = (yaw: number, pitch: number) => {
    if (!selectedHotspotId) {
      const created: TourHotspotItem = {
        id: `hs-${Date.now()}`,
        label: "Điểm liên kết mới",
        yaw: Math.round(yaw * 10) / 10,
        pitch: Math.round(pitch * 10) / 10,
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
      setToast({
        open: true,
        message: "Đã tạo điểm ghim mới tại vị trí click trên ảnh 360°.",
        type: "success",
      });
      return;
    }

    updateHotspotField(selectedHotspotId, {
      yaw: Math.round(yaw * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
    });
    setToast({
      open: true,
      message: "Đã dời điểm ghim đến tọa độ click mới.",
      type: "info",
    });
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
    setToast({ open: true, message: "Đã chèn hotspot ngay tâm góc nhìn.", type: "success" });
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
    setToast({ open: true, message: "Đã xóa hotspot khỏi cảnh này.", type: "info" });
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
    setToast({ open: true, message: "Đã lưu góc nhìn mở đầu cho cảnh hiện tại.", type: "success" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="type-h1 text-on-surface">Biên tập Tour 360° &amp; Hotspot</h1>
            <Badge variant={tourIntegrity.isValid ? "success" : "warning"}>
              {tourIntegrity.isValid
                ? "Toàn vẹn 100%"
                : `Có ${tourIntegrity.issues.length} liên kết cần kiểm tra`}
            </Badge>
          </div>
          <p className="type-body-sm text-secondary mt-1">
            Chọn cảnh, đổi ảnh panorama từ Thư viện Media, click trực tiếp lên ảnh 360° để đặt tọa độ hotspot (yaw, pitch).
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
            loading={isSaving}
            onClick={handleSaveTourConfiguration}
            data-testid="save-tour-btn"
          >
            Lưu vào CSDL
          </Button>
          <Button
            variant="outline"
            size="md"
            icon="unpublished"
            loading={isUnpublishing}
            onClick={handleUnpublishTour}
            title="Đưa các cảnh về chế độ Bản nháp (DRAFT) để bảo trì"
          >
            Về bản nháp
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon="rocket_launch"
            loading={isPublishing}
            onClick={handlePublishTour}
            data-testid="publish-tour-btn"
          >
            Xuất bản Tour
          </Button>
        </div>
      </div>

      {/* 3-Pane Operational Workbench */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Pane 1: Scene List & Scene Metadata */}
        <div className="xl:col-span-3 ui-card p-3 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="type-label text-secondary">Danh sách cảnh ({scenes.length})</span>
              <Button
                variant="outline"
                size="sm"
                icon="add_photo_alternate"
                onClick={() => setCreateSceneOpen(true)}
              >
                Thêm cảnh
              </Button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {scenes.map((scene) => {
                const active = scene.id === activeScene.id;
                return (
                  <div
                    key={scene.id}
                    className={cn(
                      "w-full p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 group",
                      active
                        ? "bg-primary-fixed/50 border-primary text-on-surface"
                        : "bg-surface border-transparent hover:bg-surface-container-low"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSceneId(scene.id);
                        setSelectedHotspotId(scene.hotspots[0]?.id ?? null);
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <img
                        src={scene.thumbUrl || scene.bgUrl}
                        alt={scene.name}
                        className="w-10 h-8 rounded-lg object-cover shrink-0 bg-slate-900 border border-surface-container"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{scene.name}</p>
                        <p className="text-[10px] text-secondary truncate">
                          {scene.hotspots.length} hotspot · {scene.buildingLabel}
                        </p>
                      </div>
                    </button>

                    {scenes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteScene(scene.id)}
                        className="text-secondary hover:text-error p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa cảnh này"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Scene Panorama & Media Switcher */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface">Ảnh 360° của cảnh:</span>
              <Badge variant="primary">2:1 Equirectangular</Badge>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-surface-container aspect-2/1 bg-slate-900">
              <img
                src={activeScene.bgUrl}
                alt={activeScene.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleOpenMediaPicker("change_active_panorama")}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center gap-1 transition-all opacity-0 hover:opacity-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">photo_library</span>
                <span className="text-xs font-bold">Đổi ảnh từ Media</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon="perm_media"
              fullWidth
              onClick={() => handleOpenMediaPicker("change_active_panorama")}
            >
              Chọn ảnh từ Thư viện Media
            </Button>
          </div>
        </div>

        {/* Pane 2: Interactive WebGL Panorama Canvas */}
        <div className="xl:col-span-6 ui-card overflow-hidden flex flex-col min-h-[440px]">
          <div className="px-4 py-2.5 border-b border-surface-container bg-surface-container-low flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-on-surface truncate">
              {selectedHotspot
                ? `Click vào ảnh 360° để dời vị trí "${selectedHotspot.label}"`
                : "Click vào ảnh 360° để tạo hotspot mới"}
            </span>
            <span className="font-mono text-secondary shrink-0">
              Yaw {cameraAngles.yaw.toFixed(1)}° · Pitch {cameraAngles.pitch.toFixed(1)}°
            </span>
          </div>

          <div className="relative flex-1 min-h-[400px]">
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
                id="hotspot-label"
                label="Nhãn hiển thị"
                value={selectedHotspot.label}
                onChange={(e) =>
                  updateHotspotField(selectedHotspot.id, { label: e.target.value })
                }
              />

              <Select
                id="hotspot-type"
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
                  id="hotspot-target-scene"
                  label="Cảnh đích chuyển tới"
                  value={selectedHotspot.targetSceneId ?? ""}
                  onChange={(e) =>
                    updateHotspotField(selectedHotspot.id, {
                      targetSceneId: e.target.value,
                    })
                  }
                >
                  {scenes.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.buildingLabel})
                    </option>
                  ))}
                </Select>
              ) : (
                <Textarea
                  id="hotspot-info-text"
                  label="Nội dung thẻ ghi chú"
                  rows={2}
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
                  id="hotspot-yaw"
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
                  id="hotspot-pitch"
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

              <div className="pt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="delete"
                  className="text-error hover:bg-error-container/30"
                  onClick={() => handleDeleteHotspot(selectedHotspot.id)}
                >
                  Xóa hotspot
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon="save"
                  onClick={handleSaveTourConfiguration}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-secondary text-center py-4">
              Chọn một điểm ghim ở trên hoặc click vào ảnh 360° để đặt hotspot.
            </p>
          )}
        </div>
      </div>

      {/* Media Picker Modal */}
      <Modal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        title="Chọn ảnh Panorama 360° từ Thư viện Media"
        size="lg"
      >
        <div className="space-y-4 pt-2">
          {loadingPanoramas ? (
            <div className="py-12 flex justify-center">
              <LoadingState label="Đang tải danh sách ảnh toàn cảnh từ máy chủ..." />
            </div>
          ) : availablePanoramas.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <span className="material-symbols-outlined text-4xl text-secondary">image_not_supported</span>
              <p className="text-sm font-semibold text-on-surface">Chưa có ảnh Panorama 2:1 nào trong Thư viện Media</p>
              <p className="text-xs text-secondary">
                Vào mục <strong>Quản lý Media</strong> để tải lên ảnh toàn cảnh equirectangular tỷ lệ 2:1 trước.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon="open_in_new"
                  onClick={() => window.open("/admin/media", "_blank")}
                >
                  Mở trang Quản lý Media
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {availablePanoramas.map((item) => {
                const imgUrl = item.publicUrl || `/images/panoramas/${item.originalFilename}`;
                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-surface-container overflow-hidden hover:border-primary transition-all bg-slate-900"
                  >
                    <div className="aspect-2/1 w-full overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={item.originalFilename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 bg-white text-xs space-y-1">
                      <p className="font-bold text-on-surface truncate" title={item.originalFilename}>
                        {item.originalFilename}
                      </p>
                      <p className="text-[10px] text-secondary">
                        {item.originalWidth} × {item.originalHeight} px
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        icon="check"
                        className="!text-[11px] !py-1 !min-h-[28px] mt-1"
                        onClick={() => handleSelectPanorama(item)}
                      >
                        Chọn ảnh này
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Create Scene Modal */}
      <Modal
        open={createSceneOpen}
        onClose={() => setCreateSceneOpen(false)}
        title="Thêm cảnh 360° mới vào Virtual Campus"
      >
        <form onSubmit={handleCreateNewScene} className="space-y-4 pt-2">
          <Input
            id="new-scene-name"
            label="Tên cảnh 360°"
            placeholder="Ví dụ: Phòng Thực hành Đồ họa iMac (Tòa F)"
            required
            value={newSceneForm.name}
            onChange={(e) => setNewSceneForm({ ...newSceneForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="new-scene-building"
              label="Tòa nhà"
              value={newSceneForm.buildingCode}
              onChange={(e) => {
                const code = e.target.value as BuildingCode;
                const labels: Record<BuildingCode, string> = {
                  INNOVATION: "Tòa Innovation",
                  "TOA-T": "Tòa Nhà T",
                  "TOA-F": "Tòa Nhà F",
                  "TOA-P": "Tòa Nhà P",
                  SPORTS: "Khu Thể Thao",
                };
                setNewSceneForm({
                  ...newSceneForm,
                  buildingCode: code,
                  buildingLabel: labels[code] || "Khuôn viên QTSC",
                });
              }}
            >
              <option value="INNOVATION">Tòa Innovation</option>
              <option value="TOA-T">Tòa Nhà T</option>
              <option value="TOA-F">Tòa Nhà F</option>
              <option value="TOA-P">Tòa Nhà P</option>
              <option value="SPORTS">Khu Thể Thao</option>
            </Select>

            <Input
              id="new-scene-floor"
              label="Tầng / Khu vực"
              placeholder="Ví dụ: Tầng 2, Ngoài trời..."
              required
              value={newSceneForm.floor}
              onChange={(e) => setNewSceneForm({ ...newSceneForm, floor: e.target.value })}
            />
          </div>

          <Textarea
            id="new-scene-intro"
            label="Mô tả không gian"
            rows={2}
            placeholder="Giới thiệu cơ sở vật chất và công năng của khu vực này..."
            value={newSceneForm.intro}
            onChange={(e) => setNewSceneForm({ ...newSceneForm, intro: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block">
              Ảnh Panorama 360° đã chọn
            </label>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low border border-surface-container">
              <img
                src={newSceneForm.bgUrl}
                alt="Panorama Preview"
                className="w-20 h-10 rounded-lg object-cover bg-slate-900 border"
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-mono text-secondary truncate">{newSceneForm.bgUrl}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon="photo_library"
                onClick={() => handleOpenMediaPicker("create_new_scene")}
              >
                Đổi ảnh khác
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="ghost" type="button" onClick={() => setCreateSceneOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Tạo cảnh mới
            </Button>
          </div>
        </form>
      </Modal>

      {/* Global Action Status Toast */}
      <StatusToast
        open={toast.open}
        message={toast.message}
        type={toast.type ?? "info"}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

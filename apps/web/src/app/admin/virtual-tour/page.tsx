"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { BuildingCode, TourHotspotItem } from "@/data/campus-data";
import type { PanoramaStageHandle } from "@/components/tour/PanoramaStage";
import { useAuth } from "@/components/auth/AuthProvider";

const PanoramaStage = dynamic(
  () =>
    import("@/components/tour/PanoramaStage").then(
      (mod) => mod.PanoramaStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Đang tải không gian 360°...</span>
      </div>
    ),
  },
);

import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  createAdminTourNode,
  deleteAdminTourNode,
  fetchAdminTourNodes,
  publishTourScenes,
  saveTourStudioBatch,
  unpublishTourScenes,
  type StudioSceneItem,
} from "@/lib/admin/tour-admin-api";
import {
  fetchCampusStructure,
  type BuildingStructureItem,
} from "@/lib/admin/locations-admin-api";
import {
  mapAdminTourNodesToStudioScenes,
  resolveActiveStudioSceneId,
} from "@/lib/admin/tour-studio-mapper";
import { mediaApi, type AdminMediaAssetItem } from "@/lib/auth/api-client";

const INITIAL_NEW_SCENE_FORM = {
  name: "",
  buildingCode: "INNOVATION" as BuildingCode,
  buildingLabel: "Tòa Innovation",
  floor: "Tầng 1",
  intro: "",
  panoramaAssetId: "",
  bgUrl: "",
  thumbUrl: "",
};

export default function AdminVirtualTourPage() {
  const { user } = useAuth();
  const canPublishTour = Boolean(user?.permissions.includes("tour:publish"));

  const [scenes, setScenes] = useState<StudioSceneItem[]>([]);
  const [structures, setStructures] = useState<BuildingStructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [cameraAngles, setCameraAngles] = useState({ yaw: 0, pitch: 2, fov: 68 });
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type?: "info" | "success" | "error";
  }>({
    open: false,
    message: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [deletingSceneId, setDeletingSceneId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // --- Media Library Picker State ---
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    "change_active_panorama" | "create_new_scene"
  >("change_active_panorama");
  const [availablePanoramas, setAvailablePanoramas] = useState<AdminMediaAssetItem[]>([]);
  const [loadingPanoramas, setLoadingPanoramas] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // --- Create Scene Modal State ---
  const [createSceneOpen, setCreateSceneOpen] = useState(false);
  const [newSceneForm, setNewSceneForm] = useState(INITIAL_NEW_SCENE_FORM);

  const stageRef = useRef<PanoramaStageHandle>(null);

  const applyStudioSnapshot = useCallback(
    (
      nodes: Awaited<ReturnType<typeof fetchAdminTourNodes>>,
      structs: BuildingStructureItem[] | null,
      preferredSlug?: string | null,
    ) => {
      const mapped = mapAdminTourNodesToStudioScenes(nodes);
      setScenes(mapped);
      setFetchError(null);
      setHasUnsavedChanges(false);

      setActiveSceneId((prev) => {
        const nextId = resolveActiveStudioSceneId(
          mapped,
          preferredSlug !== undefined ? preferredSlug : prev,
        );
        const nextScene = mapped.find((s) => s.id === nextId);
        setSelectedHotspotId(nextScene?.hotspots[0]?.id ?? null);
        return nextId;
      });

      if (structs && structs.length > 0) {
        setStructures(structs);
        setNewSceneForm((prev) => {
          const matched = structs.find((b) => b.code === prev.buildingCode);
          const target = matched ?? structs[0];
          return {
            ...prev,
            buildingCode: target.code as BuildingCode,
            buildingLabel: target.name,
            floor: target.floors[0]?.name ?? prev.floor,
          };
        });
      }
    },
    [],
  );

  const loadStudioData = useCallback(
    async (preferredSlug?: string | null) => {
      setLoading(true);
      try {
        const [nodesRes, structRes] = await Promise.allSettled([
          fetchAdminTourNodes(),
          fetchCampusStructure(),
        ]);

        if (nodesRes.status === "rejected") {
          const reason = nodesRes.reason;
          throw reason instanceof Error
            ? reason
            : new Error("Không thể tải danh sách cảnh Tour 360° từ PostgreSQL.");
        }

        const structs =
          structRes.status === "fulfilled" ? structRes.value : null;
        applyStudioSnapshot(nodesRes.value, structs, preferredSlug);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể kết nối máy chủ API quản trị Tour 360°.";
        setFetchError(msg);
        setScenes([]);
      } finally {
        setLoading(false);
      }
    },
    [applyStudioSnapshot],
  );

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchAdminTourNodes(), fetchCampusStructure()])
      .then(([nodesRes, structRes]) => {
        if (!active) return;
        if (nodesRes.status === "rejected") {
          const reason = nodesRes.reason;
          throw reason instanceof Error
            ? reason
            : new Error("Không thể tải danh sách cảnh Tour 360° từ PostgreSQL.");
        }
        const structs =
          structRes.status === "fulfilled" ? structRes.value : null;
        applyStudioSnapshot(nodesRes.value, structs);
      })
      .catch((err) => {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể kết nối máy chủ API quản trị Tour 360°.";
        setFetchError(msg);
        setScenes([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyStudioSnapshot]);

  // --- Pre-flight Tour Integrity & Go-Live Readiness Check ---
  const tourIntegrity = useMemo(() => {
    const issues: string[] = [];
    const sceneIds = new Set(scenes.map((s) => s.id));

    scenes.forEach((scene) => {
      if (!scene.bgUrl) {
        issues.push(`Cảnh "${scene.name}" chưa có ảnh Panorama 360°.`);
      }
      if (scene.isAiPlaceholder) {
        issues.push(`Cảnh "${scene.name}" đang dùng ảnh AI placeholder.`);
      }
      if (!scene.isValid2To1 || !scene.isPreviewApproved) {
        issues.push(
          `Cảnh "${scene.name}" chưa đạt kiểm định panorama 2:1 hoặc chưa duyệt preview.`,
        );
      }
      scene.hotspots.forEach((hs) => {
        if (hs.type === "scene") {
          if (!hs.targetSceneId || !sceneIds.has(hs.targetSceneId)) {
            issues.push(
              `Điểm ghim "${hs.label}" trong cảnh "${scene.name}" trỏ tới cảnh đích không tồn tại.`,
            );
          } else if (hs.targetSceneId === scene.id) {
            issues.push(
              `Điểm ghim "${hs.label}" trong cảnh "${scene.name}" đang trỏ về chính nó.`,
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

  const activeScene = useMemo(
    () => scenes.find((s) => s.id === activeSceneId) ?? scenes[0] ?? null,
    [scenes, activeSceneId],
  );

  const selectedHotspot = useMemo(
    () =>
      activeScene
        ? activeScene.hotspots.find((h) => h.id === selectedHotspotId) ?? null
        : null,
    [activeScene, selectedHotspotId],
  );

  // --- Open Media Picker for Panoramas ---
  const handleOpenMediaPicker = useCallback(
    async (target: "change_active_panorama" | "create_new_scene") => {
      setMediaPickerTarget(target);
      setMediaPickerOpen(true);
      setLoadingPanoramas(true);
      setMediaError(null);

      try {
        const res = await mediaApi.listMedia({
          assetKind: "PANORAMA_2_1",
          limit: 50,
        });
        setAvailablePanoramas(res.items);
      } catch (err) {
        setAvailablePanoramas([]);
        setMediaError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách ảnh Panorama 2:1 từ Thư viện Media.",
        );
      } finally {
        setLoadingPanoramas(false);
      }
    },
    [],
  );

  const handleSelectPanorama = (asset: AdminMediaAssetItem) => {
    const url = asset.publicUrl || `/images/panoramas/${asset.originalFilename}`;
    if (mediaPickerTarget === "change_active_panorama") {
      if (!activeScene) return;
      setScenes((prev) =>
        prev.map((s) =>
          s.id === activeScene.id
            ? {
                ...s,
                panoramaAssetId: asset.id,
                bgUrl: url,
                thumbUrl: asset.thumbnailUrl || url,
                isEquirectangular2to1: asset.isValid2To1,
                isValid2To1: asset.isValid2To1,
                isPreviewApproved: asset.isPreviewApproved,
                isAiPlaceholder: asset.isAiPlaceholder,
              }
            : s,
        ),
      );
      setHasUnsavedChanges(true);
      setToast({
        open: true,
        message: `Đã chọn ảnh "${asset.originalFilename}". Bấm "Lưu vào CSDL" để lưu thay đổi vào PostgreSQL.`,
        type: "info",
      });
    } else {
      setNewSceneForm((f) => ({
        ...f,
        panoramaAssetId: asset.id,
        bgUrl: url,
        thumbUrl: asset.thumbnailUrl || url,
      }));
      setToast({
        open: true,
        message: `Đã chọn ảnh 360°: "${asset.originalFilename}"`,
        type: "success",
      });
    }
    setMediaPickerOpen(false);
  };

  // --- Handle Create New Scene directly in PostgreSQL ---
  const handleCreateNewScene = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSceneForm.name.trim();
    if (!cleanName) return;

    if (!newSceneForm.panoramaAssetId) {
      setToast({
        open: true,
        message: "Vui lòng chọn ảnh Panorama 2:1 từ Thư viện Media trước khi tạo cảnh.",
        type: "error",
      });
      void handleOpenMediaPicker("create_new_scene");
      return;
    }

    const baseSlug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug || "scene"}-${Date.now().toString(36).slice(-4)}`;

    setIsCreatingScene(true);
    try {
      const created = await createAdminTourNode({
        title: cleanName,
        slug,
        intro: newSceneForm.intro.trim() || `Không gian 360° tại ${cleanName}.`,
        buildingCode: newSceneForm.buildingCode,
        panoramaAssetId: newSceneForm.panoramaAssetId,
        initialYaw: 0,
        initialPitch: 0,
        initialFov: 70,
      });

      setCreateSceneOpen(false);
      setNewSceneForm(INITIAL_NEW_SCENE_FORM);
      await loadStudioData(created.slug);
      setToast({
        open: true,
        message: `Đã tạo và lưu cảnh "${created.title}" vào cơ sở dữ liệu PostgreSQL.`,
        type: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message:
          err instanceof Error
            ? err.message
            : "Không thể tạo cảnh 360° mới trong cơ sở dữ liệu.",
        type: "error",
      });
    } finally {
      setIsCreatingScene(false);
    }
  };

  // --- Handle Delete Scene directly in PostgreSQL ---
  const handleDeleteScene = async (scene: StudioSceneItem) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa cảnh "${scene.name}" (${scene.id}) và các hotspot liên quan khỏi PostgreSQL?`,
      )
    ) {
      return;
    }

    setDeletingSceneId(scene.nodeId);
    try {
      await deleteAdminTourNode(scene.nodeId);
      const remainingPreferred =
        scene.id === activeSceneId
          ? scenes.find((s) => s.id !== scene.id)?.id ?? null
          : activeSceneId;
      await loadStudioData(remainingPreferred);
      setToast({
        open: true,
        message: `Đã xóa cảnh "${scene.name}" khỏi PostgreSQL.`,
        type: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message:
          err instanceof Error
            ? err.message
            : "Lỗi khi xóa cảnh khỏi cơ sở dữ liệu.",
        type: "error",
      });
    } finally {
      setDeletingSceneId(null);
    }
  };

  const handleSaveTourConfiguration = async () => {
    if (scenes.length === 0) return;

    setIsSaving(true);
    try {
      const res = await saveTourStudioBatch(scenes);
      const canonicalScenes = mapAdminTourNodesToStudioScenes(res.nodes);
      setScenes(canonicalScenes);
      setHasUnsavedChanges(false);

      const nextActive = resolveActiveStudioSceneId(
        canonicalScenes,
        activeSceneId,
      );
      setActiveSceneId(nextActive);
      const currentActive = canonicalScenes.find((s) => s.id === nextActive);
      if (
        currentActive &&
        selectedHotspotId &&
        !currentActive.hotspots.some((h) => h.id === selectedHotspotId)
      ) {
        setSelectedHotspotId(currentActive.hotspots[0]?.id ?? null);
      }

      setToast({
        open: true,
        message: `Đã lưu thành công ${res.savedCount} cảnh 360° & Hotspot trực tiếp vào PostgreSQL!`,
        type: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message:
          err instanceof Error
            ? err.message
            : "Lỗi lưu cấu hình Tour 360° lên máy chủ API. Các thay đổi chưa được ghi nhận.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishTour = async () => {
    if (hasUnsavedChanges) {
      setToast({
        open: true,
        message: "Vui lòng bấm \"Lưu vào CSDL\" các chỉnh sửa chưa lưu trước khi xuất bản.",
        type: "error",
      });
      return;
    }
    if (!tourIntegrity.isValid) {
      setToast({
        open: true,
        message: `Không thể xuất bản: ${tourIntegrity.issues[0]}`,
        type: "error",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const res = await publishTourScenes();
      await loadStudioData(activeSceneId);
      setToast({
        open: true,
        message:
          res.message ||
          "Đã xuất bản thành công toàn bộ cảnh 360° lên cổng công khai Virtual Campus!",
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
      await loadStudioData(activeSceneId);
      setToast({
        open: true,
        message:
          res.message || "Đã chuyển toàn bộ cảnh về trạng thái Bản nháp (DRAFT).",
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

  const updateHotspotField = (
    hotspotId: string,
    patch: Partial<TourHotspotItem>,
  ) => {
    if (!activeScene) return;
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? {
              ...scene,
              hotspots: scene.hotspots.map((h) =>
                h.id === hotspotId ? { ...h, ...patch } : h,
              ),
            }
          : scene,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const getSuggestedTargetSceneId = (currentId: string): string => {
    return scenes.find((s) => s.id !== currentId)?.id ?? "";
  };

  const handleSphereClick = (yaw: number, pitch: number) => {
    if (!activeScene) return;
    if (!selectedHotspotId) {
      const suggestedTarget = getSuggestedTargetSceneId(activeScene.id);
      const created: TourHotspotItem = {
        id: `hs-${Date.now()}`,
        label: suggestedTarget ? "Điểm liên kết mới" : "Thông tin không gian",
        yaw: Math.round(yaw * 10) / 10,
        pitch: Math.round(pitch * 10) / 10,
        type: suggestedTarget ? "scene" : "info",
        targetSceneId: suggestedTarget || undefined,
        infoText: suggestedTarget ? undefined : "Mô tả điểm thông tin mới.",
      };
      setScenes((prev) =>
        prev.map((scene) =>
          scene.id === activeScene.id
            ? { ...scene, hotspots: [...scene.hotspots, created] }
            : scene,
        ),
      );
      setSelectedHotspotId(created.id);
      setHasUnsavedChanges(true);
      setToast({
        open: true,
        message: "Đã đặt điểm ghim tạm trên canvas. Bấm \"Lưu vào CSDL\" để ghi vào PostgreSQL.",
        type: "info",
      });
      return;
    }

    updateHotspotField(selectedHotspotId, {
      yaw: Math.round(yaw * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
    });
    setToast({
      open: true,
      message: "Đã dời tọa độ hotspot. Nhớ bấm \"Lưu vào CSDL\" để lưu.",
      type: "info",
    });
  };

  const handleAddCenterHotspot = () => {
    if (!activeScene) return;
    const suggestedTarget = getSuggestedTargetSceneId(activeScene.id);
    const created: TourHotspotItem = {
      id: `hs-${Date.now()}`,
      label: suggestedTarget ? "Điểm chuyển cảnh mới" : "Thẻ thông tin mới",
      yaw: Math.round(cameraAngles.yaw * 10) / 10,
      pitch: Math.round(cameraAngles.pitch * 10) / 10,
      type: suggestedTarget ? "scene" : "info",
      targetSceneId: suggestedTarget || undefined,
      infoText: suggestedTarget ? undefined : "Nội dung thẻ thông tin tại điểm này.",
    };
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, hotspots: [...scene.hotspots, created] }
          : scene,
      ),
    );
    setSelectedHotspotId(created.id);
    setHasUnsavedChanges(true);
    setToast({
      open: true,
      message: "Đã chèn hotspot tạm ngay tâm góc nhìn. Bấm \"Lưu vào CSDL\" để lưu.",
      type: "info",
    });
  };

  const handleDeleteHotspot = (id: string) => {
    if (!activeScene) return;
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, hotspots: scene.hotspots.filter((h) => h.id !== id) }
          : scene,
      ),
    );
    if (selectedHotspotId === id) {
      setSelectedHotspotId(null);
    }
    setHasUnsavedChanges(true);
    setToast({
      open: true,
      message: "Đã gỡ hotspot trên giao diện. Bấm \"Lưu vào CSDL\" để xóa trong PostgreSQL.",
      type: "info",
    });
  };

  const handleSaveInitialView = () => {
    if (!activeScene) return;
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
          : scene,
      ),
    );
    setHasUnsavedChanges(true);
    setToast({
      open: true,
      message: "Đã cập nhật góc nhìn mở đầu. Bấm \"Lưu vào CSDL\" để lưu vào PostgreSQL.",
      type: "info",
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="type-h1 text-on-surface">Biên tập Tour 360° &amp; Hotspot</h1>
            {!loading && !fetchError && scenes.length > 0 && (
              <Badge variant={tourIntegrity.isValid ? "success" : "warning"}>
                {tourIntegrity.isValid
                  ? "Sẵn sàng Go-Live"
                  : `Cần kiểm tra (${tourIntegrity.issues.length})`}
              </Badge>
            )}
            {hasUnsavedChanges && (
              <Badge variant="warning">Chưa lưu thay đổi</Badge>
            )}
          </div>
          <p className="type-body-sm text-secondary mt-1">
            Dữ liệu đồng bộ trực tiếp từ PostgreSQL. Chọn cảnh, đổi ảnh panorama từ Thư viện Media, click lên ảnh 360° để đặt hotspot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon="center_focus_strong"
            onClick={handleSaveInitialView}
            disabled={!activeScene || loading || Boolean(fetchError)}
          >
            Đặt làm góc nhìn mặc định
          </Button>
          <Button
            variant="outline"
            size="md"
            icon="add_location_alt"
            onClick={handleAddCenterHotspot}
            disabled={!activeScene || loading || Boolean(fetchError)}
          >
            Thêm hotspot ở tâm nhìn
          </Button>
          <Button
            variant="primary"
            size="md"
            icon="save"
            loading={isSaving}
            onClick={handleSaveTourConfiguration}
            disabled={!activeScene || loading || Boolean(fetchError)}
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
            disabled={!canPublishTour || scenes.length === 0 || loading || Boolean(fetchError)}
            title={
              !canPublishTour
                ? "Tài khoản không có quyền tour:publish"
                : "Đưa các cảnh về chế độ Bản nháp (DRAFT) để bảo trì"
            }
          >
            Về bản nháp
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon="rocket_launch"
            loading={isPublishing}
            onClick={handlePublishTour}
            disabled={!canPublishTour || scenes.length === 0 || loading || Boolean(fetchError)}
            title={!canPublishTour ? "Tài khoản không có quyền tour:publish" : undefined}
            data-testid="publish-tour-btn"
          >
            Xuất bản Tour
          </Button>
        </div>
      </div>

      {/* Explicit Loading / Error / Empty States */}
      {loading ? (
        <div className="ui-card p-12 flex justify-center">
          <LoadingState label="Đang tải danh sách cảnh 360° và liên kết hotspot từ PostgreSQL..." />
        </div>
      ) : fetchError ? (
        <ErrorState
          title="Không thể tải Tour 360° Studio"
          description={fetchError}
          actionLabel="Thử lại"
          onAction={() => void loadStudioData()}
        />
      ) : !activeScene ? (
        <EmptyState
          icon="view_in_ar"
          title="Chưa có cảnh 360° nào trong cơ sở dữ liệu"
          description="Cơ sở dữ liệu hiện chưa có TourNode đang hoạt động. Bạn có thể tạo cảnh 360° mới từ Thư viện Media 2:1."
          actionLabel="Thêm cảnh 360° đầu tiên"
          onAction={() => setCreateSceneOpen(true)}
        />
      ) : (
        /* 3-Pane Operational Workbench */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Pane 1: Scene List & Scene Metadata */}
          <div className="xl:col-span-3 ui-card p-3 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="type-label text-secondary">
                  Danh sách cảnh ({scenes.length})
                </span>
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
                      key={scene.nodeId}
                      className={cn(
                        "w-full p-2.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-2 group",
                        active
                          ? "bg-primary-fixed/50 border-primary text-on-surface"
                          : "bg-surface border-transparent hover:bg-surface-container-low",
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate">{scene.name}</p>
                          </div>
                          <p className="text-[10px] text-secondary truncate">
                            {scene.hotspots.length} hotspot · {scene.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={deletingSceneId === scene.nodeId}
                        onClick={() => void handleDeleteScene(scene)}
                        className="text-secondary hover:text-error p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                        title="Xóa cảnh này khỏi PostgreSQL"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Scene Panorama & Media Switcher */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-2.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-bold text-on-surface">Ảnh 360° của cảnh:</span>
                <Badge variant={activeScene.isAiPlaceholder ? "warning" : "primary"}>
                  {activeScene.isAiPlaceholder
                    ? "AI Placeholder"
                    : activeScene.isValid2To1
                      ? "2:1 Equirectangular"
                      : "Chưa chuẩn 2:1"}
                </Badge>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-surface-container aspect-2/1 bg-slate-900">
                <img
                  src={activeScene.bgUrl}
                  alt={activeScene.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => void handleOpenMediaPicker("change_active_panorama")}
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
                onClick={() => void handleOpenMediaPicker("change_active_panorama")}
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
                        : "bg-surface border-surface-container hover:border-outline-variant",
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
                  onChange={(e) => {
                    const nextType = e.target.value as TourHotspotItem["type"];
                    updateHotspotField(selectedHotspot.id, {
                      type: nextType,
                      targetSceneId:
                        nextType === "scene"
                          ? selectedHotspot.targetSceneId ||
                            getSuggestedTargetSceneId(activeScene.id) ||
                            undefined
                          : undefined,
                    });
                  }}
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
                        targetSceneId: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">-- Chọn cảnh đích --</option>
                    {scenes
                      .filter((sc) => sc.id !== activeScene.id)
                      .map((sc) => (
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
                    loading={isSaving}
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
      )}

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
          ) : mediaError ? (
            <ErrorState
              title="Không thể tải Thư viện Media 2:1"
              description={mediaError}
              actionLabel="Thử lại"
              onAction={() => void handleOpenMediaPicker(mediaPickerTarget)}
            />
          ) : availablePanoramas.length === 0 ? (
            <EmptyState
              icon="image_not_supported"
              title="Chưa có ảnh Panorama 2:1 nào trong Thư viện Media"
              description="Vào mục Quản lý Media để tải lên ảnh toàn cảnh equirectangular tỷ lệ 2:1 trước."
              actionLabel="Mở trang Quản lý Media"
              onAction={() => window.open("/admin/media", "_blank")}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
              {availablePanoramas.map((item) => {
                const imgUrl =
                  item.publicUrl || `/images/panoramas/${item.originalFilename}`;
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
                      <p
                        className="font-bold text-on-surface truncate"
                        title={item.originalFilename}
                      >
                        {item.originalFilename}
                      </p>
                      <p className="text-[10px] text-secondary">
                        {item.originalWidth} × {item.originalHeight} px
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.isAiPlaceholder && (
                          <Badge variant="warning">AI Placeholder</Badge>
                        )}
                        {!item.isPreviewApproved && (
                          <Badge variant="neutral">Chưa duyệt</Badge>
                        )}
                      </div>
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
        title="Thêm cảnh 360° mới vào PostgreSQL"
      >
        <form onSubmit={handleCreateNewScene} className="space-y-4 pt-2">
          <Input
            id="new-scene-name"
            label="Tên cảnh 360°"
            placeholder="Ví dụ: Phòng Thực hành Đồ họa iMac (Tòa F)"
            required
            value={newSceneForm.name}
            onChange={(e) =>
              setNewSceneForm({ ...newSceneForm, name: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="new-scene-building"
              label="Tòa nhà"
              value={newSceneForm.buildingCode}
              onChange={(e) => {
                const code = e.target.value as BuildingCode;
                const found = structures.find((b) => b.code === code);
                setNewSceneForm({
                  ...newSceneForm,
                  buildingCode: code,
                  buildingLabel: found?.name || code,
                  floor: found?.floors[0]?.name ?? newSceneForm.floor,
                });
              }}
            >
              {structures.length > 0 ? (
                structures.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="INNOVATION">Tòa Innovation</option>
                  <option value="TOA-T">Tòa Nhà T</option>
                  <option value="TOA-F">Tòa Nhà F</option>
                  <option value="TOA-P">Tòa Nhà P</option>
                  <option value="SPORTS">Khu Thể Thao</option>
                </>
              )}
            </Select>

            <Input
              id="new-scene-floor"
              label="Tầng / Khu vực"
              placeholder="Ví dụ: Tầng 2, Ngoài trời..."
              required
              value={newSceneForm.floor}
              onChange={(e) =>
                setNewSceneForm({ ...newSceneForm, floor: e.target.value })
              }
            />
          </div>

          <Textarea
            id="new-scene-intro"
            label="Mô tả không gian"
            rows={2}
            placeholder="Giới thiệu cơ sở vật chất và công năng của khu vực này..."
            value={newSceneForm.intro}
            onChange={(e) =>
              setNewSceneForm({ ...newSceneForm, intro: e.target.value })
            }
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block">
              Ảnh Panorama 360° (bắt buộc từ Thư viện Media 2:1)
            </label>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low border border-surface-container">
              {newSceneForm.bgUrl ? (
                <img
                  src={newSceneForm.bgUrl}
                  alt="Panorama Preview"
                  className="w-20 h-10 rounded-lg object-cover bg-slate-900 border shrink-0"
                />
              ) : (
                <div className="w-20 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">panorama</span>
                </div>
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-mono text-secondary truncate">
                  {newSceneForm.bgUrl || "Chưa chọn ảnh Panorama 2:1 từ máy chủ"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon="photo_library"
                onClick={() => void handleOpenMediaPicker("create_new_scene")}
              >
                {newSceneForm.bgUrl ? "Đổi ảnh" : "Chọn ảnh"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setCreateSceneOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isCreatingScene}
            >
              Tạo cảnh vào CSDL
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

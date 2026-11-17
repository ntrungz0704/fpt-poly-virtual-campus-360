"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { BuildingCode, CampusLocationItem } from "@/data/campus-data";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  Drawer,
  ErrorState,
  Input,
  LoadingState,
  SearchInput,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import {
  type BuildingStructureItem,
  createAdminLocation,
  deleteAdminLocation,
  fetchAdminLocations,
  fetchCampusStructure,
  updateAdminLocation,
} from "@/lib/admin/locations-admin-api";
import {
  fetchAdminTourNodes,
  type AdminTourNodeItem,
} from "@/lib/admin/tour-admin-api";

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<CampusLocationItem[]>([]);
  const [structures, setStructures] = useState<BuildingStructureItem[]>([]);
  const [tourNodes, setTourNodes] = useState<AdminTourNodeItem[]>([]);
  const [tourNodesError, setTourNodesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string>("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CampusLocationItem | null>(null);
  const [formState, setFormState] = useState<{
    name: string;
    code: string;
    buildingCode: BuildingCode;
    floor: string;
    category: CampusLocationItem["category"];
    shortDesc: string;
    sceneId: string;
    status: "published" | "draft";
  }>({
    name: "",
    code: "",
    buildingCode: "INNOVATION",
    floor: "Tầng Trệt",
    category: "common",
    shortDesc: "",
    sceneId: "",
    status: "published",
  });

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ open: false, message: "", type: "info" });

  const refreshLocations = useCallback(async () => {
    try {
      const [locRes, structRes, tourNodesRes] = await Promise.allSettled([
        fetchAdminLocations(),
        fetchCampusStructure(),
        fetchAdminTourNodes(),
      ]);

      if (locRes.status === "rejected") {
        throw locRes.reason;
      }
      if (structRes.status === "rejected") {
        throw structRes.reason;
      }

      setLocations(locRes.value);
      setStructures(structRes.value);
      setFetchError(null);

      if (tourNodesRes.status === "fulfilled") {
        setTourNodes(tourNodesRes.value);
        setTourNodesError(null);
      } else {
        setTourNodes([]);
        setTourNodesError(
          tourNodesRes.reason instanceof Error
            ? tourNodesRes.reason.message
            : "Không thể tải danh sách cảnh 360° từ PostgreSQL.",
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể kết nối máy chủ API quản trị địa điểm và cấu trúc cơ sở.";
      setFetchError(msg);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetchAdminLocations(),
      fetchCampusStructure(),
      fetchAdminTourNodes(),
    ])
      .then(([locRes, structRes, tourNodesRes]) => {
        if (!active) return;

        if (locRes.status === "rejected") {
          throw locRes.reason;
        }
        if (structRes.status === "rejected") {
          throw structRes.reason;
        }

        setLocations(locRes.value);
        setStructures(structRes.value);
        setFetchError(null);

        if (tourNodesRes.status === "fulfilled") {
          setTourNodes(tourNodesRes.value);
          setTourNodesError(null);
        } else {
          setTourNodes([]);
          setTourNodesError(
            tourNodesRes.reason instanceof Error
              ? tourNodesRes.reason.message
              : "Không thể tải danh sách cảnh 360° từ PostgreSQL.",
          );
        }
      })
      .catch((err) => {
        if (active) {
          const msg =
            err instanceof Error
              ? err.message
              : "Không thể kết nối máy chủ API quản trị địa điểm và cấu trúc cơ sở.";
          setFetchError(msg);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentBuildingFloors = useMemo(() => {
    const b = structures.find((s) => s.code === formState.buildingCode);
    if (!b || b.floors.length === 0) return [];
    return b.floors.map((f) => ({ code: f.name, label: f.name }));
  }, [structures, formState.buildingCode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((loc) => {
      if (buildingFilter !== "ALL" && loc.buildingCode !== buildingFilter) return false;
      if (!q) return true;
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.buildingName.toLowerCase().includes(q)
      );
    });
  }, [locations, query, buildingFilter]);

  const openCreate = () => {
    if (structures.length === 0) {
      setToast({
        open: true,
        message: "Chưa tải được danh mục tòa nhà từ PostgreSQL. Vui lòng thử lại.",
        type: "error",
      });
      return;
    }
    setEditing(null);
    const initialBuilding = structures[0].code as BuildingCode;
    const initialFloor = structures[0].floors[0]?.name ?? "";
    setFormState({
      name: "",
      code: `QTSC-${locations.length + 1}`,
      buildingCode: initialBuilding,
      floor: initialFloor,
      category: "common",
      shortDesc: "",
      sceneId: "",
      status: "draft",
    });
    setDrawerOpen(true);
  };

  const openEdit = (loc: CampusLocationItem) => {
    if (structures.length === 0) {
      setToast({
        open: true,
        message: "Chưa tải được danh mục tòa nhà từ PostgreSQL. Vui lòng thử lại.",
        type: "error",
      });
      return;
    }
    setEditing(loc);
    setFormState({
      name: loc.name,
      code: loc.code,
      buildingCode: loc.buildingCode,
      floor: loc.floor,
      category: loc.category,
      shortDesc: loc.shortDesc,
      sceneId: loc.sceneId ?? "",
      status: loc.status,
    });
    setDrawerOpen(true);
  };

  const handleBuildingChange = (newBuildingCode: BuildingCode) => {
    const b = structures.find((s) => s.code === newBuildingCode);
    const firstFloor = b?.floors[0]?.name ?? "";
    setFormState((s) => ({
      ...s,
      buildingCode: newBuildingCode,
      floor: firstFloor,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.code.trim()) {
      setToast({
        open: true,
        message: "Vui lòng nhập đầy đủ tên và mã địa điểm.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        const updated = await updateAdminLocation(editing.id, formState);
        setToast({
          open: true,
          message: `Đã cập nhật thành công địa điểm "${updated.name}" vào cơ sở dữ liệu.`,
          type: "success",
        });
      } else {
        const created = await createAdminLocation(formState);
        setToast({
          open: true,
          message: `Đã lưu thành công địa điểm mới "${created.name}" (${created.code}) vào cơ sở dữ liệu.`,
          type: "success",
        });
      }
      setDrawerOpen(false);
      await refreshLocations();
    } catch (err) {
      // Must not close drawer on failure, must not show fake success
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể lưu địa điểm vào cơ sở dữ liệu.";
      setToast({ open: true, message: msg, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const target = locations.find((l) => l.id === id);
    if (!target) return;
    const nextStatus = target.status === "published" ? "draft" : "published";

    try {
      await updateAdminLocation(id, {
        ...target,
        status: nextStatus,
      });
      await refreshLocations();
      setToast({
        open: true,
        message: `Đã cập nhật trạng thái địa điểm "${target.name}" thành "${nextStatus === "published" ? "Đã xuất bản" : "Bản nháp"}".`,
        type: "success",
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lỗi cập nhật trạng thái xuất bản trên máy chủ.";
      setToast({ open: true, message: msg, type: "error" });
    }
  };

  const handleDelete = async (loc: CampusLocationItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa địa điểm "${loc.name}" (${loc.code}) khỏi cơ sở dữ liệu?`)) {
      return;
    }
    try {
      await deleteAdminLocation(loc.id);
      await refreshLocations();
      setToast({
        open: true,
        message: `Đã gỡ bỏ thành công địa điểm "${loc.name}".`,
        type: "success",
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lỗi gỡ bỏ địa điểm trên máy chủ.";
      setToast({ open: true, message: msg, type: "error" });
    }
  };

  const columns: DataTableColumn<CampusLocationItem>[] = [
    {
      key: "code",
      header: "Mã",
      render: (row) => <span className="font-mono text-xs font-bold whitespace-nowrap">{row.code}</span>,
    },
    {
      key: "name",
      header: "Tên không gian",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-on-surface">{row.name}</p>
          <p className="text-xs text-secondary line-clamp-1">{row.shortDesc}</p>
        </div>
      ),
    },
    {
      key: "building",
      header: "Tòa nhà & Tầng",
      render: (row) => (
        <span className="text-xs font-medium text-on-surface-variant">
          {row.buildingName} · {row.floor}
        </span>
      ),
    },
    {
      key: "scene",
      header: "Cảnh 360°",
      render: (row) =>
        row.sceneId ? (
          <Badge variant="brand">{row.sceneId}</Badge>
        ) : (
          <Badge variant="neutral">Chưa gắn</Badge>
        ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleStatus(row.id)}
          className="min-h-[36px] inline-flex items-center cursor-pointer"
          title="Nhấn để chuyển Đã xuất bản / Bản nháp"
        >
          <Badge variant={row.status === "published" ? "success" : "warning"}>
            {row.status === "published" ? "Đã xuất bản" : "Bản nháp"}
          </Badge>
        </button>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(row)}>
            Sửa
          </Button>
          <Button variant="outline" size="sm" icon="delete" onClick={() => handleDelete(row)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Quản lý Địa điểm QTSC</h1>
          <p className="type-body-sm text-secondary mt-1">
            Cấu hình danh sách phòng học, Lab, Hội trường và liên kết sang cảnh 360° thực tế trong cơ sở dữ liệu.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon="add"
          onClick={openCreate}
          disabled={structures.length === 0}
          title={structures.length === 0 ? "Chưa tải được danh mục tòa nhà từ PostgreSQL" : undefined}
        >
          Thêm địa điểm
        </Button>
      </div>

      {loading && locations.length === 0 ? (
        <div className="p-12 flex justify-center">
          <LoadingState label="Đang nạp danh mục địa điểm từ cơ sở dữ liệu PostgreSQL..." />
        </div>
      ) : fetchError && locations.length === 0 ? (
        <ErrorState
          title="Không thể tải danh sách địa điểm"
          description={fetchError}
          actionLabel="Thử lại"
          onAction={() => void refreshLocations()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(row) => row.id}
          toolbar={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery("")}
                placeholder="Tìm theo tên, mã phòng, tòa nhà..."
                className="w-full sm:w-80"
              />
              <Select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="w-full sm:w-60"
              >
                <option value="ALL">Tất cả tòa nhà</option>
                {structures.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Chỉnh sửa ${editing.code}` : "Thêm địa điểm mới"}
        description="Cập nhật thông tin không gian hiển thị trên /locations và Bản đồ GIS."
        side="right"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Tên phòng / không gian"
            value={formState.name}
            onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mã phòng"
              value={formState.code}
              onChange={(e) => setFormState((s) => ({ ...s, code: e.target.value }))}
              required
            />
            <Select
              label="Vị trí tầng"
              value={formState.floor}
              onChange={(e) => setFormState((s) => ({ ...s, floor: e.target.value }))}
            >
              {currentBuildingFloors.length > 0 ? (
                <>
                  <option value="">-- Không gắn tầng (Ngoài trời / Độc lập) --</option>
                  {currentBuildingFloors.map((fl) => (
                    <option key={fl.code} value={fl.code}>
                      {fl.label}
                    </option>
                  ))}
                </>
              ) : (
                <option value="">Tòa nhà không phân tầng</option>
              )}
            </Select>
          </div>
          <Select
            label="Thuộc tòa nhà"
            value={formState.buildingCode}
            onChange={(e) => handleBuildingChange(e.target.value as BuildingCode)}
          >
            {structures.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select
            label="Phân loại"
            value={formState.category}
            onChange={(e) =>
              setFormState((s) => ({
                ...s,
                category: e.target.value as CampusLocationItem["category"],
              }))
            }
          >
            <option value="common">Không gian chung &amp; Hội trường</option>
            <option value="lab">Phòng Lab CNTT</option>
            <option value="studio">Studio &amp; Thiết kế Đồ họa</option>
          </Select>
          <Select
            label="Cảnh Tour 360° liên kết"
            value={formState.sceneId}
            onChange={(e) => setFormState((s) => ({ ...s, sceneId: e.target.value }))}
            helperText={
              tourNodesError
                ? `Lỗi tải cảnh 360°: ${tourNodesError}`
                : tourNodes.length === 0
                  ? "Chưa có cảnh 360° nào trong PostgreSQL."
                  : undefined
            }
          >
            <option value="">Chưa liên kết cảnh 360°</option>
            {formState.sceneId &&
              !tourNodes.some((node) => node.slug === formState.sceneId) && (
                <option value={formState.sceneId}>{formState.sceneId}</option>
              )}
            {tourNodes.map((node) => (
              <option key={node.id} value={node.slug}>
                {node.title} ({node.slug})
              </option>
            ))}
          </Select>
          <Textarea
            label="Mô tả ngắn hiển thị trên thẻ"
            value={formState.shortDesc}
            onChange={(e) => setFormState((s) => ({ ...s, shortDesc: e.target.value }))}
          />
          <Select
            label="Trạng thái xuất bản"
            value={formState.status}
            onChange={(e) =>
              setFormState((s) => ({
                ...s,
                status: e.target.value as "published" | "draft",
              }))
            }
          >
            <option value="published">Đã xuất bản (Công khai)</option>
            <option value="draft">Bản nháp (Chỉ nội bộ)</option>
          </Select>

          <div className="pt-2 flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setDrawerOpen(false)}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon="save"
              loading={isSaving}
              className="flex-1"
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Drawer>

      <StatusToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

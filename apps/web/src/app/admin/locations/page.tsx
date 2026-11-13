"use client";

import React, { useMemo, useState } from "react";
import {
  BuildingCode,
  CAMPUS_BUILDINGS,
  CAMPUS_LOCATIONS,
  CampusLocationItem,
  TOUR_SCENES,
} from "@/data/campus-data";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  Drawer,
  Input,
  SearchInput,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import { resolveAutoImagePath, slugifyVietnamese } from "@/lib/slug-utils";

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<CampusLocationItem[]>(CAMPUS_LOCATIONS);
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
    floor: "Tầng 1",
    category: "common",
    shortDesc: "",
    sceneId: "",
    status: "published",
  });

  const [toast, setToast] = useState({ open: false, message: "" });

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
    setEditing(null);
    setFormState({
      name: "",
      code: `QTSC-${locations.length + 1}`,
      buildingCode: "INNOVATION",
      floor: "Tầng 1",
      category: "common",
      shortDesc: "",
      sceneId: TOUR_SCENES[0]?.id ?? "",
      status: "draft",
    });
    setDrawerOpen(true);
  };

  const openEdit = (loc: CampusLocationItem) => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const matchedBuilding = CAMPUS_BUILDINGS.find(
      (b) => b.code === formState.buildingCode
    );
    const buildingName = matchedBuilding?.shortName ?? "Tòa Innovation";
    const categoryLabel =
      formState.category === "lab"
        ? "Phòng Lab CNTT"
        : formState.category === "studio"
        ? "Studio & Multimedia"
        : "Không gian Chung";

    if (editing) {
      setLocations((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                name: formState.name.trim(),
                code: formState.code.trim(),
                buildingCode: formState.buildingCode,
                buildingName,
                floor: formState.floor.trim(),
                category: formState.category,
                categoryLabel,
                shortDesc: formState.shortDesc.trim(),
                sceneId: formState.sceneId || null,
                status: formState.status,
              }
            : item
        )
      );
      setToast({ open: true, message: `Đã cập nhật địa điểm "${formState.name}".` });
    } else {
      const generatedSlug =
        slugifyVietnamese(formState.name) ||
        formState.code.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const autoSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
      const autoImageUrl = resolveAutoImagePath(generatedSlug, "location");

      const created: CampusLocationItem = {
        id: `loc-${Date.now()}`,
        slug: autoSlug,
        code: formState.code.trim(),
        name: formState.name.trim(),
        buildingCode: formState.buildingCode,
        buildingName,
        floor: formState.floor.trim(),
        category: formState.category,
        categoryLabel,
        shortDesc: formState.shortDesc.trim() || "Không gian học tập tại CVPM Quang Trung.",
        description: formState.shortDesc.trim() || "Không gian học tập tại CVPM Quang Trung.",
        highlights: ["Đang cập nhật mô tả chi tiết"],
        imageUrl: autoImageUrl || matchedBuilding?.imageUrl || "/images/locations/building-innovation.jpg",
        sceneId: formState.sceneId || null,
        status: formState.status,
      };
      setLocations((prev) => [created, ...prev]);
      setToast({ open: true, message: `Đã tạo địa điểm mới "${created.name}" (Slug: ${autoSlug}).` });
    }
    setDrawerOpen(false);
  };

  const toggleStatus = (id: string) => {
    setLocations((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "published" ? "draft" : "published" }
          : item
      )
    );
    setToast({ open: true, message: "Đã thay đổi trạng thái xuất bản." });
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
        <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(row)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Quản lý Địa điểm QTSC</h1>
          <p className="type-body-sm text-secondary mt-1">
            Cấu hình danh sách phòng học, Lab, Hội trường và liên kết sang cảnh 360°.
          </p>
        </div>
        <Button variant="primary" size="md" icon="add" onClick={openCreate}>
          Thêm địa điểm
        </Button>
      </div>

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
              placeholder="Tìm theo mã phòng, tên không gian..."
              containerClassName="w-full sm:max-w-sm"
            />

            <Select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              aria-label="Lọc theo tòa nhà"
              containerClassName="w-full sm:w-52"
            >
              <option value="ALL">Tất cả tòa nhà</option>
              {CAMPUS_BUILDINGS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.shortName}
                </option>
              ))}
            </Select>
          </div>
        }
      />

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
            <Input
              label="Vị trí tầng"
              value={formState.floor}
              onChange={(e) => setFormState((s) => ({ ...s, floor: e.target.value }))}
            />
          </div>
          <Select
            label="Thuộc tòa nhà"
            value={formState.buildingCode}
            onChange={(e) =>
              setFormState((s) => ({
                ...s,
                buildingCode: e.target.value as BuildingCode,
              }))
            }
          >
            {CAMPUS_BUILDINGS.map((b) => (
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
          >
            <option value="">Chưa liên kết cảnh 360°</option>
            {TOUR_SCENES.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name} ({sc.id})
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
            <Button type="submit" variant="primary" size="md" icon="save" className="flex-1">
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Drawer>

      <StatusToast
        open={toast.open}
        type="success"
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { INITIAL_MEDIA_ASSETS, MediaAssetAdminItem } from "@/data/campus-data";
import {
  Badge,
  Button,
  FileDropzone,
  Modal,
  StatusToast,
} from "@/components/ui";

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAssetAdminItem[]>(INITIAL_MEDIA_ASSETS);
  const [filterKind, setFilterKind] = useState<"all" | "panorama_2_1" | "photo_2d">("all");
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetAdminItem | null>(null);
  const [toast, setToast] = useState<{ open: boolean; type: "success" | "warning"; message: string }>({
    open: false,
    type: "success",
    message: "",
  });

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      const objectUrl = URL.createObjectURL(file);
      const probe = new Image();
      probe.onload = () => {
        const w = probe.naturalWidth;
        const h = probe.naturalHeight;
        const ratio = h > 0 ? w / h : 0;
        const is2to1 = Math.abs(ratio - 2) <= 0.08;
        const sizeKb = `${Math.max(1, Math.round(file.size / 1024))} KB`;

        const added: MediaAssetAdminItem = {
          id: `med-${Date.now()}`,
          filename: file.name,
          url: objectUrl,
          kind: is2to1 ? "panorama_2_1" : "photo_2d",
          dimensions: `${w} × ${h} (${ratio.toFixed(2)}:1)`,
          ratioValid: is2to1,
          sizeLabel: sizeKb,
          usedBy: [],
          updatedAt: "Vừa tải lên",
        };
        setAssets((prev) => [added, ...prev]);

        if (is2to1) {
          setToast({
            open: true,
            type: "success",
            message: `Đã thêm "${file.name}" — đạt chuẩn Panorama 2:1 (${w}×${h}).`,
          });
        } else {
          setToast({
            open: true,
            type: "warning",
            message: `"${file.name}" (${w}×${h}) không đúng tỷ lệ 2:1. Khuyến nghị dùng làm ảnh 2D thay vì cảnh 360°.`,
          });
        }
      };
      probe.src = objectUrl;
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.usedBy.length > 0) {
      setToast({
        open: true,
        type: "warning",
        message: `Không thể xóa "${deleteTarget.filename}" vì đang gắn với ${deleteTarget.usedBy.length} cảnh/địa điểm.`,
      });
      setDeleteTarget(null);
      return;
    }
    setAssets((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setToast({
      open: true,
      type: "success",
      message: `Đã gỡ tệp "${deleteTarget.filename}" khỏi thư viện.`,
    });
    setDeleteTarget(null);
  };

  const visibleAssets =
    filterKind === "all"
      ? assets
      : assets.filter((item) => item.kind === filterKind);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Thư viện Media &amp; Kiểm định 2:1</h1>
          <p className="type-body-sm text-secondary mt-1">
            Quản lý ảnh toàn cảnh equirectangular 2:1 cho Tour 360° và ảnh không gian QTSC.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              { key: "all", label: `Tất cả (${assets.length})` },
              { key: "panorama_2_1", label: "Panorama 2:1" },
              { key: "photo_2d", label: "Ảnh 2D" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterKind(f.key)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                filterKind === f.key
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-container-lowest text-secondary border-surface-container hover:border-outline-variant"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Dropzone with Automatic Dimension Probe */}
      <FileDropzone
        label="Tải ảnh mới lên thư viện (tự động kiểm tra tỷ lệ 2:1)"
        accept="image/jpeg,image/png,image/webp"
        multiple={true}
        helperText="Khuyến nghị ảnh 360° chuẩn Equirectangular tỷ lệ đúng 2:1 (ví dụ 2048×1024 hoặc 4096×2048)."
        onFilesSelected={handleFilesSelected}
      />

      {/* Asset Grid (stable min-height prevents layout collapse on filter) */}
      <div className="min-h-[460px] sm:min-h-[580px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleAssets.map((asset) => (
            <article key={asset.id} className="ui-card overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-40 bg-slate-900">
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {asset.filename}
                    </p>
                    <Badge variant={asset.ratioValid ? "success" : "warning"}>
                      {asset.kind === "panorama_2_1"
                        ? asset.ratioValid
                          ? "2:1 Chuẩn"
                          : "3:1 Chưa đủ 2:1"
                        : "Ảnh 2D"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-secondary font-mono">
                    <span>{asset.dimensions}</span>
                    <span>{asset.sizeLabel}</span>
                  </div>

                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {asset.usedBy.length > 0 ? (
                      asset.usedBy.map((ref) => (
                        <Badge key={ref} variant="neutral">
                          {ref}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-secondary">Chưa gắn vào cảnh nào</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-surface-container-low flex items-center justify-between text-xs">
                <span className="text-secondary">{asset.updatedAt}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="delete"
                  onClick={() => setDeleteTarget(asset)}
                  className="text-error hover:bg-error-container/50"
                >
                  Gỡ tệp
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Reference Guard Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Kiểm tra ràng buộc trước khi xóa"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            {deleteTarget.usedBy.length > 0 ? (
              <div className="rounded-xl bg-warning-container border border-warning p-4 text-xs text-on-warning-container space-y-1.5">
                <p className="font-bold">Tệp này đang được sử dụng</p>
                <p>
                  <strong>{deleteTarget.filename}</strong> hiện gắn trực tiếp với:{" "}
                  {deleteTarget.usedBy.join(", ")}. Hãy thay thế ảnh trong cảnh/địa điểm trước khi xóa để tránh gãy hiển thị 360°.
                </p>
              </div>
            ) : (
              <p className="type-body-sm text-secondary">
                Tệp <strong>{deleteTarget.filename}</strong> chưa gắn với cảnh nào. Bạn xác nhận gỡ khỏi thư viện?
              </p>
            )}

            <div className="flex justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setDeleteTarget(null)}>
                Đóng
              </Button>
              {deleteTarget.usedBy.length === 0 && (
                <Button variant="danger" size="md" icon="delete" onClick={confirmDelete}>
                  Xác nhận gỡ tệp
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <StatusToast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

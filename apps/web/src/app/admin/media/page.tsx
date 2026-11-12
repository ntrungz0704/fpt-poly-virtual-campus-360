"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  FileDropzone,
  LoadingState,
  Modal,
  StatusToast,
} from "@/components/ui";
import {
  mediaApi,
  AdminMediaAssetItem,
  formatAuthErrorMessage,
} from "@/lib/auth/api-client";

async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function probeDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };
    img.src = objectUrl;
  });
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<AdminMediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<"all" | "panorama_2_1" | "photo_2d">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaAssetItem | null>(null);
  const [toast, setToast] = useState<{ open: boolean; type: "success" | "warning"; message: string }>({
    open: false,
    type: "success",
    message: "",
  });

  const loadMedia = useCallback(async () => {
    try {
      const res = await mediaApi.listMedia({
        assetKind: filterKind === "all" ? undefined : filterKind.toUpperCase(),
      });
      setAssets(res.items);
    } catch (err) {
      setToast({
        open: true,
        type: "warning",
        message: formatAuthErrorMessage(err, "Không thể tải danh sách media từ server."),
      });
    } finally {
      setLoading(false);
    }
  }, [filterKind]);

  useEffect(() => {
    let active = true;
    mediaApi
      .listMedia({
        assetKind: filterKind === "all" ? undefined : filterKind.toUpperCase(),
      })
      .then((res) => {
        if (active) {
          setAssets(res.items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setToast({
            open: true,
            type: "warning",
            message: formatAuthErrorMessage(err, "Không thể tải danh sách media từ server."),
          });
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [filterKind]);

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress(`Đang xử lý ${i + 1}/${fileList.length}: ${file.name}...`);

      try {
        const { width, height } = await probeDimensions(file);
        const sha256 = await computeSha256(file);
        const ratio = height > 0 ? width / height : 0;
        const is2to1 = Math.abs(ratio - 2) <= 0.08;
        const assetKind = is2to1 ? "PANORAMA_2_1" : "PHOTO_2D";

        setUploadProgress(`Đang xin quyền upload ${file.name}...`);
        const presignResult = await mediaApi.presign({
          assetKind,
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          fileSizeBytes: file.size,
          declaredWidth: Math.max(1, width),
          declaredHeight: Math.max(1, height),
          sha256,
        });

        setUploadProgress(`Đang tải dữ liệu tệp ${file.name}...`);
        await mediaApi.uploadBinary(presignResult.uploadUrl, file);

        setUploadProgress(`Đang xác thực toàn vẹn & lưu trữ ${file.name}...`);
        await mediaApi.completeUpload(presignResult.uploadToken, sha256);

        successCount++;
      } catch (error) {
        setToast({
          open: true,
          type: "warning",
          message: formatAuthErrorMessage(error, `Lỗi tải tệp "${file.name}".`),
        });
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      setToast({
        open: true,
        type: "success",
        message: `Đã tải lên và xác thực thành công ${successCount}/${fileList.length} tệp.`,
      });
      await loadMedia();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await mediaApi.deleteMedia(deleteTarget.id);
      setToast({
        open: true,
        type: "success",
        message: `Đã gỡ tệp "${deleteTarget.originalFilename}" khỏi thư viện.`,
      });
      setDeleteTarget(null);
      await loadMedia();
    } catch (error) {
      setToast({
        open: true,
        type: "warning",
        message: formatAuthErrorMessage(
          error,
          `Không thể xóa tệp "${deleteTarget.originalFilename}".`,
        ),
      });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Thư viện Media &amp; Kiểm định 2:1</h1>
          <p className="type-body-sm text-secondary mt-1">
            Quản lý ảnh toàn cảnh equirectangular 2:1 cho Tour 360° và ảnh không gian QTSC kết nối PostgreSQL &amp; Cloud Storage.
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

      {/* Upload Dropzone */}
      <div className="space-y-2">
        <FileDropzone
          label="Tải ảnh mới lên thư viện (xác thực chữ ký nhị phân &amp; kiểm tra tỷ lệ 2:1)"
          accept="image/jpeg,image/png,image/webp"
          multiple={true}
          helperText="Hỗ trợ JPG, PNG, WebP tối đa 50MB. Hệ thống tự động xác minh SHA-256, magic bytes và tỷ lệ 2:1."
          onFilesSelected={handleFilesSelected}
        />
        {uploading && uploadProgress && (
          <div className="rounded-xl border border-primary/30 bg-primary-fixed/20 p-3.5 flex items-center gap-3 text-xs sm:text-sm text-primary font-medium animate-pulse">
            <span className="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">
              sync
            </span>
            <span>{uploadProgress}</span>
          </div>
        )}
      </div>

      {/* Asset Grid */}
      <div className="min-h-[460px] sm:min-h-[580px]">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingState label="Đang nạp dữ liệu media từ máy chủ..." />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center ui-card p-8 space-y-2">
            <span className="material-symbols-outlined text-4xl text-secondary" aria-hidden="true">
              perm_media
            </span>
            <p className="text-on-surface font-semibold">Chưa có tệp media nào trong mục này</p>
            <p className="text-xs text-secondary">Hãy kéo thả hoặc chọn tệp ở phía trên để tải lên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => {
              const displayUrl = asset.publicUrl || `/images/locations/${asset.originalFilename}`;
              const sizeKb = `${Math.max(1, Math.round(asset.fileSizeBytes / 1024))} KB`;
              const isPano = asset.assetKind === "PANORAMA_2_1";

              return (
                <article key={asset.id} className="ui-card overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 bg-slate-900 overflow-hidden">
                      <img
                        src={displayUrl}
                        alt={asset.originalFilename}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                      <span className="absolute top-2.5 right-2.5">
                        <Badge variant={isPano ? "primary" : "secondary"}>
                          {isPano ? "Panorama 2:1" : "Ảnh 2D"}
                        </Badge>
                      </span>
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-on-surface truncate" title={asset.originalFilename}>
                          {asset.originalFilename}
                        </p>
                        <span className="text-[11px] font-mono font-semibold text-secondary shrink-0">
                          {sizeKb}
                        </span>
                      </div>

                      <div className="text-xs text-secondary space-y-1">
                        <p>Kích thước: {asset.originalWidth} × {asset.originalHeight} px</p>
                        <p className="truncate" title={asset.sha256Checksum}>
                          SHA: <span className="font-mono text-[10px]">{asset.sha256Checksum.slice(0, 16)}…</span>
                        </p>
                        <p className="text-primary font-medium">
                          {asset.usageCount > 0
                            ? `Đang gắn với ${asset.usageCount} đối tượng`
                            : "Chưa gắn với đối tượng nào"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-surface-container flex items-center justify-between">
                    <span className="text-[11px] text-tertiary">
                      {new Date(asset.createdAt).toLocaleDateString("vi-VN")}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(asset)}
                      className="text-error hover:bg-error-container/30 !px-2.5"
                    >
                      Xóa
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận gỡ tệp media"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Bạn có chắc chắn muốn gỡ tệp{" "}
            <strong className="text-on-surface font-semibold">{deleteTarget?.originalFilename}</strong> khỏi thư viện?
          </p>

          {deleteTarget && deleteTarget.usageCount > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-700 mt-0.5 shrink-0" aria-hidden="true">
                warning
              </span>
              <span>
                Cảnh báo: Tệp này đang được tham chiếu bởi {deleteTarget.usageCount} đối tượng. Hệ thống sẽ chặn xóa để bảo vệ tính toàn vẹn dữ liệu.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Xác nhận gỡ
            </Button>
          </div>
        </div>
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

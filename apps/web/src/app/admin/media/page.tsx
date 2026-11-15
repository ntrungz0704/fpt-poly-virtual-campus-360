"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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

interface UploadQueueItem {
  id: string;
  file: File;
  filename: string;
  fileSizeBytes: number;
  status: "queued" | "probing" | "presigning" | "uploading" | "completing" | "success" | "error";
  statusLabel: string;
  errorMessage?: string;
  progressPercent: number;
  tags: string[];
  category: string;
}

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
  const [filterKind, setFilterKind] = useState<"all" | "panorama_2_1" | "photo_2d">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Multi-file upload queue
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const queueProcessingRef = useRef(false);

  // Modals & previews
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaAssetItem | null>(null);
  const [previewAsset, setPreviewAsset] = useState<AdminMediaAssetItem | null>(null);

  const [toast, setToast] = useState<{ open: boolean; type: "success" | "warning"; message: string }>({
    open: false,
    type: "success",
    message: "",
  });

  const loadMedia = useCallback(async () => {
    try {
      const res = await mediaApi.listMedia({
        assetKind: filterKind === "all" ? undefined : filterKind.toUpperCase(),
        q: searchQuery.trim() || undefined,
        tag: selectedTag.trim() || undefined,
        category: selectedCategory === "all" ? undefined : selectedCategory,
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
  }, [filterKind, searchQuery, selectedTag, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedia();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadMedia]);

  // Queue item executor
  const processUploadItem = async (item: UploadQueueItem) => {
    const updateItem = (updates: Partial<UploadQueueItem>) => {
      setUploadQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, ...updates } : it)),
      );
    };

    try {
      // 1. Probing dimensions & aspect ratio
      updateItem({
        status: "probing",
        statusLabel: "Kiểm tra kích thước & tỷ lệ ảnh...",
        progressPercent: 15,
      });
      const { width, height } = await probeDimensions(item.file);
      const ratio = height > 0 ? width / height : 0;
      const is2to1 = Math.abs(ratio - 2) <= 0.08;
      const assetKind = is2to1 ? "PANORAMA_2_1" : "PHOTO_2D";

      // 2. Compute SHA-256 checksum
      updateItem({
        status: "presigning",
        statusLabel: "Tính mã kiểm tra SHA-256...",
        progressPercent: 30,
      });
      const sha256 = await computeSha256(item.file);

      // 3. Presign request
      updateItem({
        status: "presigning",
        statusLabel: "Đăng ký tải lên & xin quyền lưu trữ...",
        progressPercent: 45,
      });
      const presignResult = await mediaApi.presign({
        assetKind,
        filename: item.filename,
        mimeType: item.file.type || "image/jpeg",
        fileSizeBytes: item.file.size,
        declaredWidth: Math.max(1, width),
        declaredHeight: Math.max(1, height),
        sha256,
        tags: item.tags,
        category: item.category,
      });

      // 4. Binary upload
      updateItem({
        status: "uploading",
        statusLabel: "Đang truyền tải dữ liệu nhị phân...",
        progressPercent: 65,
      });
      await mediaApi.uploadBinary(presignResult.uploadUrl, item.file);

      // 5. Complete & WebP generation
      updateItem({
        status: "completing",
        statusLabel: "Xác thực & sinh các biến thể WebP (Sharp)...",
        progressPercent: 85,
      });
      await mediaApi.completeUpload(presignResult.uploadToken, sha256);

      // 6. Succeeded
      updateItem({
        status: "success",
        statusLabel: "Hoàn tất xử lý & lưu trữ vào PostgreSQL!",
        progressPercent: 100,
      });
    } catch (err) {
      updateItem({
        status: "error",
        statusLabel: "Thất bại",
        errorMessage: formatAuthErrorMessage(err, "Không thể tải tệp lên."),
        progressPercent: 0,
      });
    }
  };

  // Run the queue
  const runQueue = useCallback(async (currentQueue: UploadQueueItem[]) => {
    if (queueProcessingRef.current) return;
    queueProcessingRef.current = true;
    setIsProcessingQueue(true);

    const pending = currentQueue.filter((it) => it.status === "queued");
    let newlyUploaded = 0;

    for (const item of pending) {
      await processUploadItem(item);
      newlyUploaded++;
    }

    queueProcessingRef.current = false;
    setIsProcessingQueue(false);

    if (newlyUploaded > 0) {
      loadMedia();
    }
  }, [loadMedia]);

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const newItems: UploadQueueItem[] = fileList.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      filename: file.name,
      fileSizeBytes: file.size,
      status: "queued",
      statusLabel: "Đang chờ hàng đợi...",
      progressPercent: 0,
      tags: selectedTag ? [selectedTag] : [],
      category: selectedCategory !== "all" ? selectedCategory : "STANDARD_IMAGE",
    }));

    setUploadQueue((prev) => {
      const updated = [...newItems, ...prev];
      setTimeout(() => runQueue(updated), 50);
      return updated;
    });
  };

  const retryQueueItem = async (id: string) => {
    const item = uploadQueue.find((it) => it.id === id);
    if (!item) return;

    setUploadQueue((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              status: "queued",
              statusLabel: "Đang chuẩn bị thử lại...",
              errorMessage: undefined,
              progressPercent: 0,
            }
          : it,
      ),
    );

    setTimeout(() => {
      setUploadQueue((prev) => {
        runQueue(prev);
        return prev;
      });
    }, 50);
  };

  const removeQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((it) => it.id !== id));
  };

  const clearCompletedQueue = () => {
    setUploadQueue((prev) => prev.filter((it) => it.status !== "success"));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await mediaApi.deleteMedia(deleteTarget.id);
      setToast({
        open: true,
        type: "success",
        message: `Đã xóa tệp "${deleteTarget.originalFilename}" khỏi thư viện.`,
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

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setToast({
      open: true,
      type: "success",
      message: "Đã sao chép đường dẫn URL vào bộ nhớ tạm.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="type-h1 text-on-surface">Thư viện Media &amp; Tối ưu WebP</h1>
          <p className="type-body-sm text-secondary mt-1">
            Quản trị ảnh 360° Equirectangular 2:1 và ảnh không gian QTSC. Tự động chuyển đổi đa biến thể WebP (Sharp) và lưu trữ PostgreSQL an toàn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* Upload Zone */}
      <div className="space-y-4">
        <FileDropzone
          label="Tải ảnh mới lên thư viện (Hỗ trợ kéo thả nhiều tệp đồng thời)"
          accept="image/jpeg,image/png,image/webp"
          multiple={true}
          helperText="Tải lên tệp JPG, PNG, WebP tối đa 50MB. Hệ thống tự động xác thực SHA-256, kiểm tra tỷ lệ 2:1 và sinh biến thể WebP cho Mobile/Desktop."
          onFilesSelected={handleFilesSelected}
        />

        {/* Upload Queue Card */}
        {uploadQueue.length > 0 && (
          <div className="ui-card p-4 space-y-3 border-primary/20 bg-primary-fixed/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">
                  cloud_upload
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  Hàng đợi tải lên ({uploadQueue.filter((it) => it.status === "success").length}/{uploadQueue.length} hoàn tất)
                </span>
                {isProcessingQueue && (
                  <span className="material-symbols-outlined text-primary text-[18px] animate-spin" aria-hidden="true">
                    sync
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {uploadQueue.some((it) => it.status === "success") && (
                  <Button variant="ghost" size="sm" onClick={clearCompletedQueue} className="text-xs">
                    Xóa tệp đã xong
                  </Button>
                )}
              </div>
            </div>

            <div className="divide-y divide-surface-container max-h-64 overflow-y-auto">
              {uploadQueue.map((item) => (
                <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1 min-w-0 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-on-surface truncate" title={item.filename}>
                        {item.filename}
                      </span>
                      <span className="text-[11px] font-mono text-tertiary">
                        ({Math.round(item.fileSizeBytes / 1024)} KB)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-medium ${
                          item.status === "success"
                            ? "text-emerald-700"
                            : item.status === "error"
                              ? "text-rose-700"
                              : "text-primary"
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                      {item.errorMessage && (
                        <span className="text-[11px] text-rose-600 truncate max-w-xs" title={item.errorMessage}>
                          - {item.errorMessage}
                        </span>
                      )}
                    </div>

                    {/* Mini progress bar */}
                    {item.status !== "success" && item.status !== "error" && (
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {item.status === "error" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => retryQueueItem(item.id)}
                        className="!text-xs !py-1 !px-2.5"
                      >
                        Thử lại
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeQueueItem(item.id)}
                      className="p-1 text-secondary hover:text-error rounded transition-colors"
                      title="Gỡ khỏi danh sách"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ui-card p-3.5">
        <div>
          <label className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
            Tìm theo tên tệp
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="VD: sanh-toa-t, khu-trien-lam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-surface-container bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
            Lọc theo Thẻ (Tag)
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-secondary text-[18px]">
              label
            </span>
            <input
              type="text"
              placeholder="VD: toa-t, vr360, outdoor..."
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-surface-container bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
            Phân loại ảnh
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-surface-container bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="PANORAMA_360">Toàn cảnh Panorama 360°</option>
            <option value="STANDARD_IMAGE">Ảnh địa điểm thông thường</option>
            <option value="NEWS_COVER">Ảnh bìa tin tức / sự kiện</option>
          </select>
        </div>
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
            <p className="text-on-surface font-semibold">Chưa có tệp media nào khớp với điều kiện tìm kiếm</p>
            <p className="text-xs text-secondary">Hãy thay đổi bộ lọc hoặc chọn tệp ở phía trên để tải lên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => {
              const displayUrl = asset.thumbnailUrl || asset.publicUrl || `/images/locations/${asset.originalFilename}`;
              const sizeKb = `${Math.max(1, Math.round(asset.fileSizeBytes / 1024))} KB`;
              const isPano = asset.assetKind === "PANORAMA_2_1";
              const isWebp = asset.isWebpOptimized || Boolean(asset.thumbnailUrl || asset.optimizedDesktopUrl);

              return (
                <article key={asset.id} className="ui-card overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 bg-slate-900 overflow-hidden group">
                      <img
                        src={displayUrl}
                        alt={asset.originalFilename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        {isWebp && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/90 text-white backdrop-blur shadow-sm">
                            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                            WebP
                          </span>
                        )}
                        <Badge variant={isPano ? "primary" : "secondary"}>
                          {isPano ? "Panorama 2:1" : "Ảnh 2D"}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewAsset(asset)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-medium text-xs gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        Xem chi tiết biến thể
                      </button>
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

                        {/* Reference status */}
                        <div className="pt-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              asset.usageCount > 0
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {asset.usageCount > 0
                              ? `Đang gắn với ${asset.usageCount} đối tượng`
                              : "Chưa gắn với đối tượng nào"}
                          </span>
                        </div>

                        {/* Tags */}
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {asset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded bg-surface-container text-tertiary text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-surface-container flex items-center justify-between">
                    <span className="text-[11px] text-tertiary">
                      {new Date(asset.createdAt).toLocaleDateString("vi-VN")}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyUrlToClipboard(asset.publicUrl || "")}
                        className="text-secondary hover:text-primary !px-2"
                        title="Sao chép liên kết URL"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(asset)}
                        className="text-error hover:bg-error-container/30 !px-2.5"
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Variant Preview Modal */}
      <Modal
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        title="Chi tiết tệp Media & Biến thể WebP"
      >
        {previewAsset && (
          <div className="space-y-4">
            <div className="h-56 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={previewAsset.publicUrl || ""}
                alt={previewAsset.originalFilename}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="text-xs space-y-2 text-secondary">
              <p><strong>Tên tệp gốc:</strong> {previewAsset.originalFilename}</p>
              <p><strong>Loại tệp:</strong> {previewAsset.assetKind === "PANORAMA_2_1" ? "Toàn cảnh 360° 2:1" : "Ảnh phẳng 2D"}</p>
              <p><strong>Định dạng &amp; Dung lượng:</strong> {previewAsset.mimeType} - {Math.round(previewAsset.fileSizeBytes / 1024)} KB</p>
              <p><strong>Kích thước ảnh:</strong> {previewAsset.originalWidth} × {previewAsset.originalHeight} px</p>

              <div className="pt-2 border-t border-surface-container space-y-1.5">
                <p className="font-semibold text-on-surface">Các biến thể WebP đã sinh tự động (Sharp Pipeline):</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-surface-container border border-surface-container-high">
                    <span className="font-bold text-on-surface block">Thumbnail (400px WebP):</span>
                    {previewAsset.thumbnailUrl ? (
                      <a href={previewAsset.thumbnailUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                        Xem WebP Thumb
                      </a>
                    ) : (
                      <span className="text-tertiary">Chưa sinh</span>
                    )}
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-surface-container-high">
                    <span className="font-bold text-on-surface block">Desktop WebP:</span>
                    {previewAsset.optimizedDesktopUrl ? (
                      <a href={previewAsset.optimizedDesktopUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                        Xem WebP Desktop
                      </a>
                    ) : (
                      <span className="text-tertiary">Chưa sinh</span>
                    )}
                  </div>
                  <div className="p-2 rounded bg-surface-container border border-surface-container-high">
                    <span className="font-bold text-on-surface block">Mobile WebP:</span>
                    {previewAsset.optimizedMobileUrl ? (
                      <a href={previewAsset.optimizedMobileUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                        Xem WebP Mobile
                      </a>
                    ) : (
                      <span className="text-tertiary">Chưa sinh</span>
                    )}
                  </div>
                </div>
              </div>

              {previewAsset.usageCount > 0 && (
                <div className="p-2.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                  <p className="font-semibold">Chi tiết liên kết đang sử dụng:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {previewAsset.usageDetails.buildings > 0 && <li>Ảnh bìa Tòa nhà: {previewAsset.usageDetails.buildings}</li>}
                    {previewAsset.usageDetails.tourNodes > 0 && <li>Điểm dừng Tour 360°: {previewAsset.usageDetails.tourNodes}</li>}
                    {previewAsset.usageDetails.locations > 0 && <li>Bộ sưu tập Địa điểm: {previewAsset.usageDetails.locations}</li>}
                    {(previewAsset.usageDetails.newsArticles ?? 0) > 0 && <li>Ảnh bìa Tin tức: {previewAsset.usageDetails.newsArticles}</li>}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setPreviewAsset(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
              <div>
                <p className="font-bold">Cảnh báo tính toàn vẹn tham chiếu:</p>
                <p className="mt-0.5">
                  Tệp này đang được sử dụng bởi {deleteTarget.usageCount} đối tượng (Tòa nhà: {deleteTarget.usageDetails.buildings}, Điểm tour: {deleteTarget.usageDetails.tourNodes}, Địa điểm: {deleteTarget.usageDetails.locations}, Tin tức: {deleteTarget.usageDetails.newsArticles ?? 0}).
                </p>
                <p className="mt-1 text-rose-800 font-semibold">
                  Hệ thống PostgreSQL sẽ CHẶN thao tác xóa này để bảo vệ tính toàn vẹn dữ liệu.
                </p>
              </div>
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

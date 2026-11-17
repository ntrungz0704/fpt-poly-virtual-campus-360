"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  Drawer,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  SearchInput,
  Select,
  StatusToast,
  Textarea,
} from "@/components/ui";
import {
  AdminNewsArticleItem,
  createAdminNews,
  deleteAdminNews,
  fetchAdminNews,
  publishAdminNews,
  unpublishAdminNews,
  updateAdminNews,
} from "@/lib/admin/news-admin-api";
import {
  AdminMediaAssetItem,
  formatAuthErrorMessage,
  mediaApi,
} from "@/lib/auth/api-client";
import { TOUR_SCENES } from "@/data/campus-data";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<AdminNewsArticleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Edit / Create Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AdminNewsArticleItem | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Media picker modal
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaList, setMediaList] = useState<AdminMediaAssetItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Form state
  const [formState, setFormState] = useState<{
    title: string;
    slug: string;
    tag: string;
    excerpt: string;
    content: string;
    coverMediaId: string | null;
    coverImageUrl: string | null;
    relatedSceneId: string | null;
    status: "DRAFT" | "PUBLISHED";
  }>({
    title: "",
    slug: "",
    tag: "Tin tức chung",
    excerpt: "",
    content: "",
    coverMediaId: null,
    coverImageUrl: null,
    relatedSceneId: null,
    status: "DRAFT",
  });

  const [deleteTarget, setDeleteTarget] = useState<AdminNewsArticleItem | null>(null);

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type: "success" | "warning";
  }>({ open: false, message: "", type: "success" });

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminNews({
        q: query.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setArticles(res.items);
      setTotal(res.total);
      setFetchError(null);
    } catch (err) {
      const msg = formatAuthErrorMessage(
        err,
        "Không thể tải danh sách bài viết từ máy chủ.",
      );
      setFetchError(msg);
      setToast({ open: true, message: msg, type: "warning" });
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    let active = true;
    fetchAdminNews({
      q: query.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    })
      .then((res) => {
        if (active) {
          setArticles(res.items);
          setTotal(res.total);
          setFetchError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          const msg = formatAuthErrorMessage(
            err,
            "Không thể tải danh sách bài viết từ máy chủ.",
          );
          setFetchError(msg);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [query, statusFilter]);

  const loadMediaLibrary = async () => {
    try {
      setMediaLoading(true);
      const res = await mediaApi.listMedia();
      setMediaList(res.items);
    } catch (err) {
      setToast({
        open: true,
        message: formatAuthErrorMessage(err, "Không thể tải thư viện media."),
        type: "warning",
      });
    } finally {
      setMediaLoading(false);
    }
  };

  const openCreateDrawer = () => {
    setEditing(null);
    setFormState({
      title: "",
      slug: "",
      tag: "Tin tức chung",
      excerpt: "",
      content: "",
      coverMediaId: null,
      coverImageUrl: null,
      relatedSceneId: null,
      status: "DRAFT",
    });
    setActiveTab("edit");
    setDrawerOpen(true);
  };

  const openEditDrawer = (article: AdminNewsArticleItem) => {
    setEditing(article);
    setFormState({
      title: article.title,
      slug: article.slug,
      tag: article.tag,
      excerpt: article.excerpt,
      content: article.content || "",
      coverMediaId: article.coverMediaId || null,
      coverImageUrl:
        article.coverMedia?.publicUrl ||
        article.coverMedia?.thumbnailKey ||
        article.coverMedia?.originalObjectKey ||
        article.coverImageUrl ||
        null,
      relatedSceneId: article.relatedSceneId || null,
      status: article.status,
    });
    setActiveTab("edit");
    setDrawerOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormState((prev) => {
      const updated = { ...prev, title: val };
      if (!editing) {
        updated.slug = slugify(val);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formState.title.trim()) {
      setToast({ open: true, message: "Tiêu đề không được để trống.", type: "warning" });
      return;
    }
    if (!formState.excerpt.trim()) {
      setToast({ open: true, message: "Mô tả ngắn (excerpt) không được để trống.", type: "warning" });
      return;
    }
    if (!formState.content.trim()) {
      setToast({ open: true, message: "Nội dung bài viết không được để trống.", type: "warning" });
      return;
    }

    try {
      setIsSaving(true);
      if (editing) {
        await updateAdminNews(editing.id, {
          title: formState.title,
          slug: formState.slug || undefined,
          tag: formState.tag,
          excerpt: formState.excerpt,
          content: formState.content,
          coverMediaId: formState.coverMediaId,
          coverImageUrl: formState.coverImageUrl,
          relatedSceneId: formState.relatedSceneId,
          status: formState.status,
        });
        setToast({ open: true, message: "Cập nhật bài viết thành công!", type: "success" });
      } else {
        await createAdminNews({
          title: formState.title,
          slug: formState.slug || undefined,
          tag: formState.tag,
          excerpt: formState.excerpt,
          content: formState.content,
          coverMediaId: formState.coverMediaId,
          coverImageUrl: formState.coverImageUrl,
          relatedSceneId: formState.relatedSceneId,
          status: formState.status,
        });
        setToast({ open: true, message: "Tạo bài viết mới thành công!", type: "success" });
      }
      setDrawerOpen(false);
      await loadArticles();
    } catch (err) {
      const msg = formatAuthErrorMessage(err, "Lỗi khi lưu bài viết.");
      setToast({ open: true, message: msg, type: "warning" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = useCallback(
    async (article: AdminNewsArticleItem) => {
      const isCurrentlyPublished = article.status === "PUBLISHED";
      try {
        if (isCurrentlyPublished) {
          await unpublishAdminNews(article.id);
          setToast({
            open: true,
            message: `Đã chuyển bài viết "${article.title}" về trạng thái DRAFT.`,
            type: "success",
          });
        } else {
          await publishAdminNews(article.id);
          setToast({
            open: true,
            message: `Đã xuất bản bài viết "${article.title}" lên trang công khai!`,
            type: "success",
          });
        }
        await loadArticles();
      } catch (err) {
        setToast({
          open: true,
          message: formatAuthErrorMessage(
            err,
            "Không thể cập nhật trạng thái xuất bản.",
          ),
          type: "warning",
        });
      }
    },
    [loadArticles],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminNews(deleteTarget.id);
      setToast({
        open: true,
        message: `Đã xóa bài viết "${deleteTarget.title}".`,
        type: "success",
      });
      setDeleteTarget(null);
      await loadArticles();
    } catch (err) {
      setToast({
        open: true,
        message: formatAuthErrorMessage(err, "Không thể xóa bài viết."),
        type: "warning",
      });
    }
  };

  const columns: DataTableColumn<AdminNewsArticleItem>[] = useMemo(
    () => [
      {
        key: "cover",
        header: "Ảnh bìa",
        render: (item: AdminNewsArticleItem) => {
          const img =
            item.coverMedia?.publicUrl ||
            item.coverMedia?.thumbnailKey ||
            item.coverMedia?.originalObjectKey ||
            item.coverImageUrl ||
            "/images/locations/building-innovation.jpg";
          return (
            <div className="relative w-16 h-10 rounded overflow-hidden bg-surface-container-high border border-surface-container">
              <Image
                src={img}
                alt={item.title}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
          );
        },
      },
      {
        key: "title",
        header: "Tiêu đề & Đường dẫn",
        render: (item: AdminNewsArticleItem) => (
          <div className="space-y-0.5 max-w-md">
            <p className="font-semibold text-on-surface line-clamp-1">{item.title}</p>
            <p className="text-xs text-on-surface-variant font-mono">/news/{item.slug}</p>
          </div>
        ),
      },
      {
        key: "tag",
        header: "Chuyên mục",
        render: (item: AdminNewsArticleItem) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-container text-on-primary-container">
            {item.tag}
          </span>
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        render: (item: AdminNewsArticleItem) => {
          const isPublished = item.status === "PUBLISHED";
          return (
            <Badge variant={isPublished ? "success" : "neutral"}>
              {isPublished ? "Đã xuất bản" : "Bản nháp"}
            </Badge>
          );
        },
      },
      {
        key: "publishedAt",
        header: "Ngày đăng",
        render: (item: AdminNewsArticleItem) => (
          <span className="text-xs text-on-surface-variant">
            {item.publishedAt
              ? new Intl.DateTimeFormat("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(item.publishedAt))
              : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (item: AdminNewsArticleItem) => {
          const isPublished = item.status === "PUBLISHED";
          return (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={isPublished ? "outline" : "primary"}
                onClick={() => handleTogglePublish(item)}
                title={isPublished ? "Chuyển về Nháp" : "Xuất bản ngay"}
              >
                {isPublished ? "Hạ bài" : "Đăng"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDrawer(item)}
              >
                Sửa
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteTarget(item)}
              >
                Xóa
              </Button>
            </div>
          );
        },
      },
    ],
    [handleTogglePublish],
  );

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Quản trị Tin tức &amp; Cẩm nang QTSC
          </h1>
          <p className="text-sm text-on-surface-variant">
            Quản lý bài viết cẩm nang, tin tức Open Day và tích hợp hình ảnh Media Library ({total} bài).
          </p>
        </div>
        <Button variant="primary" onClick={openCreateDrawer}>
          <span className="material-symbols-outlined text-[18px] mr-1">add</span>
          Viết bài mới
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc slug..."
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
            <option value="DRAFT">Bản nháp (DRAFT)</option>
          </Select>
        </div>
      </div>

      {/* Main Content State */}
      {fetchError ? (
        <ErrorState
          title="Không thể tải danh sách bài viết"
          description={fetchError}
          actionLabel="Thử lại"
          onAction={() => {
            void loadArticles();
          }}
        />
      ) : loading ? (
        <LoadingState label="Đang tải dữ liệu bài viết từ cơ sở dữ liệu..." />
      ) : (
        <DataTable<AdminNewsArticleItem>
          columns={columns}
          data={articles}
          rowKey={(item) => item.id}
          emptyTitle="Chưa có bài viết nào phù hợp với bộ lọc."
        />
      )}

      {/* Create / Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Chỉnh sửa: ${editing.title}` : "Soạn thảo bài viết mới"}
        className="max-w-2xl"
      >
        <div className="space-y-5 pb-6">
          {/* Tabs */}
          <div className="flex border-b border-surface-container">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "edit"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "preview"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Xem trước bài viết
            </button>
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Tiêu đề bài viết *
                </label>
                <Input
                  value={formState.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Slug đường dẫn (URL) *
                  </label>
                  <Input
                    value={formState.slug}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="vi-du-duong-dan-bai-viet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                    Chuyên mục (Tag) *
                  </label>
                  <Input
                    value={formState.tag}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, tag: e.target.value }))
                    }
                    placeholder="VD: Hướng dẫn tham quan, Open Day 2026..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Ảnh bìa đại diện
                </label>
                <div className="flex items-center gap-3">
                  {formState.coverImageUrl ? (
                    <div className="relative w-24 h-16 rounded overflow-hidden border border-surface-container shrink-0">
                      <Image
                        src={formState.coverImageUrl}
                        alt="Cover preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded border border-dashed border-surface-container flex items-center justify-center text-xs text-on-surface-variant shrink-0">
                      Chưa có ảnh
                    </div>
                  )}
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void loadMediaLibrary();
                        setMediaPickerOpen(true);
                      }}
                    >
                      <span className="material-symbols-outlined text-[16px] mr-1">
                        photo_library
                      </span>
                      Chọn từ Thư viện Media
                    </Button>
                    <p className="text-[11px] text-on-surface-variant">
                      Hoặc bài viết sẽ tự dùng ảnh mặc định của tòa nhà Innovation.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Liên kết Điểm nhìn Tour 360° (Tùy chọn)
                </label>
                <Select
                  value={formState.relatedSceneId || ""}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      relatedSceneId: e.target.value || null,
                    }))
                  }
                >
                  <option value="">— Không liên kết cảnh 360° —</option>
                  {TOUR_SCENES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Tóm tắt bài viết (Excerpt) *
                </label>
                <Textarea
                  rows={2}
                  value={formState.excerpt}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, excerpt: e.target.value }))
                  }
                  placeholder="Mô tả tóm tắt nội dung bài viết hiển thị trên danh sách thẻ..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Nội dung chi tiết (Markdown / Văn bản) *
                </label>
                <Textarea
                  rows={10}
                  value={formState.content}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Nhập nội dung bài viết. Các đoạn văn cách nhau bằng một dòng trống..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-1">
                  Trạng thái xuất bản
                </label>
                <Select
                  value={formState.status}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: e.target.value as "DRAFT" | "PUBLISHED",
                    }))
                  }
                >
                  <option value="DRAFT">Bản nháp (DRAFT) — Chưa hiển thị ra ngoài</option>
                  <option value="PUBLISHED">Xuất bản ngay (PUBLISHED)</option>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl bg-surface-container border border-surface-container">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-on-primary">
                {formState.tag}
              </span>
              <h2 className="text-xl font-bold text-on-surface">{formState.title || "Tiêu đề bài viết"}</h2>
              <p className="text-sm italic text-on-surface-variant">{formState.excerpt || "Tóm tắt..."}</p>

              {formState.coverImageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={formState.coverImageUrl}
                    alt="Preview cover"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="space-y-3 pt-2 text-sm text-on-surface leading-relaxed">
                {(formState.content || "Chưa có nội dung...")
                  .split(/\n\n+/)
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph.trim()}</p>
                  ))}
              </div>
            </div>
          )}

          {/* Drawer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container">
            <Button
              variant="outline"
              onClick={() => setDrawerOpen(false)}
              disabled={isSaving}
            >
              Hủy bỏ
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo bài viết"}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Media Picker Modal */}
      <Modal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        title="Chọn hình ảnh từ Thư viện Media"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {mediaLoading ? (
            <LoadingState label="Đang tải danh sách ảnh..." />
          ) : mediaList.length === 0 ? (
            <p className="text-center py-8 text-sm text-on-surface-variant">
              Thư viện Media hiện chưa có ảnh nào. Bạn có thể tải ảnh lên ở mục Quản lý Media.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaList.map((asset) => {
                const url = asset.thumbnailUrl || asset.publicUrl || "";
                const isSelected = formState.coverMediaId === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        coverMediaId: asset.id,
                        coverImageUrl: url,
                      }));
                      setMediaPickerOpen(false);
                    }}
                    className={`relative rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary"
                        : "border-surface-container hover:border-primary/50"
                    }`}
                  >
                    <div className="relative aspect-video w-full bg-surface-container-high">
                      {url ? (
                        <Image
                          src={url}
                          alt={asset.originalFilename || "Media"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-secondary">
                          No URL
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 text-[11px] truncate text-on-surface font-medium bg-surface">
                      {asset.originalFilename || asset.id.slice(0, 8)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa bài viết"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface">
            Bạn có chắc chắn muốn xóa bài viết{" "}
            <span className="font-bold text-on-surface">
              &quot;{deleteTarget?.title}&quot;
            </span>{" "}
            không? Bài viết sẽ được chuyển vào thùng rác và không còn hiển thị ra ngoài công chúng.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Xóa bài viết
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      <StatusToast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

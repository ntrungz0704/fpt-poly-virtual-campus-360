import { apiRequest } from "../auth/api-client";

export interface AdminNewsArticleItem {
  id: string;
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  content?: string;
  contentJson?: string[];
  coverMediaId?: string | null;
  coverImageUrl?: string | null;
  relatedSceneId?: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string | null;
    fullName: string;
  } | null;
  coverMedia?: {
    id: string;
    originalObjectKey: string;
    thumbnailKey?: string | null;
  } | null;
}

export interface AdminNewsListResponse {
  items: AdminNewsArticleItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUpsertNewsPayload {
  title: string;
  slug?: string;
  tag?: string;
  excerpt: string;
  content: string;
  coverMediaId?: string | null;
  coverImageUrl?: string | null;
  relatedSceneId?: string | null;
  status?: "DRAFT" | "PUBLISHED";
}

/**
 * Fetch list of news articles for admin.
 * GET /api/v1/admin/news
 */
export async function fetchAdminNews(params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}): Promise<AdminNewsListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.q) query.set("q", params.q);

  const qs = query.toString();
  return apiRequest<AdminNewsListResponse>(`/admin/news${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
}

/**
 * Fetch detailed news article by ID for editing.
 * GET /api/v1/admin/news/:id
 */
export async function fetchAdminNewsDetail(
  id: string,
): Promise<AdminNewsArticleItem> {
  return apiRequest<AdminNewsArticleItem>(
    `/admin/news/${encodeURIComponent(id)}`,
    {
      auth: true,
    },
  );
}

/**
 * Create a new news article.
 * POST /api/v1/admin/news
 */
export async function createAdminNews(
  payload: AdminUpsertNewsPayload,
): Promise<AdminNewsArticleItem> {
  return apiRequest<AdminNewsArticleItem>("/admin/news", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

/**
 * Update an existing news article.
 * PATCH /api/v1/admin/news/:id
 */
export async function updateAdminNews(
  id: string,
  payload: Partial<AdminUpsertNewsPayload>,
): Promise<AdminNewsArticleItem> {
  return apiRequest<AdminNewsArticleItem>(
    `/admin/news/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: payload,
      auth: true,
    },
  );
}

/**
 * Soft delete an article.
 * DELETE /api/v1/admin/news/:id
 */
export async function deleteAdminNews(
  id: string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(
    `/admin/news/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

/**
 * Publish an article.
 * POST /api/v1/admin/news/:id/publish
 */
export async function publishAdminNews(
  id: string,
): Promise<AdminNewsArticleItem> {
  return apiRequest<AdminNewsArticleItem>(
    `/admin/news/${encodeURIComponent(id)}/publish`,
    {
      method: "POST",
      auth: true,
    },
  );
}

/**
 * Unpublish an article (revert to DRAFT).
 * POST /api/v1/admin/news/:id/unpublish
 */
export async function unpublishAdminNews(
  id: string,
): Promise<AdminNewsArticleItem> {
  return apiRequest<AdminNewsArticleItem>(
    `/admin/news/${encodeURIComponent(id)}/unpublish`,
    {
      method: "POST",
      auth: true,
    },
  );
}

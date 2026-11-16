import { apiRequest } from "../auth/api-client";

export interface PublicNewsArticleItem {
  id: string;
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  publishedAt?: string | null;
  relatedSceneId?: string | null;
  content?: string;
  contentJson?: string[];
}

export interface PublicNewsListResponse {
  items: PublicNewsArticleItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch list of published news articles from PostgreSQL API.
 * GET /api/v1/public/news
 */
export async function fetchPublicNews(params?: {
  page?: number;
  limit?: number;
  tag?: string;
}): Promise<PublicNewsListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.tag && params.tag !== "ALL") query.set("tag", params.tag);

  const qs = query.toString();
  return apiRequest<PublicNewsListResponse>(
    `/public/news${qs ? `?${qs}` : ""}`,
    { auth: false },
  );
}

/**
 * Fetch single published article by slug from PostgreSQL API.
 * Throws ApiError with status 404 if article does not exist, is draft or deleted.
 * GET /api/v1/public/news/:slug
 */
export async function fetchPublicNewsArticle(
  slug: string,
): Promise<PublicNewsArticleItem> {
  return apiRequest<PublicNewsArticleItem>(
    `/public/news/${encodeURIComponent(slug)}`,
    { auth: false },
  );
}

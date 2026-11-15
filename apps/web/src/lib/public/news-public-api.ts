import { apiRequest } from "../auth/api-client";
import { CAMPUS_GUIDE_ARTICLES, type CampusGuideArticle } from "@/components/news/news-items";

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
 * Fetch list of published news articles.
 * GET /api/v1/public/news
 */
export async function fetchPublicNews(params?: {
  page?: number;
  limit?: number;
  tag?: string;
}): Promise<PublicNewsListResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.tag) query.set("tag", params.tag);

    const qs = query.toString();
    return await apiRequest<PublicNewsListResponse>(
      `/public/news${qs ? `?${qs}` : ""}`,
      { auth: false },
    );
  } catch {
    // Graceful fallback to static seeded articles if API service is offline
    const fallbackItems: PublicNewsArticleItem[] = CAMPUS_GUIDE_ARTICLES.map(
      (a: CampusGuideArticle) => ({
        id: a.slug,
        slug: a.slug,
        title: a.title,
        tag: a.tag,
        excerpt: a.excerpt,
        imageUrl: a.imageUrl,
        date: a.date,
        publishedAt: null,
        relatedSceneId: a.relatedSceneId || null,
        content: a.content.join("\n\n"),
        contentJson: a.content,
      }),
    );
    return {
      items: fallbackItems,
      total: fallbackItems.length,
      page: 1,
      limit: 12,
    };
  }
}

/**
 * Fetch single published article by slug.
 * GET /api/v1/public/news/:slug
 */
export async function fetchPublicNewsArticle(
  slug: string,
): Promise<PublicNewsArticleItem | null> {
  try {
    return await apiRequest<PublicNewsArticleItem>(
      `/public/news/${encodeURIComponent(slug)}`,
      { auth: false },
    );
  } catch {
    // Fallback to static guide article by slug
    const matched = CAMPUS_GUIDE_ARTICLES.find(
      (a: CampusGuideArticle) => a.slug === slug,
    );
    if (!matched) return null;
    return {
      id: matched.slug,
      slug: matched.slug,
      title: matched.title,
      tag: matched.tag,
      excerpt: matched.excerpt,
      imageUrl: matched.imageUrl,
      date: matched.date,
      publishedAt: null,
      relatedSceneId: matched.relatedSceneId || null,
      content: matched.content.join("\n\n"),
      contentJson: matched.content,
    };
  }
}

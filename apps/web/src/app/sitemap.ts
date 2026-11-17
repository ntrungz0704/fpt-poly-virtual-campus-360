import type { MetadataRoute } from "next";
import { fetchPublicLocations } from "@/lib/public/public-api";
import { fetchPublicNews } from "@/lib/public/news-public-api";

export function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return "https://virtualcampus.poly.edu.vn";
}

export const STATIC_PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/campus", changeFrequency: "weekly", priority: 0.9 },
  { path: "/map", changeFrequency: "weekly", priority: 0.9 },
  { path: "/locations", changeFrequency: "weekly", priority: 0.85 },
  { path: "/events", changeFrequency: "weekly", priority: 0.8 },
  { path: "/games", changeFrequency: "weekly", priority: 0.8 },
  { path: "/news", changeFrequency: "weekly", priority: 0.75 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
];

export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/portal",
  "/login",
  "/change-password",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();

  // 1. Static public indexable routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map(
    (route) => ({
      url: `${baseUrl}${route.path || "/"}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }),
  );

  // 2. Dynamic published locations from PostgreSQL database
  let locationEntries: MetadataRoute.Sitemap = [];
  try {
    const locations = await fetchPublicLocations();
    if (Array.isArray(locations)) {
      locationEntries = locations
        .filter((loc) => Boolean(loc && loc.slug && loc.slug.trim()))
        .map((loc) => ({
          url: `${baseUrl}/locations/${encodeURIComponent(loc.slug.trim())}`,
          changeFrequency: "weekly" as const,
          priority: 0.75,
        }));
    }
  } catch {
    // Graceful offline fallback during isolated build environments
    locationEntries = [];
  }

  // 3. Dynamic published news articles from PostgreSQL database
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const newsData = await fetchPublicNews({ page: 1, limit: 100 });
    if (newsData && Array.isArray(newsData.items)) {
      articleEntries = newsData.items
        .filter((art) => Boolean(art && art.slug && art.slug.trim()))
        .map((art) => ({
          url: `${baseUrl}/news/${encodeURIComponent(art.slug.trim())}`,
          lastModified: art.publishedAt ? new Date(art.publishedAt) : undefined,
          changeFrequency: "monthly" as const,
          priority: 0.65,
        }));
    }
  } catch {
    // Graceful offline fallback during isolated build environments
    articleEntries = [];
  }

  // 4. Merge, deduplicate, and enforce strict exclusion of private paths
  const allEntries = [...staticEntries, ...locationEntries, ...articleEntries];
  const deduped: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  for (const entry of allEntries) {
    if (!entry.url || seenUrls.has(entry.url)) continue;

    const parsedPath = new URL(entry.url).pathname;
    const isPrivate = PRIVATE_ROUTE_PREFIXES.some(
      (prefix) => parsedPath === prefix || parsedPath.startsWith(`${prefix}/`),
    );

    if (!isPrivate) {
      seenUrls.add(entry.url);
      deduped.push(entry);
    }
  }

  return deduped;
}

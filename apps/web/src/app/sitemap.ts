import type { MetadataRoute } from "next";
import { CAMPUS_GUIDE_ARTICLES } from "@/components/news/news-items";
import { CAMPUS_LOCATIONS } from "@/data/campus-data";

function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return "https://virtualcampus.poly.edu.vn";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();
  const lastModified = new Date("2026-11-11T00:00:00.000Z");

  const staticPublicRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "/campus", changeFrequency: "weekly", priority: 0.9 },
    { path: "/map", changeFrequency: "weekly", priority: 0.9 },
    { path: "/locations", changeFrequency: "weekly", priority: 0.85 },
    { path: "/events", changeFrequency: "weekly", priority: 0.8 },
    { path: "/news", changeFrequency: "weekly", priority: 0.75 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPublicRoutes.map((route) => ({
    url: `${baseUrl}${route.path || "/"}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const locationEntries: MetadataRoute.Sitemap = CAMPUS_LOCATIONS.filter(
    (loc) => loc.status === "published"
  ).map((loc) => ({
    url: `${baseUrl}/locations/${loc.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const articleEntries: MetadataRoute.Sitemap = CAMPUS_GUIDE_ARTICLES.map(
    (article) => ({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.65,
    })
  );

  return [...staticEntries, ...locationEntries, ...articleEntries];
}

import type { MetadataRoute } from "next";
import { buildDynamicSitemap } from "@/lib/public/sitemap-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildDynamicSitemap();
}

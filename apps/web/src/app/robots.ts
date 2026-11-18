import type { MetadataRoute } from "next";
import { buildRobotsConfig } from "@/lib/public/sitemap-data";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig();
}

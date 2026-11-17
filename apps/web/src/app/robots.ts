import type { MetadataRoute } from "next";
import { resolveBaseUrl, PRIVATE_ROUTE_PREFIXES } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROUTE_PREFIXES.map((prefix) => `${prefix}`),
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

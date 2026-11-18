import type { MetadataRoute } from "next";
import type { PublicLocationSummaryDto } from "@fpt-campus/shared";
import type {
  PublicNewsArticleItem,
  PublicNewsListResponse,
} from "./news-public-api";
import { getApiBaseUrl } from "../auth/api-client";

export const SITEMAP_NEWS_PAGE_LIMIT = 50;
export const SITEMAP_MAX_PAGES = 200;
export const SITEMAP_FETCH_TIMEOUT_MS = 10_000;

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
] as const;

export type FetchLike = typeof fetch;

export interface SitemapFetchOptions {
  apiBaseUrl?: string;
  appBaseUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  isBuildPhase?: boolean;
}

export class SitemapDataFetchError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(
    message: string,
    params: { status: number; endpoint: string; cause?: unknown },
  ) {
    super(message, { cause: params.cause });
    this.name = "SitemapDataFetchError";
    this.status = params.status;
    this.endpoint = params.endpoint;
  }
}

interface EnvelopeSuccess<T> {
  success: true;
  data: T;
}

interface EnvelopeError {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * Resolves the canonical public origin URL for sitemap & robots metadata.
 */
export function resolveBaseUrl(configuredOverride?: string): string {
  const configured = (configuredOverride ?? process.env.NEXT_PUBLIC_APP_URL)?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return "https://virtualcampus.poly.edu.vn";
}

export function buildRobotsConfig(appBaseUrlOverride?: string): MetadataRoute.Robots {
  const baseUrl = resolveBaseUrl(appBaseUrlOverride);
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

async function fetchBackendEnvelope<T>(
  endpointPath: string,
  options?: SitemapFetchOptions,
): Promise<T> {
  const apiBase = (options?.apiBaseUrl ?? getApiBaseUrl()).replace(/\/+$/, "");
  const normalizedPath = endpointPath.startsWith("/")
    ? endpointPath
    : `/${endpointPath}`;
  const url = `${apiBase}${normalizedPath}`;
  const fetchFn = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? SITEMAP_FETCH_TIMEOUT_MS;

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new SitemapDataFetchError(
      `Network or timeout failure querying ${url}`,
      { status: 0, endpoint: url, cause: err },
    );
  }

  let payload: EnvelopeSuccess<T> | EnvelopeError | null = null;
  try {
    payload = (await response.json()) as EnvelopeSuccess<T> | EnvelopeError;
  } catch (err) {
    throw new SitemapDataFetchError(
      `Invalid JSON envelope from ${url} (HTTP ${response.status})`,
      { status: response.status, endpoint: url, cause: err },
    );
  }

  if (
    !response.ok ||
    !payload ||
    typeof payload !== "object" ||
    payload.success !== true ||
    !("data" in payload)
  ) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error?.message
        ? payload.error.message
        : `Backend API returned HTTP ${response.status}`;
    throw new SitemapDataFetchError(`${message} (${url})`, {
      status: response.status,
      endpoint: url,
    });
  }

  return payload.data;
}

export function isEligibleSitemapLocation(
  loc: PublicLocationSummaryDto | null | undefined,
): boolean {
  if (!loc || typeof loc.slug !== "string" || !loc.slug.trim()) return false;
  if (loc.status && loc.status !== "PUBLISHED") return false;
  if (loc.isPublicAccessible === false) return false;
  return true;
}

export function isEligibleSitemapNewsArticle(
  art: (PublicNewsArticleItem & { status?: string }) | null | undefined,
): boolean {
  if (!art || typeof art.slug !== "string" || !art.slug.trim()) return false;
  if (art.status && art.status !== "PUBLISHED") return false;
  return true;
}

export function parseReliableDate(value: string | null | undefined): Date | undefined {
  if (!value || typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Queries all public published locations directly from backend API without static fallback.
 */
export async function fetchAllPublishedLocationsForSitemap(
  options?: SitemapFetchOptions,
): Promise<{
  items: PublicLocationSummaryDto[];
  rawCount: number;
  excludedCount: number;
}> {
  const data = await fetchBackendEnvelope<PublicLocationSummaryDto[]>(
    "/public/locations",
    options,
  );
  if (!Array.isArray(data)) {
    throw new SitemapDataFetchError(
      "Unexpected payload from /public/locations: expected array",
      { status: 500, endpoint: "/public/locations" },
    );
  }

  const eligible = data.filter(isEligibleSitemapLocation);
  return {
    items: eligible,
    rawCount: data.length,
    excludedCount: data.length - eligible.length,
  };
}

/**
 * Paginates across every page of GET /public/news until all PUBLISHED records are collected.
 */
export async function fetchAllPublishedNewsForSitemap(
  options?: SitemapFetchOptions,
): Promise<{
  items: PublicNewsArticleItem[];
  totalReported: number;
  pagesFetched: number;
  excludedCount: number;
}> {
  const collected: PublicNewsArticleItem[] = [];
  let page = 1;
  let totalReported = 0;
  let pagesFetched = 0;

  while (page <= SITEMAP_MAX_PAGES) {
    const endpoint = `/public/news?page=${page}&limit=${SITEMAP_NEWS_PAGE_LIMIT}`;
    const res = await fetchBackendEnvelope<PublicNewsListResponse>(endpoint, options);
    if (!res || !Array.isArray(res.items)) {
      throw new SitemapDataFetchError(
        `Unexpected payload from ${endpoint}: missing items array`,
        { status: 500, endpoint },
      );
    }

    pagesFetched += 1;
    if (page === 1) {
      totalReported =
        typeof res.total === "number" && res.total >= 0
          ? res.total
          : res.items.length;
    }

    collected.push(...res.items);

    const serverLimit =
      typeof res.limit === "number" && res.limit > 0
        ? res.limit
        : SITEMAP_NEWS_PAGE_LIMIT;
    const totalPages = totalReported > 0 ? Math.ceil(totalReported / serverLimit) : 1;

    if (page >= totalPages || res.items.length === 0) {
      break;
    }
    page += 1;
  }

  const eligible = collected.filter(isEligibleSitemapNewsArticle);
  return {
    items: eligible,
    totalReported,
    pagesFetched,
    excludedCount: collected.length - eligible.length,
  };
}

export function isPrivatePathname(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Builds the canonical sitemap entries strictly from live PostgreSQL public endpoints.
 * Throws on API failure at runtime (resulting in HTTP 500 rather than silent incomplete 200 OK).
 * Only tolerates unreachable API during an explicit Next.js isolated production build phase.
 */
export async function buildDynamicSitemap(
  options?: SitemapFetchOptions,
): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl(options?.appBaseUrl);
  const isBuildPhase =
    options?.isBuildPhase ?? process.env.NEXT_PHASE === "phase-production-build";

  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path || "/"}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let locationEntries: MetadataRoute.Sitemap = [];
  let articleEntries: MetadataRoute.Sitemap = [];

  try {
    const [locationsResult, newsResult] = await Promise.all([
      fetchAllPublishedLocationsForSitemap(options),
      fetchAllPublishedNewsForSitemap(options),
    ]);

    locationEntries = locationsResult.items.map((loc) => ({
      url: `${baseUrl}/locations/${encodeURIComponent(loc.slug.trim())}`,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

    articleEntries = newsResult.items.map((art) => {
      const lastModified = parseReliableDate(art.publishedAt);
      return {
        url: `${baseUrl}/news/${encodeURIComponent(art.slug.trim())}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.65,
      };
    });
  } catch (err) {
    if (isBuildPhase && err instanceof SitemapDataFetchError && err.status === 0) {
      console.warn(
        "[sitemap] Backend API unreachable during isolated Next.js build phase; deferring DB entries to runtime request execution.",
      );
    } else {
      console.error("[sitemap] Failed to load dynamic database entries for sitemap.xml:", {
        message: err instanceof Error ? err.message : String(err),
        status: err instanceof SitemapDataFetchError ? err.status : undefined,
        endpoint: err instanceof SitemapDataFetchError ? err.endpoint : undefined,
      });
      throw err;
    }
  }

  const allEntries = [...staticEntries, ...locationEntries, ...articleEntries];
  const deduped: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  for (const entry of allEntries) {
    if (!entry.url || seenUrls.has(entry.url)) continue;

    let pathname: string;
    try {
      pathname = new URL(entry.url).pathname;
    } catch {
      continue;
    }

    if (!isPrivatePathname(pathname)) {
      seenUrls.add(entry.url);
      deduped.push(entry);
    }
  }

  return deduped;
}

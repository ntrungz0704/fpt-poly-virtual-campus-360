import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import robots from "../../src/app/robots";
import {
  buildDynamicSitemap,
  buildRobotsConfig,
  fetchAllPublishedLocationsForSitemap,
  fetchAllPublishedNewsForSitemap,
  PRIVATE_ROUTE_PREFIXES,
  resolveBaseUrl,
  SitemapDataFetchError,
  STATIC_PUBLIC_ROUTES,
} from "../../src/lib/public/sitemap-data";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("B-C3 SEO A: robots.txt has single source of truth (no static public/robots.txt conflict)", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const staticRobotsPath = path.join(webRoot, "public", "robots.txt");
  assert.equal(
    fs.existsSync(staticRobotsPath),
    false,
    "apps/web/public/robots.txt must not exist alongside apps/web/src/app/robots.ts",
  );

  const robotsConfig = robots();
  const baseUrl = resolveBaseUrl();
  assert.equal(robotsConfig.sitemap, `${baseUrl}/sitemap.xml`);

  const rule = Array.isArray(robotsConfig.rules)
    ? robotsConfig.rules[0]
    : robotsConfig.rules;
  assert.equal(rule.userAgent, "*");
  assert.equal(rule.allow, "/");

  const disallows = Array.isArray(rule.disallow)
    ? rule.disallow
    : [rule.disallow];
  for (const prefix of PRIVATE_ROUTE_PREFIXES) {
    assert.ok(
      disallows.includes(prefix),
      `robots.txt must disallow ${prefix}`,
    );
  }
});

test("B-C3 SEO A: buildRobotsConfig and resolveBaseUrl honor runtime NEXT_PUBLIC_APP_URL", () => {
  const origEnv = process.env.NEXT_PUBLIC_APP_URL;

  try {
    process.env.NEXT_PUBLIC_APP_URL = "https://campus-prod.poly.edu.vn///";
    assert.equal(resolveBaseUrl(), "https://campus-prod.poly.edu.vn");
    assert.equal(
      buildRobotsConfig().sitemap,
      "https://campus-prod.poly.edu.vn/sitemap.xml",
    );

    delete process.env.NEXT_PUBLIC_APP_URL;
    assert.equal(resolveBaseUrl(), "https://virtualcampus.poly.edu.vn");
  } finally {
    if (origEnv !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = origEnv;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  }
});

test("B-C3 SEO B: fetches ALL paginated news pages (>50 items) and filters draft/inaccessible records cleanly", async () => {
  const totalNews = 120;
  const pageCalls: number[] = [];

  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/public/locations")) {
      return jsonResponse({
        success: true,
        data: [
          {
            id: "loc-1",
            slug: "sanh-innovation",
            code: "INV-01",
            name: "Sảnh Đón Tiếp",
            status: "PUBLISHED",
            isPublicAccessible: true,
          },
          {
            id: "loc-2",
            slug: "lab-lap-trinh-t301",
            code: "T-301",
            name: "Phòng Lab T301",
            status: "PUBLISHED",
            isPublicAccessible: true,
          },
          {
            id: "loc-3-draft",
            slug: "khu-vuc-nhap",
            code: "DRAFT-01",
            name: "Nháp",
            status: "DRAFT",
            isPublicAccessible: true,
          },
          {
            id: "loc-4-restricted",
            slug: "phong-server-noi-bo",
            code: "SRV-01",
            name: "Server Room",
            status: "PUBLISHED",
            isPublicAccessible: false,
          },
        ],
      });
    }

    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/public/news")) {
      const page = Number(parsed.searchParams.get("page") || "1");
      const limit = Number(parsed.searchParams.get("limit") || "50");
      pageCalls.push(page);

      const startIdx = (page - 1) * limit;
      const count = Math.max(0, Math.min(limit, totalNews - startIdx));
      const items = Array.from({ length: count }, (_, idx) => {
        const globalIdx = startIdx + idx + 1;
        return {
          id: `art-${globalIdx}`,
          slug: globalIdx === 120 ? "bai-viet-1" : `bai-viet-${globalIdx}`, // include 1 duplicate slug at end
          title: `Bài viết ${globalIdx}`,
          tag: "Tin tức",
          excerpt: "...",
          imageUrl: "",
          date: "18/05/2026",
          publishedAt: globalIdx === 2 ? null : "2026-05-18T08:00:00.000Z",
        };
      });

      return jsonResponse({
        success: true,
        data: {
          items,
          total: totalNews,
          page,
          limit,
        },
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const locResult = await fetchAllPublishedLocationsForSitemap({
    apiBaseUrl: "http://api.test/api/v1",
    fetchImpl: mockFetch,
  });
  assert.equal(locResult.rawCount, 4);
  assert.equal(locResult.items.length, 2);
  assert.equal(locResult.excludedCount, 2);

  const newsResult = await fetchAllPublishedNewsForSitemap({
    apiBaseUrl: "http://api.test/api/v1",
    fetchImpl: mockFetch,
  });
  assert.deepEqual(pageCalls, [1, 2, 3]);
  assert.equal(newsResult.pagesFetched, 3);
  assert.equal(newsResult.items.length, 120);

  const entries = await buildDynamicSitemap({
    apiBaseUrl: "http://api.test/api/v1",
    appBaseUrl: "https://virtualcampus.poly.edu.vn",
    fetchImpl: mockFetch,
    isBuildPhase: false,
  });

  // 9 static + 2 eligible locations + 119 unique news slugs (120 minus 1 duplicate)
  assert.equal(entries.length, STATIC_PUBLIC_ROUTES.length + 2 + 119);

  // Check zero duplicate URLs
  const urlSet = new Set(entries.map((e) => e.url));
  assert.equal(urlSet.size, entries.length);

  // Verify excluded items absent
  assert.equal(urlSet.has("https://virtualcampus.poly.edu.vn/locations/khu-vuc-nhap"), false);
  assert.equal(urlSet.has("https://virtualcampus.poly.edu.vn/locations/phong-server-noi-bo"), false);

  // Verify reliable lastModified behavior
  const art1 = entries.find((e) => e.url.endsWith("/news/bai-viet-1"));
  assert.ok(art1?.lastModified instanceof Date);
  const art2 = entries.find((e) => e.url.endsWith("/news/bai-viet-2"));
  assert.equal(art2?.lastModified, undefined);

  // Verify private route exclusion
  for (const entry of entries) {
    const pathname = new URL(entry.url).pathname;
    for (const prefix of PRIVATE_ROUTE_PREFIXES) {
      assert.notEqual(pathname, prefix);
      assert.equal(pathname.startsWith(`${prefix}/`), false);
    }
  }
});

test("B-C3 SEO C: throws explicit SitemapDataFetchError and logs when API fails in runtime (no silent empty/static fallback)", async () => {
  const failingFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("/public/locations")) {
      return jsonResponse(
        { success: false, error: { code: "INTERNAL_ERROR", message: "DB connection lost" } },
        500,
      );
    }
    return jsonResponse({ success: true, data: { items: [], total: 0, page: 1, limit: 50 } });
  };

  const originalConsoleError = console.error;
  const loggedErrors: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    loggedErrors.push(args);
  };

  try {
    await assert.rejects(
      () =>
        buildDynamicSitemap({
          apiBaseUrl: "http://api.test/api/v1",
          fetchImpl: failingFetch,
          isBuildPhase: false,
        }),
      (err: unknown) =>
        err instanceof SitemapDataFetchError && err.status === 500,
    );
    assert.equal(loggedErrors.length, 1);
  } finally {
    console.error = originalConsoleError;
  }
});

test("B-C3 SEO C: fails loudly if pagination breaks on page 2 (prevents truncated sitemap)", async () => {
  const partialFailFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/public/locations")) {
      return jsonResponse({ success: true, data: [] });
    }
    if (url.includes("page=1")) {
      return jsonResponse({
        success: true,
        data: {
          items: Array.from({ length: 50 }, (_, idx) => ({
            id: `art-${idx + 1}`,
            slug: `slug-${idx + 1}`,
            title: `Title ${idx + 1}`,
            tag: "News",
            excerpt: "",
            imageUrl: "",
            date: "",
          })),
          total: 75,
          page: 1,
          limit: 50,
        },
      });
    }
    throw new Error("ECONNRESET on page 2");
  };

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      () =>
        buildDynamicSitemap({
          apiBaseUrl: "http://api.test/api/v1",
          fetchImpl: partialFailFetch,
          isBuildPhase: false,
        }),
      SitemapDataFetchError,
    );
  } finally {
    console.error = originalConsoleError;
  }
});

test("B-C3 SEO C: isolated build phase gracefully tolerates unreachable API (status 0) without failing build", async () => {
  const offlineFetch: typeof fetch = async () => {
    throw new TypeError("fetch failed: ECONNREFUSED");
  };

  const originalConsoleWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const entries = await buildDynamicSitemap({
      apiBaseUrl: "http://localhost:4000/api/v1",
      fetchImpl: offlineFetch,
      isBuildPhase: true,
    });
    assert.equal(entries.length, STATIC_PUBLIC_ROUTES.length);
    assert.equal(warnings.length, 1);
  } finally {
    console.warn = originalConsoleWarn;
  }
});

test("B-C3 SEO Integrity: zero hardcoded mock fallbacks or fixed dates remain in sitemap/robots sources", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const sitemapRouteSource = fs.readFileSync(
    path.join(webRoot, "src/app/sitemap.ts"),
    "utf8",
  );
  const robotsRouteSource = fs.readFileSync(
    path.join(webRoot, "src/app/robots.ts"),
    "utf8",
  );
  const sitemapDataSource = fs.readFileSync(
    path.join(webRoot, "src/lib/public/sitemap-data.ts"),
    "utf8",
  );

  for (const src of [sitemapRouteSource, robotsRouteSource, sitemapDataSource]) {
    assert.equal(src.includes("CAMPUS_GUIDE_ARTICLES"), false);
    assert.equal(src.includes("CAMPUS_LOCATIONS"), false);
    assert.equal(src.includes("2026-11-11"), false);
  }

  assert.match(sitemapRouteSource, /dynamic\s*=\s*["']force-dynamic["']/);
  assert.match(robotsRouteSource, /dynamic\s*=\s*["']force-dynamic["']/);
});

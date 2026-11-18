import { expect, test } from "@playwright/test";
import pg from "pg";
import { getDatabaseUrl } from "./portal-fixtures";

const WEB_BASE = "http://localhost:3000";
const API_BASE = "http://localhost:4000/api/v1";

function extractXmlLocs(xml: string): string[] {
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim());
}

test.describe.serial("Audit Batch B-C3 — Dynamic Database Sitemap & SEO E2E Suite", () => {
  test("1. /robots.txt serves HTTP 200 text/plain from single robots.ts source with canonical sitemap and private disallows", async ({
    request,
  }) => {
    const res = await request.get(`${WEB_BASE}/robots.txt`);
    expect(res.status()).toBe(200);

    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType.toLowerCase()).toContain("text/plain");

    const text = await res.text();
    expect(text).toMatch(/User-Agent:\s*\*/i);
    expect(text).toContain("Allow: /");
    expect(text).toContain("Disallow: /admin");
    expect(text).toContain("Disallow: /portal");
    expect(text).toContain("Disallow: /login");
    expect(text).toContain("Disallow: /change-password");
    expect(text).toContain("Sitemap: https://virtualcampus.poly.edu.vn/sitemap.xml");
  });

  test("2. /sitemap.xml reconciles 100% with seeded PostgreSQL locations and published news without duplicates or private URLs", async ({
    request,
  }) => {
    // Query authoritative counts from PostgreSQL
    const client = new pg.Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    let dbPublishedLocations: string[] = [];
    let dbPublishedNews: Array<{ slug: string; publishedAt: Date | null }> = [];
    try {
      const locRows = await client.query<{ slug: string }>(
        `SELECT l.slug
         FROM locations l
         INNER JOIN buildings b ON b.id = l.building_id
         WHERE l.deleted_at IS NULL
           AND l.status = 'PUBLISHED'
           AND l.is_public_accessible = true
           AND b.deleted_at IS NULL
           AND b.status = 'PUBLISHED'
         ORDER BY l.slug ASC;`,
      );
      dbPublishedLocations = locRows.rows.map((r) => r.slug);

      const newsRows = await client.query<{ slug: string; published_at: Date | null }>(
        `SELECT slug, published_at
         FROM news_articles
         WHERE deleted_at IS NULL
           AND status = 'PUBLISHED'
         ORDER BY slug ASC;`,
      );
      dbPublishedNews = newsRows.rows.map((r) => ({
        slug: r.slug,
        publishedAt: r.published_at,
      }));
    } finally {
      await client.end();
    }

    expect(dbPublishedLocations.length).toBeGreaterThanOrEqual(6);
    expect(dbPublishedNews.length).toBeGreaterThanOrEqual(3);

    const res = await request.get(`${WEB_BASE}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType.toLowerCase()).toContain("xml");

    const xml = await res.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");

    const locs = extractXmlLocs(xml);
    expect(new Set(locs).size).toBe(locs.length); // Zero duplicates

    // Every static route present
    for (const staticPath of [
      "",
      "/campus",
      "/map",
      "/locations",
      "/events",
      "/games",
      "/news",
      "/about",
      "/contact",
    ]) {
      expect(locs).toContain(`https://virtualcampus.poly.edu.vn${staticPath || "/"}`);
    }

    // Reconcile every DB published location
    const locationLocs = locs.filter((u) => u.includes("/locations/"));
    expect(locationLocs.length).toBe(dbPublishedLocations.length);
    for (const slug of dbPublishedLocations) {
      expect(locs).toContain(`https://virtualcampus.poly.edu.vn/locations/${slug}`);
    }

    // Reconcile every DB published news article and real lastmod
    const newsLocs = locs.filter((u) => u.includes("/news/"));
    expect(newsLocs.length).toBe(dbPublishedNews.length);
    for (const art of dbPublishedNews) {
      const targetLoc = `https://virtualcampus.poly.edu.vn/news/${art.slug}`;
      expect(locs).toContain(targetLoc);
      if (art.publishedAt) {
        expect(xml).toContain(`<lastmod>${art.publishedAt.toISOString()}</lastmod>`);
      }
    }

    // Total URL count matches exact sum
    expect(locs.length).toBe(9 + dbPublishedLocations.length + dbPublishedNews.length);

    // Strict exclusion of private routes
    for (const url of locs) {
      const pathname = new URL(url).pathname;
      expect(pathname.startsWith("/admin")).toBe(false);
      expect(pathname.startsWith("/portal")).toBe(false);
      expect(pathname === "/login").toBe(false);
      expect(pathname === "/change-password").toBe(false);
    }
  });

  test("3. /sitemap.xml fetches ALL pages (>50 news) from PostgreSQL and excludes DRAFT/ARCHIVED/non-public records", async ({
    request,
  }) => {
    const client = new pg.Client({ connectionString: getDatabaseUrl() });
    await client.connect();

    const testPrefix = "c3-e2e-pag";
    const insertedArticleSlugs: string[] = [];
    const insertedLocationSlugDraft = `${testPrefix}-loc-draft`;
    const insertedLocationSlugRestricted = `${testPrefix}-loc-restricted`;

    try {
      // Fetch FK references for test locations
      const refRes = await client.query<{
        building_id: string;
        location_type_id: string;
      }>(
        `SELECT building_id, location_type_id FROM locations WHERE deleted_at IS NULL LIMIT 1;`,
      );
      const { building_id, location_type_id } = refRes.rows[0];

      // Insert 1 DRAFT location and 1 isPublicAccessible=false location
      await client.query(
        `INSERT INTO locations (id, building_id, location_type_id, category_label, code, slug, name, short_summary, description, is_public_accessible, status, created_at, updated_at)
         VALUES
           (gen_random_uuid(), $1, $2, 'Test', 'C3-DRFT', $3, 'Draft Location', 'Draft summary', 'Draft desc', true, 'DRAFT', NOW(), NOW()),
           (gen_random_uuid(), $1, $2, 'Test', 'C3-RSTR', $4, 'Restricted Location', 'Restricted summary', 'Restricted desc', false, 'PUBLISHED', NOW(), NOW());`,
        [building_id, location_type_id, insertedLocationSlugDraft, insertedLocationSlugRestricted],
      );

      // Insert 55 PUBLISHED articles (plus 1 DRAFT and 1 ARCHIVED) to force multi-page pagination (>50)
      for (let i = 1; i <= 55; i++) {
        const slug = `${testPrefix}-pub-${i}`;
        insertedArticleSlugs.push(slug);
        await client.query(
          `INSERT INTO news_articles (id, slug, title, tag, excerpt, content, cover_image_url, status, published_at, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'Test', 'Excerpt', 'Body', '/images/locations/building-innovation.jpg', 'PUBLISHED', NOW(), NOW(), NOW());`,
          [slug, `Pagination Test Article ${i}`],
        );
      }

      const draftSlug = `${testPrefix}-art-draft`;
      const archivedSlug = `${testPrefix}-art-archived`;
      insertedArticleSlugs.push(draftSlug, archivedSlug);
      await client.query(
        `INSERT INTO news_articles (id, slug, title, tag, excerpt, content, cover_image_url, status, published_at, created_at, updated_at)
         VALUES
           (gen_random_uuid(), $1, 'Draft Article', 'Test', 'Excerpt', 'Body', '/images/locations/building-innovation.jpg', 'DRAFT', NULL, NOW(), NOW()),
           (gen_random_uuid(), $2, 'Archived Article', 'Test', 'Excerpt', 'Body', '/images/locations/building-innovation.jpg', 'ARCHIVED', NOW(), NOW(), NOW());`,
        [draftSlug, archivedSlug],
      );

      // Verify backend /public/news pagination metadata directly
      const apiPage1Res = await request.get(`${API_BASE}/public/news?page=1&limit=100`);
      expect(apiPage1Res.status()).toBe(200);
      const apiPage1Json = await apiPage1Res.json();
      expect(apiPage1Json.data.limit).toBe(50); // Server enforces max 50
      expect(apiPage1Json.data.total).toBeGreaterThanOrEqual(58);
      expect(apiPage1Json.data.items.length).toBe(50);

      // Fetch dynamic sitemap.xml
      const sitemapRes = await request.get(`${WEB_BASE}/sitemap.xml`);
      expect(sitemapRes.status()).toBe(200);
      const xml = await sitemapRes.text();
      const locs = extractXmlLocs(xml);

      // All 55 published articles from page 1 & page 2 MUST be present!
      for (let i = 1; i <= 55; i++) {
        expect(locs).toContain(`https://virtualcampus.poly.edu.vn/news/${testPrefix}-pub-${i}`);
      }

      // DRAFT, ARCHIVED, and inaccessible locations MUST be excluded
      expect(locs).not.toContain(`https://virtualcampus.poly.edu.vn/news/${draftSlug}`);
      expect(locs).not.toContain(`https://virtualcampus.poly.edu.vn/news/${archivedSlug}`);
      expect(locs).not.toContain(`https://virtualcampus.poly.edu.vn/locations/${insertedLocationSlugDraft}`);
      expect(locs).not.toContain(`https://virtualcampus.poly.edu.vn/locations/${insertedLocationSlugRestricted}`);
      expect(new Set(locs).size).toBe(locs.length);
    } finally {
      if (insertedArticleSlugs.length > 0) {
        await client.query(`DELETE FROM news_articles WHERE slug = ANY($1);`, [insertedArticleSlugs]);
      }
      await client.query(`DELETE FROM locations WHERE slug = ANY($1);`, [
        [insertedLocationSlugDraft, insertedLocationSlugRestricted],
      ]);
      await client.end();
    }
  });
});

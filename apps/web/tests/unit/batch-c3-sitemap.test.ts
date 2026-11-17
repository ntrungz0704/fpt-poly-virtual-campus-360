import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sitemap, {
  resolveBaseUrl,
  PRIVATE_ROUTE_PREFIXES,
} from "../../src/app/sitemap";
import robots from "../../src/app/robots";

test("B-C3 SEO: resolveBaseUrl formats valid absolute domain and strips trailing slashes", () => {
  const origEnv = process.env.NEXT_PUBLIC_APP_URL;

  try {
    process.env.NEXT_PUBLIC_APP_URL = "https://campus-demo.poly.edu.vn///";
    assert.equal(resolveBaseUrl(), "https://campus-demo.poly.edu.vn");

    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";
    assert.equal(resolveBaseUrl(), "http://localhost:3000");

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

test("B-C3 SEO: sitemap includes all static public routes with valid priorities and changeFrequencies", async () => {
  const entries = await sitemap();
  const baseUrl = resolveBaseUrl();

  const expectedPaths = [
    "",
    "/campus",
    "/map",
    "/locations",
    "/events",
    "/games",
    "/news",
    "/about",
    "/contact",
  ];

  for (const expectedPath of expectedPaths) {
    const targetUrl = `${baseUrl}${expectedPath || "/"}`;
    const match = entries.find((e) => e.url === targetUrl);
    assert.ok(match, `Expected static route ${targetUrl} in sitemap entries`);
    assert.ok(typeof match.priority === "number" && match.priority > 0 && match.priority <= 1.0);
    assert.ok(match.changeFrequency === "weekly" || match.changeFrequency === "monthly");
  }
});

test("B-C3 SEO: sitemap strictly excludes private and auth route paths", async () => {
  const entries = await sitemap();

  for (const entry of entries) {
    const pathname = new URL(entry.url).pathname;
    for (const prefix of PRIVATE_ROUTE_PREFIXES) {
      assert.notEqual(pathname, prefix, `Private route ${prefix} must not appear in sitemap`);
      assert.equal(
        pathname.startsWith(`${prefix}/`),
        false,
        `Private subroute ${pathname} under ${prefix} must not appear in sitemap`,
      );
    }
  }
});

test("B-C3 SEO: sitemap entries are deduplicated with zero duplicate URLs", async () => {
  const entries = await sitemap();
  const urlSet = new Set<string>();

  for (const entry of entries) {
    assert.equal(urlSet.has(entry.url), false, `Duplicate URL found in sitemap: ${entry.url}`);
    urlSet.add(entry.url);
  }
});

test("B-C3 SEO: robots config blocks private routes and points to canonical sitemap", () => {
  const robotsConfig = robots();
  const baseUrl = resolveBaseUrl();

  assert.equal(robotsConfig.sitemap, `${baseUrl}/sitemap.xml`);
  assert.ok(Array.isArray(robotsConfig.rules));

  const mainRule = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  assert.equal(mainRule.allow, "/");

  const disallows = Array.isArray(mainRule.disallow) ? mainRule.disallow : [mainRule.disallow];
  assert.ok(disallows.includes("/admin"));
  assert.ok(disallows.includes("/portal"));
  assert.ok(disallows.includes("/login"));
  assert.ok(disallows.includes("/change-password"));
});

test("B-C3 SEO: sitemap.ts contains zero hardcoded static article/location imports or arbitrary static dates", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const sitemapSource = fs.readFileSync(
    path.join(webRoot, "src/app/sitemap.ts"),
    "utf8",
  );

  // Zero imports of static news/location arrays
  assert.equal(sitemapSource.includes("CAMPUS_GUIDE_ARTICLES"), false);
  assert.equal(sitemapSource.includes("CAMPUS_LOCATIONS"), false);

  // Zero hardcoded lastModified mock dates
  assert.equal(sitemapSource.includes("2026-11-11"), false);

  // Integrates real API fetchers
  assert.match(sitemapSource, /fetchPublicLocations/);
  assert.match(sitemapSource, /fetchPublicNews/);
});

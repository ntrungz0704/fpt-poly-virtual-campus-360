import { expect, test } from "@playwright/test";

const WEB_BASE = "http://localhost:3000";

test.describe.serial("Audit Batch B-C3 — Dynamic Database Sitemap & SEO E2E Suite", () => {
  test("1. sitemap.xml returns 200, contains valid XML, includes public routes & DB items, excludes private routes", async ({
    request,
  }) => {
    const res = await request.get(`${WEB_BASE}/sitemap.xml`);
    expect(res.status()).toBe(200);

    const text = await res.text();

    // Valid sitemap XML envelope
    expect(text).toContain("<urlset");
    expect(text).toContain("http://www.sitemaps.org/schemas/sitemap/0.9");

    // Static public pages
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/campus</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/map</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/locations</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/events</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/games</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/news</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/about</loc>");
    expect(text).toContain("<loc>https://virtualcampus.poly.edu.vn/contact</loc>");

    // Database dynamic items (seeded locations)
    expect(text).toContain("/locations/sanh-innovation");

    // Strict exclusion of private routes
    expect(text).not.toContain("/admin");
    expect(text).not.toContain("/portal");
    expect(text).not.toContain("/login");
    expect(text).not.toContain("/change-password");
  });

  test("2. robots.txt returns 200, blocks private paths, and declares canonical sitemap", async ({
    request,
  }) => {
    const res = await request.get(`${WEB_BASE}/robots.txt`);
    expect(res.status()).toBe(200);

    const text = await res.text();

    // Standard crawler allow
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");

    // Block private and authentication areas
    expect(text).toContain("Disallow: /admin");
    expect(text).toContain("Disallow: /portal");
    expect(text).toContain("Disallow: /login");
    expect(text).toContain("Disallow: /change-password");

    // Canonical sitemap link
    expect(text).toContain("Sitemap: https://virtualcampus.poly.edu.vn/sitemap.xml");
  });
});

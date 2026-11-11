import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

/**
 * Multi-viewport UI verification & screenshot capture script for FPT Polytechnic Virtual Campus 360.
 * Checks horizontal overflow (scrollWidth <= clientWidth), runtime console/page errors,
 * and saves PNG captures to OUT_DIR (defaults to workspace tmp-ui00 or CAPTURE_OUT_DIR env var).
 */

const BASE_URL = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const OUT_DIR =
  process.env.CAPTURE_OUT_DIR ||
  path.resolve(process.cwd(), "tmp-ui-captures");

const DEFAULT_VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-360", width: 360, height: 800 },
];

const DEFAULT_ROUTES = [
  { slug: "home", route: "/", fullPage: false },
  { slug: "about", route: "/about", fullPage: false },
  { slug: "campus", route: "/campus", fullPage: false },
  { slug: "map", route: "/map", fullPage: false },
  { slug: "locations", route: "/locations", fullPage: false },
  { slug: "location-detail", route: "/locations/lab-lap-trinh-t301", fullPage: false },
  { slug: "events", route: "/events", fullPage: false },
  { slug: "news", route: "/news", fullPage: false },
  { slug: "news-detail", route: "/news/huong-dan-tham-quan-qtsc-360", fullPage: false },
  { slug: "contact", route: "/contact", fullPage: false },
  { slug: "games", route: "/games", fullPage: false },
  { slug: "login", route: "/login", fullPage: false },
  { slug: "portal", route: "/portal", fullPage: false },
  { slug: "admin", route: "/admin", fullPage: false },
  { slug: "admin-locations", route: "/admin/locations", fullPage: false },
  { slug: "admin-virtual-tour", route: "/admin/virtual-tour", fullPage: false },
  { slug: "admin-events", route: "/admin/events", fullPage: false },
  { slug: "admin-media", route: "/admin/media", fullPage: false },
  { slug: "admin-users", route: "/admin/users", fullPage: false },
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const filterViewports = process.env.VIEWPORTS
    ? process.env.VIEWPORTS.split(",").map((v) => v.trim())
    : null;
  const filterRoutes = process.env.ROUTES
    ? process.env.ROUTES.split(",").map((r) => r.trim())
    : null;

  const viewports = filterViewports
    ? DEFAULT_VIEWPORTS.filter((v) => filterViewports.includes(v.name))
    : DEFAULT_VIEWPORTS;
  const routes = filterRoutes
    ? DEFAULT_ROUTES.filter((r) => filterRoutes.includes(r.slug) || filterRoutes.includes(r.route))
    : DEFAULT_ROUTES;

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
    ],
  });

  const results = [];

  try {
    const page = await browser.newPage();

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });

      for (const item of routes) {
        const consoleErrors = [];
        const pageErrors = [];

        const onConsole = (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(msg.text());
          }
        };
        const onPageError = (err) => {
          pageErrors.push(err.message);
        };

        page.on("console", onConsole);
        page.on("pageerror", onPageError);

        const url = `${BASE_URL}${item.route}`;
        let status = 0;
        let overflowX = false;
        let scrollWidth = 0;
        let clientWidth = 0;
        let screenshotFile = "";

        try {
          const resp = await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });
          status = resp ? resp.status() : 0;
          await new Promise((r) => setTimeout(r, 800));

          const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
          }));
          scrollWidth = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth);
          clientWidth = metrics.clientWidth;
          overflowX = scrollWidth > clientWidth;

          screenshotFile = path.join(OUT_DIR, `${vp.name}__${item.slug}.png`);
          await page.screenshot({
            path: screenshotFile,
            fullPage: item.fullPage,
          });
        } catch (err) {
          pageErrors.push(err instanceof Error ? err.message : String(err));
        } finally {
          page.off("console", onConsole);
          page.off("pageerror", onPageError);
        }

        const record = {
          viewport: vp.name,
          width: vp.width,
          route: item.route,
          status,
          scrollWidth,
          clientWidth,
          overflowX,
          consoleErrorCount: consoleErrors.length,
          pageErrorCount: pageErrors.length,
          consoleErrors,
          pageErrors,
          screenshot: screenshotFile,
        };
        results.push(record);

        const flag = overflowX || status >= 400 || pageErrors.length > 0 ? "FAIL" : "PASS";
        console.log(
          `[${flag}] ${vp.name} ${item.route} -> HTTP ${status}, scrollW=${scrollWidth}/${clientWidth}, consoleErr=${consoleErrors.length}, pageErr=${pageErrors.length}`
        );
      }
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(OUT_DIR, "capture-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Report written: ${reportPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

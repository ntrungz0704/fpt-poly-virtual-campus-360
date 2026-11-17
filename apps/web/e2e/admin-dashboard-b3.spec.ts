import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const WEB_BASE = "http://localhost:3000";

function attachErrorCollector(page: Page) {
  const pageErrors: string[] = [];
  const hydrationErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text.toLowerCase().includes("hydrat")) {
        hydrationErrors.push(text);
      }
    }
  });
  return { pageErrors, hydrationErrors };
}

function maybeSaveScreenshot(
  page: Page,
  filename: string,
  fullPage = true,
): Promise<void> {
  const artifactDir = process.env.B3_ARTIFACT_DIR?.trim();
  if (!artifactDir) return Promise.resolve();
  fs.mkdirSync(artifactDir, { recursive: true });
  return page.screenshot({
    path: path.join(artifactDir, filename),
    fullPage,
  }).then(() => undefined);
}

test.describe.serial("Audit Batch B-B3 — Real Admin Dashboard Metrics & Audit Log E2E Suite", () => {
  test("1. SUPER_ADMIN views real PostgreSQL metrics, live AuditLogs, 500 error recovery, and HTTP 403 fallback prevention", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${WEB_BASE}/login`);
    await page.locator("#login-identifier").fill("e2e_super");
    await page.locator("#login-password").fill("SuperAdmin-2026!");

    const [overviewResponse] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/admin/overview") &&
          res.request().method() === "GET",
      ),
      page.getByRole("button", { name: "Đăng nhập" }).click(),
    ]);

    await expect(page).toHaveURL(`${WEB_BASE}/admin`);
    expect(overviewResponse.status()).toBe(200);
    const overviewPayload = (await overviewResponse.json()).data;

    await expect(page.getByTestId("dashboard-metrics-ready")).toBeVisible();
    await expect(page.getByTestId("audit-log-list")).toBeVisible();

    // Exact database-backed metric assertions
    const expectedTourText =
      overviewPayload.tourNodesTotal > 0
        ? `${overviewPayload.tourNodesPublished} / ${overviewPayload.tourNodesTotal}`
        : "0";
    await expect(page.getByTestId("metric-value-tour")).toHaveText(
      expectedTourText,
    );
    await expect(page.getByTestId("metric-value-openday")).toHaveText(
      Number(overviewPayload.eventRegistrationsActive).toLocaleString("vi-VN"),
    );

    // Zero hardcoded fake values anywhere on page
    const bodyText = await page.locator("body").innerText();
    for (const fake of ["128,450", "3,820", "95.5%", "99.98%", "Panorama 8K"]) {
      expect(bodyText).not.toContain(fake);
    }

    await maybeSaveScreenshot(page, "b3_admin_dashboard_desktop.png", true);

    // Responsive mobile check (390x844) — wait for drawer CSS transition to finish sliding off-canvas
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(async () => (await page.locator("aside").boundingBox())?.x ?? 0)
      .toBeLessThan(-200);
    await expect(page.getByTestId("metric-card-tour")).toBeVisible();
    await expect(page.getByTestId("admin-recent-activity-card")).toBeVisible();
    await maybeSaveScreenshot(page, "b3_admin_dashboard_mobile.png", true);

    // Simulated API 500 on /admin/overview -> renders ErrorState + recovers cleanly on Retry
    await page.setViewportSize({ width: 1440, height: 900 });
    let failOnce = true;
    await page.route("**/api/v1/admin/overview", async (route) => {
      if (failOnce) {
        failOnce = false;
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "PostgreSQL timeout B3 test" },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.reload();
    await expect(page.getByTestId("dashboard-metrics-error")).toBeVisible();
    await page.getByRole("button", { name: "Tải lại số liệu" }).click();
    await expect(page.getByTestId("dashboard-metrics-ready")).toBeVisible();

    // Simulated HTTP 403 on /admin/audit-logs -> renders 403 UI state without fake activities
    await page.route("**/api/v1/admin/audit-logs*", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "FORBIDDEN", message: "Thiếu quyền audit:read" },
        }),
      });
    });

    await page.getByRole("button", { name: "Làm mới số liệu" }).click();
    await expect(page.getByTestId("audit-log-forbidden")).toBeVisible();
    await expect(page.getByTestId("audit-log-list")).toHaveCount(0);

    await page.unroute("**/api/v1/admin/audit-logs*");
    await page.unroute("**/api/v1/admin/overview");

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. EVENT_OPERATOR (lacking audit:read) sees real KPI metrics and explicit 403 permission state for Audit Logs", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${WEB_BASE}/login`);
    await page.locator("#login-identifier").fill("e2e_operator");
    await page.locator("#login-password").fill("OperatorInit-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/change-password/);
    await page.locator("#current-password").fill("OperatorInit-2026!");
    await page.locator("#new-password").fill("OperatorB3Pass-2026!");
    await page.locator("#confirm-password").fill("OperatorB3Pass-2026!");
    await page.getByRole("button", { name: "Xác nhận đổi mật khẩu" }).click();

    await expect(page).toHaveURL(`${WEB_BASE}/admin`);
    await expect(page.getByTestId("dashboard-metrics-ready")).toBeVisible();
    await expect(page.getByTestId("audit-log-forbidden")).toBeVisible();
    await expect(page.getByTestId("audit-log-list")).toHaveCount(0);

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("128,450");
    expect(bodyText).not.toContain("Điều phối viên QTSC");

    await maybeSaveScreenshot(page, "b3_admin_dashboard_403_operator.png", true);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });
});

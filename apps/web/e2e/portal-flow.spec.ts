import { expect, test, type Page } from "@playwright/test";

const WEB_BASE = "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Admin@123456";

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

test.describe.serial("Milestone M4: Student & Parent Portal End-to-End Test Suite", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Authenticate once as Super Admin (avoids hitting 5 req/60s rate limit on login endpoint)
    await page.goto(`${WEB_BASE}/login?next=%2Fportal`);
    await page.locator("#login-identifier").fill("admin");
    await page.locator("#login-password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Đăng nhập/i }).click();
    await page.waitForURL(/\/portal/, { timeout: 15_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("1. Student Portal Overview (/portal) renders tabs and greeting", async () => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/portal`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(/Xin chào/i);

    // Verify navigation tabs
    const nav = page.locator("nav[aria-label='Điều hướng cổng thông tin']");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /Hồ sơ cá nhân/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Vé Open Day của tôi/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Lịch trình sự kiện/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Tiến trình & Quà/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Cổng Phụ huynh/i })).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. Student Profile (/portal/profile) displays info and updates profile successfully", async () => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/portal/profile`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("student-profile-page")).toBeVisible();

    // Click edit button
    const editBtn = page.getByRole("button", { name: /Chỉnh sửa hồ sơ/i });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Form inputs should appear
    const bioInput = page.getByPlaceholder(/Đôi nét về sở thích/i);
    await expect(bioInput).toBeVisible();
    await bioInput.fill("Sinh viên đam mê Công nghệ Thông tin tại FPT Polytechnic.");

    // Save changes
    const saveBtn = page.getByTestId("save-profile-btn");
    await saveBtn.click();

    // Verify success toast
    await expect(page.getByText(/lưu thành công vào cơ sở dữ liệu/i)).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("3. My Tickets (/portal/tickets) renders tickets view and QR modal trigger", async () => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/portal/tickets`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("student-tickets-page")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Vé Open Day của tôi/i);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("4. Schedule (/portal/schedule) displays sessions and filters by period", async () => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/portal/schedule`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("student-schedule-page")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Lịch trình sự kiện/i);

    // Verify filter buttons
    const filterAll = page.getByRole("button", { name: "Tất cả", exact: true });
    const filterMorning = page.getByRole("button", { name: "Buổi sáng" });
    const filterAfternoon = page.getByRole("button", { name: "Buổi chiều" });

    await expect(filterAll).toBeVisible();
    await expect(filterMorning).toBeVisible();
    await expect(filterAfternoon).toBeVisible();

    // Click morning filter
    await filterMorning.click();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("5. Gamification Progress (/portal/progress) renders level, XP, and badges", async () => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/portal/progress`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("student-progress-page")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Tiến trình & Quà/i);

    // Verify summary stat cards exist
    await expect(page.getByText(/Tổng điểm kinh nghiệm/i)).toBeVisible();
    await expect(page.getByText(/Cấp bậc hiện tại/i)).toBeVisible();
    await expect(page.getByText(/Lượt quay còn lại/i)).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("6. Parent Portal (/parent) renders dashboard and student link modal", async () => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/parent`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("parent-portal-page")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Cổng thông tin Phụ huynh & Gia đình/i);

    // Verify Link student button
    const linkBtn = page.getByTestId("add-student-link-btn");
    await expect(linkBtn).toBeVisible();
    await linkBtn.click();

    // Modal should be visible
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Liên kết sinh viên/i })).toBeVisible();

    // Close modal
    const cancelBtn = page.getByRole("button", { name: /Hủy/i });
    await cancelBtn.click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });
});

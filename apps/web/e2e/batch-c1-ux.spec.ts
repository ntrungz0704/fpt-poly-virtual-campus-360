import { expect, test, type Page } from "@playwright/test";
import argon2 from "argon2";
import pg from "pg";
import { getDatabaseUrl } from "./portal-fixtures";

const WEB_BASE = "http://localhost:3000";

function attachErrorCollector(page: Page) {
  const pageErrors: string[] = [];
  const hydrationErrors: string[] = [];
  const nativeDialogs: string[] = [];

  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text.toLowerCase().includes("hydrat")) {
        hydrationErrors.push(text);
      }
    }
  });
  page.on("dialog", (dialog) => {
    nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });

  return { pageErrors, hydrationErrors, nativeDialogs };
}

test.describe.serial("Audit Batch B-C1 — Portal & Admin UX Consistency E2E Smoke", () => {
  const c1ParentUsername = "c1_parent_smoke";
  const c1ParentPassword = "ParentC1Pass-2026!";
  const c1OperatorUsername = "c1_operator_smoke";
  const c1OperatorPassword = "OperatorC1Pass-2026!";
  let c1ParentId = "";
  let c1OperatorId = "";
  let linkedStudentId = "";

  test.beforeAll(async () => {
    const client = new pg.Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    try {
      const hashOptions = {
        type: argon2.argon2id as 2,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      };
      const parentHash = await argon2.hash(c1ParentPassword, hashOptions);
      const opHash = await argon2.hash(c1OperatorPassword, hashOptions);

      // Clean any previous c1 smoke users safely
      const oldUsers = await client.query(
        `SELECT id FROM users WHERE username = ANY($1);`,
        [[c1ParentUsername, c1OperatorUsername]],
      );
      const oldIds = oldUsers.rows.map((r) => r.id);
      if (oldIds.length > 0) {
        await client.query(`DELETE FROM parent_student_links WHERE parent_id = ANY($1);`, [oldIds]);
        await client.query(`DELETE FROM user_roles WHERE user_id = ANY($1);`, [oldIds]);
        await client.query(`DELETE FROM refresh_tokens WHERE user_id = ANY($1);`, [oldIds]);
        await client.query(`DELETE FROM users WHERE id = ANY($1);`, [oldIds]);
      }

      const parentRes = await client.query(
        `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'Phu Huynh C1 Smoke', 'c1.parent.smoke@poly.edu.vn', '+84901888001', $2, 'PARENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
         RETURNING id;`,
        [c1ParentUsername, parentHash],
      );
      c1ParentId = parentRes.rows[0].id;

      const studentRes = await client.query(
        `SELECT id FROM users WHERE username = 'e2e_student' LIMIT 1;`,
      );
      if (studentRes.rows.length > 0) {
        linkedStudentId = studentRes.rows[0].id;
        await client.query(
          `INSERT INTO parent_student_links (id, parent_id, student_id, status, relationship, notes, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'APPROVED', 'Phụ huynh', 'Smoke fixture', NOW(), NOW());`,
          [c1ParentId, linkedStudentId],
        );
      }

      const opRes = await client.query(
        `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, 'Operator C1 Smoke', 'c1.operator.smoke@poly.edu.vn', '+84901888002', $2, 'STAFF', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
         RETURNING id;`,
        [c1OperatorUsername, opHash],
      );
      c1OperatorId = opRes.rows[0].id;

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE code = 'EVENT_OPERATOR';`,
        [c1OperatorId],
      );
    } finally {
      await client.end();
    }
  });

  test.afterAll(async () => {
    const ids = [c1ParentId, c1OperatorId].filter(Boolean);
    if (ids.length === 0) return;
    const client = new pg.Client({ connectionString: getDatabaseUrl() });
    await client.connect();
    try {
      await client.query(`DELETE FROM parent_student_links WHERE parent_id = ANY($1);`, [ids]);
      await client.query(`DELETE FROM user_roles WHERE user_id = ANY($1);`, [ids]);
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = ANY($1);`, [ids]);
      await client.query(`DELETE FROM users WHERE id = ANY($1);`, [ids]);
    } finally {
      await client.end();
    }
  });

  test("1. Student Portal: Schedule renders MORNING/NOON/AFTERNOON correctly & Profile save failure uses inline role=alert banner instead of window.alert", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/login?next=%2Fportal%2Fschedule`);
    await page.locator("#login-identifier").fill("e2e_student");
    await page.locator("#login-password").fill("StudentPass-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/portal\/schedule/);

    // Intercept schedule API with MORNING + NOON + AFTERNOON sessions
    await page.route("**/api/v1/portal/schedule", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              title: "Check-in Sáng & Khai mạc",
              eventTitle: "Open Day 2026",
              dateLabel: "15/06/2026",
              timeRangeLabel: "08:00 - 10:30",
              customLocationLabel: "Sảnh Tòa T",
              hostUnit: "Ban Tổ chức",
              period: "MORNING",
              description: "Đón khách buổi sáng",
              isRegistered: true,
            },
            {
              id: "22222222-2222-4222-8222-222222222222",
              title: "Workshop Giao lưu Buổi Trưa",
              eventTitle: "Open Day 2026",
              dateLabel: "15/06/2026",
              timeRangeLabel: "11:30 - 13:00",
              customLocationLabel: "Phòng Lab 201",
              hostUnit: "CLB IT",
              period: "NOON",
              description: "Phiên trưa đặc biệt",
              isRegistered: false,
            },
            {
              id: "33333333-3333-4333-8333-333333333333",
              title: "Tư vấn Chuyên ngành Chiều",
              eventTitle: "Open Day 2026",
              dateLabel: "15/06/2026",
              timeRangeLabel: "14:00 - 16:30",
              customLocationLabel: "Hội trường A",
              hostUnit: "Phòng Đào tạo",
              period: "AFTERNOON",
              description: "Hỏi đáp ngành học",
              isRegistered: false,
            },
          ],
        }),
      });
    });

    await page.reload();
    await expect(page.getByTestId("student-schedule-page")).toBeVisible();

    await expect(page.getByText("Check-in Sáng & Khai mạc")).toBeVisible();
    await expect(page.getByText("Workshop Giao lưu Buổi Trưa")).toBeVisible();
    await expect(page.getByText("Tư vấn Chuyên ngành Chiều")).toBeVisible();

    // Verify all 3 period filter pills work accurately and NOON displays "Trưa"
    await page.getByRole("button", { name: "Buổi trưa" }).click();
    await expect(page.getByText("Workshop Giao lưu Buổi Trưa")).toBeVisible();
    await expect(page.getByText("Check-in Sáng & Khai mạc")).toHaveCount(0);
    await expect(page.getByText("Tư vấn Chuyên ngành Chiều")).toHaveCount(0);
    await expect(page.getByText("Trưa", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Buổi sáng" }).click();
    await expect(page.getByText("Check-in Sáng & Khai mạc")).toBeVisible();
    await expect(page.getByText("Sáng", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Buổi chiều" }).click();
    await expect(page.getByText("Tư vấn Chuyên ngành Chiều")).toBeVisible();
    await expect(page.getByText("Chiều", { exact: true })).toBeVisible();
    await page.unroute("**/api/v1/portal/schedule");

    // Profile error UX: simulate 500 error -> inline role=alert banner, keyboard dismiss, no alert(), no false success
    await page.goto(`${WEB_BASE}/portal/profile`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("student-profile-page")).toBeVisible();

    await page.route("**/api/v1/portal/profile", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Không thể lưu hồ sơ lúc này." },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByTestId("edit-profile-btn").click();
    await page.getByTestId("save-profile-btn").click();

    const errorBanner = page.getByTestId("profile-save-error");
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toHaveAttribute("role", "alert");
    await expect(errorBanner).toContainText("Không thể lưu hồ sơ lúc này.");
    await expect(page.getByTestId("profile-save-success")).toHaveCount(0);

    // Keyboard dismiss verification
    const dismissBtn = errorBanner.getByRole("button", { name: "Đóng thông báo lỗi" });
    await dismissBtn.focus();
    await page.keyboard.press("Enter");
    await expect(errorBanner).toHaveCount(0);

    await page.unroute("**/api/v1/portal/profile");
    expect(errors.nativeDialogs).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. Parent Portal: link-request & view-detail errors show inline role=alert banners without window.alert or false success", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/login?next=%2Fparent`);
    await page.locator("#login-identifier").fill(c1ParentUsername);
    await page.locator("#login-password").fill(c1ParentPassword);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByTestId("parent-portal-page")).toBeVisible();

    // 2a. Failed create link request renders error inside dialog with role="alert"
    await page.route("**/api/v1/parent/link-requests", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Không tìm thấy sinh viên tương ứng." },
        }),
      });
    });

    await page.getByTestId("add-student-link-btn").click();
    await page.getByPlaceholder("Ví dụ: student1@poly.edu.vn").fill("missing@poly.edu.vn");
    await page.getByRole("button", { name: "Gửi yêu cầu" }).click();

    const modalError = page.getByTestId("parent-create-link-error");
    await expect(modalError).toBeVisible();
    await expect(modalError).toHaveAttribute("role", "alert");
    await expect(modalError).toContainText("Không tìm thấy sinh viên tương ứng.");
    await expect(page.getByTestId("parent-action-success")).toHaveCount(0);

    // Dismiss error with keyboard Enter inside modal
    const modalDismissBtn = modalError.getByRole("button", { name: "Đóng thông báo lỗi" });
    await modalDismissBtn.focus();
    await page.keyboard.press("Enter");
    await expect(modalError).toHaveCount(0);
    await page.getByRole("button", { name: "Hủy" }).click();

    // 2b. Failed view-detail renders page-level inline role=alert banner
    if (linkedStudentId) {
      await page.route(`**/api/v1/parent/students/${linkedStudentId}`, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Lỗi tải chi tiết sinh viên C1." },
          }),
        });
      });

      await page.getByTestId(`view-student-${linkedStudentId}`).click();
      const actionError = page.getByTestId("parent-action-error");
      await expect(actionError).toBeVisible();
      await expect(actionError).toHaveAttribute("role", "alert");
      await expect(actionError).toContainText("Lỗi tải chi tiết sinh viên C1.");
      await expect(page.getByTestId("parent-action-success")).toHaveCount(0);

      await actionError.getByRole("button", { name: "Đóng thông báo lỗi" }).click();
      await expect(actionError).toHaveCount(0);
    }

    await page.unroute("**/api/v1/parent/link-requests");
    expect(errors.nativeDialogs).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("3. Admin Overview Quick Workspaces include /admin/questions & /admin/news filtered strictly by RBAC", async ({
    browser,
  }) => {
    // 3a. SUPER_ADMIN sees both Questions and News shortcuts and navigates correctly
    const superContext = await browser.newContext();
    const superPage = await superContext.newPage();
    const superErrors = attachErrorCollector(superPage);
    try {
      await superPage.goto(`${WEB_BASE}/login`);
      await superPage.locator("#login-identifier").fill("e2e_super");
      await superPage.locator("#login-password").fill("SuperAdmin-2026!");
      await superPage.getByRole("button", { name: "Đăng nhập" }).click();
      await expect(superPage).toHaveURL(`${WEB_BASE}/admin`);

      const workspaces = superPage.getByTestId("admin-quick-workspaces");
      await expect(workspaces).toBeVisible();

      const questionsCard = workspaces.locator('a[href="/admin/questions"]');
      const newsCard = workspaces.locator('a[href="/admin/news"]');
      await expect(questionsCard).toBeVisible();
      await expect(questionsCard).toContainText("Ngân hàng câu hỏi");
      await expect(newsCard).toBeVisible();
      await expect(newsCard).toContainText("Tin tức & Cẩm nang");

      await questionsCard.click();
      await expect(superPage).toHaveURL(/\/admin\/questions/);

      await superPage.goto(`${WEB_BASE}/admin`);
      await superPage.getByTestId("admin-quick-workspaces").locator('a[href="/admin/news"]').click();
      await expect(superPage).toHaveURL(/\/admin\/news/);

      expect(superErrors.pageErrors).toEqual([]);
      expect(superErrors.hydrationErrors).toEqual([]);
    } finally {
      await superContext.close();
    }

    // 3b. EVENT_OPERATOR sees /admin/questions (events:write) and does NOT see /admin/news
    const opContext = await browser.newContext();
    const opPage = await opContext.newPage();
    const opErrors = attachErrorCollector(opPage);
    try {
      await opPage.goto(`${WEB_BASE}/login`);
      await opPage.locator("#login-identifier").fill(c1OperatorUsername);
      await opPage.locator("#login-password").fill(c1OperatorPassword);
      await opPage.getByRole("button", { name: "Đăng nhập" }).click();
      await expect(opPage).toHaveURL(`${WEB_BASE}/admin`);

      const workspaces = opPage.getByTestId("admin-quick-workspaces");
      await expect(workspaces).toBeVisible();
      await expect(workspaces.locator('a[href="/admin/questions"]')).toBeVisible();
      await expect(workspaces.locator('a[href="/admin/events"]')).toBeVisible();
      await expect(workspaces.locator('a[href="/admin/news"]')).toHaveCount(0);
      await expect(workspaces.locator('a[href="/admin/locations"]')).toHaveCount(0);

      expect(opErrors.pageErrors).toEqual([]);
      expect(opErrors.hydrationErrors).toEqual([]);
    } finally {
      await opContext.close();
    }
  });
});

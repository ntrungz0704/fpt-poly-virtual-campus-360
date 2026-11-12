import { expect, test, type Page } from "@playwright/test";
import pg from "pg";

const WEB_BASE = "http://localhost:3000";
const API_BASE = "http://localhost:4000/api/v1";

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

test.describe.serial("Phase 2B Authentication Frontend Integration E2E", () => {
  test("1. Anonymous public routes remain open; /portal and /admin redirect to /login; direct API rejects anonymous", async ({
    page,
    request,
  }) => {
    const errors = attachErrorCollector(page);

    for (const publicPath of ["/", "/campus", "/map", "/locations", "/events"]) {
      await page.goto(`${WEB_BASE}${publicPath}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
    }

    await page.goto(`${WEB_BASE}/portal`);
    await expect(page).toHaveURL(/\/login\?next=%2Fportal/);

    await page.goto(`${WEB_BASE}/admin`);
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);

    const meRes = await request.get(`${API_BASE}/auth/me`);
    expect(meRes.status()).toBe(401);

    const adminUsersRes = await request.get(`${API_BASE}/admin/users`);
    expect(adminUsersRes.status()).toBe(401);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. /login has no default prefilled credentials and displays error on invalid login", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);
    await page.goto(`${WEB_BASE}/login`);

    const idInput = page.locator("#login-identifier");
    const pwInput = page.locator("#login-password");
    await expect(idInput).toHaveValue("");
    await expect(pwInput).toHaveValue("");

    await idInput.fill("nonexistent_user");
    await pwInput.fill("WrongPassword123!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("3. Student login persists on reload, uses real /auth/me, is denied 403 on /admin & backend admin API, and logs out cleanly", async ({
    page,
    request,
  }) => {
    const errors = attachErrorCollector(page);
    let capturedStudentBearer = "";
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/auth/me")) {
        const auth = req.headers()["authorization"];
        if (auth) capturedStudentBearer = auth;
      }
    });

    await page.goto(`${WEB_BASE}/login`);
    await page.locator("#login-identifier").fill("e2e_student");
    await page.locator("#login-password").fill("StudentPass-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(`${WEB_BASE}/portal`);
    await expect(page.getByTestId("portal-user-fullname")).toContainText(
      "Nguyen Minh Hoc Sinh",
    );
    await expect(page.getByTestId("portal-dashboard")).toContainText("Open Day");

    // Verify no JWT or auth credentials stored in localStorage/sessionStorage
    const storageCounts = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
    }));
    expect(storageCounts).toEqual({ local: 0, session: 0 });

    // Reload persistence via real HttpOnly refresh cookie + /auth/me
    await page.reload();
    await expect(page).toHaveURL(`${WEB_BASE}/portal`);
    await expect(page.getByTestId("portal-user-fullname")).toContainText(
      "Nguyen Minh Hoc Sinh",
    );

    // Direct backend check using student's Bearer token confirms authoritative 403
    expect(capturedStudentBearer).toMatch(/^Bearer /);
    const forbiddenApiRes = await request.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: capturedStudentBearer },
    });
    expect(forbiddenApiRes.status()).toBe(403);

    // Visiting /admin as STUDENT shows 403 Forbidden UI (never Admin shell)
    await page.goto(`${WEB_BASE}/admin`);
    await expect(page.getByTestId("forbidden-admin-state")).toBeVisible();
    await expect(page.getByTestId("admin-shell")).toHaveCount(0);

    // Logout from /portal and verify protected route blocks access afterwards
    await page.goto(`${WEB_BASE}/portal`);
    await page.getByTestId("portal-logout-btn").click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto(`${WEB_BASE}/portal`);
    await expect(page).toHaveURL(/\/login\?next=%2Fportal/);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("4. First-login mustChangePassword forces /change-password, blocks bypass, updates password, and enforces EVENT_OPERATOR RBAC", async ({
    page,
    request,
  }) => {
    const errors = attachErrorCollector(page);
    let capturedMustChangeBearer = "";
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/auth/me") && !capturedMustChangeBearer) {
        const auth = req.headers()["authorization"];
        if (auth) capturedMustChangeBearer = auth;
      }
    });

    await page.goto(`${WEB_BASE}/login`);
    await page.locator("#login-identifier").fill("e2e_operator");
    await page.locator("#login-password").fill("OperatorInit-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(/\/change-password/);

    // Attempt bypass to /portal and /admin while mustChangePassword=true
    await page.goto(`${WEB_BASE}/portal`);
    await expect(page).toHaveURL(/\/change-password/);
    await page.goto(`${WEB_BASE}/admin`);
    await expect(page).toHaveURL(/\/change-password/);

    // Backend ForcePasswordChangedGuard also returns 403 PASSWORD_CHANGE_REQUIRED
    if (capturedMustChangeBearer) {
      const guardRes = await request.get(`${API_BASE}/open-day/events`, {
        headers: { Authorization: capturedMustChangeBearer },
      });
      expect(guardRes.status()).toBe(403);
      const body = await guardRes.json();
      expect(body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
    }

    // Weak password blocked by validation
    await page.locator("#current-password").fill("OperatorInit-2026!");
    await page.locator("#new-password").fill("short");
    await page.locator("#confirm-password").fill("short");
    await page.getByRole("button", { name: "Xác nhận đổi mật khẩu" }).click();
    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.locator("#new-password-desc")).toContainText(
      "Mật khẩu mới phải có tối thiểu 12 ký tự.",
    );

    // Valid new password succeeds and routes EVENT_OPERATOR to /admin
    await page.locator("#current-password").fill("OperatorInit-2026!");
    await page.locator("#new-password").fill("OperatorNewPass-2026!");
    await page.locator("#confirm-password").fill("OperatorNewPass-2026!");
    await page.getByRole("button", { name: "Xác nhận đổi mật khẩu" }).click();

    await expect(page).toHaveURL(`${WEB_BASE}/admin`);
    await expect(page.getByTestId("admin-shell")).toBeVisible();
    await expect(page.getByTestId("admin-user-fullname")).toContainText(
      "Tran Thi Dieu Phoi",
    );

    // Reload stays authenticated on /admin
    await page.reload();
    await expect(page).toHaveURL(`${WEB_BASE}/admin`);
    await expect(page.getByTestId("admin-shell")).toBeVisible();

    // EVENT_OPERATOR can access /admin/events, denied 403 on /admin/media
    await page.goto(`${WEB_BASE}/admin/events`);
    await expect(
      page.getByRole("heading", { name: "Open Day & Điểm danh Check-in" }),
    ).toBeVisible();
    await expect(page.getByTestId("forbidden-module-state")).toHaveCount(0);

    await page.goto(`${WEB_BASE}/admin/media`);
    await expect(page.getByTestId("forbidden-module-state")).toBeVisible();

    await page.getByTestId("admin-logout-btn").click();
    await expect(page).toHaveURL(/\/login/);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("5. Super Admin single-flight 401 refresh recovery and revoked refresh session redirect to /login", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/login`);
    await page.locator("#login-identifier").fill("e2e_super");
    await page.locator("#login-password").fill("SuperAdmin-2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page).toHaveURL(`${WEB_BASE}/admin`);
    await expect(page.getByTestId("admin-shell")).toBeVisible();

    // Super Admin can open /admin/media without 403
    await page.locator('aside nav a[href="/admin/media"]').click();
    await expect(page).toHaveURL(`${WEB_BASE}/admin/media`);
    await expect(
      page.getByRole("heading", { name: "Thư viện Media & Kiểm định 2:1" }),
    ).toBeVisible();
    await expect(page.getByTestId("forbidden-module-state")).toHaveCount(0);

    // Test 401 -> single-flight POST /auth/refresh -> retry GET /auth/me
    let injectedExpiredOnce = false;
    let refreshHits = 0;
    page.on("request", (req) => {
      if (req.url().endsWith("/api/v1/auth/refresh")) {
        refreshHits += 1;
      }
    });

    await page.route("**/api/v1/auth/me", async (route) => {
      if (!injectedExpiredOnce) {
        injectedExpiredOnce = true;
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Simulated expired access token",
            },
            meta: { requestId: "e2e-401", timestamp: new Date().toISOString() },
          }),
        });
        return;
      }
      await route.continue();
    });

    // Call getMe from inside the authenticated page session
    const meResult = await page.evaluate(async () => {
      const api = (window as unknown as { __authApi?: { getMe: () => Promise<{ username: string }> } }).__authApi;
      if (!api) throw new Error("__authApi not found on window");
      return await api.getMe();
    });

    expect(meResult.username).toBe("e2e_super");
    expect(injectedExpiredOnce).toBe(true);
    expect(refreshHits).toBeGreaterThanOrEqual(1);
    await page.unroute("**/api/v1/auth/me");

    // Revoke server-side refresh tokens for e2e_super in PostgreSQL -> reload redirects to /login
    const dbUrl = process.env.E2E_DB_URL;
    expect(dbUrl).toBeTruthy();
    const pgClient = new pg.Client({ connectionString: dbUrl });
    await pgClient.connect();
    try {
      await pgClient.query(
        `UPDATE refresh_tokens rt
         SET revoked_at = NOW()
         FROM users u
         WHERE rt.user_id = u.id AND u.username = 'e2e_super' AND rt.revoked_at IS NULL;`,
      );
    } finally {
      await pgClient.end();
    }

    await page.goto(`${WEB_BASE}/admin`);
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });
});

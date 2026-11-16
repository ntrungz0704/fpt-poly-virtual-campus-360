import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  cleanupPortalTestFixtures,
  ensurePortalTestFixtures,
  type PortalFixtures,
} from "./portal-fixtures";

const WEB_BASE = "http://localhost:3000";
const API_BASE = "http://localhost:4000/api/v1";

// Task 4 (B4): Strict environment check — Zero hardcoded fallback credentials
const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_BOOTSTRAP_PASSWORD environment variable is required to run E2E tests.",
  );
}

async function getAuthToken(username: string, pass: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: username, password: pass }),
  });
  const body = (await res.json()) as { data?: { accessToken?: string } };
  if (!body.data?.accessToken) {
    throw new Error(`Failed to authenticate ${username}: ${JSON.stringify(body)}`);
  }
  return body.data.accessToken;
}

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

test.describe.serial("Milestone M4: Student & Parent Portal Authorization & Blocker Remediation Suite", () => {
  let fixtures: PortalFixtures;
  let browserInstance: Browser;

  test.beforeAll(async ({ browser }) => {
    browserInstance = browser;
    // Provision isolated test fixtures with distinct roles
    fixtures = await ensurePortalTestFixtures();
  });

  test.afterAll(async () => {
    // Teardown test fixtures
    await cleanupPortalTestFixtures();
  });

  // --------------------------------------------------------------------------
  // 1. Student A View & Profile Management
  // --------------------------------------------------------------------------
  test("1. Student A logs in, views own profile and updates bio successfully", async () => {
    const page = await browserInstance.newPage();
    const errors = attachErrorCollector(page);

    try {
      await page.goto(`${WEB_BASE}/login?next=%2Fportal`);
      await page.locator("#login-identifier").fill(fixtures.studentA.username);
      await page.locator("#login-password").fill(fixtures.studentA.password);
      await page.getByRole("button", { name: /Đăng nhập/i }).click();
      await page.waitForURL(/\/portal/, { timeout: 15_000 });

      // Verify Student greeting and nav tabs
      await expect(page.locator("h1")).toContainText(/Xin chào,? Sinh Vien A Test/i);
      const nav = page.locator("nav[aria-label='Điều hướng cổng thông tin']");
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: /Hồ sơ cá nhân/i })).toBeVisible();

      // Go to profile edit
      await page.goto(`${WEB_BASE}/portal/profile`, { waitUntil: "networkidle" });
      await expect(page.getByTestId("student-profile-page")).toBeVisible();

      const editBtn = page.getByRole("button", { name: /Chỉnh sửa hồ sơ/i });
      await editBtn.click();

      const bioInput = page.getByPlaceholder(/Đôi nét về sở thích/i);
      await bioInput.fill("Sinh viên đam mê CNTT tại FPT Polytechnic QTSC.");

      const saveBtn = page.getByTestId("save-profile-btn");
      await saveBtn.click();

      await expect(page.getByText(/lưu thành công vào cơ sở dữ liệu/i)).toBeVisible();

      expect(errors.pageErrors).toEqual([]);
      expect(errors.hydrationErrors).toEqual([]);
    } finally {
      await page.close();
    }
  });

  // --------------------------------------------------------------------------
  // 2. Student A Tickets & Gamification Full History Aggregation (B2 & B5)
  // --------------------------------------------------------------------------
  test("2. Student A views tickets & full XP aggregation (120 XP, no leakage)", async () => {
    const page = await browserInstance.newPage();
    const errors = attachErrorCollector(page);

    try {
      await page.goto(`${WEB_BASE}/login?next=%2Fportal%2Ftickets`);
      await page.locator("#login-identifier").fill(fixtures.studentA.username);
      await page.locator("#login-password").fill(fixtures.studentA.password);
      await page.getByRole("button", { name: /Đăng nhập/i }).click();
      await page.waitForURL(/\/portal\/tickets/, { timeout: 15_000 });

      // Verify Student A sees ticket OD26-TEST-STUA
      await expect(page.getByTestId("student-tickets-page")).toBeVisible();
      await expect(page.getByText("OD26-TEST-STUA")).toBeVisible();
      // Must NOT see Student B's ticket
      await expect(page.getByText("OD26-TEST-STUB")).not.toBeVisible();

      // Verify Gamification Progress
      await page.goto(`${WEB_BASE}/portal/progress`, { waitUntil: "networkidle" });
      await expect(page.getByTestId("student-progress-page")).toBeVisible();

      // Full database aggregation: 3 records * 40 XP = 120 XP (Level 2)
      await expect(page.getByText("120")).toBeVisible();
      await expect(page.getByText("Cấp 2")).toBeVisible();

      expect(errors.pageErrors).toEqual([]);
      expect(errors.hydrationErrors).toEqual([]);
    } finally {
      await page.close();
    }
  });

  // --------------------------------------------------------------------------
  // 3. Parent B (APPROVED) views Student A details; Cannot view Student B (B1)
  // --------------------------------------------------------------------------
  test("3. Parent B (APPROVED) views Student A; Blocked from viewing Student B", async () => {
    const page = await browserInstance.newPage();
    const errors = attachErrorCollector(page);

    try {
      await page.goto(`${WEB_BASE}/login?next=%2Fparent`);
      await page.locator("#login-identifier").fill(fixtures.parentB.username);
      await page.locator("#login-password").fill(fixtures.parentB.password);
      await page.getByRole("button", { name: /Đăng nhập/i }).click();
      await page.waitForURL(/\/parent/, { timeout: 15_000 });

      await expect(page.getByTestId("parent-portal-page")).toBeVisible();
      // Should see Student A with APPROVED badge
      await expect(page.getByText("Sinh Vien A Test")).toBeVisible();
      await expect(page.getByText(/Đã kết nối|APPROVED/i)).toBeVisible();

      const parentBToken = await getAuthToken(fixtures.parentB.username, fixtures.parentB.password);

      // Direct API check: Parent B accessing Student A detail -> 200 OK
      const detailRes = await page.request.get(`${API_BASE}/parent/students/${fixtures.studentA.id}`, {
        headers: { Authorization: `Bearer ${parentBToken}` },
      });
      expect(detailRes.status()).toBe(200);
      const detailBody = await detailRes.json();
      expect(detailBody.data.student.id).toBe(fixtures.studentA.id);

      // Direct API check: Parent B accessing Student B detail -> 403 Forbidden
      const unauthRes = await page.request.get(`${API_BASE}/parent/students/${fixtures.studentB.id}`, {
        headers: { Authorization: `Bearer ${parentBToken}` },
      });
      expect(unauthRes.status()).toBe(403);
      const unauthBody = (await unauthRes.json()) as { error?: { code: string; message: string }; message?: string; code?: string };
      const errStr = unauthBody.error?.code || unauthBody.error?.message || unauthBody.message || unauthBody.code || "";
      expect(errStr).toMatch(/UNAUTHORIZED_STUDENT_ACCESS|không có liên kết/i);

      expect(errors.pageErrors).toEqual([]);
      expect(errors.hydrationErrors).toEqual([]);
    } finally {
      await page.close();
    }
  });

  // --------------------------------------------------------------------------
  // 4. Parent A (Unlinked) and Parent C (PENDING) Authorization Isolation (B1)
  // --------------------------------------------------------------------------
  test("4. Parent A (unlinked) and Parent C (PENDING) are blocked from student details", async () => {
    const parentAToken = await getAuthToken(fixtures.parentA.username, fixtures.parentA.password);
    const parentCToken = await getAuthToken(fixtures.parentC.username, fixtures.parentC.password);

    // Parent A calling Student A detail -> 403
    const paRes = await fetch(`${API_BASE}/parent/students/${fixtures.studentA.id}`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    expect(paRes.status).toBe(403);

    // Parent C calling Student A detail -> 403
    const pcRes = await fetch(`${API_BASE}/parent/students/${fixtures.studentA.id}`, {
      headers: { Authorization: `Bearer ${parentCToken}` },
    });
    expect(pcRes.status).toBe(403);
  });

  // --------------------------------------------------------------------------
  // 5. Student Link Resolution & Anti-Tampering (B1)
  // --------------------------------------------------------------------------
  test("5. Student A approves link; Student B cannot tamper; Duplicate resolution rejected", async () => {
    const studentBToken = await getAuthToken(fixtures.studentB.username, fixtures.studentB.password);
    const studentAToken = await getAuthToken(fixtures.studentA.username, fixtures.studentA.password);

    // Student B attempts to APPROVE Parent C's link intended for Student A -> 404
    const tamperRes = await fetch(`${API_BASE}/portal/link-requests/${fixtures.pendingLinkId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    expect(tamperRes.status).toBe(404);

    // Student A approves the link -> 200 OK
    const approveRes = await fetch(`${API_BASE}/portal/link-requests/${fixtures.pendingLinkId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    expect(approveRes.status).toBe(200);

    // Student A attempts to change already resolved link -> 400 Bad Request
    const replayRes = await fetch(`${API_BASE}/portal/link-requests/${fixtures.pendingLinkId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentAToken}`,
      },
      body: JSON.stringify({ action: "REJECT" }),
    });
    expect(replayRes.status).toBe(400);
    const replayBody = (await replayRes.json()) as { error?: { code: string }; code?: string };
    expect(replayBody.error?.code || replayBody.code).toBe("LINK_ALREADY_RESOLVED");
  });

  // --------------------------------------------------------------------------
  // 6. Cross-Role Server-Side Enforcement (B1)
  // --------------------------------------------------------------------------
  test("6. Server rejects cross-role access (Parent accessing Student API, Student accessing Parent API)", async () => {
    const parentBToken = await getAuthToken(fixtures.parentB.username, fixtures.parentB.password);
    const studentAToken = await getAuthToken(fixtures.studentA.username, fixtures.studentA.password);

    // Parent B calls Student Portal endpoint directly -> 403 FORBIDDEN_STUDENT_ONLY
    const parentToStudentRes = await fetch(`${API_BASE}/portal/profile`, {
      headers: { Authorization: `Bearer ${parentBToken}` },
    });
    expect(parentToStudentRes.status).toBe(403);
    const parentErr = (await parentToStudentRes.json()) as { error?: { code: string }; code?: string };
    expect(parentErr.error?.code || parentErr.code).toBe("FORBIDDEN_STUDENT_ONLY");

    // Student A calls Parent Portal endpoint directly -> 403 FORBIDDEN_PARENT_ONLY
    const studentToParentRes = await fetch(`${API_BASE}/parent/students`, {
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    expect(studentToParentRes.status).toBe(403);
    const studentErr = (await studentToParentRes.json()) as { error?: { code: string }; code?: string };
    expect(studentErr.error?.code || studentErr.code).toBe("FORBIDDEN_PARENT_ONLY");
  });
});

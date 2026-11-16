import { expect, test, type Page } from "@playwright/test";

const WEB_BASE = "http://localhost:3000";
const API_BASE = "http://localhost:4000/api/v1";
const ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error(
    "ADMIN_BOOTSTRAP_PASSWORD environment variable is required to run E2E tests.",
  );
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

test.describe.serial("Milestone M3C: Open Day User Flow & QR Check-in E2E", () => {
  let createdTicketCode = "";
  const testEmail = `e2e.attendee.${Date.now()}@poly.edu.vn`;
  const testPhone = "0987654321";
  const testFullName = "Trần Minh Quân (Playwright)";

  test("1. Public /events page renders live PostgreSQL event and schedule sessions", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/events`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Ngày hội Trải nghiệm Open Day FPT Polytechnic QTSC 2026");

    // Verify schedule timeline rendered with sessions
    const sessionArticles = page.locator("article.ui-card");
    const count = await sessionArticles.count();
    expect(count).toBeGreaterThanOrEqual(2);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. Attendee registers via TicketRegistrationModal, receives QR ticket, and reload preserves ticket in localStorage", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/events`, { waitUntil: "networkidle" });

    // Click CTA to open modal
    const registerBtn = page.getByRole("button", { name: /Đăng ký nhận vé QR/i });
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Verify modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.getByLabel(/Họ và tên/i).fill(testFullName);
    await page.getByLabel(/Địa chỉ Email/i).fill(testEmail);
    await page.getByLabel(/Số điện thoại/i).fill(testPhone);

    // Submit
    const submitBtn = modal.getByRole("button", { name: /Nhận vé Open Day & QR/i });
    await submitBtn.click();

    // Wait for ticket view
    await expect(modal.getByText(/Thẻ Tham Quan Open Day 2026/i)).toBeVisible();
    await expect(modal.getByText(/VÉ HỢP LỆ/i)).toBeVisible();

    // Verify ticket code format
    const codeEl = modal.locator("span.font-mono.tracking-wider");
    await expect(codeEl).toBeVisible();
    createdTicketCode = (await codeEl.textContent())?.trim() ?? "";
    expect(createdTicketCode).toMatch(/^OD26-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // Verify QR SVG element
    const qrSvg = modal.locator('svg[role="img"]');
    await expect(qrSvg).toBeVisible();

    // Close modal
    const closeBtn = modal.getByRole("button", { name: "Đóng", exact: true });
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    // Reload page to verify localStorage persistence
    await page.reload({ waitUntil: "networkidle" });

    // The CTA button should now display "Xem vé của tôi (OD26-...)"
    const myTicketBtn = page.getByRole("button", { name: new RegExp(createdTicketCode, "i") });
    await expect(myTicketBtn).toBeVisible();

    // Clicking it opens the ticket modal directly
    await myTicketBtn.click();
    await expect(modal).toBeVisible();
    await expect(modal.getByText(testFullName)).toBeVisible();
    await expect(modal.locator("span.font-mono.tracking-wider")).toHaveText(createdTicketCode);

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("3. Public ticket lookup API returns authoritative registration record", async ({
    request,
  }) => {
    expect(createdTicketCode).toMatch(/^OD26-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    const ticketRes = await request.get(`${API_BASE}/public/events/tickets/${createdTicketCode}`);
    expect(ticketRes.status()).toBe(200);

    const ticketJson = await ticketRes.json();
    expect(ticketJson.success).toBe(true);
    expect(ticketJson.data.ticketCode).toBe(createdTicketCode);
    expect(ticketJson.data.attendeeName).toBe(testFullName);
    expect(ticketJson.data.attendeeEmail).toBe(testEmail);
    expect(ticketJson.data.participationStatus).toBe("CONFIRMED");
  });

  test("4. Duplicate registration with same email is rejected with 409 Conflict", async ({
    request,
  }) => {
    // Look up event ID
    const eventsRes = await request.get(`${API_BASE}/public/events`);
    const eventsJson = await eventsRes.json();
    const eventId = eventsJson.data.event.id;

    // Attempt re-registration with same email
    const duplicateRes = await request.post(`${API_BASE}/public/events/register`, {
      data: {
        eventId,
        fullName: testFullName,
        email: testEmail,
        phone: "0911223344",
      },
    });

    expect(duplicateRes.status()).toBe(409);
    const errJson = await duplicateRes.json();
    expect(errJson.success).toBe(false);
    expect(errJson.error.code).toBe("DUPLICATE_REGISTRATION");
  });

  test("5. Admin checks in attendee via /admin/events and duplicate check-in is blocked", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    // 1. Log in as admin
    await page.goto(`${WEB_BASE}/login`);
    await page.locator("#login-identifier").fill("admin");
    await page.locator("#login-password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Đăng nhập/i }).click();

    // Wait for redirect to admin
    await page.waitForURL(/\/admin/);

    // 2. Go to /admin/events
    await page.goto(`${WEB_BASE}/admin/events`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Open Day & Điểm danh Check-in");

    // 3. Switch to 'Danh sách Check-in' tab
    const checkinTab = page.getByRole("tab", { name: /Danh sách Check-in/i });
    await checkinTab.click();

    // 4. Quick check-in input
    const input = page.getByPlaceholder(/Nhập mã vé ví dụ/i);
    await expect(input).toBeVisible();
    await input.fill(createdTicketCode);

    const confirmCheckinBtn = page.getByRole("button", { name: /Xác nhận Check-in/i });
    await confirmCheckinBtn.click();

    // 5. Verify success toast and checked-in badge in table
    const successToast = page.getByRole("status").getByText(/Check-in thành công/i);
    await expect(successToast).toBeVisible({ timeout: 8_000 });

    const attendeeRow = page.locator("tr", { hasText: createdTicketCode });
    await expect(attendeeRow.getByText(/Đã check-in/i)).toBeVisible({ timeout: 10_000 });

    // 6. Test duplicate check-in rejection
    await input.fill(createdTicketCode);
    await confirmCheckinBtn.click();

    // Verify error toast for duplicate check-in
    const duplicateErrorToast = page.getByRole("status").getByText(/đã được check-in/i);
    await expect(duplicateErrorToast).toBeVisible({ timeout: 8_000 });

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });
});

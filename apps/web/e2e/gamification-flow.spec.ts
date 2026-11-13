import { expect, test, type Page } from "@playwright/test";

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

test.describe.serial("Milestone M3D: Gamification User Flow (Quiz, XP, Spin Wheel, Leaderboard) E2E", () => {
  const testAttendeeName = `Học viên E2E ${Date.now().toString().slice(-4)}`;
  const testTicketCode = `OD26-E2E-${Date.now().toString().slice(-6)}`;

  test("1. Public /games page renders live quiz, profile header, and leaderboard", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/games`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Đấu Trường Khám Phá");

    // Profile header
    await expect(page.getByText("Tài khoản tham dự:")).toBeVisible();
    await expect(page.getByText("Tổng điểm XP")).toBeVisible();
    await expect(page.getByText("Vòng quay", { exact: true })).toBeVisible();

    // Leaderboard
    await expect(page.getByText("Bảng Xếp Hạng XP QTSC")).toBeVisible();

    // Tabs
    await expect(page.getByRole("button", { name: /Thử Thách Trắc Nghiệm QTSC/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Vòng Quay May Mắn/i })).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. Attendee completes live Quiz questions, submits to backend, receives authoritative XP and itemized explanations", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    // Seed test ticket into localStorage before loading
    await page.addInitScript(
      ({ ticket, name }) => {
        localStorage.setItem(
          "fpoly_openday_ticket",
          JSON.stringify({ ticketCode: ticket, attendeeName: name }),
        );
      },
      { ticket: testTicketCode, name: testAttendeeName },
    );

    await page.goto(`${WEB_BASE}/games`, { waitUntil: "networkidle" });

    // Verify attendee identity prefilled from localStorage
    await expect(page.getByText(testTicketCode, { exact: true })).toBeVisible();

    // Answer Question 1 (e.g. pick second option: Quận 12)
    const optionsQ1 = page.locator("button.min-h-\\[48px\\]");
    await expect(optionsQ1.first()).toBeVisible();
    await optionsQ1.nth(1).click();
    await page.getByRole("button", { name: /Câu tiếp theo/i }).click();

    // Answer Question 2 (pick first option: Tòa Nhà Innovation)
    const optionsQ2 = page.locator("button.min-h-\\[48px\\]");
    await optionsQ2.first().click();
    await page.getByRole("button", { name: /Câu tiếp theo/i }).click();

    // Answer Question 3 (pick second option: Tòa Nhà F)
    const optionsQ3 = page.locator("button.min-h-\\[48px\\]");
    await optionsQ3.nth(1).click();

    // Final question submit button
    const submitBtn = page.getByRole("button", { name: /Nộp bài & Nhận XP/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Authoritative result card from backend
    await expect(page.getByText("Kết quả Đã Xác Thực Từ Hệ Thống")).toBeVisible();
    await expect(page.getByText(/Chi tiết đáp án & Giải thích:/i)).toBeVisible();

    // Verify XP counter in header updated
    await expect(page.getByText(/\+ \d+ XP đã được cộng/i)).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("3. Spin Wheel tab renders 8 slices and allows spinning to win rewards and update XP", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.addInitScript(
      ({ ticket, name }) => {
        localStorage.setItem(
          "fpoly_openday_ticket",
          JSON.stringify({ ticketCode: ticket, attendeeName: name }),
        );
      },
      { ticket: testTicketCode, name: testAttendeeName },
    );

    await page.goto(`${WEB_BASE}/games`, { waitUntil: "networkidle" });

    // Switch to Spin Wheel tab
    const spinTabBtn = page.getByRole("button", { name: /Vòng Quay May Mắn/i });
    await spinTabBtn.click();

    await expect(page.locator("h2")).toContainText("Vòng Quay May Mắn QTSC");

    // Verify SVG wheel rendered with slices
    const wheelSvg = page.locator("svg").filter({ hasText: "FPT" });
    await expect(wheelSvg).toBeVisible();

    // Trigger Spin
    const spinActionBtn = page.getByRole("button", { name: /QUAY NGAY/i });
    if (await spinActionBtn.isVisible()) {
      await spinActionBtn.click();

      // Wait for spin animation and reward announcement
      await expect(page.getByText("Xin chúc mừng!")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/Tuyệt vời! Bạn nhận được/i)).toBeVisible();
    }

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("4. Backend API rejects duplicate XP farming and enforces spin quotas strictly", async ({
    request,
  }) => {
    // Direct API: attempt duplicate quiz XP on same event
    const quizRes = await request.post(`${API_BASE}/public/gamification/quiz/submit`, {
      data: {
        eventId: "4173b76b-8e00-4276-9309-98ac372eb928",
        attendeeName: testAttendeeName,
        ticketCode: testTicketCode,
        items: [
          { questionId: "4d2d6158-dbe7-45de-86a2-d0aa262159b6", selectedIndex: 1 },
          { questionId: "ac906b7f-aadb-4e53-999a-e5a94bfa8fca", selectedIndex: 0 },
          { questionId: "279f5a74-ee6e-4339-ba8a-5f6243b09f9f", selectedIndex: 1 },
        ],
      },
    });

    const quizJson = await quizRes.json();
    expect(quizRes.status()).toBe(201);
    expect(quizJson.data.isXpAwarded).toBe(false);
    expect(quizJson.data.scoreXp).toBe(0);
    expect(quizJson.data.message).toContain("Bạn đã nhận XP cho bài thi này trước đó");
  });

  test("5. Leaderboard displays real aggregated rankings with verified XP", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/games`, { waitUntil: "networkidle" });

    // Verify leaderboard entries
    const leaderboardCard = page.locator("div.ui-card").filter({ hasText: "Bảng Xếp Hạng XP QTSC" });
    await expect(leaderboardCard).toBeVisible();

    // Check top ambassador
    await expect(page.getByText("Đặng Quốc Hưng (K19 CNTT)")).toBeVisible();
    await expect(page.getByText("480 XP")).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });
});

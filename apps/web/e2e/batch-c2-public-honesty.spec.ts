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

test.describe.serial("Audit Batch B-C2 — Events Countdown & Public Content Honesty E2E Suite", () => {
  test("1. REAL-07: Events page renders real countdown, handles unannounced & past events without hardcoded values", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/events`);

    // Verify countdown widget exists and does NOT contain hardcoded 12:08:45:30
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("12 : 08 : 45 : 30");

    // 1a. Test future event with 10 days ahead
    const futureDate = new Date(Date.now() + 10 * 86400 * 1000 + 3600 * 1000).toISOString();
    await page.route("**/api/v1/public/events", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: "00000000-0000-4000-8000-000000000999",
              eventKey: "OD2026",
              title: "Open Day Tuyển Sinh 2026",
              subtitle: "Trải nghiệm thực tế khuôn viên QTSC",
              dateLabel: "15/06/2026",
              timeLabel: "08:00 - 16:30",
              eventDate: futureDate,
            },
            sessions: [],
            faqs: [],
            quizItems: [],
          },
        }),
      });
    });

    await page.reload();
    await expect(page.getByTestId("event-countdown-widget")).toBeVisible();
    await expect(page.getByTestId("countdown-days")).toHaveText("10");

    // 1b. Test unannounced eventDate
    await page.route("**/api/v1/public/events", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: "00000000-0000-4000-8000-000000000999",
              eventKey: "OD2026",
              title: "Open Day Tuyển Sinh 2026",
              subtitle: "Trải nghiệm thực tế khuôn viên QTSC",
              dateLabel: "Chưa công bố",
              timeLabel: "Đang cập nhật",
              eventDate: null,
            },
            sessions: [],
            faqs: [],
            quizItems: [],
          },
        }),
      });
    });

    await page.reload();
    await expect(page.getByTestId("event-countdown-unannounced")).toBeVisible();
    await expect(page.getByText("Thời gian sự kiện: Đang cập nhật ngày chính thức")).toBeVisible();

    // 1c. Test past/happening event
    await page.route("**/api/v1/public/events", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: "00000000-0000-4000-8000-000000000999",
              eventKey: "OD2026",
              title: "Open Day Tuyển Sinh 2026",
              subtitle: "Trải nghiệm thực tế khuôn viên QTSC",
              dateLabel: "10/01/2026",
              timeLabel: "08:00",
              eventDate: "2026-01-10T08:00:00.000Z",
            },
            sessions: [],
            faqs: [],
            quizItems: [],
          },
        }),
      });
    });

    await page.reload();
    await expect(page.getByTestId("event-countdown-happening")).toBeVisible();
    await expect(page.getByText("Sự kiện đang diễn ra hoặc đã đến giờ đón tiếp khách tham quan")).toBeVisible();

    await page.unroute("**/api/v1/public/events");
    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("2. REAL-08: Location Detail removes fake '60 Sinh viên' & 'GPU RTX 4080' and renders authentic properties", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/locations/sanh-innovation`);

    // Verify absence of fake metrics
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("60 Sinh viên");
    expect(bodyText).not.toContain("GPU RTX 4080");

    // Verify verified real attributes
    const attributesCard = page.getByTestId("location-real-attributes");
    await expect(attributesCard).toBeVisible();
    await expect(attributesCard).toContainText("Innovation");
    await expect(attributesCard).toContainText("INV-01");

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("3. REAL-09: Contact page has zero dummy PII, zero fake 24h promise, and provides verified official hotline guidance", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/contact`);

    // Zero dummy PII prefilled
    const nameInput = page.getByTestId("contact-name-input").first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue("");

    const phoneInput = page.getByTestId("contact-phone-input").first();
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveValue("");

    const emailInput = page.getByTestId("contact-email-input").first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue("");

    // Zero unverified 24h promise on page
    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toContain("Nguyễn Văn An");
    expect(pageText).not.toContain("trong vòng 24 giờ");
    expect(pageText).not.toContain("Đăng ký tư vấn thành công!");

    // Limitation notice is visible
    await expect(page.getByTestId("contact-online-limitation")).toBeVisible();
    await expect(page.getByText("1900 633 540").first()).toBeVisible();

    // Fill form and submit -> honest guidance banner, zero fake ticket success
    await nameInput.fill("Tran Thu Trang");
    await phoneInput.fill("0909123456");
    await emailInput.fill("thutrang@test.com");
    await page.locator("form button[type='submit']").first().click();

    const submitNotice = page.getByTestId("contact-submission-notice");
    await expect(submitNotice).toBeVisible();
    await expect(submitNotice).toContainText("1900 633 540");
    await expect(submitNotice).not.toContainText("trong vòng 24 giờ");

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });

  test("4. REAL-10: About page removes unverified '42+' and binds to verified campus building count", async ({
    page,
  }) => {
    const errors = attachErrorCollector(page);

    await page.goto(`${WEB_BASE}/about`);

    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toContain("42+");
    expect(pageText).not.toContain("Điểm nhìn VR 360° số hóa");

    // Verified 5 buildings at QTSC
    const buildingCount = page.getByTestId("verified-building-count");
    await expect(buildingCount).toBeVisible();
    await expect(buildingCount).toHaveText("5");
    await expect(page.getByText("Tòa nhà & Phân khu tại QTSC")).toBeVisible();

    expect(errors.pageErrors).toEqual([]);
    expect(errors.hydrationErrors).toEqual([]);
  });
});

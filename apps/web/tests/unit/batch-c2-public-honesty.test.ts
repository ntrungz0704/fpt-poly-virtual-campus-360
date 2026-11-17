import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  calculateEventCountdown,
  formatCountdownUnit,
} from "../../src/lib/public/events-countdown";

test("REAL-07: calculateEventCountdown handles future events, happening/past events, and unannounced dates with zero negative values", () => {
  const baseNow = new Date("2026-06-01T10:00:00.000Z").getTime();

  // 1. Future event: 14 days, 2 hours, 30 minutes, 15 seconds ahead
  const futureIso = new Date(
    baseNow +
      (14 * 86400 + 2 * 3600 + 30 * 60 + 15) * 1000,
  ).toISOString();
  const futureCountdown = calculateEventCountdown(futureIso, baseNow);
  assert.equal(futureCountdown.status, "UPCOMING");
  assert.equal(futureCountdown.days, 14);
  assert.equal(futureCountdown.hours, 2);
  assert.equal(futureCountdown.minutes, 30);
  assert.equal(futureCountdown.seconds, 15);
  assert.match(futureCountdown.label, /14 ngày 2 giờ 30 phút 15 giây/);

  // 2. Happening / Past event: never displays negative numbers and uses neutral semantics
  const pastIso = "2026-05-30T08:00:00.000Z";
  const pastCountdown = calculateEventCountdown(pastIso, baseNow);
  assert.equal(pastCountdown.status, "STARTED_OR_PASSED");
  assert.equal(pastCountdown.days, 0);
  assert.equal(pastCountdown.hours, 0);
  assert.equal(pastCountdown.minutes, 0);
  assert.equal(pastCountdown.seconds, 0);
  assert.match(pastCountdown.label, /Đã đến thời gian bắt đầu sự kiện/);

  // 3. Exact target timestamp (diff = 0)
  const exactCountdown = calculateEventCountdown("2026-06-01T10:00:00.000Z", baseNow);
  assert.equal(exactCountdown.status, "STARTED_OR_PASSED");
  assert.equal(exactCountdown.days, 0);

  // 4. Missing / null / invalid dates
  assert.equal(calculateEventCountdown(null, baseNow).status, "UNANNOUNCED");
  assert.equal(calculateEventCountdown("", baseNow).status, "UNANNOUNCED");
  assert.equal(calculateEventCountdown("invalid-date-string", baseNow).status, "UNANNOUNCED");
  assert.equal(calculateEventCountdown(undefined, baseNow).days, 0);

  // 5. formatCountdownUnit
  assert.equal(formatCountdownUnit(5), "05");
  assert.equal(formatCountdownUnit(12), "12");
  assert.equal(formatCountdownUnit(0), "00");
  assert.equal(formatCountdownUnit(-7), "00");
});

test("REAL-07: EventsView.tsx contains zero hardcoded countdown numbers and cleans up interval on unmount", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const eventsViewSource = fs.readFileSync(
    path.join(webRoot, "src/components/events/EventsView.tsx"),
    "utf8",
  );

  // Zero hardcoded countdown numbers
  assert.equal(
    /<span[^>]*font-heading[^>]*>\s*12\s*<\/span>/.test(eventsViewSource),
    false,
    "Found hardcoded 12 days in EventsView",
  );
  assert.equal(
    /<span[^>]*font-heading[^>]*>\s*08\s*<\/span>/.test(eventsViewSource),
    false,
    "Found hardcoded 08 hours in EventsView",
  );
  assert.equal(
    /<span[^>]*font-heading[^>]*>\s*45\s*<\/span>/.test(eventsViewSource),
    false,
    "Found hardcoded 45 minutes in EventsView",
  );
  assert.equal(
    /<span[^>]*font-heading[^>]*>\s*30\s*<\/span>/.test(eventsViewSource),
    false,
    "Found hardcoded 30 seconds in EventsView",
  );

  // Uses EventLiveCountdown component with timer cleanup
  assert.match(eventsViewSource, /<EventLiveCountdown[\s\S]*?eventDate=\{event\.eventDate\}/);
  assert.match(eventsViewSource, /clearInterval\(timer\)/);
  assert.match(eventsViewSource, /calculateEventCountdown/);
});

test("REAL-08: locations/[slug]/page.tsx removes fake '60 Sinh viên' and 'GPU RTX 4080' and binds to authentic DTO fields", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const locationDetailSource = fs.readFileSync(
    path.join(webRoot, "src/app/(public)/locations/[slug]/page.tsx"),
    "utf8",
  );

  assert.equal(locationDetailSource.includes("60 Sinh viên"), false);
  assert.equal(locationDetailSource.includes("GPU RTX 4080"), false);
  assert.match(locationDetailSource, /location\.buildingName/);
  assert.match(locationDetailSource, /location\.floor/);
  assert.match(locationDetailSource, /location\.code/);
});

test("REAL-09: contact/page.tsx removes dummy PII, eliminates fake client-side success and unverified 24h promise", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const contactSource = fs.readFileSync(
    path.join(webRoot, "src/app/(public)/contact/page.tsx"),
    "utf8",
  );

  // Zero dummy PII
  assert.equal(contactSource.includes("Nguyễn Văn An"), false);
  assert.equal(contactSource.includes("0987 654 321"), false);
  assert.equal(contactSource.includes("an.nguyen@gmail.com"), false);

  // Zero unverified 24h promise & zero unverified hotline
  assert.equal(contactSource.includes("24 giờ qua số điện thoại"), false);
  assert.equal(contactSource.includes("Đăng ký tư vấn thành công!"), false);
  assert.equal(contactSource.includes("1900 633 540"), false);

  // Has honest limitation note directing to verified official URLs
  assert.match(contactSource, /contact-online-limitation/);
  assert.match(contactSource, /officialContactUrl/);
});

test("REAL-10: about/page.tsx removes unverified '42+' metric and binds to verified campus building data", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const aboutSource = fs.readFileSync(
    path.join(webRoot, "src/app/(public)/about/page.tsx"),
    "utf8",
  );

  // Zero 42+ unverified metric
  assert.equal(aboutSource.includes("42+"), false);
  assert.equal(aboutSource.includes("Điểm nhìn VR 360° số hóa"), false);

  // Binds to verified CAMPUS_BUILDINGS count
  assert.match(aboutSource, /CAMPUS_BUILDINGS\.length/);
});

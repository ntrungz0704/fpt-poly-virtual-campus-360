import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import type { AuthUserProfileDto, PortalScheduleItemDto } from "@fpt-campus/shared";
import {
  SCHEDULE_FILTER_OPTIONS,
  filterScheduleItems,
  getSchedulePeriodMeta,
  normalizeSchedulePeriod,
} from "../../src/lib/portal/schedule-utils";
import {
  ADMIN_QUICK_WORKSPACES,
  getVisibleAdminQuickWorkspaces,
} from "../../src/lib/admin/overview-workspaces";
import { hasRequiredAdminPathPermission } from "../../src/lib/auth/auth-routing";

function makeScheduleItem(
  overrides: Partial<PortalScheduleItemDto> & { id: string; period: string },
): PortalScheduleItemDto {
  return {
    title: "Phiên trải nghiệm",
    eventTitle: "Open Day QTSC",
    dateLabel: "15/06/2026",
    timeRangeLabel: "08:00 - 11:00",
    customLocationLabel: "Sảnh chính Tòa T",
    hostUnit: "Phòng Tuyển sinh",
    description: "Mô tả phiên",
    isRegistered: false,
    ...overrides,
  };
}

function makeAdminUser(
  overrides: Partial<AuthUserProfileDto> = {},
): AuthUserProfileDto {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    username: "admin_test",
    fullName: "Admin Test",
    email: "admin@poly.edu.vn",
    phone: null,
    userType: "STAFF",
    accountStatus: "ACTIVE",
    activationStatus: "ACTIVATED",
    provisioningMethod: "ADMIN_DIRECT",
    mustChangePassword: false,
    roles: ["EVENT_OPERATOR"],
    permissions: [],
    eventParticipations: [],
    ...overrides,
  };
}

test("UI-03: schedule period mapping renders MORNING=Sáng, NOON=Trưa, AFTERNOON=Chiều and handles missing values gracefully", () => {
  assert.deepEqual(getSchedulePeriodMeta("MORNING"), {
    label: "Sáng",
    variant: "brand",
  });
  assert.deepEqual(getSchedulePeriodMeta("NOON"), {
    label: "Trưa",
    variant: "warning",
  });
  assert.deepEqual(getSchedulePeriodMeta("AFTERNOON"), {
    label: "Chiều",
    variant: "neutral",
  });
  assert.equal(getSchedulePeriodMeta(" noon ").label, "Trưa");
  assert.equal(normalizeSchedulePeriod("  Noon "), "NOON");

  // Missing or unexpected period must not throw or label NOON as Chiều
  assert.equal(getSchedulePeriodMeta("").label, "Chưa rõ");
  assert.equal(getSchedulePeriodMeta(null).label, "Chưa rõ");
  assert.equal(getSchedulePeriodMeta(undefined).label, "Chưa rõ");
  assert.equal(getSchedulePeriodMeta("EVENING").label, "EVENING");
});

test("UI-03: schedule filter pills support ALL, REGISTERED, MORNING, NOON, AFTERNOON consistently even with partial datasets", () => {
  const pillIds = SCHEDULE_FILTER_OPTIONS.map((opt) => opt.id);
  assert.deepEqual(pillIds, [
    "ALL",
    "REGISTERED",
    "MORNING",
    "NOON",
    "AFTERNOON",
  ]);

  const items: PortalScheduleItemDto[] = [
    makeScheduleItem({ id: "s1", period: "MORNING", isRegistered: true }),
    makeScheduleItem({ id: "s2", period: "NOON", isRegistered: false }),
    makeScheduleItem({ id: "s3", period: "AFTERNOON", isRegistered: true }),
  ];

  assert.deepEqual(
    filterScheduleItems(items, "ALL").map((i) => i.id),
    ["s1", "s2", "s3"],
  );
  assert.deepEqual(
    filterScheduleItems(items, "REGISTERED").map((i) => i.id),
    ["s1", "s3"],
  );
  assert.deepEqual(
    filterScheduleItems(items, "MORNING").map((i) => i.id),
    ["s1"],
  );
  assert.deepEqual(
    filterScheduleItems(items, "NOON").map((i) => i.id),
    ["s2"],
  );
  assert.deepEqual(
    filterScheduleItems(items, "AFTERNOON").map((i) => i.id),
    ["s3"],
  );

  // Missing periods & empty dataset never throw
  const morningOnly = [makeScheduleItem({ id: "m1", period: "MORNING" })];
  assert.deepEqual(filterScheduleItems(morningOnly, "NOON"), []);
  assert.deepEqual(filterScheduleItems(morningOnly, "AFTERNOON"), []);
  assert.deepEqual(filterScheduleItems([], "NOON"), []);
});

test("UI-04: profile and parent portal pages contain zero window.alert calls and wire accessible role=alert error banners without false success", () => {
  const webRoot = path.resolve(__dirname, "../..");
  const profileSource = fs.readFileSync(
    path.join(webRoot, "src/app/(portal)/portal/profile/page.tsx"),
    "utf8",
  );
  const parentSource = fs.readFileSync(
    path.join(webRoot, "src/app/(portal)/parent/page.tsx"),
    "utf8",
  );
  const bannerSource = fs.readFileSync(
    path.join(webRoot, "src/components/ui/InlineAlertBanner.tsx"),
    "utf8",
  );

  // Zero window.alert / alert( calls in B-C1 target files
  assert.equal(/\b(?:window\.)?alert\s*\(/.test(profileSource), false);
  assert.equal(/\b(?:window\.)?alert\s*\(/.test(parentSource), false);

  // Uses accessible InlineAlertBanner with role="alert" + keyboard-focusable dismiss button
  assert.match(profileSource, /<InlineAlertBanner[\s\S]*variant="error"/);
  assert.match(parentSource, /<InlineAlertBanner[\s\S]*variant="error"/);
  assert.match(bannerSource, /role:\s*"alert"/);
  assert.match(bannerSource, /<button[\s\S]*type="button"[\s\S]*aria-label=/);

  // Error catch blocks must never enable success banner
  assert.match(profileSource, /catch \(err\)[\s\S]*?setSaveSuccess\(false\)/);
  assert.match(parentSource, /catch \(err\)[\s\S]*?setSuccessMsg\(null\)/);
});

test("UI-05: Admin Quick Workspaces include Questions & News without duplicates, match sidebar routes, and enforce RBAC via hasRequiredAdminPathPermission", () => {
  const hrefs = ADMIN_QUICK_WORKSPACES.map((ws) => ws.href);
  assert.equal(new Set(hrefs).size, hrefs.length, "Duplicate workspace href detected");

  const questionsWs = ADMIN_QUICK_WORKSPACES.find((w) => w.href === "/admin/questions");
  const newsWs = ADMIN_QUICK_WORKSPACES.find((w) => w.href === "/admin/news");
  assert.ok(questionsWs, "Missing /admin/questions workspace shortcut");
  assert.ok(newsWs, "Missing /admin/news workspace shortcut");
  assert.equal(questionsWs.title, "Ngân hàng câu hỏi");
  assert.equal(newsWs.title, "Tin tức & Cẩm nang");

  // Full permission admin sees all shortcuts including questions & news
  const fullAdmin = makeAdminUser({
    userType: "ADMIN",
    roles: ["SUPER_ADMIN"],
    permissions: [
      "campus:write",
      "tour:write",
      "events:write",
      "media:upload",
      "users:manage",
    ],
  });
  const fullVisible = getVisibleAdminQuickWorkspaces(fullAdmin).map((w) => w.href);
  assert.ok(fullVisible.includes("/admin/questions"));
  assert.ok(fullVisible.includes("/admin/news"));
  assert.equal(fullVisible.length, ADMIN_QUICK_WORKSPACES.length);

  // EVENT_OPERATOR (events:write + users:provision_openday) sees /admin/questions, NOT /admin/news
  const operator = makeAdminUser({
    roles: ["EVENT_OPERATOR"],
    permissions: ["events:write", "users:provision_openday"],
  });
  const opVisible = getVisibleAdminQuickWorkspaces(operator).map((w) => w.href);
  assert.ok(opVisible.includes("/admin/events"));
  assert.ok(opVisible.includes("/admin/questions"));
  assert.ok(opVisible.includes("/admin/users"));
  assert.equal(opVisible.includes("/admin/news"), false);
  assert.equal(opVisible.includes("/admin/media"), false);

  // Tour/content editor (campus:write + tour:write) sees /admin/news & /admin/locations, NOT /admin/questions
  const contentWriter = makeAdminUser({
    roles: ["TOUR_EDITOR"],
    permissions: ["campus:write", "tour:write"],
  });
  const cwVisible = getVisibleAdminQuickWorkspaces(contentWriter).map((w) => w.href);
  assert.ok(cwVisible.includes("/admin/news"));
  assert.ok(cwVisible.includes("/admin/locations"));
  assert.equal(cwVisible.includes("/admin/questions"), false);

  // Unauthorized / null user sees zero workspace shortcuts
  assert.deepEqual(getVisibleAdminQuickWorkspaces(null), []);
  assert.deepEqual(
    getVisibleAdminQuickWorkspaces(makeAdminUser({ userType: "STUDENT", permissions: [] })),
    [],
  );

  // Parity with sidebar ADMIN_MODULES in admin/layout.tsx (excluding root /admin)
  const webRoot = path.resolve(__dirname, "../..");
  const layoutSource = fs.readFileSync(
    path.join(webRoot, "src/app/admin/layout.tsx"),
    "utf8",
  );
  const overviewSource = fs.readFileSync(
    path.join(webRoot, "src/components/admin/AdminOverviewContent.tsx"),
    "utf8",
  );
  assert.match(overviewSource, /getVisibleAdminQuickWorkspaces/);
  assert.match(layoutSource, /href:\s*"\/admin\/questions",\s*label:\s*"Ngân hàng câu hỏi"/);
  assert.match(layoutSource, /href:\s*"\/admin\/news",\s*label:\s*"Tin tức & Cẩm nang"/);

  for (const ws of ADMIN_QUICK_WORKSPACES) {
    assert.equal(
      hasRequiredAdminPathPermission(fullAdmin, ws.href),
      true,
      `Expected super admin permission for ${ws.href}`,
    );
  }
});

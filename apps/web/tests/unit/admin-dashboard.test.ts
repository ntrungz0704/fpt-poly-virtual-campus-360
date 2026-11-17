import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import type {
  AdminOverviewMetricsDto,
  AuditLogEntryDto,
  AuthUserProfileDto,
} from "@fpt-campus/shared";
import {
  areAllOverviewMetricsZero,
  formatAuditLogActivityRow,
  hasAuditReadPermission,
  mapOverviewMetricsToCards,
} from "../../src/lib/admin/overview-mappers";
import {
  fetchAdminAuditLogs,
  fetchAdminOverviewMetrics,
  isForbiddenApiError,
} from "../../src/lib/admin/overview-admin-api";
import {
  ApiClientError,
  setInMemoryAccessToken,
} from "../../src/lib/auth/api-client";

const sampleMetrics: AdminOverviewMetricsDto = {
  tourNodesTotal: 5,
  tourNodesPublished: 2,
  hotspotsTotal: 7,
  locationsTotal: 14,
  locationsPublished: 10,
  approvedPanoramasCount: 3,
  openDayEventsPublished: 1,
  eventRegistrationsActive: 20,
  eventRegistrationsCheckedIn: 5,
  checkInRatePercent: 25.0,
  activeUsersTotal: 8,
  activatedUsersTotal: 6,
  activationRatePercent: 75.0,
  generatedAt: "2026-11-17T12:00:00.000Z",
};

const emptyMetrics: AdminOverviewMetricsDto = {
  tourNodesTotal: 0,
  tourNodesPublished: 0,
  hotspotsTotal: 0,
  locationsTotal: 0,
  locationsPublished: 0,
  approvedPanoramasCount: 0,
  openDayEventsPublished: 0,
  eventRegistrationsActive: 0,
  eventRegistrationsCheckedIn: 0,
  checkInRatePercent: null,
  activeUsersTotal: 0,
  activatedUsersTotal: 0,
  activationRatePercent: null,
  generatedAt: "2026-11-17T12:00:00.000Z",
};

test("B-B3 metrics mapper derives authentic card values from PostgreSQL totals without fake KPIs", () => {
  const cards = mapOverviewMetricsToCards(sampleMetrics);
  assert.equal(cards.length, 4);
  assert.equal(areAllOverviewMetricsZero(sampleMetrics), false);

  const byId = new Map(cards.map((c) => [c.id, c]));
  assert.equal(byId.get("tour")?.value, "2 / 5");
  assert.match(byId.get("tour")?.unit ?? "", /7 hotspot/);
  assert.equal(byId.get("openday")?.value, "20");
  assert.match(byId.get("openday")?.note ?? "", /25%/);
  assert.equal(byId.get("locations")?.value, "10 / 14");
  assert.match(byId.get("locations")?.unit ?? "", /3 ảnh 2:1/);
  assert.equal(byId.get("users")?.value, "6 / 8");
  assert.match(byId.get("users")?.note ?? "", /75%/);
});

test("B-B3 metrics mapper renders honest 0 counts and N/A rates when database tables are empty", () => {
  assert.equal(areAllOverviewMetricsZero(emptyMetrics), true);
  const cards = mapOverviewMetricsToCards(emptyMetrics);

  for (const card of cards) {
    assert.equal(card.value, "0");
    assert.match(card.note, /N\/A/);
    assert.equal(card.tone, "muted");
  }
});

test("B-B3 RBAC & audit log formatting handle audit:read permission, 403 detection, and real AuditLog entries", () => {
  const superAdmin: AuthUserProfileDto = {
    id: "u-1",
    username: "admin",
    fullName: "Super Admin",
    email: "admin@poly.edu.vn",
    phone: null,
    userType: "ADMIN",
    accountStatus: "ACTIVE",
    activationStatus: "ACTIVATED",
    provisioningMethod: "BOOTSTRAP",
    mustChangePassword: false,
    roles: ["SUPER_ADMIN"],
    permissions: ["audit:read", "tour:write"],
  };
  const tourEditor: AuthUserProfileDto = {
    ...superAdmin,
    id: "u-2",
    roles: ["TOUR_EDITOR"],
    permissions: ["tour:write", "tour:publish"],
  };

  assert.equal(hasAuditReadPermission(superAdmin), true);
  assert.equal(hasAuditReadPermission(tourEditor), false);
  assert.equal(hasAuditReadPermission(null), false);

  assert.equal(
    isForbiddenApiError(
      new ApiClientError({ status: 403, code: "FORBIDDEN", message: "Denied" }),
    ),
    true,
  );
  assert.equal(
    isForbiddenApiError(
      new ApiClientError({ status: 500, code: "INTERNAL_ERROR", message: "Oops" }),
    ),
    false,
  );

  const sampleLog: AuditLogEntryDto = {
    id: "11111111-2222-4333-8444-555555555555",
    actorUserId: "u-1",
    actorUsername: "admin",
    action: "TOUR_STUDIO_BATCH_SAVE",
    resourceType: "TourStudio",
    resourceId: null,
    diffJson: { savedCount: 2 },
    ipAddress: "127.0.0.1",
    createdAt: "2026-11-17T10:30:00.000Z",
  };

  const formatted = formatAuditLogActivityRow(sampleLog);
  assert.equal(formatted.actionCode, "TOUR_STUDIO_BATCH_SAVE");
  assert.equal(formatted.actorLabel, "admin");
  assert.equal(formatted.badgeLabel, "Tour Studio");
});

test("B-B3 overview API client unwraps paginated NestJS ResponseEnvelope and propagates 403/500 errors without fallback", async () => {
  const originalFetch = globalThis.fetch;
  setInMemoryAccessToken("unit-test-token");
  try {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: "11111111-2222-4333-8444-555555555555",
              actorUserId: "u-1",
              actorUsername: "admin",
              action: "USER_LOGIN",
              resourceType: "User",
              resourceId: "u-1",
              diffJson: null,
              ipAddress: "127.0.0.1",
              createdAt: "2026-11-17T10:30:00.000Z",
            },
          ],
          meta: { page: 1, limit: 8, total: 42 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const auditPayload = await fetchAdminAuditLogs({ page: 1, limit: 8 });
    assert.equal(auditPayload.items.length, 1);
    assert.equal(auditPayload.items[0]?.action, "USER_LOGIN");
    assert.equal(auditPayload.total, 42);
    assert.equal(auditPayload.limit, 8);

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "FORBIDDEN", message: "Missing audit:read permission" },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => fetchAdminAuditLogs({ page: 1, limit: 8 }),
      (err: unknown) => isForbiddenApiError(err),
    );

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "DB unavailable" },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () => fetchAdminOverviewMetrics(),
      (err: unknown) => err instanceof ApiClientError && err.status === 500,
    );
  } finally {
    setInMemoryAccessToken(null);
    globalThis.fetch = originalFetch;
  }
});

test("B-B3 dashboard components contain zero hardcoded fake KPIs, SLA percentages, or static operation logs", () => {
  const files = [
    path.resolve(process.cwd(), "src/components/admin/AdminDashboardMetrics.tsx"),
    path.resolve(process.cwd(), "src/components/admin/AdminRecentActivityLog.tsx"),
    path.resolve(process.cwd(), "src/components/admin/AdminOverviewContent.tsx"),
  ];
  const forbiddenLiterals = [
    "128,450",
    "3,820",
    "95.5%",
    "99.98%",
    "Panorama 8K",
    "RECENT_OPERATIONS",
    "TOUR_SCENES",
  ];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const token of forbiddenLiterals) {
      assert.equal(
        content.includes(token),
        false,
        `Forbidden fake dashboard literal '${token}' found in ${filePath}`,
      );
    }
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUserProfileDto } from "@fpt-campus/shared";
import {
  canAccessAdmin,
  getPrimaryRoleLabel,
  getUserInitials,
  hasRequiredAdminPathPermission,
  isProtectedAppPath,
  resolvePostAuthRoute,
  sanitizeInternalNextPath,
  validateNewPasswordClient,
} from "../../src/lib/auth/auth-routing";

function makeUser(overrides: Partial<AuthUserProfileDto> = {}): AuthUserProfileDto {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    username: "user1",
    fullName: "Nguyen Van A",
    email: "user1@fpt.edu.vn",
    phone: null,
    userType: "STUDENT",
    accountStatus: "ACTIVE",
    activationStatus: "ACTIVATED",
    provisioningMethod: "ADMIN_DIRECT",
    mustChangePassword: false,
    roles: [],
    permissions: [],
    eventParticipations: [],
    ...overrides,
  };
}

test("sanitizeInternalNextPath prevents open redirect and auth loops", () => {
  assert.equal(sanitizeInternalNextPath("/portal"), "/portal");
  assert.equal(sanitizeInternalNextPath("/admin/events?tab=1"), "/admin/events?tab=1");
  assert.equal(sanitizeInternalNextPath("https://evil.example"), null);
  assert.equal(sanitizeInternalNextPath("//evil.example/admin"), null);
  assert.equal(sanitizeInternalNextPath("/\\evil"), null);
  assert.equal(sanitizeInternalNextPath("/login"), null);
  assert.equal(sanitizeInternalNextPath("/change-password?next=/admin"), null);
  assert.equal(sanitizeInternalNextPath("/api/v1/auth/login"), null);
});

test("isProtectedAppPath identifies portal, admin, and change-password routes", () => {
  assert.equal(isProtectedAppPath("/portal"), true);
  assert.equal(isProtectedAppPath("/portal/details"), true);
  assert.equal(isProtectedAppPath("/admin"), true);
  assert.equal(isProtectedAppPath("/admin/events"), true);
  assert.equal(isProtectedAppPath("/change-password"), true);
  assert.equal(isProtectedAppPath("/"), false);
  assert.equal(isProtectedAppPath("/campus"), false);
  assert.equal(isProtectedAppPath("/login"), false);
});

test("canAccessAdmin & module permissions enforce strict RBAC", () => {
  const student = makeUser({ userType: "STUDENT" });
  const operator = makeUser({
    userType: "STAFF",
    roles: ["EVENT_OPERATOR"],
    permissions: ["events:write", "users:provision_openday"],
  });
  const lockedStaff = makeUser({
    userType: "STAFF",
    accountStatus: "LOCKED",
    roles: ["EVENT_OPERATOR"],
    permissions: ["events:write"],
  });

  assert.equal(canAccessAdmin(student), false);
  assert.equal(hasRequiredAdminPathPermission(student, "/admin"), false);
  assert.equal(canAccessAdmin(lockedStaff), false);
  assert.equal(canAccessAdmin(operator), true);
  assert.equal(hasRequiredAdminPathPermission(operator, "/admin"), true);
  assert.equal(hasRequiredAdminPathPermission(operator, "/admin/events"), true);
  assert.equal(hasRequiredAdminPathPermission(operator, "/admin/users"), true);
  assert.equal(hasRequiredAdminPathPermission(operator, "/admin/media"), false);
});

test("resolvePostAuthRoute prioritizes mustChangePassword then role destination", () => {
  const mustChangeAdmin = makeUser({
    userType: "ADMIN",
    mustChangePassword: true,
    roles: ["SUPER_ADMIN"],
    permissions: ["users:manage"],
  });
  assert.equal(
    resolvePostAuthRoute(mustChangeAdmin, "/admin/users"),
    "/change-password?next=%2Fadmin%2Fusers",
  );

  const student = makeUser({ userType: "STUDENT" });
  assert.equal(resolvePostAuthRoute(student), "/portal");
  assert.equal(resolvePostAuthRoute(student, "/admin/events"), "/portal");
  assert.equal(resolvePostAuthRoute(student, "/events"), "/events");

  const admin = makeUser({
    userType: "ADMIN",
    roles: ["SUPER_ADMIN"],
    permissions: ["users:manage"],
  });
  assert.equal(resolvePostAuthRoute(admin), "/admin");
  assert.equal(resolvePostAuthRoute(admin, "/admin/events"), "/admin/events");
});

test("validateNewPasswordClient enforces 12-char policy, difference, and confirmation", () => {
  assert.equal(
    validateNewPasswordClient("OldPass123456!", "Short1!", "Short1!").valid,
    false,
  );
  assert.equal(
    validateNewPasswordClient("OldPass123456!", "            ", "            ").valid,
    false,
  );
  assert.equal(
    validateNewPasswordClient("SamePassword123!", "SamePassword123!", "SamePassword123!").valid,
    false,
  );
  assert.equal(
    validateNewPasswordClient("OldPass123456!", "ValidNewPass123!", "Mismatch123!").valid,
    false,
  );
  assert.equal(
    validateNewPasswordClient("OldPass123456!", "ValidNewPass123!", "ValidNewPass123!").valid,
    true,
  );
});

test("user display helpers format role labels and initials safely", () => {
  const op = makeUser({
    fullName: "Tran Thi Minh Thu",
    userType: "STAFF",
    roles: ["EVENT_OPERATOR"],
  });
  assert.equal(getPrimaryRoleLabel(op), "Điều phối viên Open Day");
  assert.equal(getUserInitials(op.fullName), "TT");
});

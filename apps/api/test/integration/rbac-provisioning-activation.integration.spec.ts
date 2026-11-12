import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  hashPasswordArgon2id,
  sha256Hex,
} from "../../src/common/utils/token-crypto";
import {
  INVITATION_DELIVERY_ADAPTER,
  type DeliverInvitationParams,
  type InvitationDeliveryAdapter,
} from "../../src/modules/users-rbac/invitation-delivery.adapter";
import {
  createIntegrationApiApp,
  extractCookieValue,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  TEST_WEB_ORIGIN,
  type ScratchDbHandle,
} from "./test-db.helper";

class InMemorySpyInvitationAdapter implements InvitationDeliveryAdapter {
  public readonly deliveries: DeliverInvitationParams[] = [];

  async deliver(params: DeliverInvitationParams) {
    this.deliveries.push(params);
    return {
      delivered: true,
      sentAt: new Date(),
      failureReason: null,
    };
  }
}

describe("RBAC, Provisioning, Activation & Audit integration tests (D-2A2-01)", () => {
  let dbHandle: ScratchDbHandle;
  const adminNewPass = "SuperAdmin-RBAC-Strong-2026!";
  const staffPassword = "Staff-Member-Strong-Pass-2026!";

  const tourEditorUsername = "tour.editor.test";
  const eventOperatorUsername = "event.operator.test";
  let tourEditorUserId = "";

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("rbac");

    // Pre-change admin password once and provision active TOUR_EDITOR & EVENT_OPERATOR test users
    const setupCtx = await createIntegrationApiApp({
      databaseUrl: dbHandle.testDbUrl,
    });
    try {
      const prisma = setupCtx.app.get(PrismaService);
      const server = setupCtx.app.getHttpServer();

      const login1 = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: "admin", password: TEST_ADMIN_BOOTSTRAP_PASSWORD })
        .expect(200);
      const t1 = login1.body.data.accessToken;

      await request(server)
        .patch("/api/v1/auth/me/password")
        .set("Authorization", `Bearer ${t1}`)
        .send({
          currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
          newPassword: adminNewPass,
        })
        .expect(200);

      // Seed active TOUR_EDITOR & EVENT_OPERATOR directly mapped to real seeded Role rows
      const [tourRole, eventRole] = await Promise.all([
        prisma.role.findUniqueOrThrow({ where: { code: "TOUR_EDITOR" } }),
        prisma.role.findUniqueOrThrow({ where: { code: "EVENT_OPERATOR" } }),
      ]);
      const staffHash = await hashPasswordArgon2id(staffPassword);

      const tourEditor = await prisma.user.create({
        data: {
          username: tourEditorUsername,
          fullName: "Tour Editor Tester",
          email: "tour.editor.test@fpt.edu.vn",
          userType: "STAFF",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "ADMIN_DIRECT",
          mustChangePassword: false,
          passwordHash: staffHash,
          userRoles: { create: { roleId: tourRole.id } },
        },
      });
      tourEditorUserId = tourEditor.id;

      await prisma.user.create({
        data: {
          username: eventOperatorUsername,
          fullName: "Event Operator Tester",
          email: "event.operator.test@fpt.edu.vn",
          userType: "STAFF",
          accountStatus: "ACTIVE",
          activationStatus: "ACTIVATED",
          provisioningMethod: "ADMIN_DIRECT",
          mustChangePassword: false,
          passwordHash: staffHash,
          userRoles: { create: { roleId: eventRole.id } },
        },
      });
    } finally {
      await setupCtx.close();
    }
  });

  afterAll(async () => {
    await dbHandle?.drop();
  });

  it("enforces D-2A2-01 RBAC matrix, object-level target checks, provisioning, phone E.164 & audit scrubbing", async () => {
    const spyAdapter = new InMemorySpyInvitationAdapter();
    const ctx = await createIntegrationApiApp({
      databaseUrl: dbHandle.testDbUrl,
      customizeBuilder: (builder) =>
        builder
          .overrideProvider(INVITATION_DELIVERY_ADAPTER)
          .useValue(spyAdapter),
    });

    try {
      const prisma = ctx.app.get(PrismaService);
      const server = ctx.app.getHttpServer();

      const adminLogin = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: "admin", password: adminNewPass })
        .expect(200);
      const adminToken: string = adminLogin.body.data.accessToken;

      const tourLogin = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: tourEditorUsername, password: staffPassword })
        .expect(200);
      const tourToken: string = tourLogin.body.data.accessToken;

      const eventLogin = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: eventOperatorUsername, password: staffPassword })
        .expect(200);
      const eventToken: string = eventLogin.body.data.accessToken;

      // 1. TOUR_EDITOR has zero access to /admin/users or /admin/audit-logs
      await request(server)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${tourToken}`)
        .expect(403);
      await request(server)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", `Bearer ${tourToken}`)
        .expect(403);
      await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${tourToken}`)
        .send({
          fullName: "Blocked Student",
          userType: "STUDENT",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
        })
        .expect(403);

      // 2. EVENT_OPERATOR strict boundaries (D-2A2-01)
      // 2a. CANNOT read GET /admin/users or GET /admin/audit-logs
      await request(server)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${eventToken}`)
        .expect(403);
      await request(server)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", `Bearer ${eventToken}`)
        .expect(403);

      // 2b. CANNOT create STAFF or assign roleCodes
      await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${eventToken}`)
        .send({
          fullName: "Unauthorized Staff",
          email: "unauth.staff@fpt.edu.vn",
          userType: "STAFF",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
        })
        .expect(403);

      await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${eventToken}`)
        .send({
          fullName: "Role Escalation Student",
          email: "esc.student@fpt.edu.vn",
          userType: "STUDENT",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
          roleCodes: ["SUPER_ADMIN"],
        })
        .expect(403);

      // 2c. CAN provision STUDENT via ADMIN_DIRECT -> single-time activationToken, stored SHA-256 hash
      const studentRes = await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${eventToken}`)
        .send({
          fullName: "Nguyen Van Hoc Sinh",
          email: "student.openday@example.edu.vn",
          userType: "STUDENT",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
          eventKeys: ["open-day-2026-qtsc"],
        })
        .expect(201);

      expect(studentRes.body.data.invitation.activationToken).toEqual(
        expect.any(String),
      );
      const directToken: string = studentRes.body.data.invitation.activationToken;
      const studentId: string = studentRes.body.data.user.id;
      expect(studentRes.body.data.user.activationStatus).toBe(
        "PENDING_ACTIVATION",
      );
      expect(studentRes.body.data.user.eventParticipations).toHaveLength(1);
      expect(studentRes.body.data.user.eventParticipations[0].eventKey).toBe(
        "open-day-2026-qtsc",
      );

      const dbInvDirect = await prisma.accountInvitation.findFirstOrThrow({
        where: { userId: studentId },
      });
      expect(dbInvDirect.tokenHash).toBe(sha256Hex(directToken));
      expect(dbInvDirect.tokenHash).not.toBe(directToken);

      // 2d. CAN provision PARENT via EMAIL_SMS_INVITATION -> phone normalized, token NULL in response, spy captured
      const parentRes = await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${eventToken}`)
        .send({
          fullName: "Tran Thi Phu Huynh",
          phone: "0901 234 567",
          userType: "PARENT",
          provisioningMethod: "EMAIL_SMS_INVITATION",
          channel: "SMS",
        })
        .expect(201);

      expect(parentRes.body.data.invitation.activationToken).toBeNull();
      expect(parentRes.body.data.user.phone).toBe("+84901234567");
      expect(parentRes.body.data.user.activationStatus).toBe("INVITATION_SENT");
      expect(spyAdapter.deliveries).toHaveLength(1);
      expect(spyAdapter.deliveries[0].recipientPhone).toBe("+84901234567");
      const parentId: string = parentRes.body.data.user.id;

      // 2e. Duplicate normalized phone rejected with 409 CONFLICT
      await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${eventToken}`)
        .send({
          fullName: "Duplicate Phone",
          phone: "84901234567",
          userType: "PARENT",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
        })
        .expect(409);

      // 2f. Object-level target RBAC check: EVENT_OPERATOR CANNOT lock or resend for STAFF/ADMIN
      await request(server)
        .patch(`/api/v1/admin/users/${tourEditorUserId}/status`)
        .set("Authorization", `Bearer ${eventToken}`)
        .send({ accountStatus: "LOCKED" })
        .expect(403);

      await request(server)
        .post(`/api/v1/admin/users/${tourEditorUserId}/invitations/resend`)
        .set("Authorization", `Bearer ${eventToken}`)
        .send({ channel: "DIRECT_LINK" })
        .expect(403);

      // 2g. EVENT_OPERATOR CAN resend invitation for STUDENT -> previous token marked EXPIRED
      const resendRes = await request(server)
        .post(`/api/v1/admin/users/${studentId}/invitations/resend`)
        .set("Authorization", `Bearer ${eventToken}`)
        .send({ channel: "DIRECT_LINK" })
        .expect(200);
      expect(resendRes.body.data.resendCount).toBe(1);
      expect(resendRes.body.data.activationToken).toEqual(expect.any(String));
      expect(resendRes.body.data.activationToken).not.toBe(directToken);

      const expiredPrevInv = await prisma.accountInvitation.findUnique({
        where: { tokenHash: sha256Hex(directToken) },
      });
      expect(expiredPrevInv?.status).toBe("EXPIRED");

      // 3. SUPER_ADMIN can list users & audit logs (zero sensitive hashes/tokens leaked)
      const adminList = await request(server)
        .get("/api/v1/admin/users?limit=50")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      const listSerialized = JSON.stringify(adminList.body);
      expect(listSerialized).not.toContain("passwordHash");
      expect(listSerialized).not.toContain("tokenHash");
      expect(listSerialized).not.toContain(directToken);

      const adminAudits = await request(server)
        .get("/api/v1/admin/audit-logs?limit=50")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(adminAudits.body.meta.total).toBeGreaterThanOrEqual(2);
      const auditSerialized = JSON.stringify(adminAudits.body);
      expect(auditSerialized).not.toContain(directToken);
      expect(auditSerialized).not.toContain(
        spyAdapter.deliveries[0].activationToken,
      );

      // 4. Reject unknown invented roles (strictly seeded 3 roles only)
      await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Invalid Role User",
          email: "bad.role@fpt.edu.vn",
          userType: "STAFF",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
          roleCodes: ["INVENTED_ROLE"],
        })
        .expect(400);

      // 5. SUPER_ADMIN cannot self-lock root admin account
      const adminDb = await prisma.user.findFirstOrThrow({
        where: { username: "admin" },
      });
      await request(server)
        .patch(`/api/v1/admin/users/${adminDb.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ accountStatus: "LOCKED" })
        .expect(422);

      expect(parentId).toBeTruthy();
    } finally {
      await ctx.close();
    }
  });

  it("completes activation, rejects replay (409) & expired tokens, logs in by E.164 phone, and revokes locked user sessions immediately", async () => {
    const spyAdapter = new InMemorySpyInvitationAdapter();
    const ctx = await createIntegrationApiApp({
      databaseUrl: dbHandle.testDbUrl,
      customizeBuilder: (builder) =>
        builder
          .overrideProvider(INVITATION_DELIVERY_ADAPTER)
          .useValue(spyAdapter),
    });

    try {
      const prisma = ctx.app.get(PrismaService);
      const server = ctx.app.getHttpServer();

      const adminLogin = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: "admin", password: adminNewPass })
        .expect(200);
      const adminToken: string = adminLogin.body.data.accessToken;

      // Create STUDENT via ADMIN_DIRECT to get clean token for activation tests
      const created = await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Activation Flow Tester",
          phone: "0912 345 678",
          userType: "STUDENT",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
        })
        .expect(201);

      const rawToken: string = created.body.data.invitation.activationToken;
      const targetUserId: string = created.body.data.user.id;

      // Validate invalid token -> valid: false
      const badValidate = await request(server)
        .post("/api/v1/auth/activate/validate")
        .send({ token: "invalid-activation-token-0123456789" })
        .expect(200);
      expect(badValidate.body.data.valid).toBe(false);

      // Validate valid token -> valid: true
      const okValidate = await request(server)
        .post("/api/v1/auth/activate/validate")
        .send({ token: rawToken })
        .expect(200);
      expect(okValidate.body.data.valid).toBe(true);
      expect(okValidate.body.data.fullName).toBe("Activation Flow Tester");

      // Complete activation with strong password
      const chosenPassword = "Student-Activated-Strong-2026!";
      await request(server)
        .post("/api/v1/auth/activate/complete")
        .send({ token: rawToken, newPassword: chosenPassword })
        .expect(200);

      // Replaying the same activation token -> 409 CONFLICT
      const replay = await request(server)
        .post("/api/v1/auth/activate/complete")
        .send({ token: rawToken, newPassword: chosenPassword })
        .expect(409);
      expect(replay.body.error.code).toBe("CONFLICT");

      // Login using unformatted Vietnamese phone ("0912 345 678") matching "+84912345678"
      const phoneLogin = await request(server)
        .post("/api/v1/auth/login")
        .send({ identifier: "0912 345 678", password: chosenPassword })
        .expect(200);
      const userAccessToken: string = phoneLogin.body.data.accessToken;
      const userRefreshCookie = extractCookieValue(
        phoneLogin.headers["set-cookie"],
        "refresh_token",
      )!.value;

      await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(200);

      // Lock user via PATCH /admin/users/:id/status -> must immediately revoke refresh tokens AND block Bearer JWT
      const lockedRes = await request(server)
        .patch(`/api/v1/admin/users/${targetUserId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ accountStatus: "LOCKED" })
        .expect(200);
      expect(lockedRes.body.data.accountStatus).toBe("LOCKED");

      const revokedRows = await prisma.refreshToken.findMany({
        where: { userId: targetUserId },
      });
      expect(revokedRows.length).toBeGreaterThan(0);
      expect(revokedRows.every((r) => r.revokedAt !== null)).toBe(true);

      await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${userAccessToken}`)
        .expect(401);

      await request(server)
        .post("/api/v1/auth/refresh")
        .set("Origin", TEST_WEB_ORIGIN)
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${userRefreshCookie}`)
        .expect(401);

      // Expired invitation token test: create second STUDENT and force expiresAt in past
      const expUser = await request(server)
        .post("/api/v1/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Expired Invitation Tester",
          email: "expired.invite@fpt.edu.vn",
          userType: "STUDENT",
          provisioningMethod: "ADMIN_DIRECT",
          channel: "DIRECT_LINK",
        })
        .expect(201);
      const expToken: string = expUser.body.data.invitation.activationToken;
      await prisma.accountInvitation.updateMany({
        where: { tokenHash: sha256Hex(expToken) },
        data: { expiresAt: new Date(Date.now() - 60_000) },
      });

      const expComplete = await request(server)
        .post("/api/v1/auth/activate/complete")
        .send({ token: expToken, newPassword: chosenPassword })
        .expect(400);
      expect(expComplete.body.error.code).toBe("VALIDATION_ERROR");
    } finally {
      await ctx.close();
    }
  });
});

import { JwtService } from "@nestjs/jwt";
import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import { sha256Hex } from "../../src/common/utils/token-crypto";
import {
  createIntegrationApiApp,
  extractCookieValue,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  TEST_JWT_SECRET,
  TEST_WEB_ORIGIN,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Authentication, Session Lifecycle, Brute-Force & Rate Limit integration tests", () => {
  let dbHandle: ScratchDbHandle;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("auth");
  });

  afterAll(async () => {
    await dbHandle?.drop();
  });

  describe("Bootstrap admin mustChangePassword flow & session revocation", () => {
    it("enforces PASSWORD_CHANGE_REQUIRED until PATCH /auth/me/password and revokes sibling sessions", async () => {
      const ctx = await createIntegrationApiApp({
        databaseUrl: dbHandle.testDbUrl,
      });

      try {
        const prisma = ctx.app.get(PrismaService);
        const server = ctx.app.getHttpServer();

        const login1 = await request(server)
          .post("/api/v1/auth/login")
          .send({
            identifier: "admin",
            password: TEST_ADMIN_BOOTSTRAP_PASSWORD,
          })
          .expect(200);

        expect(login1.body.success).toBe(true);
        expect(login1.body.data.user.mustChangePassword).toBe(true);
        const token1: string = login1.body.data.accessToken;
        const cookie1 = extractCookieValue(
          login1.headers["set-cookie"],
          "refresh_token",
        );
        expect(cookie1).not.toBeNull();
        expect(cookie1!.rawHeader).toContain("HttpOnly");
        expect(cookie1!.rawHeader).toContain("Path=/api/v1/auth");
        expect(cookie1!.rawHeader).toContain("SameSite=Lax");
        // Non-production HTTP dev test mode omits Secure attribute
        expect(cookie1!.rawHeader).not.toContain("; Secure");

        // Second concurrent session (sibling refresh token)
        const login2 = await request(server)
          .post("/api/v1/auth/login")
          .send({
            identifier: "admin",
            password: TEST_ADMIN_BOOTSTRAP_PASSWORD,
          })
          .expect(200);
        const cookie2 = extractCookieValue(
          login2.headers["set-cookie"],
          "refresh_token",
        );
        expect(cookie2).not.toBeNull();

        // Admin routes blocked while mustChangePassword=true
        const blockedUsers = await request(server)
          .get("/api/v1/admin/users")
          .set("Authorization", `Bearer ${token1}`)
          .expect(403);
        expect(blockedUsers.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");

        // /auth/me remains accessible with mustChangePassword=true
        const meBefore = await request(server)
          .get("/api/v1/auth/me")
          .set("Authorization", `Bearer ${token1}`)
          .expect(200);
        expect(meBefore.body.data.mustChangePassword).toBe(true);
        expect(meBefore.body.data.roles).toContain("SUPER_ADMIN");

        // Weak password rejected (<12 chars)
        const weakChange = await request(server)
          .patch("/api/v1/auth/me/password")
          .set("Authorization", `Bearer ${token1}`)
          .send({
            currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
            newPassword: "Short1!",
          })
          .expect(400);
        expect(weakChange.body.error.code).toBe("VALIDATION_ERROR");

        // Wrong current password rejected + audited
        await request(server)
          .patch("/api/v1/auth/me/password")
          .set("Authorization", `Bearer ${token1}`)
          .send({
            currentPassword: "Wrong-Current-Password-2026!",
            newPassword: "Updated-Admin-Strong-Pass-2026!",
          })
          .expect(401);

        // Successful password change using session 1's cookie
        const newPassword = "Updated-Admin-Strong-Pass-2026!";
        const changed = await request(server)
          .patch("/api/v1/auth/me/password")
          .set("Authorization", `Bearer ${token1}`)
          .set("Cookie", `refresh_token=${cookie1!.value}`)
          .send({
            currentPassword: TEST_ADMIN_BOOTSTRAP_PASSWORD,
            newPassword,
          })
          .expect(200);
        expect(changed.body.data).toEqual({
          updated: true,
          mustChangePassword: false,
        });

        // Sibling session cookie2 MUST have been revoked in DB
        const siblingRefresh = await request(server)
          .post("/api/v1/auth/refresh")
          .set("Origin", TEST_WEB_ORIGIN)
          .set("X-Requested-With", "XMLHttpRequest")
          .set("Cookie", `refresh_token=${cookie2!.value}`)
          .expect(401);
        expect(siblingRefresh.body.error.code).toBe("UNAUTHORIZED");

        // Re-login with new password unlocks /admin/*
        const loginAfter = await request(server)
          .post("/api/v1/auth/login")
          .send({ identifier: "admin", password: newPassword })
          .expect(200);
        expect(loginAfter.body.data.user.mustChangePassword).toBe(false);

        const allowedUsers = await request(server)
          .get("/api/v1/admin/users")
          .set("Authorization", `Bearer ${loginAfter.body.data.accessToken}`)
          .expect(200);
        expect(allowedUsers.body.success).toBe(true);
        expect(Array.isArray(allowedUsers.body.data)).toBe(true);

        const pwdAudit = await prisma.auditLog.findFirst({
          where: { action: "PASSWORD_CHANGED" },
          orderBy: { createdAt: "desc" },
        });
        expect(pwdAudit).not.toBeNull();
      } finally {
        await ctx.close();
      }
    });
  });

  describe("JWT verification, Refresh rotation, family reuse revocation & logout", () => {
    const CURRENT_ADMIN_PASSWORD = "Updated-Admin-Strong-Pass-2026!";

    it("rotates refresh tokens, detects token reuse revoking entire family, and clears cookie on logout", async () => {
      const ctx = await createIntegrationApiApp({
        databaseUrl: dbHandle.testDbUrl,
      });

      try {
        const prisma = ctx.app.get(PrismaService);
        const jwtService = ctx.app.get(JwtService);
        const server = ctx.app.getHttpServer();

        // Missing / tampered / expired JWT checks
        await request(server).get("/api/v1/auth/me").expect(401);
        await request(server)
          .get("/api/v1/auth/me")
          .set("Authorization", "Bearer invalid.jwt.token")
          .expect(401);

        const adminRow = await prisma.user.findFirstOrThrow({
          where: { username: "admin" },
        });
        const expiredToken = await jwtService.signAsync(
          {
            sub: adminRow.id,
            username: "admin",
            roles: ["SUPER_ADMIN"],
            pwdRequired: false,
            jti: "expired-test-jti",
          },
          { secret: TEST_JWT_SECRET, expiresIn: -10 },
        );
        await request(server)
          .get("/api/v1/auth/me")
          .set("Authorization", `Bearer ${expiredToken}`)
          .expect(401);

        // Absent /auth/register route per D-2A2-02 / OD-04
        await request(server)
          .post("/api/v1/auth/register")
          .send({ username: "hacker" })
          .expect(404);

        // Login -> R1
        const loginRes = await request(server)
          .post("/api/v1/auth/login")
          .send({ identifier: "admin", password: CURRENT_ADMIN_PASSWORD })
          .expect(200);
        const r1 = extractCookieValue(
          loginRes.headers["set-cookie"],
          "refresh_token",
        )!.value;

        // Refresh R1 -> R2
        const refreshRes = await request(server)
          .post("/api/v1/auth/refresh")
          .set("Origin", TEST_WEB_ORIGIN)
          .set("X-Requested-With", "XMLHttpRequest")
          .set("Cookie", `refresh_token=${r1}`)
          .expect(200);
        const r2 = extractCookieValue(
          refreshRes.headers["set-cookie"],
          "refresh_token",
        )!.value;
        expect(r2).not.toBe(r1);

        const r1Db = await prisma.refreshToken.findUnique({
          where: { tokenHash: sha256Hex(r1) },
        });
        const r2Db = await prisma.refreshToken.findUnique({
          where: { tokenHash: sha256Hex(r2) },
        });
        expect(r1Db?.revokedAt).not.toBeNull();
        expect(r2Db?.revokedAt).toBeNull();
        expect(r2Db?.familyId).toBe(r1Db?.familyId);

        // Replay stale R1 -> triggers family revocation
        await request(server)
          .post("/api/v1/auth/refresh")
          .set("Origin", TEST_WEB_ORIGIN)
          .set("X-Requested-With", "XMLHttpRequest")
          .set("Cookie", `refresh_token=${r1}`)
          .expect(401);

        const reuseAudit = await prisma.auditLog.findFirst({
          where: { action: "REFRESH_TOKEN_REUSE_DETECTED" },
          orderBy: { createdAt: "desc" },
        });
        expect(reuseAudit).not.toBeNull();

        // Active R2 in the same family MUST now also be revoked
        await request(server)
          .post("/api/v1/auth/refresh")
          .set("Origin", TEST_WEB_ORIGIN)
          .set("X-Requested-With", "XMLHttpRequest")
          .set("Cookie", `refresh_token=${r2}`)
          .expect(401);

        // Fresh login -> test clean logout
        const login2 = await request(server)
          .post("/api/v1/auth/login")
          .send({ identifier: "admin", password: CURRENT_ADMIN_PASSWORD })
          .expect(200);
        const r3 = extractCookieValue(
          login2.headers["set-cookie"],
          "refresh_token",
        )!.value;

        const logoutRes = await request(server)
          .post("/api/v1/auth/logout")
          .set("Origin", TEST_WEB_ORIGIN)
          .set("X-Requested-With", "XMLHttpRequest")
          .set("Cookie", `refresh_token=${r3}`)
          .expect(200);
        expect(logoutRes.body.data).toEqual({ loggedOut: true });
        expect(logoutRes.headers["set-cookie"]?.[0]).toContain("refresh_token=;");

        // Revoked R3 cannot refresh
        await request(server)
          .post("/api/v1/auth/refresh")
          .set("Origin", TEST_WEB_ORIGIN)
          .set("X-Requested-With", "XMLHttpRequest")
          .set("Cookie", `refresh_token=${r3}`)
          .expect(401);
      } finally {
        await ctx.close();
      }
    });
  });

  describe("Brute-force lock (5 wrong logins -> 15m lock) and rate limiting", () => {
    const CURRENT_ADMIN_PASSWORD = "Updated-Admin-Strong-Pass-2026!";

    it("locks account for 15 minutes after 5 wrong login attempts across sessions and rejects valid password while locked", async () => {
      const ctxAttempts = await createIntegrationApiApp({
        databaseUrl: dbHandle.testDbUrl,
      });

      try {
        const prisma = ctxAttempts.app.get(PrismaService);
        const server = ctxAttempts.app.getHttpServer();

        for (let i = 0; i < 5; i++) {
          const wrongRes = await request(server)
            .post("/api/v1/auth/login")
            .send({
              identifier: "admin",
              password: "Invalid-Attempt-Password-2026!",
            })
            .expect(401);
          expect(wrongRes.body.error.code).toBe("UNAUTHORIZED");
        }

        const lockedUser = await prisma.user.findFirstOrThrow({
          where: { username: "admin" },
        });
        expect(lockedUser.failedLoginAttempts).toBe(5);
        expect(lockedUser.lockedUntil).not.toBeNull();
        expect(lockedUser.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

        const bruteAudit = await prisma.auditLog.findFirst({
          where: { action: "ACCOUNT_LOCKED_BRUTE_FORCE" },
        });
        expect(bruteAudit).not.toBeNull();
      } finally {
        await ctxAttempts.close();
      }

      // Separate app instance (fresh rate-limit bucket) proves DB lock holds even with correct password
      const ctxVerifyLock = await createIntegrationApiApp({
        databaseUrl: dbHandle.testDbUrl,
      });
      try {
        const prisma = ctxVerifyLock.app.get(PrismaService);
        const server = ctxVerifyLock.app.getHttpServer();

        const blockedValid = await request(server)
          .post("/api/v1/auth/login")
          .send({
            identifier: "admin",
            password: CURRENT_ADMIN_PASSWORD,
          })
          .expect(401);
        expect(blockedValid.body.error.code).toBe("UNAUTHORIZED");

        const lockAttemptAudit = await prisma.auditLog.findFirst({
          where: { action: "LOGIN_LOCKED_ATTEMPT" },
        });
        expect(lockAttemptAudit).not.toBeNull();

        // Clear lock before rate-limit check
        await prisma.user.updateMany({
          where: { username: "admin" },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });
      } finally {
        await ctxVerifyLock.close();
      }
    });

    it("enforces @Throttle(5 req/60s) on POST /api/v1/auth/login returning 429 RATE_LIMITED", async () => {
      const ctxRate = await createIntegrationApiApp({
        databaseUrl: dbHandle.testDbUrl,
      });

      try {
        const server = ctxRate.app.getHttpServer();
        for (let i = 0; i < 5; i++) {
          await request(server)
            .post("/api/v1/auth/login")
            .send({
              identifier: "nonexistent-user-rate-check",
              password: "Some-Random-Password-2026!",
            })
            .expect(401);
        }

        const limited = await request(server)
          .post("/api/v1/auth/login")
          .send({
            identifier: "nonexistent-user-rate-check",
            password: "Some-Random-Password-2026!",
          })
          .expect(429);

        expect(limited.body.success).toBe(false);
        expect(limited.body.error.code).toBe("RATE_LIMITED");
      } finally {
        await ctxRate.close();
      }
    });
  });
});

import request from "supertest";
import {
  createIntegrationApiApp,
  extractCookieValue,
  provisionScratchDatabase,
  TEST_ADMIN_BOOTSTRAP_PASSWORD,
  TEST_WEB_ORIGIN,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("CSRF & CORS enforcement integration tests (D-2A2-04)", () => {
  let dbHandle: ScratchDbHandle;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("csrf");
  });

  afterAll(async () => {
    await dbHandle?.drop();
  });

  it("enforces BOTH Origin/Referer allowlist AND X-Requested-With on /auth/refresh and /auth/logout", async () => {
    const ctx = await createIntegrationApiApp({
      databaseUrl: dbHandle.testDbUrl,
    });

    try {
      const server = ctx.app.getHttpServer();

      const loginRes = await request(server)
        .post("/api/v1/auth/login")
        .send({
          identifier: "admin",
          password: TEST_ADMIN_BOOTSTRAP_PASSWORD,
        })
        .expect(200);
      const refreshCookie = extractCookieValue(
        loginRes.headers["set-cookie"],
        "refresh_token",
      )!.value;

      // 1. Missing X-Requested-With on /refresh & /logout -> 403
      const noXrwRefresh = await request(server)
        .post("/api/v1/auth/refresh")
        .set("Origin", TEST_WEB_ORIGIN)
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);
      expect(noXrwRefresh.body.error.code).toBe("FORBIDDEN");

      await request(server)
        .post("/api/v1/auth/logout")
        .set("Origin", TEST_WEB_ORIGIN)
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);

      // 2. Wrong X-Requested-With -> 403
      await request(server)
        .post("/api/v1/auth/refresh")
        .set("Origin", TEST_WEB_ORIGIN)
        .set("X-Requested-With", "Fetch")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);

      // 3. Missing BOTH Origin and Referer -> 403
      await request(server)
        .post("/api/v1/auth/refresh")
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);

      // 4. Untrusted Origin -> 403
      await request(server)
        .post("/api/v1/auth/refresh")
        .set("Origin", "https://attacker.example")
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);

      // 5. Untrusted Referer without Origin -> 403
      await request(server)
        .post("/api/v1/auth/logout")
        .set("Referer", "https://attacker.example/exploit.html")
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);

      // 5b. Malformed Referer URL syntax without Origin -> 403 FORBIDDEN (never 500)
      const malformedRefresh = await request(server)
        .post("/api/v1/auth/refresh")
        .set("Referer", "://not-a-valid-url[broken]")
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);
      expect(malformedRefresh.body.success).toBe(false);
      expect(malformedRefresh.body.error.code).toBe("FORBIDDEN");

      const malformedLogout = await request(server)
        .post("/api/v1/auth/logout")
        .set("Referer", "not a url with spaces")
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(403);
      expect(malformedLogout.body.success).toBe(false);
      expect(malformedLogout.body.error.code).toBe("FORBIDDEN");

      // 6. Valid Referer fallback without Origin + valid X-Requested-With -> 200 (rotates)
      const refererOk = await request(server)
        .post("/api/v1/auth/refresh")
        .set("Referer", `${TEST_WEB_ORIGIN}/admin/users?tab=accounts`)
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${refreshCookie}`)
        .expect(200);
      const rotatedCookie = extractCookieValue(
        refererOk.headers["set-cookie"],
        "refresh_token",
      )!.value;

      // 7. Valid Origin + X-Requested-With on logout -> 200
      await request(server)
        .post("/api/v1/auth/logout")
        .set("Origin", TEST_WEB_ORIGIN)
        .set("X-Requested-With", "XMLHttpRequest")
        .set("Cookie", `refresh_token=${rotatedCookie}`)
        .expect(200);
    } finally {
      await ctx.close();
    }
  });

  it("configures exact CORS allowlist with credentials and omits CORS headers for unknown origins", async () => {
    const ctx = await createIntegrationApiApp({
      databaseUrl: dbHandle.testDbUrl,
    });

    try {
      const server = ctx.app.getHttpServer();

      const allowed = await request(server)
        .get("/api/v1/health")
        .set("Origin", TEST_WEB_ORIGIN)
        .expect(200);
      expect(allowed.headers["access-control-allow-origin"]).toBe(
        TEST_WEB_ORIGIN,
      );
      expect(allowed.headers["access-control-allow-origin"]).not.toBe("*");
      expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

      const preflight = await request(server)
        .options("/api/v1/auth/refresh")
        .set("Origin", TEST_WEB_ORIGIN)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "X-Requested-With,Content-Type")
        .expect(204);
      expect(preflight.headers["access-control-allow-origin"]).toBe(
        TEST_WEB_ORIGIN,
      );
      expect(preflight.headers["access-control-allow-credentials"]).toBe(
        "true",
      );

      const disallowed = await request(server)
        .get("/api/v1/health")
        .set("Origin", "https://evil.example.com")
        .expect(200);
      expect(disallowed.headers["access-control-allow-origin"]).toBeUndefined();
      expect(
        disallowed.headers["access-control-allow-credentials"],
      ).toBeUndefined();
    } finally {
      await ctx.close();
    }
  });

  it("sets Secure attribute on refresh_token cookie when NODE_ENV=production", async () => {
    const prodCtx = await createIntegrationApiApp({
      databaseUrl: dbHandle.testDbUrl,
      nodeEnv: "production",
    });

    try {
      const loginRes = await request(prodCtx.app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          identifier: "admin",
          password: TEST_ADMIN_BOOTSTRAP_PASSWORD,
        })
        .expect(200);

      const cookie = extractCookieValue(
        loginRes.headers["set-cookie"],
        "refresh_token",
      );
      expect(cookie).not.toBeNull();
      expect(cookie!.rawHeader).toContain("HttpOnly");
      expect(cookie!.rawHeader).toContain("Secure");
      expect(cookie!.rawHeader).toContain("SameSite=Lax");
      expect(cookie!.rawHeader).toContain("Path=/api/v1/auth");
    } finally {
      await prodCtx.close();
    }
  });
});

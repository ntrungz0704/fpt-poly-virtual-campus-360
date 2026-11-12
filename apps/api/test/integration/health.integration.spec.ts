import request from "supertest";
import { PrismaService } from "../../src/common/adapters/prisma.service";
import {
  createIntegrationApiApp,
  provisionScratchDatabase,
  type ApiTestContext,
  type ScratchDbHandle,
} from "./test-db.helper";

describe("Health endpoint integration tests (D-2A2-02)", () => {
  let dbHandle: ScratchDbHandle;
  let ctx: ApiTestContext;

  beforeAll(async () => {
    dbHandle = await provisionScratchDatabase("health");
    ctx = await createIntegrationApiApp({ databaseUrl: dbHandle.testDbUrl });
  });

  afterAll(async () => {
    await ctx?.close();
    await dbHandle?.drop();
  });

  it("GET /api/v1/health returns 200 ok with SELECT 1 probe and envelope metadata", async () => {
    const res = await request(ctx.app.getHttpServer())
      .get("/api/v1/health")
      .expect(200);

    expect(res.headers["x-request-id"]).toMatch(/^req_/);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      status: "ok",
      database: "up",
      timestamp: expect.any(String),
    });
    expect(res.body.meta.requestId).toBe(res.headers["x-request-id"]);
  });

  it("GET /api/v1/health returns 503 SERVICE_UNAVAILABLE without leaking DSN, host, credentials, or stack trace", async () => {
    const prisma = ctx.app.get(PrismaService);
    const pingSpy = jest.spyOn(prisma, "ping").mockResolvedValueOnce(false);

    try {
      const res = await request(ctx.app.getHttpServer())
        .get("/api/v1/health")
        .expect(503);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toMatch(/postgresql:\/\//i);
      expect(serialized).not.toMatch(/localhost:5432/i);
      expect(serialized).not.toMatch(/at\s+HealthController/i);
      expect(serialized).not.toContain(dbHandle.testDbUrl);
    } finally {
      pingSpy.mockRestore();
    }
  });
});

import { validateAndBuildEnv } from "../../src/config/env.schema";

describe("env.schema validation unit tests", () => {
  const VALID_BASE = {
    NODE_ENV: "test",
    API_PORT: "4000",
    WEB_ORIGIN: "http://localhost:3000",
    RATE_LIMIT_STORE: "memory",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/virtual_campus_360",
    JWT_SECRET: "a".repeat(48),
    JWT_EXPIRATION: "15m",
    JWT_REFRESH_SECRET: "b".repeat(48),
    JWT_REFRESH_EXPIRATION: "7d",
    STORAGE_DRIVER: "local",
    LOCAL_MEDIA_ROOT: "apps/web/public/images",
  };

  it("accepts valid configuration and computes derived TTL and cookie flags", () => {
    const dev = validateAndBuildEnv(VALID_BASE);
    expect(dev.allowedOrigins).toEqual(["http://localhost:3000"]);
    expect(dev.accessTokenTtlSeconds).toBe(900);
    expect(dev.refreshTokenTtlMs).toBe(604_800_000);
    expect(dev.cookieSecure).toBe(false);

    const prod = validateAndBuildEnv({
      ...VALID_BASE,
      NODE_ENV: "production",
    });
    expect(prod.cookieSecure).toBe(true);
  });

  it("rejects CHANGE_ME_* placeholder secrets and short JWT secrets", () => {
    const placeholder = ["CHANGE", "ME", "EXAMPLE", "SECRET", "12345678901234567890"].join("_");
    expect(() =>
      validateAndBuildEnv({ ...VALID_BASE, JWT_SECRET: placeholder }),
    ).toThrow();
    expect(() =>
      validateAndBuildEnv({ ...VALID_BASE, JWT_REFRESH_SECRET: placeholder }),
    ).toThrow();
    expect(() =>
      validateAndBuildEnv({ ...VALID_BASE, JWT_SECRET: "too-short-secret" }),
    ).toThrow();
  });

  it("rejects wildcard '*' or non-origin WEB_ORIGIN values", () => {
    expect(() =>
      validateAndBuildEnv({ ...VALID_BASE, WEB_ORIGIN: "*" }),
    ).toThrow();
    expect(() =>
      validateAndBuildEnv({
        ...VALID_BASE,
        WEB_ORIGIN: "http://localhost:3000/with-path",
      }),
    ).toThrow();
  });

  it("rejects non-postgresql DATABASE_URL values", () => {
    expect(() =>
      validateAndBuildEnv({ ...VALID_BASE, DATABASE_URL: "mysql://localhost/db" }),
    ).toThrow();
  });
});

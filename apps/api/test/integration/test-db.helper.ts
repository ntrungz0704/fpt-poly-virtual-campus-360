import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModuleBuilder } from "@nestjs/testing";
import dotenv from "dotenv";
import { Client } from "pg";
import { TestAppHostModule } from "../../src/app.module";
import { configureApiApp } from "../../src/app.setup";
import { findMonorepoRoot } from "../../src/config/repo-root";

export const TEST_WEB_ORIGIN = "http://localhost:3000";
export const TEST_JWT_SECRET =
  "test-jwt-secret-key-for-phase-2a2-integration-verification-001";
export const TEST_JWT_REFRESH_SECRET =
  "test-jwt-refresh-secret-key-for-phase-2a2-integration-verify-002";
export const TEST_ADMIN_BOOTSTRAP_PASSWORD = "TestBootstr@p-Init-2026!";

const SAFE_IDENTIFIER = /^[a-z0-9_]{3,63}$/;

export interface ScratchDbHandle {
  testDbName: string;
  testDbUrl: string;
  adminDbUrl: string;
  monorepoRoot: string;
  drop: () => Promise<void>;
}

function loadBaseDatabaseUrl(monorepoRoot: string): string {
  const envPath = path.resolve(monorepoRoot, ".env");
  const parsed = fs.existsSync(envPath)
    ? dotenv.parse(fs.readFileSync(envPath, "utf8"))
    : {};
  const rawUrl = parsed.DATABASE_URL || process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error(
      "DATABASE_URL must be configured in .env or environment to provision scratch integration DB.",
    );
  }
  return rawUrl;
}

function deriveDatabaseUrls(
  baseDatabaseUrl: string,
  scratchDbName: string,
): { testDbUrl: string; adminDbUrl: string; baseDbName: string } {
  if (!SAFE_IDENTIFIER.test(scratchDbName)) {
    throw new Error(`Unsafe scratch DB name: ${scratchDbName}`);
  }
  const baseUrl = new URL(baseDatabaseUrl);
  const baseDbName = baseUrl.pathname.replace(/^\/+/, "");
  if (!baseDbName || baseDbName === scratchDbName) {
    throw new Error("Scratch test DB must differ from primary database.");
  }

  const testUrl = new URL(baseDatabaseUrl);
  testUrl.pathname = `/${scratchDbName}`;

  const adminUrl = new URL(baseDatabaseUrl);
  adminUrl.pathname = "/postgres";

  return {
    testDbUrl: testUrl.toString(),
    adminDbUrl: adminUrl.toString(),
    baseDbName,
  };
}

async function connectAdminPg(
  adminDbUrl: string,
  fallbackBaseUrl: string,
): Promise<Client> {
  const client = new Client({ connectionString: adminDbUrl });
  try {
    await client.connect();
    return client;
  } catch {
    await client.end().catch(() => undefined);
    const fallbackClient = new Client({ connectionString: fallbackBaseUrl });
    await fallbackClient.connect();
    return fallbackClient;
  }
}

export async function provisionScratchDatabase(
  suiteSuffix: string,
): Promise<ScratchDbHandle> {
  const monorepoRoot = findMonorepoRoot();
  const baseDatabaseUrl = loadBaseDatabaseUrl(monorepoRoot);
  const safeSuffix = suiteSuffix.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const testDbName = `vc_api_test_${safeSuffix}`.slice(0, 60);

  const { testDbUrl, adminDbUrl } = deriveDatabaseUrls(
    baseDatabaseUrl,
    testDbName,
  );

  const adminClient = await connectAdminPg(adminDbUrl, baseDatabaseUrl);
  try {
    await adminClient.query(
      `DROP DATABASE IF EXISTS "${testDbName}" WITH (FORCE);`,
    );
    await adminClient.query(`CREATE DATABASE "${testDbName}";`);
  } finally {
    await adminClient.end();
  }

  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: testDbUrl,
    ADMIN_BOOTSTRAP_PASSWORD: TEST_ADMIN_BOOTSTRAP_PASSWORD,
    NODE_ENV: "test",
  };

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  execFileSync(pnpmCmd, ["exec", "prisma", "migrate", "deploy"], {
    cwd: monorepoRoot,
    env: childEnv,
    stdio: "pipe",
    shell: process.platform === "win32",
  });

  execFileSync(pnpmCmd, ["exec", "tsx", "prisma/seed.ts"], {
    cwd: monorepoRoot,
    env: childEnv,
    stdio: "pipe",
    shell: process.platform === "win32",
  });

  return {
    testDbName,
    testDbUrl,
    adminDbUrl,
    monorepoRoot,
    drop: async () => {
      const cleanupClient = await connectAdminPg(adminDbUrl, baseDatabaseUrl);
      try {
        await cleanupClient.query(
          `DROP DATABASE IF EXISTS "${testDbName}" WITH (FORCE);`,
        );
      } finally {
        await cleanupClient.end();
      }
    },
  };
}

export interface ApiTestContext {
  app: INestApplication;
  close: () => Promise<void>;
}

export async function createIntegrationApiApp(options: {
  databaseUrl: string;
  nodeEnv?: "test" | "development" | "production";
  customizeBuilder?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}): Promise<ApiTestContext> {
  const watchedKeys = [
    "NODE_ENV",
    "API_PORT",
    "WEB_ORIGIN",
    "RATE_LIMIT_STORE",
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_EXPIRATION",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRATION",
    "STORAGE_DRIVER",
    "LOCAL_MEDIA_ROOT",
  ] as const;

  const previousEnv = new Map<string, string | undefined>();
  for (const key of watchedKeys) {
    previousEnv.set(key, process.env[key]);
  }

  const envOverrides: Record<string, string> = {
    NODE_ENV: options.nodeEnv ?? "test",
    API_PORT: "4000",
    WEB_ORIGIN: TEST_WEB_ORIGIN,
    RATE_LIMIT_STORE: "memory",
    DATABASE_URL: options.databaseUrl,
    JWT_SECRET: TEST_JWT_SECRET,
    JWT_EXPIRATION: "15m",
    JWT_REFRESH_SECRET: TEST_JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRATION: "7d",
    STORAGE_DRIVER: "local",
    LOCAL_MEDIA_ROOT: "apps/web/public/images",
  };

  Object.assign(process.env, envOverrides);

  let builder = Test.createTestingModule({
    imports: [TestAppHostModule.register(envOverrides)],
  });
  if (options.customizeBuilder) {
    builder = options.customizeBuilder(builder);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  configureApiApp(app);
  await app.init();

  return {
    app,
    close: async () => {
      await app.close();
      for (const [key, value] of previousEnv.entries()) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}

export function extractCookieValue(
  setCookieHeaders: string | string[] | undefined,
  cookieName: string,
): { rawHeader: string; value: string } | null {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : typeof setCookieHeaders === "string"
      ? [setCookieHeaders]
      : [];
  const prefix = `${cookieName}=`;
  const match = list.find((item) => item.startsWith(prefix));
  if (!match) {
    return null;
  }
  const value = match.slice(prefix.length).split(";")[0] ?? "";
  return { rawHeader: match, value };
}

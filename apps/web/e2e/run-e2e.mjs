import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import argon2 from "argon2";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webDir, "..", "..");

const E2E_DB_NAME = "vc_e2e_phase2b";
const API_URL = "http://localhost:4000/api/v1";
const WEB_URL = "http://localhost:3000";

function loadEnv() {
  const envPath = path.join(repoRoot, ".env");
  return fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath, "utf8")) : {};
}

function buildDbUrls(baseUrl) {
  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${E2E_DB_NAME}`;
  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = "/postgres";
  return {
    testDbUrl: testUrl.toString(),
    adminDbUrl: adminUrl.toString(),
  };
}

async function setupScratchDatabase(baseUrl) {
  const { testDbUrl, adminDbUrl } = buildDbUrls(baseUrl);
  const adminClient = new pg.Client({ connectionString: adminDbUrl });
  await adminClient.connect();
  try {
    await adminClient.query(`DROP DATABASE IF EXISTS "${E2E_DB_NAME}" WITH (FORCE);`);
    await adminClient.query(`CREATE DATABASE "${E2E_DB_NAME}";`);
  } finally {
    await adminClient.end();
  }

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const childEnv = {
    ...process.env,
    DATABASE_URL: testDbUrl,
    ADMIN_BOOTSTRAP_PASSWORD: "E2EBootstr@p-Init-2026!",
    NODE_ENV: "test",
    PRISMA_SEED_SKIP_DOTENV: "1",
  };

  execFileSync(pnpmCmd, ["exec", "prisma", "migrate", "deploy"], {
    cwd: repoRoot,
    env: childEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  execFileSync(pnpmCmd, ["exec", "tsx", "prisma/seed.ts"], {
    cwd: repoRoot,
    env: childEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const client = new pg.Client({ connectionString: testDbUrl });
  await client.connect();
  try {
    const hashOptions = {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    };

    const studentHash = await argon2.hash("StudentPass-2026!", hashOptions);
    const operatorHash = await argon2.hash("OperatorInit-2026!", hashOptions);
    const superHash = await argon2.hash("SuperAdmin-2026!", hashOptions);

    // 1. Activated Student participant with real EventParticipation
    const studentRes = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_student', 'Nguyen Minh Hoc Sinh', 'e2e.student@fpt.edu.vn', '+84901234001', $1, 'STUDENT', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [studentHash],
    );
    const studentId = studentRes.rows[0].id;

    const eventRes = await client.query(
      `SELECT id FROM open_day_events WHERE deleted_at IS NULL ORDER BY is_default DESC, created_at ASC LIMIT 1;`,
    );
    if (eventRes.rows.length > 0) {
      await client.query(
        `INSERT INTO event_participations (id, user_id, event_id, participation_status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'INVITED', NOW(), NOW());`,
        [studentId, eventRes.rows[0].id],
      );
    }

    // 2. First-login EVENT_OPERATOR (must_change_password = true)
    const opRes = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_operator', 'Tran Thi Dieu Phoi', 'e2e.operator@fpt.edu.vn', '+84901234002', $1, 'STAFF', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', true, NOW(), NOW())
       RETURNING id;`,
      [operatorHash],
    );
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE code = 'EVENT_OPERATOR';`,
      [opRes.rows[0].id],
    );

    // 3. Ready SUPER_ADMIN account (must_change_password = false)
    const superRes = await client.query(
      `INSERT INTO users (id, username, full_name, email, phone, password_hash, user_type, account_status, activation_status, provisioning_method, must_change_password, created_at, updated_at)
       VALUES (gen_random_uuid(), 'e2e_super', 'Le Quan Tri Vien', 'e2e.super@fpt.edu.vn', '+84901234003', $1, 'ADMIN', 'ACTIVE', 'ACTIVATED', 'ADMIN_DIRECT', false, NOW(), NOW())
       RETURNING id;`,
      [superHash],
    );
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE code = 'SUPER_ADMIN';`,
      [superRes.rows[0].id],
    );
  } finally {
    await client.end();
  }

  return { testDbUrl, adminDbUrl };
}

async function waitForHttp(url, timeoutMs = 45_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function killProcessTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === "win32" && child.pid) {
      execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // ignore cleanup errors
  }
}

async function main() {
  const fileEnv = loadEnv();
  const baseDbUrl = fileEnv.DATABASE_URL || process.env.DATABASE_URL;
  if (!baseDbUrl) {
    throw new Error("DATABASE_URL is required in .env to run E2E tests.");
  }

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  console.log("[E2E] Ensuring API and Web dist builds are up to date...");
  execFileSync(pnpmCmd, ["--filter", "api", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  execFileSync(pnpmCmd, ["--filter", "web", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  let apiProc = null;
  let webProc = null;
  const adminDbUrlToDrop = buildDbUrls(baseDbUrl).adminDbUrl;

  try {
    console.log(`[E2E] Provisioning scratch database ${E2E_DB_NAME}...`);
    const { testDbUrl } = await setupScratchDatabase(baseDbUrl);

    console.log("[E2E] Starting NestJS API server on port 4000...");
    apiProc = spawn(process.execPath, ["dist/main.js"], {
      cwd: path.join(repoRoot, "apps", "api"),
      env: {
        ...process.env,
        NODE_ENV: "development",
        API_PORT: "4000",
        WEB_ORIGIN: WEB_URL,
        RATE_LIMIT_STORE: "memory",
        DATABASE_URL: testDbUrl,
        JWT_SECRET:
          fileEnv.JWT_SECRET ||
          "e2e-jwt-secret-key-for-phase-2b-playwright-integration-001",
        JWT_EXPIRATION: "15m",
        JWT_REFRESH_SECRET:
          fileEnv.JWT_REFRESH_SECRET ||
          "e2e-jwt-refresh-secret-key-for-phase-2b-playwright-002",
        JWT_REFRESH_EXPIRATION: "7d",
        STORAGE_DRIVER: "local",
        LOCAL_MEDIA_ROOT: "apps/web/public/images",
      },
      stdio: "inherit",
    });

    await waitForHttp(`${API_URL}/health`);
    console.log("[E2E] API healthy. Starting Next.js server on port 3000...");

    const nextBin = path.join(
      repoRoot,
      "node_modules",
      "next",
      "dist",
      "bin",
      "next",
    );
    const webNextBin = fs.existsSync(nextBin)
      ? nextBin
      : path.join(webDir, "node_modules", "next", "dist", "bin", "next");

    webProc = spawn(process.execPath, [webNextBin, "start", "-p", "3000"], {
      cwd: webDir,
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
      stdio: "inherit",
    });

    await waitForHttp(`${WEB_URL}/login`);
    console.log("[E2E] Web server ready. Running Playwright suite...");

    const pwCli = path.join(
      webDir,
      "node_modules",
      "@playwright",
      "test",
      "cli.js",
    );
    execFileSync(process.execPath, [pwCli, "test"], {
      cwd: webDir,
      env: {
        ...process.env,
        E2E_DB_URL: testDbUrl,
      },
      stdio: "inherit",
    });
  } finally {
    killProcessTree(webProc);
    killProcessTree(apiProc);

    if (adminDbUrlToDrop) {
      const dropClient = new pg.Client({ connectionString: adminDbUrlToDrop });
      await dropClient.connect();
      try {
        await dropClient.query(`DROP DATABASE IF EXISTS "${E2E_DB_NAME}" WITH (FORCE);`);
      } finally {
        await dropClient.end();
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

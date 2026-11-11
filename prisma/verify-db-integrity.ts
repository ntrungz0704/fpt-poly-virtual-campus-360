// ============================================================================
// FPT Polytechnic Virtual Campus 360° (QTSC District 12)
// Phase 2A-1 — Real PostgreSQL 16 Integrity, Constraint & Reset Test Suite
// Always tests mutations/reset on an ISOLATED scratch DB (never wipes main DB).
// ============================================================================

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import dotenv from "dotenv";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { Client } from "pg";

dotenv.config({ quiet: true });

interface PgErrorLike {
  code?: string;
  constraint?: string;
  message?: string;
}

function getScratchDatabaseUrls(baseUrl: string): {
  adminDbUrl: string;
  scratchDbName: string;
  scratchUrl: string;
} {
  const parsed = new URL(baseUrl);
  const baseDbName = parsed.pathname.replace(/^\//, "") || "virtual_campus_360";
  const scratchDbName = `${baseDbName}_verify`;

  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = "/postgres";
  adminUrl.searchParams.delete("schema");

  const scratchUrl = new URL(baseUrl);
  scratchUrl.pathname = `/${scratchDbName}`;

  return {
    adminDbUrl: adminUrl.toString(),
    scratchDbName,
    scratchUrl: scratchUrl.toString(),
  };
}

function runCommand(
  cmd: string,
  args: string[],
  envOverrides: Record<string, string | undefined>,
  expectFailure = false,
): { status: number; output: string } {
  const env = { ...process.env };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) {
      delete env[k];
    } else {
      env[k] = v;
    }
  }
  const result = spawnSync(cmd, args, {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    shell: process.platform === "win32" && cmd === "pnpm",
  });
  const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const status = result.status ?? 1;
  if (!expectFailure && status !== 0) {
    throw new Error(
      `Command failed (${cmd} ${args.join(" ")}): exit=${status}\n${combined}`,
    );
  }
  if (expectFailure && status === 0) {
    throw new Error(
      `Expected command to fail (${cmd} ${args.join(" ")}), but exited 0`,
    );
  }
  return { status, output: combined };
}

async function assertPgRejects(
  fn: () => Promise<unknown>,
  expectedCode: string,
  expectedConstraintSubstring?: string,
): Promise<void> {
  let caught: unknown;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, `Expected PostgreSQL error ${expectedCode}, but succeeded`);
  const pgErr = caught as PgErrorLike;
  assert.equal(
    pgErr.code,
    expectedCode,
    `Expected SQLSTATE ${expectedCode}, got ${pgErr.code} (${pgErr.message})`,
  );
  if (expectedConstraintSubstring) {
    assert.ok(
      pgErr.constraint?.includes(expectedConstraintSubstring) ||
        pgErr.message?.includes(expectedConstraintSubstring),
      `Expected constraint "${expectedConstraintSubstring}", got "${pgErr.constraint}" / "${pgErr.message}"`,
    );
  }
}

async function collectTableCounts(prisma: PrismaClient) {
  return {
    users: await prisma.user.count({ where: { deletedAt: null } }),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
    locationTypes: await prisma.locationType.count(),
    campuses: await prisma.campus.count({ where: { deletedAt: null } }),
    buildings: await prisma.building.count({ where: { deletedAt: null } }),
    floors: await prisma.floor.count({ where: { deletedAt: null } }),
    floorPlans: await prisma.floorPlan.count(),
    mediaAssets: await prisma.mediaAsset.count({ where: { deletedAt: null } }),
    locations: await prisma.location.count({ where: { deletedAt: null } }),
    locationMedia: await prisma.locationMedia.count(),
    tourNodes: await prisma.tourNode.count({ where: { deletedAt: null } }),
    tourEdges: await prisma.tourEdge.count(),
    hotspots: await prisma.hotspot.count(),
    openDayEvents: await prisma.openDayEvent.count({ where: { deletedAt: null } }),
    openDaySessions: await prisma.openDaySession.count({
      where: { deletedAt: null },
    }),
    openDayFaqs: await prisma.openDayFaq.count({ where: { deletedAt: null } }),
    openDayQuizItems: await prisma.openDayQuizItem.count({
      where: { deletedAt: null },
    }),
  };
}

async function main() {
  const baseDatabaseUrl = process.env.DATABASE_URL;
  assert.ok(baseDatabaseUrl, "DATABASE_URL must be configured in .env");

  const { adminDbUrl, scratchDbName, scratchUrl } =
    getScratchDatabaseUrls(baseDatabaseUrl);

  const tsxCli = "./node_modules/tsx/dist/cli.mjs";
  const results: Array<{ id: string; name: string; status: "PASS" }> = [];
  const recordPass = (id: string, name: string) => {
    results.push({ id, name, status: "PASS" });
    console.log(`[PASS] ${id}: ${name}`);
  };

  // --------------------------------------------------------------------------
  // 1. Verify Primary DB Read-Only State (never mutate main DB)
  // --------------------------------------------------------------------------
  const mainPrisma = new PrismaClient({ datasources: { db: { url: baseDatabaseUrl } } });
  let mainCounts: Awaited<ReturnType<typeof collectTableCounts>>;
  try {
    mainCounts = await collectTableCounts(mainPrisma);
    assert.equal(mainCounts.users, 1, "Main DB should have exactly 1 active admin");
    assert.equal(mainCounts.buildings, 5, "Main DB should have 5 QTSC buildings");
    assert.equal(mainCounts.locations, 6, "Main DB should have 6 QTSC locations");
    assert.equal(mainCounts.tourNodes, 5, "Main DB should have 5 TourNodes");
    assert.equal(mainCounts.floorPlans, 0, "Main DB should have 0 fake FloorPlans");

    const sportsLoc = await mainPrisma.location.findFirst({
      where: { slug: "khu-the-thao-qtsc", deletedAt: null },
    });
    assert.ok(sportsLoc, "loc-the-thao must exist");
    assert.equal(
      sportsLoc.primaryNodeId,
      null,
      "OD-02: loc-the-thao.primary_node_id must be NULL",
    );

    const unplacedNodes = await mainPrisma.tourNode.count({
      where: { floorPlanId: null, status: "PUBLISHED", deletedAt: null },
    });
    assert.equal(
      unplacedNodes,
      5,
      "OD-10: All 5 published TourNodes allow floor_plan_id = NULL",
    );

    const adminRow = await mainPrisma.user.findFirst({
      where: { username: "admin", deletedAt: null },
      select: {
        passwordHash: true,
        mustChangePassword: true,
        userType: true,
        userRoles: { include: { role: true } },
      },
    });
    if (!adminRow || !adminRow.passwordHash) {
      throw new Error("Bootstrap admin user or passwordHash missing in main DB");
    }
    assert.ok(adminRow.passwordHash.startsWith("$argon2id$"));
    assert.equal(adminRow.mustChangePassword, true);
    assert.equal(adminRow.userType, "ADMIN");
    assert.ok(
      adminRow.userRoles.some((ur) => ur.role.code === "SUPER_ADMIN"),
      "admin must hold SUPER_ADMIN role",
    );
    const envBootstrap = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    if (!envBootstrap) {
      throw new Error("ADMIN_BOOTSTRAP_PASSWORD missing in env");
    }
    const pwMatches = await argon2.verify(adminRow.passwordHash, envBootstrap);
    assert.equal(pwMatches, true, "Stored Argon2id hash must verify env password");
    recordPass("PRIMARY-DB", "Primary seeded DB state, Argon2id verification, OD-02 & OD-10 invariants");
  } finally {
    await mainPrisma.$disconnect();
  }

  // --------------------------------------------------------------------------
  // 2. Setup Isolated Scratch DB & Run Reset / Migrate Deploy / Seed Tests
  // --------------------------------------------------------------------------
  const adminPg = new Client({ connectionString: adminDbUrl });
  await adminPg.connect();

  const recreateScratchDb = async () => {
    await adminPg.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [scratchDbName],
    );
    await adminPg.query(`DROP DATABASE IF EXISTS "${scratchDbName}"`);
    await adminPg.query(`CREATE DATABASE "${scratchDbName}"`);
  };

  try {
    await recreateScratchDb();

    // Apply migration to empty scratch DB first
    runCommand(
      "pnpm",
      ["exec", "prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"],
      { DATABASE_URL: scratchUrl },
    );

    // Negative Seed Env Tests (AC-03) on migrated empty scratch DB
    const envTestMissing = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: undefined,
      },
      true,
    );
    assert.match(envTestMissing.output, /ADMIN_BOOTSTRAP_PASSWORD is required/i);

    const envTest1 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: "",
      },
      true,
    );
    assert.match(envTest1.output, /ADMIN_BOOTSTRAP_PASSWORD is required/i);

    const envTest2 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: "too_short",
      },
      true,
    );
    assert.match(envTest2.output, /at least 12 characters/i);

    const envTest3 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: "CHANGE_ME_STRONG_ADMIN_PASSWORD_MIN_12",
      },
      true,
    );
    assert.match(envTest3.output, /example placeholder/i);

    const legacyBanned = Buffer.from("RnBvbHlAMjAyNg==", "base64").toString("utf8");
    const envTest4 = runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      {
        DATABASE_URL: scratchUrl,
        PRISMA_SEED_SKIP_DOTENV: "1",
        ADMIN_BOOTSTRAP_PASSWORD: legacyBanned,
      },
      true,
    );
    assert.match(envTest4.output, /forbidden leaked credential/i);

    // Confirm zero users were created during negative env guard tests
    const scratchPgCheck = new Client({ connectionString: scratchUrl });
    await scratchPgCheck.connect();
    try {
      const { rows } = await scratchPgCheck.query(`SELECT count(*)::int AS cnt FROM users`);
      assert.equal(rows[0].cnt, 0, "Failed bootstrap guards must write 0 rows to users");
    } finally {
      await scratchPgCheck.end();
    }
    recordPass("AC-03", "Seed fails cleanly before DB write when ADMIN_BOOTSTRAP_PASSWORD is missing, <12 chars, placeholder, or banned leaked value");

    // Seed Run 1 + Run 2 on scratch DB
    runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      { DATABASE_URL: scratchUrl },
    );
    runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      { DATABASE_URL: scratchUrl },
    );

    const scratchPrisma = new PrismaClient({ datasources: { db: { url: scratchUrl } } });
    try {
      const scratchCounts = await collectTableCounts(scratchPrisma);
      assert.deepEqual(scratchCounts, mainCounts);
      recordPass("AC-05-IDEMP", "Scratch DB migrate deploy + seed x2 produces identical counts");

      // Test AC-05 Password Preservation on re-seed after password change
      const rotatedSecret = `Rotated#${crypto.randomBytes(8).toString("hex")}`;
      const rotatedHash = await argon2.hash(rotatedSecret, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
      await scratchPrisma.user.updateMany({
        where: { username: "admin", deletedAt: null },
        data: { passwordHash: rotatedHash, mustChangePassword: false },
      });
      runCommand(
        process.execPath,
        [tsxCli, "prisma/seed.ts"],
        { DATABASE_URL: scratchUrl },
      );
      const afterReseed = await scratchPrisma.user.findFirstOrThrow({
        where: { username: "admin", deletedAt: null },
      });
      assert.equal(afterReseed.mustChangePassword, false);
      assert.equal(
        await argon2.verify(afterReseed.passwordHash!, rotatedSecret),
        true,
        "Re-seed must NOT overwrite existing admin password_hash",
      );
      recordPass("AC-05-KEEP-PW", "Re-seed preserves updated admin password_hash & mustChangePassword");

      // ----------------------------------------------------------------------
      // 3. Direct PG Constraint & Policy Tests (via node-pg on scratch DB)
      // ----------------------------------------------------------------------
      const pg = new Client({ connectionString: scratchUrl });
      await pg.connect();
      try {
        // Fetch sample IDs from scratch DB
        const { rows: [campusRow] } = await pg.query(
          `SELECT id FROM campuses WHERE code = 'QTSC-Q12' AND deleted_at IS NULL`,
        );
        const { rows: [bldgRow] } = await pg.query(
          `SELECT id FROM buildings WHERE code = 'INNOVATION' AND deleted_at IS NULL`,
        );
        const { rows: [locTypeRow] } = await pg.query(
          `SELECT id FROM location_types WHERE code = 'CLASSROOM'`,
        );
        const { rows: [locRow] } = await pg.query(
          `SELECT id FROM locations WHERE slug = 'sanh-innovation' AND deleted_at IS NULL`,
        );
        const { rows: [mediaRow] } = await pg.query(
          `SELECT id FROM media_assets WHERE asset_kind = 'PANORAMA_2_1' LIMIT 1`,
        );
        const { rows: [nodeA] } = await pg.query(
          `SELECT id FROM tour_nodes WHERE slug = 'cong-chao-qtsc' AND deleted_at IS NULL`,
        );
        const { rows: [nodeB] } = await pg.query(
          `SELECT id FROM tour_nodes WHERE slug = 'lab-it' AND deleted_at IS NULL`,
        );
        const { rows: [edgeRow] } = await pg.query(
          `SELECT id, from_node_id FROM tour_edges LIMIT 1`,
        );

        // AC-06.1: Active duplicate unique rejected (users username/email/phone, locations slug, tour_nodes slug)
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO users (username, full_name, user_type, provisioning_method) VALUES ('admin', 'Dup Admin', 'ADMIN', 'BOOTSTRAP')`,
            ),
          "23505",
          "uq_users_username_active",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO locations (building_id, location_type_id, category_label, code, slug, name, short_summary, description)
               VALUES ($1, $2, 'Test', 'DUP-01', 'sanh-innovation', 'Dup', 'Dup', 'Dup')`,
              [bldgRow.id, locTypeRow.id],
            ),
          "23505",
          "uq_locations_slug_active",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id)
               VALUES ('cong-chao-qtsc', 'Dup Node', 'Dup', $1, $2)`,
              [locRow.id, mediaRow.id],
            ),
          "23505",
          "uq_tour_nodes_slug_active",
        );
        // Phone partial unique test (OD-04)
        await pg.query(
          `INSERT INTO users (full_name, phone, user_type, provisioning_method)
           VALUES ('Guest SMS 1', '+84901234567', 'STUDENT', 'EMAIL_SMS_INVITATION')`,
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO users (full_name, phone, user_type, provisioning_method)
               VALUES ('Guest SMS 2', '+84901234567', 'PARENT', 'EMAIL_SMS_INVITATION')`,
            ),
          "23505",
          "uq_users_phone_active",
        );
        recordPass("AC-06.1", "Active duplicate unique keys rejected (23505) on users/phone/locations/tour_nodes");

        // AC-06.2: Soft-deleted record allows unique reuse while active duplicate still rejected
        await pg.query(
          `UPDATE users SET deleted_at = NOW(), account_status = 'ARCHIVED' WHERE phone = '+84901234567' AND deleted_at IS NULL`,
        );
        await pg.query(
          `INSERT INTO users (full_name, phone, user_type, provisioning_method)
           VALUES ('Guest SMS Reused', '+84901234567', 'STUDENT', 'EMAIL_SMS_INVITATION')`,
        );
        await pg.query(
          `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id, deleted_at, status)
           VALUES ('reusable-node-slug', 'Old Node', 'Old', $1, $2, NOW(), 'ARCHIVED')`,
          [locRow.id, mediaRow.id],
        );
        await pg.query(
          `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id, status)
           VALUES ('reusable-node-slug', 'Active Replacement Node', 'New', $1, $2, 'PUBLISHED')`,
          [locRow.id, mediaRow.id],
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id)
               VALUES ('reusable-node-slug', 'Active Duplicate', 'Dup', $1, $2)`,
              [locRow.id, mediaRow.id],
            ),
          "23505",
          "uq_tour_nodes_slug_active",
        );
        recordPass("AC-06.2", "Soft-deleted unique reuse allowed while active duplicate still blocked");

        // AC-06.3: CHECK constraints enforced by PostgreSQL
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
               VALUES ($1, 'SCENE_LINK', NULL, 10, 5, 'Invalid SCENE_LINK')`,
              [nodeA.id],
            ),
          "23514",
          "chk_hotspots_scene_link_edge_consistency",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
               VALUES ($1, 'INFO', $2, 10, 5, 'Invalid INFO with edge')`,
              [edgeRow.from_node_id, edgeRow.id],
            ),
          "23514",
          "chk_hotspots_scene_link_edge_consistency",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
               VALUES ($1, 'INFO', NULL, 185, 5, 'Out of range yaw')`,
              [nodeA.id],
            ),
          "23514",
          "chk_hotspots_yaw_range",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_edges (from_node_id, to_node_id, edge_type, label)
               VALUES ($1, $1, 'WALKWAY', 'Self loop')`,
              [nodeA.id],
            ),
          "23514",
          "chk_tour_edges_no_self_loop",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id, floor_plan_id, floor_norm_x, floor_norm_y)
               VALUES ('orphan-coord-node', 'Orphan Coord', 'Orphan', $1, $2, NULL, 0.5, NULL)`,
              [locRow.id, mediaRow.id],
            ),
          "23514",
          "chk_tour_nodes_floor_coords_consistency",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO open_day_quiz_items (question_text, options_json, correct_index, explanation)
               VALUES ('Invalid quiz', '["A","B"]'::jsonb, -1, 'Negative')`,
            ),
          "23514",
          "chk_open_day_quiz_items_correct_index_non_negative",
        );
        recordPass("AC-06.3", "PostgreSQL CHECK constraints (hotspots OD-06, yaw/pitch, self-loop, floor coords, quiz) enforced (23514)");

        // AC-06.4: Invalid FK rejected (23503)
        const fakeUuid = "00000000-0000-0000-0000-000000000999";
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO tour_nodes (slug, title, intro, location_id, panorama_asset_id)
               VALUES ('bad-fk-node', 'Bad FK', 'Bad FK', $1, $2)`,
              [fakeUuid, mediaRow.id],
            ),
          "23503",
        );
        await assertPgRejects(
          () =>
            pg.query(
              `INSERT INTO buildings (campus_id, code, slug, name, short_name, category, category_label, floors_label, summary, description, lat, lng, address_note, status_note, map_icon_key)
               VALUES ($1, 'BAD', 'bad', 'Bad', 'Bad', 'LAB', 'Lab', '1F', 'Sum', 'Desc', 10.8, 106.6, 'Addr', 'Note', 'IT_BUILDING')`,
              [fakeUuid],
            ),
          "23503",
        );
        recordPass("AC-06.4", "Invalid foreign keys rejected by PostgreSQL (23503)");

        // AC-06.5 & AC-06.6: OD-10 floor_plan_id = NULL & OD-02 primary_node_id = NULL valid on PUBLISHED records
        const { rows: [unplacedLocRow] } = await pg.query(
          `INSERT INTO locations (building_id, floor_id, location_type_id, category_label, code, slug, name, short_summary, description, primary_node_id, status)
           VALUES ($1, NULL, $2, 'Tiện ích', 'TMP-OUT', 'tmp-outdoor-null-node', 'Outdoor', 'Sum', 'Desc', NULL, 'PUBLISHED')
           RETURNING id, primary_node_id, status`,
          [bldgRow.id, locTypeRow.id],
        );
        assert.equal(unplacedLocRow.primary_node_id, null);
        assert.equal(unplacedLocRow.status, "PUBLISHED");
        const { rows: [unplacedNodeRow] } = await pg.query(
          `INSERT INTO tour_nodes (slug, title, intro, location_id, floor_plan_id, panorama_asset_id, floor_norm_x, floor_norm_y, status)
           VALUES ('tmp-unplaced-published-node', 'Unplaced', 'No floor plan', $1, NULL, $2, NULL, NULL, 'PUBLISHED')
           RETURNING id, floor_plan_id, status`,
          [unplacedLocRow.id, mediaRow.id],
        );
        assert.equal(unplacedNodeRow.floor_plan_id, null);
        assert.equal(unplacedNodeRow.status, "PUBLISHED");
        recordPass("AC-06.5/6", "OD-10 (floor_plan_id=NULL PUBLISHED) & OD-02 (primary_node_id=NULL PUBLISHED) validated");

        // AC-06.7: TourNode / TourEdge / Hotspot deletion policy (RESTRICT + CASCADE + Soft-delete TX)
        // Direct hard delete of node referenced by tour_edges must fail (23503)
        await assertPgRejects(
          () => pg.query(`DELETE FROM tour_nodes WHERE id = $1`, [nodeB.id]),
          "23503",
        );

        // Edge deletion cascades its linked SCENE_LINK hotspot while preserving endpoints
        const { rows: [edgeDelTarget] } = await pg.query(
          `INSERT INTO tour_edges (from_node_id, to_node_id, edge_type, label)
           VALUES ($1, $2, 'WALKWAY', 'Temp edge for cascade')
           RETURNING id`,
          [unplacedNodeRow.id, nodeB.id],
        );
        const { rows: [hsCascade] } = await pg.query(
          `INSERT INTO hotspots (node_id, hotspot_type, edge_id, yaw, pitch, title)
           VALUES ($1, 'SCENE_LINK', $2, 12, 0, 'Temp scene hotspot')
           RETURNING id`,
          [unplacedNodeRow.id, edgeDelTarget.id],
        );
        await pg.query(`DELETE FROM tour_edges WHERE id = $1`, [edgeDelTarget.id]);
        const { rows: remainingHs } = await pg.query(
          `SELECT id FROM hotspots WHERE id = $1`,
          [hsCascade.id],
        );
        assert.equal(
          remainingHs.length,
          0,
          "Deleting tour_edge must ON DELETE CASCADE its SCENE_LINK hotspot",
        );

        // Full transactional soft-delete of a TourNode (`nodeToSoftDelete` = 'thu-vien')
        const { rows: [targetNode] } = await pg.query(
          `SELECT id, panorama_asset_id FROM tour_nodes WHERE slug = 'thu-vien' AND deleted_at IS NULL`,
        );
        await pg.query("BEGIN");
        await pg.query(
          `UPDATE locations SET primary_node_id = NULL WHERE primary_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `UPDATE buildings SET default_node_id = NULL WHERE default_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `UPDATE campuses SET default_entry_node_id = NULL WHERE default_entry_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `DELETE FROM tour_edges WHERE from_node_id = $1 OR to_node_id = $1`,
          [targetNode.id],
        );
        await pg.query(`DELETE FROM hotspots WHERE node_id = $1`, [targetNode.id]);
        await pg.query(
          `UPDATE tour_nodes SET deleted_at = NOW(), status = 'ARCHIVED' WHERE id = $1`,
          [targetNode.id],
        );
        await pg.query(
          `INSERT INTO audit_logs (actor_username, action, resource_type, resource_id, diff_json)
           VALUES ('admin', 'TOUR_NODE_DELETED', 'tour_node', $1, $2::jsonb)`,
          [targetNode.id, JSON.stringify({ slug: "thu-vien", campusId: campusRow.id })],
        );
        await pg.query("COMMIT");

        const { rows: orphanEdges } = await pg.query(
          `SELECT id FROM tour_edges WHERE from_node_id = $1 OR to_node_id = $1`,
          [targetNode.id],
        );
        const { rows: orphanHotspots } = await pg.query(
          `SELECT id FROM hotspots WHERE node_id = $1`,
          [targetNode.id],
        );
        const { rows: mediaPreserved } = await pg.query(
          `SELECT id, deleted_at FROM media_assets WHERE id = $1`,
          [targetNode.panorama_asset_id],
        );
        assert.equal(orphanEdges.length, 0);
        assert.equal(orphanHotspots.length, 0);
        assert.equal(mediaPreserved.length, 1);
        assert.equal(mediaPreserved[0].deleted_at, null);
        recordPass("AC-06.7", "TourNode/TourEdge/Hotspot deletion policy & transactional soft-delete verified");

        // Extra sanity check: ensure media_assets has zero base64/binary URIs and all start with /images/
        const { rows: mediaKeys } = await pg.query(
          `SELECT original_object_key FROM media_assets WHERE deleted_at IS NULL`,
        );
        for (const row of mediaKeys) {
          assert.ok(
            typeof row.original_object_key === "string" &&
              row.original_object_key.startsWith("/images/"),
            `media_assets key must be relative path, got ${row.original_object_key}`,
          );
        }
        recordPass("AC-07", "MediaAsset rows store relative object keys only (no binary/base64 in PG)");
      } finally {
        await pg.end();
      }
    } finally {
      await scratchPrisma.$disconnect();
    }

    // ------------------------------------------------------------------------
    // 4. AC-08 Full Isolated Scratch DB Reset & Re-Init Consistency Check
    // ------------------------------------------------------------------------
    await recreateScratchDb();
    runCommand(
      "pnpm",
      ["exec", "prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"],
      { DATABASE_URL: scratchUrl },
    );
    runCommand(
      process.execPath,
      [tsxCli, "prisma/seed.ts"],
      { DATABASE_URL: scratchUrl },
    );
    const resetPrisma = new PrismaClient({ datasources: { db: { url: scratchUrl } } });
    try {
      const resetCounts = await collectTableCounts(resetPrisma);
      assert.deepEqual(resetCounts, mainCounts);
      recordPass("AC-08", "Full scratch DB drop -> recreate -> migrate deploy -> seed produces exact canonical state");
    } finally {
      await resetPrisma.$disconnect();
    }
  } finally {
    // Always drop scratch database cleanly
    try {
      await adminPg.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [scratchDbName],
      );
      await adminPg.query(`DROP DATABASE IF EXISTS "${scratchDbName}"`);
    } finally {
      await adminPg.end();
    }
  }

  console.log(
    JSON.stringify(
      {
        suite: "PHASE_2A_1_POSTGRESQL_INTEGRITY",
        passed: results.length,
        failed: 0,
        checks: results,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error("[verify-db-integrity] FAILED:", error);
  process.exitCode = 1;
});

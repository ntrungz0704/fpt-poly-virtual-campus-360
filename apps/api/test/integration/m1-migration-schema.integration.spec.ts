import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import {
  provisionScratchDatabase,
  type ScratchDbHandle,
} from "./test-db.helper";

interface PgErrorShape {
  code?: string;
  constraint?: string;
  message?: string;
}

async function expectPgError(
  fn: () => Promise<unknown>,
  expectedCode: string,
  expectedMessageOrConstraint?: string,
): Promise<void> {
  let caught: PgErrorShape | undefined;
  try {
    await fn();
  } catch (err) {
    caught = err as PgErrorShape;
  }
  expect(caught).toBeDefined();
  expect(caught?.code).toBe(expectedCode);
  if (expectedMessageOrConstraint) {
    const combined = `${caught?.constraint ?? ""} ${caught?.message ?? ""}`;
    expect(combined).toContain(expectedMessageOrConstraint);
  }
}

describe("M1 Migration, Preflight & UploadToken Schema Integration", () => {
  let m1Handle: ScratchDbHandle;
  let pgClient: Client;
  let preflightSql: string;
  let m1MigrationSql: string;
  let initMigrationSql: string;

  beforeAll(async () => {
    m1Handle = await provisionScratchDatabase("m1_schema");
    pgClient = new Client({ connectionString: m1Handle.testDbUrl });
    await pgClient.connect();

    initMigrationSql = fs.readFileSync(
      path.join(
        m1Handle.monorepoRoot,
        "prisma/migrations/20261111175635_init/migration.sql",
      ),
      "utf8",
    );
    m1MigrationSql = fs.readFileSync(
      path.join(
        m1Handle.monorepoRoot,
        "prisma/migrations/20261112000001_m1_quiz_event_upload_tokens/migration.sql",
      ),
      "utf8",
    );
    preflightSql = fs
      .readFileSync(
        path.join(m1Handle.monorepoRoot, "prisma/preflight-m1-quiz-event.sql"),
        "utf8",
      )
      .replace(/;\s*$/, "");
  }, 60000);

  afterAll(async () => {
    await pgClient?.end().catch(() => undefined);
    await m1Handle?.drop();
  });

  async function withIsolatedPreM1Db(
    suffix: string,
    fn: (client: Client) => Promise<void>,
  ): Promise<void> {
    const dbName = `vc_api_test_prem1_${suffix}`.slice(0, 60);
    const adminPg = new Client({ connectionString: m1Handle.adminDbUrl });
    await adminPg.connect();
    try {
      await adminPg.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE);`);
      await adminPg.query(`CREATE DATABASE "${dbName}";`);

      const parsed = new URL(m1Handle.testDbUrl);
      parsed.pathname = `/${dbName}`;
      const dbClient = new Client({ connectionString: parsed.toString() });
      await dbClient.connect();
      try {
        await dbClient.query(initMigrationSql);
        await fn(dbClient);
      } finally {
        await dbClient.end().catch(() => undefined);
      }
    } finally {
      await adminPg
        .query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE);`)
        .catch(() => undefined);
      await adminPg.end().catch(() => undefined);
    }
  }

  async function seedTwoCampusPreM1Fixture(client: Client): Promise<{
    campusAId: string;
    campusBId: string;
    nodeAId: string;
    nodeBId: string;
    eventAId: string;
    eventBId: string;
  }> {
    const {
      rows: [locType],
    } = await client.query<{ id: string }>(
      `INSERT INTO "location_types" ("code", "filter_group", "label", "icon_name") VALUES ('LAB', 'lab', 'Lab', 'cpu') RETURNING "id"`,
    );
    const {
      rows: [uploader],
    } = await client.query<{ id: string }>(
      `INSERT INTO "users" ("username", "full_name", "user_type", "provisioning_method") VALUES ('m1probe', 'M1 Probe', 'ADMIN', 'BOOTSTRAP') RETURNING "id"`,
    );
    const {
      rows: [media],
    } = await client.query<{ id: string }>(
      `INSERT INTO "media_assets" ("asset_kind", "original_filename", "mime_type", "file_size_bytes", "sha256_checksum", "original_width", "original_height", "original_object_key", "uploaded_by")
       VALUES ('PANORAMA_2_1', 'probe.jpg', 'image/jpeg', 1000, repeat('a', 64), 2048, 1024, 'probe.jpg', $1)
       RETURNING "id"`,
      [uploader.id],
    );
    const {
      rows: [campusA],
    } = await client.query<{ id: string }>(
      `INSERT INTO "campuses" ("code", "name", "address", "origin_point_json") VALUES ('CAMP-A', 'Campus A', 'Addr A', '{}'::jsonb) RETURNING "id"`,
    );
    const {
      rows: [campusB],
    } = await client.query<{ id: string }>(
      `INSERT INTO "campuses" ("code", "name", "address", "origin_point_json") VALUES ('CAMP-B', 'Campus B', 'Addr B', '{}'::jsonb) RETURNING "id"`,
    );
    const {
      rows: [bldgA],
    } = await client.query<{ id: string }>(
      `INSERT INTO "buildings" ("campus_id", "code", "slug", "name", "short_name", "category", "category_label", "floors_label", "summary", "description", "lat", "lng", "address_note", "status_note", "map_icon_key")
       VALUES ($1, 'BA', 'ba', 'Bldg A', 'BA', 'LAB', 'Lab', '1F', 'S', 'D', 10.8, 106.6, 'A', 'N', 'IT_BUILDING') RETURNING "id"`,
      [campusA.id],
    );
    const {
      rows: [bldgB],
    } = await client.query<{ id: string }>(
      `INSERT INTO "buildings" ("campus_id", "code", "slug", "name", "short_name", "category", "category_label", "floors_label", "summary", "description", "lat", "lng", "address_note", "status_note", "map_icon_key")
       VALUES ($1, 'BB', 'bb', 'Bldg B', 'BB', 'LAB', 'Lab', '1F', 'S', 'D', 10.8, 106.6, 'B', 'N', 'IT_BUILDING') RETURNING "id"`,
      [campusB.id],
    );
    const {
      rows: [locA],
    } = await client.query<{ id: string }>(
      `INSERT INTO "locations" ("building_id", "location_type_id", "category_label", "code", "slug", "name", "short_summary", "description")
       VALUES ($1, $2, 'Lab', 'LA', 'la', 'Loc A', 'S', 'D') RETURNING "id"`,
      [bldgA.id, locType.id],
    );
    const {
      rows: [locB],
    } = await client.query<{ id: string }>(
      `INSERT INTO "locations" ("building_id", "location_type_id", "category_label", "code", "slug", "name", "short_summary", "description")
       VALUES ($1, $2, 'Lab', 'LB', 'lb', 'Loc B', 'S', 'D') RETURNING "id"`,
      [bldgB.id, locType.id],
    );
    const {
      rows: [nodeA],
    } = await client.query<{ id: string }>(
      `INSERT INTO "tour_nodes" ("slug", "title", "intro", "location_id", "panorama_asset_id")
       VALUES ('node-a', 'Node A', 'Intro A', $1, $2) RETURNING "id"`,
      [locA.id, media.id],
    );
    const {
      rows: [nodeB],
    } = await client.query<{ id: string }>(
      `INSERT INTO "tour_nodes" ("slug", "title", "intro", "location_id", "panorama_asset_id")
       VALUES ('node-b', 'Node B', 'Intro B', $1, $2) RETURNING "id"`,
      [locB.id, media.id],
    );
    const {
      rows: [eventA],
    } = await client.query<{ id: string }>(
      `INSERT INTO "open_day_events" ("campus_id", "event_key", "title", "date_label", "time_label", "status")
       VALUES ($1, 'evt-a', 'Event A', 'D', 'T', 'PUBLISHED') RETURNING "id"`,
      [campusA.id],
    );
    const {
      rows: [eventB],
    } = await client.query<{ id: string }>(
      `INSERT INTO "open_day_events" ("campus_id", "event_key", "title", "date_label", "time_label", "status")
       VALUES ($1, 'evt-b', 'Event B', 'D', 'T', 'PUBLISHED') RETURNING "id"`,
      [campusB.id],
    );

    return {
      campusAId: campusA.id,
      campusBId: campusB.id,
      nodeAId: nodeA.id,
      nodeBId: nodeB.id,
      eventAId: eventA.id,
      eventBId: eventB.id,
    };
  }

  it("M1-C & M1-A schema, catalog columns, indexes, and PostgreSQL constraints match spec", async () => {
    const { rows: fpCols } = await pgClient.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'floor_plans'`,
    );
    expect(fpCols).toHaveLength(17);
    expect(fpCols.some((r) => r.column_name === "deleted_at")).toBe(false);

    const { rows: utCols } = await pgClient.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'upload_tokens'`,
    );
    expect(utCols.some((r) => r.column_name === "consumed_by_ip")).toBe(false);
    expect(utCols.map((r) => r.column_name)).toEqual(
      expect.arrayContaining([
        "id",
        "jti",
        "subject_user_id",
        "target_type",
        "media_asset_id",
        "floor_plan_id",
        "object_key",
        "expected_mime_type",
        "max_size_bytes",
        "expires_at",
        "used_at",
        "revoked_at",
        "created_at",
      ]),
    );

    const { rows: quizNulls } = await pgClient.query<{ cnt: number }>(
      `SELECT COUNT(*)::int AS cnt FROM "open_day_quiz_items" WHERE "event_id" IS NULL`,
    );
    expect(quizNulls[0].cnt).toBe(0);

    const {
      rows: [adminUser],
    } = await pgClient.query<{ id: string }>(
      `SELECT id FROM "users" WHERE "username" = 'admin' AND "deleted_at" IS NULL`,
    );
    const {
      rows: [mediaRow],
    } = await pgClient.query<{ id: string }>(
      `SELECT id FROM "media_assets" WHERE "deleted_at" IS NULL LIMIT 1`,
    );
    const {
      rows: [floorRow],
    } = await pgClient.query<{ id: string }>(
      `SELECT id FROM "floors" WHERE "deleted_at" IS NULL LIMIT 1`,
    );
    const {
      rows: [eventRow],
    } = await pgClient.query<{ id: string }>(
      `SELECT id FROM "open_day_events" WHERE "deleted_at" IS NULL LIMIT 1`,
    );

    // open_day_quiz_items.event_id NOT NULL + ON DELETE RESTRICT
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "open_day_quiz_items" ("question_text", "options_json", "correct_index", "explanation")
           VALUES ('Missing event', '["A","B"]'::jsonb, 0, 'Null FK')`,
        ),
      "23502",
    );
    await expectPgError(
      () =>
        pgClient.query(`DELETE FROM "open_day_events" WHERE "id" = $1`, [
          eventRow.id,
        ]),
      "23503",
    );

    // Valid MEDIA_ASSET & FLOOR_PLAN UploadToken inserts + constraint checks
    const jtiMedia = crypto.randomUUID();
    const {
      rows: [tokMedia],
    } = await pgClient.query<{ id: string }>(
      `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
       VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/test.jpg', 'image/jpeg', 1048576, NOW() + INTERVAL '10 minutes')
       RETURNING "id"`,
      [jtiMedia, adminUser.id, mediaRow.id],
    );

    const {
      rows: [tempFloorPlan],
    } = await pgClient.query<{ id: string }>(
      `INSERT INTO "floor_plans" ("floor_id", "version", "source_format", "source_object_key", "uploaded_by")
       VALUES ($1, 99, 'PNG', 'source/fp-temp.png', $2) RETURNING "id"`,
      [floorRow.id, adminUser.id],
    );
    const {
      rows: [tokFloorPlan],
    } = await pgClient.query<{ id: string }>(
      `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
       VALUES ($1, $2, 'FLOOR_PLAN', NULL, $3, 'source/fp.png', 'image/png', 2048, NOW() + INTERVAL '10 minutes')
       RETURNING "id"`,
      [crypto.randomUUID(), adminUser.id, tempFloorPlan.id],
    );

    // Duplicate jti
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
           VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/dup.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '10 minutes')`,
          [jtiMedia, adminUser.id, mediaRow.id],
        ),
      "23505",
      "upload_tokens_jti_key",
    );

    // XOR: both null
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
           VALUES ($1, $2, 'MEDIA_ASSET', NULL, NULL, 'source/null.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '10 minutes')`,
          [crypto.randomUUID(), adminUser.id],
        ),
      "23514",
      "chk_upload_tokens_single_typed_target",
    );

    // XOR: both non-null
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
           VALUES ($1, $2, 'MEDIA_ASSET', $3, $4, 'source/both.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '10 minutes')`,
          [crypto.randomUUID(), adminUser.id, mediaRow.id, tempFloorPlan.id],
        ),
      "23514",
      "chk_upload_tokens_single_typed_target",
    );

    // XOR: mismatched type/FK
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
           VALUES ($1, $2, 'FLOOR_PLAN', $3, NULL, 'source/mis.jpg', 'image/png', 1024, NOW() + INTERVAL '10 minutes')`,
          [crypto.randomUUID(), adminUser.id, mediaRow.id],
        ),
      "23514",
      "chk_upload_tokens_single_typed_target",
    );

    // Positive max_size_bytes check
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
           VALUES ($1, $2, 'MEDIA_ASSET', $3, NULL, 'source/zero.jpg', 'image/jpeg', 0, NOW() + INTERVAL '10 minutes')`,
          [crypto.randomUUID(), adminUser.id, mediaRow.id],
        ),
      "23514",
      "chk_upload_tokens_max_size_positive",
    );

    // Invalid FK
    await expectPgError(
      () =>
        pgClient.query(
          `INSERT INTO "upload_tokens" ("jti", "subject_user_id", "target_type", "media_asset_id", "floor_plan_id", "object_key", "expected_mime_type", "max_size_bytes", "expires_at")
           VALUES ($1, $2, 'MEDIA_ASSET', '00000000-0000-0000-0000-000000000999', NULL, 'source/badfk.jpg', 'image/jpeg', 1024, NOW() + INTERVAL '10 minutes')`,
          [crypto.randomUUID(), adminUser.id],
        ),
      "23503",
    );

    await pgClient.query(`DELETE FROM "upload_tokens" WHERE "id" IN ($1, $2)`, [
      tokMedia.id,
      tokFloorPlan.id,
    ]);
    await pgClient.query(`DELETE FROM "floor_plans" WHERE "id" = $1`, [
      tempFloorPlan.id,
    ]);
  });

  it("BLK-B1 & BLK-B2 negative preflight/migration cases fail closed and roll back atomically", async () => {
    await withIsolatedPreM1Db("neg_null_node", async (db) => {
      await seedTwoCampusPreM1Fixture(db);
      await db.query(
        `INSERT INTO "open_day_quiz_items" ("tour_node_id", "question_text", "options_json", "correct_index", "explanation", "sort_order", "status")
         VALUES (NULL, 'No node', '["A","B"]'::jsonb, 0, 'E', 1, 'DRAFT')`,
      );
      const pre = await db.query<{
        final_resolution_status: string;
        resolution_tier_or_reason: string;
      }>(preflightSql);
      expect(pre.rows[0].final_resolution_status).toBe("UNRESOLVED");
      expect(pre.rows[0].resolution_tier_or_reason).toBe(
        "NULL_TOUR_NODE_NO_LINEAGE",
      );

      await db.query("BEGIN");
      await expectPgError(
        () => db.query(m1MigrationSql),
        "P0001",
        "MIGRATION_ABORT_NULL_QUIZ_EVENT_ID",
      );
      await db.query("ROLLBACK");

      const afterCol = await db.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'open_day_quiz_items' AND column_name = 'event_id'`,
      );
      expect(afterCol.rows).toHaveLength(0);
    });

    await withIsolatedPreM1Db("neg_hist_cross_campus", async (db) => {
      const fx = await seedTwoCampusPreM1Fixture(db);
      await db.query(
        `INSERT INTO "open_day_sessions" ("event_id", "campus_id", "tour_node_id", "title", "session_period", "start_time_label", "end_time_label", "time_range_label", "custom_location_label", "host_unit", "description", "deleted_at")
         VALUES ($1, $2, $3, 'Deleted cross campus', 'MORNING', '08:00', '09:00', '08:00-09:00', 'Lab', 'IT', 'Desc', NOW())`,
        [fx.eventBId, fx.campusBId, fx.nodeAId],
      );
      await db.query(
        `INSERT INTO "open_day_quiz_items" ("tour_node_id", "question_text", "options_json", "correct_index", "explanation", "sort_order", "status")
         VALUES ($1, 'Cross campus quiz', '["A","B"]'::jsonb, 0, 'E', 1, 'PUBLISHED')`,
        [fx.nodeAId],
      );

      const pre = await db.query<{
        final_resolution_status: string;
        resolution_tier_or_reason: string;
        cross_campus_historical_mismatch_cnt: number;
      }>(preflightSql);
      expect(pre.rows[0].cross_campus_historical_mismatch_cnt).toBe(1);
      expect(pre.rows[0].final_resolution_status).toBe("UNRESOLVED");
      expect(pre.rows[0].resolution_tier_or_reason).toBe(
        "CROSS_CAMPUS_MISMATCH",
      );

      await db.query("BEGIN");
      await expectPgError(
        () => db.query(m1MigrationSql),
        "P0001",
        "MIGRATION_ABORT_CROSS_CAMPUS_MISMATCH",
      );
      await db.query("ROLLBACK");
    });

    await withIsolatedPreM1Db("pos_multi_campus", async (db) => {
      const fx = await seedTwoCampusPreM1Fixture(db);
      const {
        rows: [qA],
      } = await db.query<{ id: string }>(
        `INSERT INTO "open_day_quiz_items" ("tour_node_id", "question_text", "options_json", "correct_index", "explanation", "sort_order", "status")
         VALUES ($1, 'Quiz A', '["A","B"]'::jsonb, 0, 'E', 1, 'PUBLISHED') RETURNING "id"`,
        [fx.nodeAId],
      );
      const {
        rows: [qB],
      } = await db.query<{ id: string }>(
        `INSERT INTO "open_day_quiz_items" ("tour_node_id", "question_text", "options_json", "correct_index", "explanation", "sort_order", "status")
         VALUES ($1, 'Quiz B', '["A","B"]'::jsonb, 1, 'E', 2, 'PUBLISHED') RETURNING "id"`,
        [fx.nodeBId],
      );

      const pre = await db.query<{
        quiz_id: string;
        final_resolution_status: string;
        resolved_event_id: string;
        resolution_tier_or_reason: string;
      }>(preflightSql);
      expect(pre.rows).toHaveLength(2);
      expect(pre.rows[0]).toEqual(
        expect.objectContaining({
          quiz_id: qA.id,
          final_resolution_status: "RESOLVED",
          resolved_event_id: fx.eventAId,
          resolution_tier_or_reason: "R2_CAMPUS",
        }),
      );
      expect(pre.rows[1]).toEqual(
        expect.objectContaining({
          quiz_id: qB.id,
          final_resolution_status: "RESOLVED",
          resolved_event_id: fx.eventBId,
          resolution_tier_or_reason: "R2_CAMPUS",
        }),
      );

      await db.query("BEGIN");
      await db.query(m1MigrationSql);
      await db.query("COMMIT");

      const { rows: mapped } = await db.query<{
        id: string;
        event_id: string;
      }>(`SELECT id, event_id FROM "open_day_quiz_items" ORDER BY sort_order`);
      expect(mapped).toEqual([
        { id: qA.id, event_id: fx.eventAId },
        { id: qB.id, event_id: fx.eventBId },
      ]);
    });
  }, 60000);
});

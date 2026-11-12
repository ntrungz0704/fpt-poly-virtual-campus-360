-- Milestone M1-A & M1-C Migration:
--   1. Backfill & enforce open_day_quiz_items.event_id (NOT NULL + ON DELETE RESTRICT)
--   2. Add UploadTargetType enum & upload_tokens table (atomic jti tracking for M3/M4)
-- Verified fail-closed across BLK-B1 (no R3 default fallback) & BLK-B2 (historical cross-campus mismatch check).

ALTER TABLE "open_day_quiz_items"
  ADD COLUMN "event_id" UUID;

CREATE INDEX "idx_open_day_quiz_items_event_id"
  ON "open_day_quiz_items"("event_id");

WITH quiz_lineage AS (
  SELECT
    q."id" AS quiz_id,
    q."tour_node_id",
    q."deleted_at" AS quiz_deleted_at,
    c."id" AS node_campus_id,
    (q."tour_node_id" IS NULL) AS null_tour_node,
    (q."tour_node_id" IS NOT NULL AND (tn."id" IS NULL OR l."id" IS NULL OR b."id" IS NULL OR c."id" IS NULL)) AS missing_campus_lineage,
    (q."deleted_at" IS NULL AND q."tour_node_id" IS NOT NULL AND (
      tn."deleted_at" IS NOT NULL OR l."deleted_at" IS NOT NULL OR b."deleted_at" IS NOT NULL OR c."deleted_at" IS NOT NULL
    )) AS has_soft_deleted_live_lineage
  FROM "open_day_quiz_items" q
  LEFT JOIN "tour_nodes" tn ON tn."id" = q."tour_node_id"
  LEFT JOIN "locations" l ON l."id" = tn."location_id"
  LEFT JOIN "buildings" b ON b."id" = l."building_id"
  LEFT JOIN "campuses" c ON c."id" = b."campus_id"
  WHERE q."event_id" IS NULL
),
r1_analysis AS (
  SELECT
    ql.quiz_id,
    -- Strict historical mismatch check (BLK-B2): inspects active and soft-deleted sessions/events
    COUNT(DISTINCT CASE
      WHEN (e."campus_id" <> ql.node_campus_id OR s."campus_id" <> ql.node_campus_id OR s."campus_id" <> e."campus_id")
      THEN s."id"
    END)::int AS cross_campus_mismatch_cnt,
    COUNT(DISTINCT CASE
      WHEN s."deleted_at" IS NULL AND e."deleted_at" IS NULL
       AND e."campus_id" = ql.node_campus_id AND s."campus_id" = ql.node_campus_id AND s."campus_id" = e."campus_id"
      THEN e."id"
    END)::int AS r1_active_cnt,
    MIN(CASE
      WHEN s."deleted_at" IS NULL AND e."deleted_at" IS NULL
       AND e."campus_id" = ql.node_campus_id AND s."campus_id" = ql.node_campus_id AND s."campus_id" = e."campus_id"
      THEN e."id"::text
    END)::uuid AS r1_active_event_id,
    COUNT(DISTINCT CASE
      WHEN e."campus_id" = ql.node_campus_id AND s."campus_id" = ql.node_campus_id AND s."campus_id" = e."campus_id"
      THEN e."id"
    END)::int AS r1_any_cnt,
    MIN(CASE
      WHEN e."campus_id" = ql.node_campus_id AND s."campus_id" = ql.node_campus_id AND s."campus_id" = e."campus_id"
      THEN e."id"::text
    END)::uuid AS r1_any_event_id
  FROM quiz_lineage ql
  LEFT JOIN "open_day_sessions" s ON s."tour_node_id" = ql.tour_node_id AND ql.tour_node_id IS NOT NULL
  LEFT JOIN "open_day_events" e ON e."id" = s."event_id"
  GROUP BY ql.quiz_id
),
r2_analysis AS (
  SELECT
    ql.quiz_id,
    COUNT(DISTINCT CASE WHEN e."deleted_at" IS NULL THEN e."id" END)::int AS r2_active_cnt,
    MIN(CASE WHEN e."deleted_at" IS NULL THEN e."id"::text END)::uuid AS r2_active_event_id,
    COUNT(DISTINCT e."id")::int AS r2_any_cnt,
    MIN(e."id"::text)::uuid AS r2_any_event_id
  FROM quiz_lineage ql
  LEFT JOIN "open_day_events" e ON e."campus_id" = ql.node_campus_id AND ql.node_campus_id IS NOT NULL
  GROUP BY ql.quiz_id
),
resolved AS (
  SELECT
    ql.quiz_id,
    CASE
      WHEN ql.null_tour_node OR ql.missing_campus_lineage OR ql.has_soft_deleted_live_lineage OR r1.cross_campus_mismatch_cnt > 0 THEN NULL
      WHEN ql.quiz_deleted_at IS NULL THEN
        CASE
          WHEN r1.r1_active_cnt > 1 THEN NULL
          WHEN r1.r1_active_cnt = 1 THEN r1.r1_active_event_id
          WHEN r2.r2_active_cnt = 1 THEN r2.r2_active_event_id
          ELSE NULL
        END
      ELSE
        CASE
          WHEN r1.r1_active_cnt > 1 OR (r1.r1_active_cnt = 0 AND r1.r1_any_cnt > 1) THEN NULL
          WHEN r1.r1_active_cnt = 1 THEN r1.r1_active_event_id
          WHEN r1.r1_active_cnt = 0 AND r1.r1_any_cnt = 1 THEN r1.r1_any_event_id
          WHEN r2.r2_active_cnt = 1 THEN r2.r2_active_event_id
          WHEN r2.r2_active_cnt = 0 AND r2.r2_any_cnt = 1 THEN r2.r2_any_event_id
          ELSE NULL
        END
    END AS resolved_event_id
  FROM quiz_lineage ql
  JOIN r1_analysis r1 ON r1.quiz_id = ql.quiz_id
  JOIN r2_analysis r2 ON r2.quiz_id = ql.quiz_id
)
UPDATE "open_day_quiz_items" q
SET "event_id" = r.resolved_event_id
FROM resolved r
WHERE q."id" = r.quiz_id
  AND r.resolved_event_id IS NOT NULL;

DO $$
DECLARE
  v_cross_campus_cnt INTEGER := 0;
  v_soft_deleted_lineage_cnt INTEGER := 0;
  v_ambiguous_cnt INTEGER := 0;
  v_null_cnt INTEGER := 0;
  v_orphan_cnt INTEGER := 0;
  v_deleted_parent_cnt INTEGER := 0;
BEGIN
  -- Strict historical mismatch check (BLK-B2): catches active AND soft-deleted sessions/events with wrong campus
  SELECT COUNT(*) INTO v_cross_campus_cnt
  FROM "open_day_quiz_items" q
  JOIN "tour_nodes" tn ON tn."id" = q."tour_node_id"
  JOIN "locations" l ON l."id" = tn."location_id"
  JOIN "buildings" b ON b."id" = l."building_id"
  JOIN "open_day_sessions" s ON s."tour_node_id" = q."tour_node_id"
  JOIN "open_day_events" e ON e."id" = s."event_id"
  WHERE q."event_id" IS NULL
    AND (e."campus_id" <> b."campus_id" OR s."campus_id" <> b."campus_id" OR s."campus_id" <> e."campus_id");

  IF v_cross_campus_cnt > 0 THEN
    RAISE EXCEPTION 'MIGRATION_ABORT_CROSS_CAMPUS_MISMATCH: % row(s) have active or historical cross-campus Session/Event/TourNode conflict.', v_cross_campus_cnt;
  END IF;

  SELECT COUNT(*) INTO v_soft_deleted_lineage_cnt
  FROM "open_day_quiz_items" q
  JOIN "tour_nodes" tn ON tn."id" = q."tour_node_id"
  JOIN "locations" l ON l."id" = tn."location_id"
  JOIN "buildings" b ON b."id" = l."building_id"
  JOIN "campuses" c ON c."id" = b."campus_id"
  WHERE q."event_id" IS NULL
    AND q."deleted_at" IS NULL
    AND (tn."deleted_at" IS NOT NULL OR l."deleted_at" IS NOT NULL OR b."deleted_at" IS NOT NULL OR c."deleted_at" IS NOT NULL);

  IF v_soft_deleted_lineage_cnt > 0 THEN
    RAISE EXCEPTION 'MIGRATION_ABORT_SOFT_DELETED_LINEAGE: % active quiz item(s) reference soft-deleted TourNode/Location/Building/Campus.', v_soft_deleted_lineage_cnt;
  END IF;

  WITH unmapped AS (
    SELECT q."id", q."tour_node_id", q."deleted_at", b."campus_id"
    FROM "open_day_quiz_items" q
    LEFT JOIN "tour_nodes" tn ON tn."id" = q."tour_node_id"
    LEFT JOIN "locations" l ON l."id" = tn."location_id"
    LEFT JOIN "buildings" b ON b."id" = l."building_id"
    WHERE q."event_id" IS NULL
  ),
  diag AS (
    SELECT u."id",
      u."deleted_at",
      u."tour_node_id",
      (SELECT COUNT(DISTINCT e."id") FROM "open_day_sessions" s JOIN "open_day_events" e ON e."id" = s."event_id"
       WHERE s."tour_node_id" = u."tour_node_id" AND s."deleted_at" IS NULL AND e."deleted_at" IS NULL) AS r1_act,
      (SELECT COUNT(DISTINCT e."id") FROM "open_day_sessions" s JOIN "open_day_events" e ON e."id" = s."event_id"
       WHERE s."tour_node_id" = u."tour_node_id") AS r1_any,
      (SELECT COUNT(*) FROM "open_day_events" e WHERE e."campus_id" = u."campus_id" AND e."deleted_at" IS NULL) AS r2_act,
      (SELECT COUNT(*) FROM "open_day_events" e WHERE e."campus_id" = u."campus_id") AS r2_any
    FROM unmapped u
  )
  SELECT COUNT(*) INTO v_ambiguous_cnt
  FROM diag d
  WHERE d."tour_node_id" IS NOT NULL AND (
    (d."deleted_at" IS NULL AND (d.r1_act > 1 OR (d.r1_act = 0 AND d.r2_act > 1))) OR
    (d."deleted_at" IS NOT NULL AND (d.r1_act > 1 OR (d.r1_act = 0 AND d.r1_any > 1) OR (d.r1_act = 0 AND d.r1_any = 0 AND (d.r2_act > 1 OR (d.r2_act = 0 AND d.r2_any > 1)))))
  );

  IF v_ambiguous_cnt > 0 THEN
    RAISE EXCEPTION 'MIGRATION_ABORT_AMBIGUOUS_QUIZ_EVENT: % quiz item(s) match multiple candidate OpenDayEvents.', v_ambiguous_cnt;
  END IF;

  SELECT COUNT(*) INTO v_null_cnt FROM "open_day_quiz_items" WHERE "event_id" IS NULL;
  IF v_null_cnt > 0 THEN
    RAISE EXCEPTION 'MIGRATION_ABORT_NULL_QUIZ_EVENT_ID: % row(s) remain unmapped (NULL tour_node_id or missing eligible OpenDayEvent).', v_null_cnt;
  END IF;

  SELECT COUNT(*) INTO v_orphan_cnt
  FROM "open_day_quiz_items" q
  LEFT JOIN "open_day_events" e ON e."id" = q."event_id"
  WHERE e."id" IS NULL;
  IF v_orphan_cnt > 0 THEN
    RAISE EXCEPTION 'MIGRATION_ABORT_ORPHAN_QUIZ_EVENT_ID: % row(s) point to missing OpenDayEvent.', v_orphan_cnt;
  END IF;

  SELECT COUNT(*) INTO v_deleted_parent_cnt
  FROM "open_day_quiz_items" q
  JOIN "open_day_events" e ON e."id" = q."event_id"
  WHERE q."deleted_at" IS NULL AND e."deleted_at" IS NOT NULL;
  IF v_deleted_parent_cnt > 0 THEN
    RAISE EXCEPTION 'MIGRATION_ABORT_DELETED_PARENT_EVENT: % active quiz item(s) mapped to soft-deleted event.', v_deleted_parent_cnt;
  END IF;
END $$;

ALTER TABLE "open_day_quiz_items"
  ALTER COLUMN "event_id" SET NOT NULL;

ALTER TABLE "open_day_quiz_items"
  ADD CONSTRAINT "open_day_quiz_items_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "open_day_events"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "UploadTargetType" AS ENUM ('MEDIA_ASSET', 'FLOOR_PLAN');

CREATE TABLE "upload_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jti" UUID NOT NULL,
  "subject_user_id" UUID NOT NULL,
  "target_type" "UploadTargetType" NOT NULL,
  "media_asset_id" UUID,
  "floor_plan_id" UUID,
  "object_key" TEXT NOT NULL,
  "expected_mime_type" VARCHAR(120) NOT NULL,
  "max_size_bytes" BIGINT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "upload_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "upload_tokens_jti_key" UNIQUE ("jti"),
  CONSTRAINT "upload_tokens_subject_user_id_fkey" FOREIGN KEY ("subject_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "upload_tokens_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "upload_tokens_floor_plan_id_fkey" FOREIGN KEY ("floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "chk_upload_tokens_single_typed_target" CHECK (
    ("target_type" = 'MEDIA_ASSET' AND "media_asset_id" IS NOT NULL AND "floor_plan_id" IS NULL) OR
    ("target_type" = 'FLOOR_PLAN'  AND "floor_plan_id"  IS NOT NULL AND "media_asset_id" IS NULL)
  ),
  CONSTRAINT "chk_upload_tokens_max_size_positive" CHECK ("max_size_bytes" > 0)
);

CREATE INDEX "idx_upload_tokens_media_asset_id" ON "upload_tokens"("media_asset_id");
CREATE INDEX "idx_upload_tokens_floor_plan_id"  ON "upload_tokens"("floor_plan_id");
CREATE INDEX "idx_upload_tokens_expires_at"     ON "upload_tokens"("expires_at");
CREATE INDEX "idx_upload_tokens_subject_unused" ON "upload_tokens"("subject_user_id", "used_at");

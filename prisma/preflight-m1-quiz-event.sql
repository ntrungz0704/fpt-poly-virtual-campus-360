-- ============================================================================
-- M1 Preflight Diagnostic (READ-ONLY) for open_day_quiz_items -> open_day_events
-- Matches 20261112000001_m1_quiz_event_upload_tokens backfill logic 1:1.
-- Gate rule (BLK-E1): Proceed with `prisma migrate deploy` ONLY when every row
-- returns final_resolution_status = 'RESOLVED' and cross_campus_mismatch_cnt = 0.
-- If any row is AMBIGUOUS or UNRESOLVED, remediate source data BEFORE cutover.
-- ============================================================================

WITH quiz_lineage AS (
  SELECT
    q."id" AS quiz_id,
    q."tour_node_id",
    q."sort_order",
    q."status" AS quiz_status,
    q."deleted_at" AS quiz_deleted_at,
    tn."slug" AS tour_node_slug,
    c."id" AS node_campus_id,
    c."code" AS node_campus_code,
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
       AND (e."campus_id" <> ql.node_campus_id OR s."campus_id" <> ql.node_campus_id OR s."campus_id" <> e."campus_id")
      THEN s."id"
    END)::int AS cross_campus_active_mismatch_cnt,
    COUNT(DISTINCT CASE
      WHEN (s."deleted_at" IS NOT NULL OR e."deleted_at" IS NOT NULL)
       AND (e."campus_id" <> ql.node_campus_id OR s."campus_id" <> ql.node_campus_id OR s."campus_id" <> e."campus_id")
      THEN s."id"
    END)::int AS cross_campus_historical_mismatch_cnt,
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
)
SELECT
  ql.quiz_id,
  ql.tour_node_id,
  ql.tour_node_slug,
  (ql.quiz_deleted_at IS NOT NULL) AS is_soft_deleted_quiz,
  r1.cross_campus_mismatch_cnt,
  r1.cross_campus_active_mismatch_cnt,
  r1.cross_campus_historical_mismatch_cnt,
  r1.r1_active_cnt,
  r1.r1_any_cnt,
  r2.r2_active_cnt,
  r2.r2_any_cnt,
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
  END AS resolved_event_id,
  CASE
    WHEN ql.null_tour_node OR ql.missing_campus_lineage OR ql.has_soft_deleted_live_lineage OR r1.cross_campus_mismatch_cnt > 0 THEN 'UNRESOLVED'
    WHEN ql.quiz_deleted_at IS NULL AND (
      r1.r1_active_cnt > 1 OR (r1.r1_active_cnt = 0 AND r2.r2_active_cnt > 1)
    ) THEN 'AMBIGUOUS'
    WHEN ql.quiz_deleted_at IS NOT NULL AND (
      r1.r1_active_cnt > 1 OR
      (r1.r1_active_cnt = 0 AND r1.r1_any_cnt > 1) OR
      (r1.r1_active_cnt = 0 AND r1.r1_any_cnt = 0 AND (r2.r2_active_cnt > 1 OR (r2.r2_active_cnt = 0 AND r2.r2_any_cnt > 1)))
    ) THEN 'AMBIGUOUS'
    WHEN (
      (ql.quiz_deleted_at IS NULL AND (r1.r1_active_cnt = 1 OR r2.r2_active_cnt = 1)) OR
      (ql.quiz_deleted_at IS NOT NULL AND (
        r1.r1_active_cnt = 1 OR (r1.r1_active_cnt = 0 AND r1.r1_any_cnt = 1) OR
        r2.r2_active_cnt = 1 OR (r2.r2_active_cnt = 0 AND r2.r2_any_cnt = 1)
      ))
    ) THEN 'RESOLVED'
    ELSE 'UNRESOLVED'
  END AS final_resolution_status,
  CASE
    WHEN ql.null_tour_node THEN 'NULL_TOUR_NODE_NO_LINEAGE'
    WHEN ql.missing_campus_lineage THEN 'MISSING_CAMPUS_LINEAGE'
    WHEN ql.has_soft_deleted_live_lineage THEN 'SOFT_DELETED_LINEAGE'
    WHEN r1.cross_campus_mismatch_cnt > 0 THEN 'CROSS_CAMPUS_MISMATCH'
    WHEN ql.quiz_deleted_at IS NULL AND r1.r1_active_cnt > 1 THEN 'AMBIGUOUS_SESSION_EVENTS'
    WHEN ql.quiz_deleted_at IS NULL AND r1.r1_active_cnt = 1 THEN 'R1_SESSION'
    WHEN ql.quiz_deleted_at IS NULL AND r2.r2_active_cnt > 1 THEN 'AMBIGUOUS_CAMPUS_EVENTS'
    WHEN ql.quiz_deleted_at IS NULL AND r2.r2_active_cnt = 1 THEN 'R2_CAMPUS'
    WHEN ql.quiz_deleted_at IS NOT NULL AND (r1.r1_active_cnt > 1 OR (r1.r1_active_cnt = 0 AND r1.r1_any_cnt > 1)) THEN 'AMBIGUOUS_SESSION_EVENTS'
    WHEN ql.quiz_deleted_at IS NOT NULL AND r1.r1_active_cnt = 1 THEN 'R1_SESSION_FOR_DELETED_QUIZ'
    WHEN ql.quiz_deleted_at IS NOT NULL AND r1.r1_active_cnt = 0 AND r1.r1_any_cnt = 1 THEN 'R1_ARCHIVED_SESSION_FOR_DELETED_QUIZ'
    WHEN ql.quiz_deleted_at IS NOT NULL AND (r2.r2_active_cnt > 1 OR (r2.r2_active_cnt = 0 AND r2.r2_any_cnt > 1)) THEN 'AMBIGUOUS_CAMPUS_EVENTS'
    WHEN ql.quiz_deleted_at IS NOT NULL AND (r2.r2_active_cnt = 1 OR (r2.r2_active_cnt = 0 AND r2.r2_any_cnt = 1)) THEN 'R2_CAMPUS_FOR_DELETED_QUIZ'
    ELSE 'NO_ELIGIBLE_EVENT'
  END AS resolution_tier_or_reason
FROM quiz_lineage ql
JOIN r1_analysis r1 ON r1.quiz_id = ql.quiz_id
JOIN r2_analysis r2 ON r2.quiz_id = ql.quiz_id
ORDER BY ql.sort_order, ql.quiz_id;

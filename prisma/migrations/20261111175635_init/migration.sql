-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "FloorPlanFormat" AS ENUM ('PNG', 'JPG', 'SVG', 'PDF');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PANORAMA_2_1', 'PHOTO_2D', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "BuildingCategory" AS ENUM ('ACADEMIC', 'LAB', 'FACILITY');

-- CreateEnum
CREATE TYPE "MapBuildingIconKey" AS ENUM ('INNOVATION', 'IT_BUILDING', 'DESIGN_STUDIO', 'ACADEMIC_HALL', 'SPORTS');

-- CreateEnum
CREATE TYPE "TourEdgeType" AS ENUM ('WALKWAY', 'DOORWAY', 'STAIRS', 'ELEVATOR', 'OUTDOOR_LINK');

-- CreateEnum
CREATE TYPE "AlignmentStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "HotspotType" AS ENUM ('SCENE_LINK', 'INFO', 'QUIZ_TRIGGER');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'STAFF', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivationStatus" AS ENUM ('PENDING_ACTIVATION', 'INVITATION_SENT', 'ACTIVATED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProvisioningMethod" AS ENUM ('BOOTSTRAP', 'ADMIN_DIRECT', 'EMAIL_SMS_INVITATION');

-- CreateEnum
CREATE TYPE "InvitationChannel" AS ENUM ('DIRECT_LINK', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('INVITATION_PENDING', 'SENT', 'EXPIRED', 'ACTIVATED', 'FAILED');

-- CreateEnum
CREATE TYPE "SessionPeriod" AS ENUM ('MORNING', 'NOON', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('INVITED', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "campuses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" TEXT NOT NULL,
    "origin_point_json" JSONB NOT NULL,
    "landmarks_json" JSONB NOT NULL DEFAULT '[]',
    "default_entry_node_id" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campus_id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "short_name" VARCHAR(80) NOT NULL,
    "category" "BuildingCategory" NOT NULL,
    "category_label" VARCHAR(80) NOT NULL,
    "floors_label" VARCHAR(80) NOT NULL,
    "summary" VARCHAR(280) NOT NULL,
    "description" TEXT NOT NULL,
    "highlights_json" JSONB NOT NULL DEFAULT '[]',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address_note" TEXT NOT NULL,
    "status_note" VARCHAR(160) NOT NULL,
    "map_icon_key" "MapBuildingIconKey" NOT NULL,
    "route_waypoints_json" JSONB NOT NULL DEFAULT '[]',
    "gis_x" DOUBLE PRECISION,
    "gis_y" DOUBLE PRECISION,
    "cover_media_id" UUID,
    "default_node_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "code" VARCHAR(24) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level_index" INTEGER NOT NULL,
    "active_floor_plan_id" UUID,
    "requires_floor_plan" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "floor_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source_format" "FloorPlanFormat" NOT NULL,
    "source_object_key" TEXT NOT NULL,
    "render_object_key" TEXT,
    "thumbnail_object_key" TEXT,
    "source_page_number" INTEGER NOT NULL DEFAULT 1,
    "render_width" INTEGER,
    "render_height" INTEGER,
    "aspect_ratio" DOUBLE PRECISION,
    "north_offset_deg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processing_error" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plan_alignment_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "new_floor_plan_id" UUID NOT NULL,
    "previous_floor_plan_id" UUID,
    "node_coords_snapshot" JSONB NOT NULL,
    "alignment_status" "AlignmentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "confirmed_by" UUID,
    "confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floor_plan_alignment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(40) NOT NULL,
    "filter_group" VARCHAR(24) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "icon_name" VARCHAR(60) NOT NULL,
    "is_inter_floor_connector" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "location_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "floor_id" UUID,
    "location_type_id" UUID NOT NULL,
    "category_label" VARCHAR(80) NOT NULL,
    "code" VARCHAR(48) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "short_summary" VARCHAR(280) NOT NULL,
    "description" TEXT NOT NULL,
    "highlights_json" JSONB NOT NULL DEFAULT '[]',
    "floor_norm_x" DOUBLE PRECISION,
    "floor_norm_y" DOUBLE PRECISION,
    "floor_polygon_norm" JSONB,
    "is_public_accessible" BOOLEAN NOT NULL DEFAULT true,
    "restriction_note" TEXT,
    "primary_node_id" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "asset_kind" "MediaKind" NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "sha256_checksum" CHAR(64) NOT NULL,
    "original_width" INTEGER NOT NULL,
    "original_height" INTEGER NOT NULL,
    "is_valid_2_to_1" BOOLEAN NOT NULL DEFAULT false,
    "is_preview_approved" BOOLEAN NOT NULL DEFAULT false,
    "original_object_key" TEXT NOT NULL,
    "optimized_desktop_key" TEXT,
    "optimized_mobile_key" TEXT,
    "thumbnail_key" TEXT,
    "camera_metadata" JSONB,
    "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processing_error" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "caption" VARCHAR(200),

    CONSTRAINT "location_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "intro" TEXT NOT NULL,
    "category" VARCHAR(24) NOT NULL DEFAULT 'study',
    "location_id" UUID NOT NULL,
    "floor_plan_id" UUID,
    "panorama_asset_id" UUID NOT NULL,
    "floor_norm_x" DOUBLE PRECISION,
    "floor_norm_y" DOUBLE PRECISION,
    "needs_realignment" BOOLEAN NOT NULL DEFAULT false,
    "heading_offset_deg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initial_yaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initial_pitch" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initial_fov" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "is_terminal_approved" BOOLEAN NOT NULL DEFAULT false,
    "terminal_approval_reason" VARCHAR(240),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tour_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_edges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_node_id" UUID NOT NULL,
    "to_node_id" UUID NOT NULL,
    "edge_type" "TourEdgeType" NOT NULL DEFAULT 'WALKWAY',
    "label" VARCHAR(120) NOT NULL,
    "target_entry_yaw" DOUBLE PRECISION,
    "target_entry_pitch" DOUBLE PRECISION,
    "is_one_way_approved" BOOLEAN NOT NULL DEFAULT false,
    "one_way_approval_reason" VARCHAR(240),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tour_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotspots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "node_id" UUID NOT NULL,
    "hotspot_type" "HotspotType" NOT NULL,
    "edge_id" UUID,
    "yaw" DOUBLE PRECISION NOT NULL,
    "pitch" DOUBLE PRECISION NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "body" TEXT,
    "payload_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotspots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(64),
    "full_name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(160),
    "phone" VARCHAR(32),
    "user_type" "UserType" NOT NULL,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "activation_status" "ActivationStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "provisioning_method" "ProvisioningMethod" NOT NULL,
    "password_hash" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(48) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(80) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "account_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "channel" "InvitationChannel" NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "status" "InvitationStatus" NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "sent_at" TIMESTAMPTZ(6),
    "activated_at" TIMESTAMPTZ(6),
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "failure_reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "participation_status" "ParticipationStatus" NOT NULL DEFAULT 'INVITED',
    "provisioned_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_import_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "imported_by" UUID NOT NULL,
    "default_user_type" "UserType" NOT NULL,
    "provisioning_method" "ProvisioningMethod" NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "success_count" INTEGER NOT NULL,
    "skipped_count" INTEGER NOT NULL,
    "failed_count" INTEGER NOT NULL,
    "row_results_summary_json" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "user_agent" TEXT,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID,
    "actor_username" VARCHAR(64),
    "action" VARCHAR(80) NOT NULL,
    "resource_type" VARCHAR(64),
    "resource_id" UUID,
    "diff_json" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_day_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campus_id" UUID NOT NULL,
    "event_key" VARCHAR(80) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "subtitle" TEXT,
    "date_label" VARCHAR(80) NOT NULL,
    "time_label" VARCHAR(80) NOT NULL,
    "event_date" DATE,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "open_day_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_day_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "building_id" UUID,
    "location_id" UUID,
    "tour_node_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "session_period" "SessionPeriod" NOT NULL,
    "start_time_label" VARCHAR(24) NOT NULL,
    "end_time_label" VARCHAR(24) NOT NULL,
    "time_range_label" VARCHAR(48) NOT NULL,
    "custom_location_label" VARCHAR(160) NOT NULL,
    "host_unit" VARCHAR(120) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "open_day_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_day_faqs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID,
    "campus_id" UUID NOT NULL,
    "question" VARCHAR(280) NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "open_day_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_day_quiz_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tour_node_id" UUID,
    "question_text" VARCHAR(280) NOT NULL,
    "options_json" JSONB NOT NULL,
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "open_day_quiz_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "floor_plans_floor_id_version_key" ON "floor_plans"("floor_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "location_types_code_key" ON "location_types"("code");

-- CreateIndex
CREATE INDEX "idx_media_sha256" ON "media_assets"("sha256_checksum");

-- CreateIndex
CREATE UNIQUE INDEX "location_media_location_id_media_asset_id_key" ON "location_media"("location_id", "media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "tour_edges_from_node_id_to_node_id_edge_type_key" ON "tour_edges"("from_node_id", "to_node_id", "edge_type");

-- CreateIndex
CREATE UNIQUE INDEX "hotspots_edge_id_key" ON "hotspots"("edge_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_invitations_token_hash_key" ON "account_invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "event_participations_user_id_event_id_key" ON "event_participations"("user_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_default_entry_node_id_fkey" FOREIGN KEY ("default_entry_node_id") REFERENCES "tour_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_default_node_id_fkey" FOREIGN KEY ("default_node_id") REFERENCES "tour_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_active_floor_plan_id_fkey" FOREIGN KEY ("active_floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_alignment_snapshots" ADD CONSTRAINT "floor_plan_alignment_snapshots_new_floor_plan_id_fkey" FOREIGN KEY ("new_floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_alignment_snapshots" ADD CONSTRAINT "floor_plan_alignment_snapshots_previous_floor_plan_id_fkey" FOREIGN KEY ("previous_floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_alignment_snapshots" ADD CONSTRAINT "floor_plan_alignment_snapshots_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_location_type_id_fkey" FOREIGN KEY ("location_type_id") REFERENCES "location_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_primary_node_id_fkey" FOREIGN KEY ("primary_node_id") REFERENCES "tour_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_media" ADD CONSTRAINT "location_media_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_media" ADD CONSTRAINT "location_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_nodes" ADD CONSTRAINT "tour_nodes_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_nodes" ADD CONSTRAINT "tour_nodes_floor_plan_id_fkey" FOREIGN KEY ("floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_nodes" ADD CONSTRAINT "tour_nodes_panorama_asset_id_fkey" FOREIGN KEY ("panorama_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_edges" ADD CONSTRAINT "tour_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "tour_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_edges" ADD CONSTRAINT "tour_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "tour_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotspots" ADD CONSTRAINT "hotspots_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "tour_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotspots" ADD CONSTRAINT "hotspots_edge_id_fkey" FOREIGN KEY ("edge_id") REFERENCES "tour_edges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "open_day_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_provisioned_by_fkey" FOREIGN KEY ("provisioned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_import_batches" ADD CONSTRAINT "user_import_batches_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_events" ADD CONSTRAINT "open_day_events_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_sessions" ADD CONSTRAINT "open_day_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "open_day_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_sessions" ADD CONSTRAINT "open_day_sessions_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_sessions" ADD CONSTRAINT "open_day_sessions_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_sessions" ADD CONSTRAINT "open_day_sessions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_sessions" ADD CONSTRAINT "open_day_sessions_tour_node_id_fkey" FOREIGN KEY ("tour_node_id") REFERENCES "tour_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_faqs" ADD CONSTRAINT "open_day_faqs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "open_day_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_faqs" ADD CONSTRAINT "open_day_faqs_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_day_quiz_items" ADD CONSTRAINT "open_day_quiz_items_tour_node_id_fkey" FOREIGN KEY ("tour_node_id") REFERENCES "tour_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Custom Partial Unique Indexes (OD-04, OD-06 — Soft-delete Aware)
-- ============================================================================

CREATE UNIQUE INDEX "uq_campuses_code_active"
  ON "campuses"("code")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_buildings_campus_code_active"
  ON "buildings"("campus_id", "code")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_buildings_campus_slug_active"
  ON "buildings"("campus_id", "slug")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_floors_building_code_active"
  ON "floors"("building_id", "code")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_floors_building_level_active"
  ON "floors"("building_id", "level_index")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_locations_slug_active"
  ON "locations"("slug")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_locations_building_code_active"
  ON "locations"("building_id", "code")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_tour_nodes_slug_active"
  ON "tour_nodes"("slug")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "uq_users_username_active"
  ON "users"("username")
  WHERE "deleted_at" IS NULL AND "username" IS NOT NULL;

CREATE UNIQUE INDEX "uq_users_email_active"
  ON "users"("email")
  WHERE "deleted_at" IS NULL AND "email" IS NOT NULL;

CREATE UNIQUE INDEX "uq_users_phone_active"
  ON "users"("phone")
  WHERE "deleted_at" IS NULL AND "phone" IS NOT NULL;

CREATE UNIQUE INDEX "uq_open_day_events_key_active"
  ON "open_day_events"("event_key")
  WHERE "deleted_at" IS NULL;

-- ============================================================================
-- Custom Partial Query Indexes (Active Rows Only)
-- ============================================================================

CREATE INDEX "idx_buildings_campus_status"
  ON "buildings"("campus_id", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_locations_floor_type"
  ON "locations"("floor_id", "location_type_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_locations_building_status"
  ON "locations"("building_id", "status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_media_kind_status"
  ON "media_assets"("asset_kind", "processing_status")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_tour_nodes_location"
  ON "tour_nodes"("location_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_tour_nodes_floor_plan"
  ON "tour_nodes"("floor_plan_id")
  WHERE "deleted_at" IS NULL;

-- ============================================================================
-- Custom PostgreSQL CHECK Constraints (OD-01, OD-06, OD-08, OD-10)
-- ============================================================================

ALTER TABLE "buildings"
  ADD CONSTRAINT "chk_buildings_lat_wgs84"
  CHECK ("lat" >= -90 AND "lat" <= 90);

ALTER TABLE "buildings"
  ADD CONSTRAINT "chk_buildings_lng_wgs84"
  CHECK ("lng" >= -180 AND "lng" <= 180);

ALTER TABLE "buildings"
  ADD CONSTRAINT "chk_buildings_gis_x_range"
  CHECK ("gis_x" IS NULL OR ("gis_x" >= 0 AND "gis_x" <= 100));

ALTER TABLE "buildings"
  ADD CONSTRAINT "chk_buildings_gis_y_range"
  CHECK ("gis_y" IS NULL OR ("gis_y" >= 0 AND "gis_y" <= 100));

ALTER TABLE "locations"
  ADD CONSTRAINT "chk_locations_floor_norm_x_range"
  CHECK ("floor_norm_x" IS NULL OR ("floor_norm_x" >= 0 AND "floor_norm_x" <= 1));

ALTER TABLE "locations"
  ADD CONSTRAINT "chk_locations_floor_norm_y_range"
  CHECK ("floor_norm_y" IS NULL OR ("floor_norm_y" >= 0 AND "floor_norm_y" <= 1));

ALTER TABLE "tour_nodes"
  ADD CONSTRAINT "chk_tour_nodes_floor_norm_x_range"
  CHECK ("floor_norm_x" IS NULL OR ("floor_norm_x" >= 0 AND "floor_norm_x" <= 1));

ALTER TABLE "tour_nodes"
  ADD CONSTRAINT "chk_tour_nodes_floor_norm_y_range"
  CHECK ("floor_norm_y" IS NULL OR ("floor_norm_y" >= 0 AND "floor_norm_y" <= 1));

ALTER TABLE "tour_nodes"
  ADD CONSTRAINT "chk_tour_nodes_floor_coords_consistency"
  CHECK (
    ("floor_plan_id" IS NULL AND "floor_norm_x" IS NULL AND "floor_norm_y" IS NULL) OR
    ("floor_plan_id" IS NOT NULL AND "floor_norm_x" IS NOT NULL AND "floor_norm_y" IS NOT NULL)
  );

ALTER TABLE "tour_nodes"
  ADD CONSTRAINT "chk_tour_nodes_initial_yaw_range"
  CHECK ("initial_yaw" >= -180 AND "initial_yaw" <= 180);

ALTER TABLE "tour_nodes"
  ADD CONSTRAINT "chk_tour_nodes_initial_pitch_range"
  CHECK ("initial_pitch" >= -90 AND "initial_pitch" <= 90);

ALTER TABLE "tour_nodes"
  ADD CONSTRAINT "chk_tour_nodes_initial_fov_range"
  CHECK ("initial_fov" >= 30 AND "initial_fov" <= 100);

ALTER TABLE "tour_edges"
  ADD CONSTRAINT "chk_tour_edges_no_self_loop"
  CHECK ("from_node_id" <> "to_node_id");

ALTER TABLE "hotspots"
  ADD CONSTRAINT "chk_hotspots_yaw_range"
  CHECK ("yaw" >= -180 AND "yaw" <= 180);

ALTER TABLE "hotspots"
  ADD CONSTRAINT "chk_hotspots_pitch_range"
  CHECK ("pitch" >= -90 AND "pitch" <= 90);

ALTER TABLE "hotspots"
  ADD CONSTRAINT "chk_hotspots_scene_link_edge_consistency"
  CHECK (
    ("hotspot_type" = 'SCENE_LINK' AND "edge_id" IS NOT NULL) OR
    ("hotspot_type" <> 'SCENE_LINK' AND "edge_id" IS NULL)
  );

ALTER TABLE "open_day_quiz_items"
  ADD CONSTRAINT "chk_open_day_quiz_items_correct_index_non_negative"
  CHECK ("correct_index" >= 0);


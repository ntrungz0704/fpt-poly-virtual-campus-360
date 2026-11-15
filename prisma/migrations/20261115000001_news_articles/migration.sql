-- CreateTable
CREATE TABLE IF NOT EXISTS "news_articles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(240) NOT NULL,
    "slug" VARCHAR(240) NOT NULL,
    "tag" VARCHAR(80) NOT NULL DEFAULT 'Tin tức chung',
    "excerpt" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "content_json" JSONB NOT NULL DEFAULT '[]',
    "cover_media_id" UUID,
    "cover_image_url" TEXT,
    "related_scene_id" VARCHAR(100),
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "author_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "news_articles_slug_key" ON "news_articles"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "news_articles_status_deleted_at_idx" ON "news_articles"("status", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "news_articles_published_at_idx" ON "news_articles"("published_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'news_articles_cover_media_id_fkey'
    ) THEN
        ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_cover_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'news_articles_author_id_fkey'
    ) THEN
        ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

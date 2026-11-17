import {
  DEFAULT_NEWS_FALLBACK_IMAGE,
  resolveAdminNewsMediaState,
  resolvePublicMediaUrl,
  resolvePublicNewsImageUrl,
  serializeSafeAdminCoverMedia,
  serializeSafeBigInt,
  type NewsCoverMediaRecord,
} from "../../src/modules/news/news-media.helper";
import type { StorageAdapter } from "../../src/modules/storage/storage.adapter";

const mockStorageAdapter = {
  driver: "local" as const,
  getPublicUrl: (key: string) =>
    key.startsWith("/") ? key : `/storage-cdn/${key}`,
} as unknown as StorageAdapter;

const activeMedia: NewsCoverMediaRecord = {
  id: "media-1",
  originalFilename: "campus-news.jpg",
  originalObjectKey: "news/campus-news.jpg",
  thumbnailKey: "news/campus-news-thumb.webp",
  mimeType: "image/jpeg",
  fileSizeBytes: 2_457_600n,
  processingStatus: "READY",
  deletedAt: null,
};

const softDeletedMedia: NewsCoverMediaRecord = {
  ...activeMedia,
  id: "media-deleted",
  deletedAt: new Date("2026-11-17T10:00:00.000Z"),
};

describe("News Media Helper Unit Tests (B-B4)", () => {
  it("serializes BigInt values safely for JSON without throwing TypeError", () => {
    const safeSmall = serializeSafeBigInt(2_457_600n);
    const safeHuge = serializeSafeBigInt(9_007_199_254_740_999n);

    expect(safeSmall).toBe(2_457_600);
    expect(safeHuge).toBe("9007199254740999");

    const serialized = serializeSafeAdminCoverMedia(activeMedia, mockStorageAdapter);
    expect(serialized).not.toBeNull();
    expect(() => JSON.stringify(serialized)).not.toThrow();
    expect(serialized?.fileSizeBytes).toBe(2_457_600);
    expect(serialized?.publicUrl).toBe("/storage-cdn/news/campus-news-thumb.webp");
  });

  it("excludes soft-deleted MediaAsset (deletedAt !== null) from admin and public responses while preserving legacy coverImageUrl", () => {
    const adminWithDeleted = resolveAdminNewsMediaState(
      {
        coverMediaId: softDeletedMedia.id,
        coverImageUrl: "/storage-cdn/news/campus-news-thumb.webp",
        coverMedia: softDeletedMedia,
      },
      mockStorageAdapter,
    );
    expect(adminWithDeleted.coverMedia).toBeNull();
    expect(adminWithDeleted.coverMediaId).toBeNull();
    expect(adminWithDeleted.coverImageUrl).toBeNull();

    const publicWithDeleted = resolvePublicNewsImageUrl(
      {
        coverMediaId: softDeletedMedia.id,
        coverImageUrl: "/storage-cdn/news/campus-news-thumb.webp",
        coverMedia: softDeletedMedia,
      },
      mockStorageAdapter,
    );
    expect(publicWithDeleted).toBe(DEFAULT_NEWS_FALLBACK_IMAGE);

    // Legacy article without coverMediaId preserves coverImageUrl intact
    const legacyAdmin = resolveAdminNewsMediaState(
      {
        coverMediaId: null,
        coverImageUrl: "/images/legacy-news.jpg",
        coverMedia: null,
      },
      mockStorageAdapter,
    );
    expect(legacyAdmin.coverImageUrl).toBe("/images/legacy-news.jpg");

    const legacyPublic = resolvePublicNewsImageUrl(
      {
        coverMediaId: null,
        coverImageUrl: "/images/legacy-news.jpg",
        coverMedia: null,
      },
      mockStorageAdapter,
    );
    expect(legacyPublic).toBe("/images/legacy-news.jpg");
    expect(
      resolvePublicMediaUrl(mockStorageAdapter, "https://cdn.example.com/a.jpg"),
    ).toBe("https://cdn.example.com/a.jpg");
  });
});

import type { StorageAdapter } from "../storage/storage.adapter";

export const DEFAULT_NEWS_FALLBACK_IMAGE =
  "/images/locations/building-innovation.jpg";

export const SAFE_NEWS_MEDIA_SELECT = {
  id: true,
  originalFilename: true,
  originalObjectKey: true,
  thumbnailKey: true,
  mimeType: true,
  fileSizeBytes: true,
  processingStatus: true,
  deletedAt: true,
} as const;

export interface NewsCoverMediaRecord {
  id: string;
  originalFilename: string;
  originalObjectKey: string;
  thumbnailKey: string | null;
  mimeType: string;
  fileSizeBytes: bigint | number | string;
  processingStatus: string;
  deletedAt: Date | null;
}

export interface SerializedAdminNewsCoverMedia {
  id: string;
  originalFilename: string;
  originalObjectKey: string;
  thumbnailKey: string | null;
  mimeType: string;
  fileSizeBytes: number | string;
  processingStatus: string;
  publicUrl: string | null;
}

export function serializeSafeBigInt(value: bigint | number | string): number | string {
  if (typeof value === "bigint") {
    return value <= BigInt(Number.MAX_SAFE_INTEGER) &&
      value >= BigInt(Number.MIN_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  return value;
}

export function resolvePublicMediaUrl(
  storageAdapter: StorageAdapter | undefined,
  key: string | null | undefined,
): string | null {
  if (!key) {
    return null;
  }
  const trimmed = key.trim();
  if (!trimmed) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (!storageAdapter) {
    return trimmed;
  }
  try {
    return storageAdapter.getPublicUrl(trimmed) ?? trimmed;
  } catch {
    return trimmed;
  }
}

export function isActiveNewsMedia(
  media: Pick<NewsCoverMediaRecord, "deletedAt"> | null | undefined,
): media is NewsCoverMediaRecord {
  return Boolean(media && media.deletedAt === null);
}

export function serializeSafeAdminCoverMedia(
  media: NewsCoverMediaRecord | null | undefined,
  storageAdapter?: StorageAdapter,
): SerializedAdminNewsCoverMedia | null {
  if (!isActiveNewsMedia(media)) {
    return null;
  }

  return {
    id: media.id,
    originalFilename: media.originalFilename,
    originalObjectKey: media.originalObjectKey,
    thumbnailKey: media.thumbnailKey,
    mimeType: media.mimeType,
    fileSizeBytes: serializeSafeBigInt(media.fileSizeBytes),
    processingStatus: media.processingStatus,
    publicUrl: resolvePublicMediaUrl(
      storageAdapter,
      media.thumbnailKey || media.originalObjectKey,
    ),
  };
}

export function resolveAdminNewsMediaState(
  article: {
    coverMediaId: string | null;
    coverImageUrl: string | null;
    coverMedia?: NewsCoverMediaRecord | null;
  },
  storageAdapter?: StorageAdapter,
): {
  coverMediaId: string | null;
  coverImageUrl: string | null;
  coverMedia: SerializedAdminNewsCoverMedia | null;
} {
  const safeMedia = serializeSafeAdminCoverMedia(
    article.coverMedia,
    storageAdapter,
  );
  if (safeMedia) {
    return {
      coverMediaId: article.coverMediaId,
      coverImageUrl:
        safeMedia.publicUrl ??
        resolvePublicMediaUrl(storageAdapter, article.coverImageUrl),
      coverMedia: safeMedia,
    };
  }

  // If coverMediaId was set but the MediaAsset is missing or soft-deleted, exclude stale image references.
  if (article.coverMediaId) {
    return {
      coverMediaId: null,
      coverImageUrl: null,
      coverMedia: null,
    };
  }

  return {
    coverMediaId: null,
    coverImageUrl:
      resolvePublicMediaUrl(storageAdapter, article.coverImageUrl) ??
      article.coverImageUrl,
    coverMedia: null,
  };
}

export function resolvePublicNewsImageUrl(
  article: {
    coverMediaId: string | null;
    coverImageUrl: string | null;
    coverMedia?: {
      deletedAt: Date | null;
      originalObjectKey: string;
      thumbnailKey: string | null;
    } | null;
  },
  storageAdapter?: StorageAdapter,
): string {
  if (article.coverMedia && article.coverMedia.deletedAt === null) {
    return (
      resolvePublicMediaUrl(
        storageAdapter,
        article.coverMedia.thumbnailKey || article.coverMedia.originalObjectKey,
      ) || DEFAULT_NEWS_FALLBACK_IMAGE
    );
  }

  if (article.coverMediaId) {
    return DEFAULT_NEWS_FALLBACK_IMAGE;
  }

  return (
    resolvePublicMediaUrl(storageAdapter, article.coverImageUrl) ||
    DEFAULT_NEWS_FALLBACK_IMAGE
  );
}

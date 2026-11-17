import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { Prisma, ProcessingStatus, PublishStatus } from "@prisma/client";
import { PrismaService } from "../../common/adapters/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from "../storage/storage.adapter";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { CreateNewsArticleDto, UpdateNewsArticleDto } from "./dto/news-admin.dto";
import {
  resolveAdminNewsMediaState,
  resolvePublicMediaUrl,
  SAFE_NEWS_MEDIA_SELECT,
  type NewsCoverMediaRecord,
} from "./news-media.helper";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPrismaP2002SlugError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = err.meta?.target;
    if (Array.isArray(target)) {
      return target.some((f) => String(f).includes("slug"));
    }
    return String(target).includes("slug");
  }
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
    const target = (err as { meta?: { target?: unknown } }).meta?.target;
    return String(target).includes("slug");
  }
  return false;
}

@Injectable()
export class NewsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Optional()
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter?: StorageAdapter,
  ) {}

  private formatAdminArticle<
    T extends {
      id: string;
      title: string;
      slug: string;
      tag: string;
      excerpt: string;
      content: string;
      contentJson: unknown;
      coverMediaId: string | null;
      coverImageUrl: string | null;
      coverMedia?: NewsCoverMediaRecord | null;
      relatedSceneId: string | null;
      status: PublishStatus;
      publishedAt: Date | null;
      author?: { id: string; fullName: string; username: string | null } | null;
      createdAt: Date;
      updatedAt: Date;
    },
  >(art: T) {
    const mediaState = resolveAdminNewsMediaState(art, this.storageAdapter);
    return {
      id: art.id,
      title: art.title,
      slug: art.slug,
      tag: art.tag,
      excerpt: art.excerpt,
      content: art.content,
      contentJson: art.contentJson,
      coverMediaId: mediaState.coverMediaId,
      coverImageUrl: mediaState.coverImageUrl,
      coverMedia: mediaState.coverMedia,
      relatedSceneId: art.relatedSceneId,
      status: art.status,
      publishedAt: art.publishedAt,
      ...(art.author !== undefined ? { author: art.author } : {}),
      createdAt: art.createdAt,
      updatedAt: art.updatedAt,
    };
  }

  private async resolveValidatedCoverMediaUrl(coverMediaId: string): Promise<string | null> {
    const media = await this.prisma.mediaAsset.findFirst({
      where: { id: coverMediaId, deletedAt: null },
      select: SAFE_NEWS_MEDIA_SELECT,
    });
    if (!media) {
      throw new BadRequestException(
        `MediaAsset mang ID "${coverMediaId}" không tồn tại hoặc đã bị xóa.`,
      );
    }
    if (media.processingStatus === ProcessingStatus.FAILED) {
      throw new BadRequestException(
        `MediaAsset mang ID "${coverMediaId}" xử lý thất bại và không thể sử dụng.`,
      );
    }
    return resolvePublicMediaUrl(
      this.storageAdapter,
      media.thumbnailKey || media.originalObjectKey,
    );
  }

  async listArticles(query: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NewsArticleWhereInput = { deletedAt: null };

    if (query.status && query.status !== "ALL") {
      where.status =
        query.status.toUpperCase() === "PUBLISHED"
          ? PublishStatus.PUBLISHED
          : PublishStatus.DRAFT;
    }

    if (query.q && query.q.trim()) {
      const term = query.q.trim();
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { excerpt: { contains: term, mode: "insensitive" } },
        { tag: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.newsArticle.count({ where }),
      this.prisma.newsArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        include: {
          coverMedia: {
            select: SAFE_NEWS_MEDIA_SELECT,
          },
          author: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((art) => this.formatAdminArticle(art)),
      total,
      page,
      limit,
    };
  }

  async getArticle(id: string) {
    const art = await this.prisma.newsArticle.findFirst({
      where: { id, deletedAt: null },
      include: {
        coverMedia: {
          select: SAFE_NEWS_MEDIA_SELECT,
        },
        author: { select: { id: true, fullName: true, username: true } },
      },
    });

    if (!art) {
      throw new NotFoundException(`Không tìm thấy bài viết mang ID "${id}".`);
    }

    return this.formatAdminArticle(art);
  }

  async createArticle(
    dto: CreateNewsArticleDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const rawSlug = dto.slug && dto.slug.trim() ? slugify(dto.slug) : slugify(dto.title);
    if (!rawSlug) {
      throw new BadRequestException("Slug bài viết không thể để trống hoặc chỉ chứa ký tự đặc biệt.");
    }

    // Check duplicate slug across ALL articles (active and soft-deleted) to prevent DB constraint failure
    const duplicate = await this.prisma.newsArticle.findFirst({
      where: { slug: rawSlug },
    });
    if (duplicate) {
      if (duplicate.deletedAt !== null) {
        throw new ConflictException(
          `Slug "${rawSlug}" đã từng được sử dụng bởi bài viết đã xóa lưu trữ "${duplicate.title}". Vui lòng chọn slug khác.`,
        );
      }
      throw new ConflictException(
        `Slug "${rawSlug}" đã được sử dụng bởi bài viết "${duplicate.title}".`,
      );
    }

    // Verify coverMedia if supplied
    let coverImageUrl = dto.coverImageUrl ?? null;
    if (dto.coverMediaId) {
      coverImageUrl = await this.resolveValidatedCoverMediaUrl(dto.coverMediaId);
    }

    const isPublished = dto.status === "PUBLISHED";
    const paragraphs = dto.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const article = await tx.newsArticle.create({
          data: {
            title: dto.title.trim(),
            slug: rawSlug,
            tag: dto.tag?.trim() || "Tin tức chung",
            excerpt: dto.excerpt.trim(),
            content: dto.content.trim(),
            contentJson: paragraphs,
            coverMediaId: dto.coverMediaId ?? null,
            coverImageUrl,
            relatedSceneId: dto.relatedSceneId?.trim() ?? null,
            status: isPublished ? PublishStatus.PUBLISHED : PublishStatus.DRAFT,
            publishedAt: isPublished ? new Date() : null,
            authorId: actor.id,
          },
          include: {
            coverMedia: {
              select: SAFE_NEWS_MEDIA_SELECT,
            },
          },
        });

        await this.auditLog.record({
          actorUserId: actor.id,
          actorUsername: actor.username,
          action: "CREATE_NEWS_ARTICLE",
          resourceType: "news_article",
          resourceId: article.id,
          diffJson: {
            title: article.title,
            slug: article.slug,
            status: article.status,
          },
          ipAddress,
          tx,
        });

        return article;
      });

      return this.formatAdminArticle(created);
    } catch (err: unknown) {
      if (isPrismaP2002SlugError(err)) {
        throw new ConflictException(
          `Slug "${rawSlug}" đã được sử dụng bởi một bài viết khác trong cơ sở dữ liệu.`,
        );
      }
      throw err;
    }
  }

  async updateArticle(
    id: string,
    dto: UpdateNewsArticleDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.newsArticle.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy bài viết mang ID "${id}".`);
    }

    let nextSlug = existing.slug;
    if (dto.slug && dto.slug.trim()) {
      nextSlug = slugify(dto.slug);
      if (nextSlug !== existing.slug) {
        const dup = await this.prisma.newsArticle.findFirst({
          where: { slug: nextSlug, id: { not: id } },
        });
        if (dup) {
          if (dup.deletedAt !== null) {
            throw new ConflictException(
              `Slug "${nextSlug}" đã từng được sử dụng bởi bài viết đã xóa lưu trữ "${dup.title}". Vui lòng chọn slug khác.`,
            );
          }
          throw new ConflictException(`Slug "${nextSlug}" đã được sử dụng bởi bài viết "${dup.title}".`);
        }
      }
    }

    let coverImageUrl = dto.coverImageUrl !== undefined ? dto.coverImageUrl : existing.coverImageUrl;
    if (dto.coverMediaId !== undefined) {
      if (dto.coverMediaId) {
        coverImageUrl = await this.resolveValidatedCoverMediaUrl(dto.coverMediaId);
      } else {
        coverImageUrl = null;
      }
    }

    let paragraphs: Prisma.InputJsonValue | undefined = undefined;
    if (dto.content !== undefined) {
      paragraphs = dto.content
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
    }

    const nextStatus = dto.status
      ? dto.status === "PUBLISHED"
        ? PublishStatus.PUBLISHED
        : PublishStatus.DRAFT
      : existing.status;

    let publishedAt = existing.publishedAt;
    if (nextStatus === PublishStatus.PUBLISHED && !publishedAt) {
      publishedAt = new Date();
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const article = await tx.newsArticle.update({
          where: { id },
          data: {
            title: dto.title !== undefined ? dto.title.trim() : existing.title,
            slug: nextSlug,
            tag: dto.tag !== undefined ? dto.tag.trim() : existing.tag,
            excerpt: dto.excerpt !== undefined ? dto.excerpt.trim() : existing.excerpt,
            content: dto.content !== undefined ? dto.content.trim() : existing.content,
            contentJson: paragraphs !== undefined ? paragraphs : undefined,
            coverMediaId: dto.coverMediaId !== undefined ? dto.coverMediaId : existing.coverMediaId,
            coverImageUrl,
            relatedSceneId: dto.relatedSceneId !== undefined ? dto.relatedSceneId : existing.relatedSceneId,
            status: nextStatus,
            publishedAt,
          },
          include: {
            coverMedia: {
              select: SAFE_NEWS_MEDIA_SELECT,
            },
          },
        });

        await this.auditLog.record({
          actorUserId: actor.id,
          actorUsername: actor.username,
          action: "UPDATE_NEWS_ARTICLE",
          resourceType: "news_article",
          resourceId: article.id,
          diffJson: {
            title: article.title,
            slug: article.slug,
            status: article.status,
          },
          ipAddress,
          tx,
        });

        return article;
      });

      return this.formatAdminArticle(updated);
    } catch (err: unknown) {
      if (isPrismaP2002SlugError(err)) {
        throw new ConflictException(
          `Slug "${nextSlug}" đã được sử dụng bởi một bài viết khác trong cơ sở dữ liệu.`,
        );
      }
      throw err;
    }
  }

  async deleteArticle(
    id: string,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.newsArticle.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy bài viết mang ID "${id}".`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.newsArticle.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.auditLog.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: "DELETE_NEWS_ARTICLE",
        resourceType: "news_article",
        resourceId: id,
        diffJson: { title: existing.title, slug: existing.slug },
        ipAddress,
        tx,
      });
    });

    return { success: true, deleted: true, id };
  }

  async setPublishStatus(
    id: string,
    publish: boolean,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.newsArticle.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy bài viết mang ID "${id}".`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const art = await tx.newsArticle.update({
        where: { id },
        data: {
          status: publish ? PublishStatus.PUBLISHED : PublishStatus.DRAFT,
          publishedAt: publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        },
        include: {
          coverMedia: {
            select: SAFE_NEWS_MEDIA_SELECT,
          },
        },
      });

      await this.auditLog.record({
        actorUserId: actor.id,
        actorUsername: actor.username,
        action: publish ? "PUBLISH_NEWS_ARTICLE" : "UNPUBLISH_NEWS_ARTICLE",
        resourceType: "news_article",
        resourceId: id,
        diffJson: { status: art.status },
        ipAddress,
        tx,
      });

      return art;
    });

    return this.formatAdminArticle(updated);
  }
}

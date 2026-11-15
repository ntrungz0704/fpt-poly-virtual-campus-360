import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PublishStatus } from "@prisma/client";
import { PrismaService } from "../../common/adapters/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import { CreateNewsArticleDto, UpdateNewsArticleDto } from "./dto/news-admin.dto";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

@Injectable()
export class NewsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listArticles(query: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

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
            select: {
              id: true,
              originalFilename: true,
              originalObjectKey: true,
              thumbnailKey: true,
            },
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
      items: items.map((art: any) => ({
        id: art.id,
        title: art.title,
        slug: art.slug,
        tag: art.tag,
        excerpt: art.excerpt,
        content: art.content,
        contentJson: art.contentJson,
        coverMediaId: art.coverMediaId,
        coverImageUrl: art.coverImageUrl,
        coverMedia: art.coverMedia,
        relatedSceneId: art.relatedSceneId,
        status: art.status,
        publishedAt: art.publishedAt,
        author: art.author,
        createdAt: art.createdAt,
        updatedAt: art.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getArticle(id: string) {
    const art = await this.prisma.newsArticle.findFirst({
      where: { id, deletedAt: null },
      include: {
        coverMedia: true,
        author: { select: { id: true, fullName: true, username: true } },
      },
    });

    if (!art) {
      throw new NotFoundException(`Không tìm thấy bài viết mang ID "${id}".`);
    }

    return art;
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

    // Check duplicate slug
    const duplicate = await this.prisma.newsArticle.findFirst({
      where: { slug: rawSlug, deletedAt: null },
    });
    if (duplicate) {
      throw new ConflictException(`Slug "${rawSlug}" đã được sử dụng bởi bài viết "${duplicate.title}".`);
    }

    // Verify coverMedia if supplied
    let coverImageUrl = dto.coverImageUrl ?? null;
    if (dto.coverMediaId) {
      const media = await this.prisma.mediaAsset.findFirst({
        where: { id: dto.coverMediaId, deletedAt: null },
      });
      if (!media) {
        throw new BadRequestException(`MediaAsset mang ID "${dto.coverMediaId}" không tồn tại.`);
      }
      coverImageUrl = media.thumbnailKey || media.originalObjectKey;
    }

    const isPublished = dto.status === "PUBLISHED";
    const paragraphs = dto.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

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

    return created;
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
          where: { slug: nextSlug, id: { not: id }, deletedAt: null },
        });
        if (dup) {
          throw new ConflictException(`Slug "${nextSlug}" đã được sử dụng.`);
        }
      }
    }

    let coverImageUrl = dto.coverImageUrl !== undefined ? dto.coverImageUrl : existing.coverImageUrl;
    if (dto.coverMediaId !== undefined) {
      if (dto.coverMediaId) {
        const media = await this.prisma.mediaAsset.findFirst({
          where: { id: dto.coverMediaId, deletedAt: null },
        });
        if (!media) {
          throw new BadRequestException(`MediaAsset mang ID "${dto.coverMediaId}" không tồn tại.`);
        }
        coverImageUrl = media.thumbnailKey || media.originalObjectKey;
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

    return updated;
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

    return updated;
  }
}

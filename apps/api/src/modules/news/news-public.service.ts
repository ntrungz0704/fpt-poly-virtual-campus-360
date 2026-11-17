import { Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { PrismaService } from "../../common/adapters/prisma.service";
import { Prisma, PublishStatus } from "@prisma/client";
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from "../storage/storage.adapter";
import { resolvePublicNewsImageUrl } from "./news-media.helper";

@Injectable()
export class NewsPublicService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter?: StorageAdapter,
  ) {}

  async listPublished(query: { page?: number; limit?: number; tag?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: Prisma.NewsArticleWhereInput = {
      deletedAt: null,
      status: PublishStatus.PUBLISHED,
    };

    if (query.tag && query.tag !== "ALL") {
      where.tag = query.tag;
    }

    const [total, items] = await Promise.all([
      this.prisma.newsArticle.count({ where }),
      this.prisma.newsArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          tag: true,
          excerpt: true,
          coverMediaId: true,
          coverImageUrl: true,
          relatedSceneId: true,
          publishedAt: true,
          createdAt: true,
          coverMedia: {
            select: {
              id: true,
              deletedAt: true,
              originalObjectKey: true,
              thumbnailKey: true,
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((art) => ({
        id: art.id,
        slug: art.slug,
        title: art.title,
        tag: art.tag,
        excerpt: art.excerpt,
        imageUrl: resolvePublicNewsImageUrl(art, this.storageAdapter),
        date: art.publishedAt
          ? new Intl.DateTimeFormat("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(new Date(art.publishedAt))
          : "Mới cập nhật",
        publishedAt: art.publishedAt,
        relatedSceneId: art.relatedSceneId,
      })),
      total,
      page,
      limit,
    };
  }

  async getBySlug(slug: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: PublishStatus.PUBLISHED,
      },
      include: {
        coverMedia: {
          select: {
            id: true,
            deletedAt: true,
            originalObjectKey: true,
            thumbnailKey: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Không tìm thấy bài viết "${slug}".`);
    }

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      tag: article.tag,
      excerpt: article.excerpt,
      content: article.content,
      contentJson: Array.isArray(article.contentJson)
        ? article.contentJson
        : [article.content],
      imageUrl: resolvePublicNewsImageUrl(article, this.storageAdapter),
      date: article.publishedAt
        ? new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(new Date(article.publishedAt))
        : "Mới cập nhật",
      publishedAt: article.publishedAt,
      relatedSceneId: article.relatedSceneId,
    };
  }
}

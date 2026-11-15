import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/adapters/prisma.service";
import { PublishStatus } from "@prisma/client";

@Injectable()
export class NewsPublicService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(query: { page?: number; limit?: number; tag?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = {
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
          coverImageUrl: true,
          relatedSceneId: true,
          publishedAt: true,
          createdAt: true,
          coverMedia: {
            select: {
              id: true,
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
        imageUrl:
          art.coverMedia?.thumbnailKey ||
          art.coverMedia?.originalObjectKey ||
          art.coverImageUrl ||
          "/images/locations/building-innovation.jpg",
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
      imageUrl:
        article.coverMedia?.thumbnailKey ||
        article.coverMedia?.originalObjectKey ||
        article.coverImageUrl ||
        "/images/locations/building-innovation.jpg",
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

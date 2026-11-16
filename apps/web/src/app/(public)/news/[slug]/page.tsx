import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { AnimatedContent, FadeContent } from "@/components/animations";
import { CopyLinkButton } from "./CopyLinkButton";
import {
  fetchPublicNewsArticle,
  PublicNewsArticleItem,
} from "@/lib/public/news-public-api";
import { ApiClientError } from "@/lib/auth/api-client";

export const dynamic = "force-dynamic";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  let article: PublicNewsArticleItem | null = null;

  try {
    article = await fetchPublicNewsArticle(slug);
  } catch (err: unknown) {
    if (
      (err instanceof ApiClientError && (err.status === 404 || err.code === "NOT_FOUND")) ||
      (typeof err === "object" && err !== null && (err as { status?: number }).status === 404)
    ) {
      notFound();
    }
    // If backend returns another error (e.g. 500 or network offline), throw to let server error boundary handle
    throw err;
  }

  if (!article) {
    notFound();
  }

  const contentParagraphs: string[] = Array.isArray(article.contentJson)
    ? (article.contentJson as string[])
    : article.content
      ? [article.content]
      : [];

  return (
    <article className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-medium text-secondary flex items-center gap-1.5 flex-wrap"
        >
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/news" className="hover:text-primary">
            Hướng dẫn &amp; Bản tin
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-surface font-semibold line-clamp-1">
            {article.title}
          </span>
        </nav>

        <header className="space-y-3 rb-desktop-rise">
          <div className="flex items-center gap-3">
            <Badge variant="brand">{article.tag}</Badge>
            <span className="text-xs font-medium text-secondary">
              {article.date}
            </span>
          </div>
          <h1 className="type-h1 text-on-surface">{article.title}</h1>
          <p className="type-body-lg text-secondary">{article.excerpt}</p>
        </header>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-surface-container bg-surface-container shadow-elevation-1 rb-desktop-rise-delay">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        <FadeContent delay={0.08}>
          <div className="space-y-4 text-base text-on-surface-variant leading-relaxed pt-2">
            {contentParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </FadeContent>

        <AnimatedContent distance={20}>
          <div className="pt-6 border-t border-surface-container flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/campus?scene=${encodeURIComponent(
                article.relatedSceneId || "cong-chao-qtsc",
              )}`}
              className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2.5 text-sm font-bold"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px]"
              >
                360
              </span>
              <span>Mở không gian 360° liên quan</span>
            </Link>

            <div className="flex items-center gap-3">
              <CopyLinkButton />
              <Link
                href="/news"
                className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2 text-sm font-semibold"
              >
                Danh sách bài viết
              </Link>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </article>
  );
}

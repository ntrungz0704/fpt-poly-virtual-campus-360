import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CAMPUS_GUIDE_ARTICLES } from "@/components/news";
import { Badge, NotFoundState } from "@/components/ui";
import { AnimatedContent, FadeContent } from "@/components/animations";
import { CopyLinkButton } from "./CopyLinkButton";

export function generateStaticParams() {
  return CAMPUS_GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const article = CAMPUS_GUIDE_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <NotFoundState
          title="Không tìm thấy bài hướng dẫn"
          description={`Đường dẫn "/news/${slug}" không tồn tại trong mục hướng dẫn trải nghiệm QTSC.`}
          actionLabel="Về danh sách hướng dẫn"
          actionHref="/news"
          secondaryLabel="Mở Tour 360°"
          secondaryHref="/campus"
        />
      </div>
    );
  }

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
          <span className="text-on-surface font-semibold line-clamp-1">{article.title}</span>
        </nav>

        <header className="space-y-3 rb-desktop-rise">
          <div className="flex items-center gap-3">
            <Badge variant="brand">{article.tag}</Badge>
            <span className="text-xs font-medium text-secondary">{article.date}</span>
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
            {article.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </FadeContent>

        <AnimatedContent distance={20}>
          <div className="pt-6 border-t border-surface-container flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/campus?scene=${encodeURIComponent(article.relatedSceneId)}`}
              className="ui-btn ui-btn-primary min-h-[44px] px-5 py-2.5 text-sm font-bold"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
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

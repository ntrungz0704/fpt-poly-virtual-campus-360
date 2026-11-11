import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { AnimatedContent, SpotlightCard } from "@/components/animations";
import { CampusGuideArticle } from "./news-items";

interface FeaturedArticleCardProps {
  article: CampusGuideArticle;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  return (
    <AnimatedContent distance={26}>
      <SpotlightCard className="rounded-2xl">
        <article className="ui-card ui-card-hover overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[340px] bg-surface-container">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="brand">{article.tag}</Badge>
            <span className="text-xs font-medium text-secondary">{article.date}</span>
          </div>
          <h2 className="type-h2 text-on-surface">
            <Link
              href={`/news/${article.slug}`}
              className="hover:text-primary transition-colors"
            >
              {article.title}
            </Link>
          </h2>
          <p className="type-body text-secondary line-clamp-3">{article.excerpt}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-container-low">
          <Link
            href={`/news/${article.slug}`}
            className="ui-btn ui-btn-primary min-h-[44px] px-4 py-2 text-xs font-bold"
          >
            <span>Đọc hướng dẫn</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </Link>
          <Link
            href={`/campus?scene=${encodeURIComponent(article.relatedSceneId)}`}
            className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2 text-xs font-semibold"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              360
            </span>
            <span>Mở cảnh 360° liên quan</span>
          </Link>
        </div>
      </div>
        </article>
      </SpotlightCard>
    </AnimatedContent>
  );
}

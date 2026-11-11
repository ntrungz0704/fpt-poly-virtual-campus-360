import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { AnimatedContent, SpotlightCard } from "@/components/animations";
import { CampusGuideArticle } from "./news-items";

interface NewsArticleGridProps {
  articles: CampusGuideArticle[];
}

export function NewsArticleGrid({ articles }: NewsArticleGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, index) => (
        <AnimatedContent
          key={article.slug}
          delay={Math.min(index * 0.06, 0.24)}
          distance={24}
          className="h-full"
        >
          <SpotlightCard className="rounded-2xl h-full">
            <article className="group ui-card ui-card-hover flex flex-col justify-between overflow-hidden h-full">
          <div>
            <div className="relative h-48 bg-surface-container overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>

            <div className="p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="neutral">{article.tag}</Badge>
                <span className="text-xs text-secondary">{article.date}</span>
              </div>
              <h3 className="type-h3 text-on-surface line-clamp-2">
                <Link
                  href={`/news/${article.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {article.title}
                </Link>
              </h3>
              <p className="type-body-sm text-secondary line-clamp-2">{article.excerpt}</p>
            </div>
          </div>

          <div className="px-5 py-3.5 border-t border-surface-container-low flex items-center justify-between gap-2">
            <Link
              href={`/news/${article.slug}`}
              className="ui-cta-link text-xs min-h-[36px]"
            >
              <span>Xem chi tiết</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                arrow_forward
              </span>
            </Link>
            <Link
              href={`/campus?scene=${encodeURIComponent(article.relatedSceneId)}`}
              className="text-xs font-semibold text-secondary hover:text-primary transition-colors min-h-[36px] inline-flex items-center"
            >
              Xem 360°
            </Link>
          </div>
            </article>
          </SpotlightCard>
        </AnimatedContent>
      ))}
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { OFFICIAL_CAMPUS_INFO } from "@/data/campus-data";
import {
  CampusGuideArticle,
  FeaturedArticleCard,
  NewsArticleGrid,
} from "@/components/news";
import { EmptyState, ErrorState } from "@/components/ui";
import { FadeContent } from "@/components/animations";
import {
  fetchPublicNews,
  PublicNewsListResponse,
} from "@/lib/public/news-public-api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bản tin Hướng dẫn Trải nghiệm QTSC | FPT Polytechnic Virtual Campus",
  description:
    "Tổng hợp hướng dẫn tham quan Virtual Campus 360° và lịch trình Open Day tại cơ sở CVPM Quang Trung Quận 12.",
};

interface NewsPageProps {
  searchParams: Promise<{
    page?: string;
    tag?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page: rawPage, tag: rawTag } = await searchParams;
  const currentPage = Math.max(1, Number(rawPage) || 1);
  const currentTag = rawTag && rawTag !== "ALL" ? rawTag : undefined;
  const pageSize = 9;

  let newsData: PublicNewsListResponse | null = null;
  let fetchError: string | null = null;

  try {
    newsData = await fetchPublicNews({
      page: currentPage,
      limit: pageSize,
      tag: currentTag,
    });
  } catch (err) {
    fetchError =
      err instanceof Error
        ? err.message
        : "Không thể kết nối đến máy chủ tin tức.";
  }

  const articles: CampusGuideArticle[] = newsData
    ? newsData.items.map((art) => ({
        slug: art.slug,
        tag: art.tag,
        title: art.title,
        excerpt: art.excerpt,
        imageUrl: art.imageUrl,
        date: art.date,
        relatedSceneId: art.relatedSceneId || "cong-chao-qtsc",
        content: Array.isArray(art.contentJson)
          ? (art.contentJson as string[])
          : art.content
            ? [art.content]
            : [],
      }))
    : [];

  const total = newsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [featured, ...rest] = articles;

  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (pageNumber > 1) params.set("page", String(pageNumber));
    if (currentTag) params.set("tag", currentTag);
    const qs = params.toString();
    return `/news${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-surface-container">
          <div className="space-y-2 max-w-2xl rb-desktop-rise">
            <p className="type-label text-primary">Thông tin trải nghiệm QTSC</p>
            <h1 className="type-h1 text-on-surface">
              Cẩm nang Tham quan &amp; Sự kiện Open Day
            </h1>
            <p className="type-body text-secondary">
              Hướng dẫn sử dụng nền tảng tham quan 360° và Bản đồ GIS tại cơ sở{" "}
              {OFFICIAL_CAMPUS_INFO.campusLabel}.
            </p>
          </div>

          <a
            href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-outline min-h-[44px] px-4 py-2 text-xs font-semibold shrink-0 self-start md:self-auto rb-desktop-rise-delay"
          >
            <span>Tin tức chính thức tại caodang.fpt.edu.vn</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              open_in_new
            </span>
          </a>
        </div>

        {/* Notice banner */}
        <FadeContent delay={0.08}>
          <div className="rounded-xl bg-info-container/40 border border-surface-container px-4 py-3.5 text-xs sm:text-sm text-on-surface-variant flex items-start gap-2.5">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
              info
            </span>
            <span>
              Chuyên mục này chỉ cung cấp thông tin định hướng không gian QTSC và Open Day. Mọi thông báo tuyển sinh, quy chế và tin tức toàn trường được đăng chính thức tại{" "}
              <a
                href={OFFICIAL_CAMPUS_INFO.officialSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                caodang.fpt.edu.vn
              </a>
              .
            </span>
          </div>
        </FadeContent>

        {/* Main Content Area */}
        {fetchError ? (
          <div className="py-12">
            <ErrorState
              title="Không thể tải danh sách bài viết"
              description={`Máy chủ phản hồi lỗi: ${fetchError}. Vui lòng thử lại sau.`}
              actionLabel="Tải lại trang"
              actionHref="/news"
            />
          </div>
        ) : articles.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon="article"
              title="Chưa có bài viết nào"
              description={
                currentTag
                  ? `Chưa có bài viết nào thuộc chuyên mục "${currentTag}".`
                  : "Hệ thống tin tức và cẩm nang hiện đang được cập nhật."
              }
              actionLabel={currentTag ? "Xem tất cả bài viết" : undefined}
              actionHref={currentTag ? "/news" : undefined}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {featured && <FeaturedArticleCard article={featured} />}
            {rest.length > 0 && <NewsArticleGrid articles={rest} />}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Phân trang bài viết"
                className="flex items-center justify-between pt-6 border-t border-surface-container"
              >
                <div className="text-sm text-secondary">
                  Hiển thị bài viết trang{" "}
                  <span className="font-semibold text-on-surface">{currentPage}</span>{" "}
                  trên tổng số{" "}
                  <span className="font-semibold text-on-surface">{totalPages}</span>{" "}
                  trang ({total} bài viết)
                </div>

                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageUrl(currentPage - 1)}
                      className="ui-btn ui-btn-outline min-h-[38px] px-3.5 py-1.5 text-xs font-semibold"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        arrow_back
                      </span>
                      <span>Trang trước</span>
                    </Link>
                  ) : (
                    <span className="ui-btn ui-btn-outline min-h-[38px] px-3.5 py-1.5 text-xs font-semibold opacity-40 cursor-not-allowed">
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        arrow_back
                      </span>
                      <span>Trang trước</span>
                    </span>
                  )}

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const isActive = p === currentPage;
                      return (
                        <Link
                          key={p}
                          href={buildPageUrl(p)}
                          className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                            isActive
                              ? "bg-primary text-on-primary font-bold shadow-xs"
                              : "text-secondary hover:text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageUrl(currentPage + 1)}
                      className="ui-btn ui-btn-outline min-h-[38px] px-3.5 py-1.5 text-xs font-semibold"
                    >
                      <span>Trang sau</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </Link>
                  ) : (
                    <span className="ui-btn ui-btn-outline min-h-[38px] px-3.5 py-1.5 text-xs font-semibold opacity-40 cursor-not-allowed">
                      <span>Trang sau</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </span>
                  )}
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

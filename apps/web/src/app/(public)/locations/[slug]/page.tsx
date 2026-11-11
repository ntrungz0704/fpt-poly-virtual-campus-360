import React from "react";
import Link from "next/link";
import {
  AnimatedContent,
  BlurText,
  SpotlightCard,
} from "@/components/animations";
import Image from "next/image";
import { CAMPUS_LOCATIONS } from "@/data/campus-data";
import { Badge, NotFoundState } from "@/components/ui";

export function generateStaticParams() {
  return CAMPUS_LOCATIONS.map((loc) => ({ slug: loc.slug }));
}

interface LocationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { slug } = await params;
  const location = CAMPUS_LOCATIONS.find((item) => item.slug === slug);

  if (!location) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <NotFoundState
          title="Không tìm thấy địa điểm này"
          description={`Đường dẫn "/locations/${slug}" chưa có trong danh mục không gian QTSC Quận 12.`}
          actionLabel="Về danh mục địa điểm"
          actionHref="/locations"
          secondaryLabel="Mở Tour 360°"
          secondaryHref="/campus"
        />
      </div>
    );
  }

  const related = CAMPUS_LOCATIONS.filter(
    (item) => item.slug !== location.slug && item.status === "published"
  ).slice(0, 3);

  return (
    <div className="bg-surface min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-medium text-secondary flex items-center gap-1.5 flex-wrap"
        >
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/locations" className="hover:text-primary">
            Địa điểm
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-surface font-semibold">{location.name}</span>
        </nav>

        {/* Main Detail Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 rb-desktop-rise">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-surface-container bg-surface-container shadow-elevation-1">
              <Image
                src={location.imageUrl}
                alt={location.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 rb-desktop-rise-delay">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">
                {location.buildingName} · {location.floor}
              </Badge>
              <Badge variant="neutral">{location.code}</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="type-h1 text-on-surface">{location.name}</h1>
              <p className="type-body text-secondary leading-relaxed">
                {location.description}
              </p>
            </div>

            <div className="ui-card p-5 space-y-3 bg-surface-container-low/60">
              <h2 className="type-label text-on-surface">Đặc điểm không gian</h2>
              <ul className="space-y-2.5">
                {location.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2.5 text-sm text-on-surface-variant"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5"
                    >
                      check_circle
                    </span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {location.sceneId && (
                <Link
                  href={`/campus?scene=${encodeURIComponent(location.sceneId)}`}
                  className="ui-btn ui-btn-primary min-h-[46px] px-5 py-2.5 text-sm font-bold flex-1 sm:flex-none"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    360
                  </span>
                  <span>Mở góc nhìn 360°</span>
                </Link>
              )}

              <Link
                href={`/map?building=${encodeURIComponent(location.buildingCode)}`}
                className="ui-btn ui-btn-outline min-h-[46px] px-5 py-2.5 text-sm font-semibold flex-1 sm:flex-none"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  map
                </span>
                <span>Định vị trên Bản đồ GIS</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Locations */}
        {related.length > 0 && (
          <section
            aria-labelledby="related-locations-heading"
            className="pt-8 border-t border-surface-container space-y-5"
          >
            <div className="flex items-center justify-between gap-4">
              <BlurText
                as="h2"
                id="related-locations-heading"
                text="Không gian khác trong khuôn viên"
                className="type-h2 text-on-surface"
              />
              <Link
                href="/locations"
                className="ui-cta-link text-sm min-h-[40px]"
              >
                <span>Xem toàn bộ</span>
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((item, index) => (
                <AnimatedContent
                  key={item.id}
                  delay={index * 0.08}
                  distance={24}
                  className="h-full"
                >
                  <SpotlightCard className="rounded-2xl h-full">
                    <Link
                      href={`/locations/${item.slug}`}
                      className="ui-card ui-card-hover overflow-hidden flex flex-col h-full"
                    >
                      <div className="relative h-36 bg-surface-container">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <span className="text-[11px] font-semibold text-primary">
                          {item.buildingName} · {item.code}
                        </span>
                        <h3 className="type-h3 text-on-surface line-clamp-1">{item.name}</h3>
                      </div>
                    </Link>
                  </SpotlightCard>
                </AnimatedContent>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

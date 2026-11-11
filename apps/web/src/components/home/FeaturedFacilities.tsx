import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CAMPUS_LOCATIONS } from "@/data/campus-data";
import { Badge } from "@/components/ui";
import {
  AnimatedContent,
  BlurText,
  FadeContent,
  SpotlightCard,
} from "@/components/animations";

const FEATURED_SLUGS = [
  "sanh-innovation",
  "thu-vien-so-t2",
  "lab-lap-trinh-t301",
  "studio-imac-f402",
];

const FEATURED_ITEMS = FEATURED_SLUGS.map((slug) =>
  CAMPUS_LOCATIONS.find((loc) => loc.slug === slug)
).filter((loc): loc is NonNullable<typeof loc> => Boolean(loc));

export function FeaturedFacilities() {
  return (
    <section
      aria-labelledby="featured-spaces-heading"
      className="py-14 sm:py-16 bg-surface-container-low border-b border-surface-container"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeContent blur={false}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-1.5">
              <p className="type-label text-primary">Không gian tiêu biểu</p>
              <BlurText
                as="h2"
                id="featured-spaces-heading"
                text="Điểm dừng nổi bật tại QTSC"
                className="type-h1 text-on-surface"
              />
            </div>
            <Link
              href="/locations"
              className="ui-cta-link text-sm min-h-[44px] self-start sm:self-auto"
            >
              <span>Xem tất cả {CAMPUS_LOCATIONS.length} địa điểm</span>
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </FadeContent>

        {/* Strict 4-item Card Budget: Image + Tag + Title + Short Desc + Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURED_ITEMS.map((loc, idx) => (
            <AnimatedContent key={loc.id} delay={idx * 0.07} distance={26} className="h-full">
              <SpotlightCard className="h-full rounded-[var(--radius-card)]">
                <article className="group ui-card ui-card-hover h-full flex flex-col justify-between overflow-hidden">
                  <div className="relative z-20">
                    <div className="relative h-44 w-full bg-surface-container overflow-hidden">
                      <Image
                        src={loc.imageUrl}
                        alt={loc.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="brand">{loc.buildingName}</Badge>
                        <span className="text-[11px] font-mono font-semibold text-secondary">
                          {loc.code}
                        </span>
                      </div>
                      <h3 className="type-h3 text-on-surface line-clamp-1">{loc.name}</h3>
                      <p className="type-body-sm text-secondary line-clamp-2">{loc.shortDesc}</p>
                    </div>
                  </div>

                  <div className="relative z-20 px-4 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-surface-container-low">
                    <Link
                      href={`/locations/${loc.slug}`}
                      className="text-xs font-semibold text-on-surface-variant hover:text-primary min-h-[40px] inline-flex items-center transition-colors"
                    >
                      Chi tiết
                    </Link>
                    {loc.sceneId && (
                      <Link
                        href={`/campus?scene=${encodeURIComponent(loc.sceneId)}`}
                        className="ui-cta-link text-xs min-h-[40px]"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                          360
                        </span>
                        <span>Xem 360°</span>
                      </Link>
                    )}
                  </div>
                </article>
              </SpotlightCard>
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  );
}

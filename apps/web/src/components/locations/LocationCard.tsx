import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CampusLocationItem } from "@/data/campus-data";
import { Badge } from "@/components/ui";

interface LocationCardProps {
  location: CampusLocationItem;
}

export function LocationCard({ location }: LocationCardProps) {
  return (
    <article className="group ui-card ui-card-hover flex flex-col justify-between overflow-hidden h-full">
      <div>
        <div className="relative h-48 w-full bg-surface-container overflow-hidden">
          <Image
            src={location.imageUrl}
            alt={location.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="brand">
              {location.buildingName} · {location.floor}
            </Badge>
            <span className="text-xs font-mono font-semibold text-secondary">
              {location.code}
            </span>
          </div>

          <h2 className="type-h3 text-on-surface line-clamp-1">
            <Link
              href={`/locations/${location.slug}`}
              className="hover:text-primary transition-colors"
            >
              {location.name}
            </Link>
          </h2>

          <p className="type-body-sm text-secondary line-clamp-2">
            {location.shortDesc}
          </p>
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-surface-container-low bg-surface-container-low/40 flex items-center justify-between gap-3">
        <Link
          href={`/locations/${location.slug}`}
          className="text-xs font-semibold text-on-surface-variant hover:text-primary min-h-[40px] inline-flex items-center"
        >
          Xem chi tiết
        </Link>

        {location.sceneId ? (
          <Link
            href={`/campus?scene=${encodeURIComponent(location.sceneId)}`}
            className="ui-cta-link text-xs min-h-[40px]"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              360
            </span>
            <span>Xem 360°</span>
          </Link>
        ) : (
          <Link
            href={`/map?building=${encodeURIComponent(location.buildingCode)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-primary min-h-[40px]"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
              map
            </span>
            <span>Định vị GIS</span>
          </Link>
        )}
      </div>
    </article>
  );
}

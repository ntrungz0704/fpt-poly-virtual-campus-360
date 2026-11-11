"use client";

import React, { useMemo, useState } from "react";
import {
  BuildingCode,
  CAMPUS_BUILDINGS,
  CAMPUS_LOCATIONS,
  LocationCategoryKey,
} from "@/data/campus-data";
import { EmptyState } from "@/components/ui";
import { AnimatedContent, SpotlightCard } from "@/components/animations";
import { LocationCard } from "./LocationCard";
import { LocationFilterBar } from "./LocationFilterBar";

interface LocationsExplorerProps {
  initialBuildingParam?: string;
}

function resolveInitialBuilding(param?: string): BuildingCode | "ALL" {
  if (!param) return "ALL";
  const upper = param.trim().toUpperCase();
  const exact = CAMPUS_BUILDINGS.find((b) => b.code === upper);
  if (exact) return exact.code;

  const norm = param.trim().toLowerCase();
  if (norm.includes("innovation")) return "INNOVATION";
  if (norm.includes("tòa t") || norm.includes("tòa nhà t")) return "TOA-T";
  if (norm.includes("tòa f") || norm.includes("tòa nhà f")) return "TOA-F";
  if (norm.includes("thể thao") || norm.includes("sports")) return "SPORTS";
  return "ALL";
}

export function LocationsExplorer({ initialBuildingParam }: LocationsExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LocationCategoryKey>("all");
  const [building, setBuilding] = useState<BuildingCode | "ALL">(() =>
    resolveInitialBuilding(initialBuildingParam)
  );

  const publishedLocations = useMemo(
    () => CAMPUS_LOCATIONS.filter((loc) => loc.status === "published"),
    []
  );

  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return publishedLocations.filter((loc) => {
      if (category !== "all" && loc.category !== category) return false;
      if (building !== "ALL" && loc.buildingCode !== building) return false;
      if (!q) return true;
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.buildingName.toLowerCase().includes(q) ||
        loc.shortDesc.toLowerCase().includes(q)
      );
    });
  }, [publishedLocations, query, category, building]);

  const handleReset = () => {
    setQuery("");
    setCategory("all");
    setBuilding("ALL");
  };

  return (
    <div className="space-y-6">
      <LocationFilterBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        building={building}
        onBuildingChange={setBuilding}
        totalCount={publishedLocations.length}
        filteredCount={filteredLocations.length}
        onReset={handleReset}
      />

      {/* Stable height stage prevents footer jumping when filter narrows results */}
      <div className="min-h-[520px] sm:min-h-[700px] lg:min-h-[846px] flex flex-col">
        {filteredLocations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <EmptyState
              icon="search_off"
              title="Không tìm thấy không gian phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc tòa nhà và phân loại để xem toàn bộ khuôn viên QTSC."
              actionLabel="Đặt lại bộ lọc"
              onAction={handleReset}
              className="w-full max-w-lg"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredLocations.map((location, index) => (
              <AnimatedContent
                key={location.id}
                delay={Math.min(index * 0.05, 0.25)}
                distance={24}
                className="h-full"
              >
                <SpotlightCard className="rounded-2xl h-full">
                  <LocationCard location={location} />
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

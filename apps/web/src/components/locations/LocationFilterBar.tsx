"use client";

import React from "react";
import {
  BuildingCode,
  CAMPUS_BUILDINGS,
  LocationCategoryKey,
} from "@/data/campus-data";
import { SearchInput } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORY_TABS: { key: LocationCategoryKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "common", label: "Không gian chung" },
  { key: "lab", label: "Phòng Lab CNTT" },
  { key: "studio", label: "Studio & Đồ họa" },
];

export interface LocationFilterBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  category: LocationCategoryKey;
  onCategoryChange: (cat: LocationCategoryKey) => void;
  building: BuildingCode | "ALL";
  onBuildingChange: (code: BuildingCode | "ALL") => void;
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
}

export function LocationFilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  building,
  onBuildingChange,
  totalCount,
  filteredCount,
  onReset,
}: LocationFilterBarProps) {
  const isFiltered = query.trim() !== "" || category !== "all" || building !== "ALL";

  return (
    <div className="ui-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <SearchInput
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onClear={() => onQueryChange("")}
          placeholder="Tìm theo tên phòng, mã phòng hoặc tòa nhà..."
          aria-label="Tìm kiếm địa điểm trong khuôn viên"
          containerClassName="w-full lg:max-w-md"
        />

        <div
          role="tablist"
          aria-label="Phân loại không gian"
          className="flex flex-wrap items-center gap-1.5"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCategoryChange(tab.key)}
                className={cn(
                  "min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Building filter chips + Count / Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-container-low">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-secondary mr-1">Tòa nhà:</span>
          <button
            type="button"
            onClick={() => onBuildingChange("ALL")}
            className={cn(
              "min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
              building === "ALL"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-surface text-secondary border-outline-variant hover:border-slate-400"
            )}
          >
            Tất cả
          </button>
          {CAMPUS_BUILDINGS.map((b) => {
            const active = building === b.code;
            return (
              <button
                key={b.code}
                type="button"
                onClick={() => onBuildingChange(b.code)}
                className={cn(
                  "min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-surface text-secondary border-outline-variant hover:border-slate-400"
                )}
              >
                {b.shortName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs text-secondary">
          <span>
            Hiển thị <strong className="text-on-surface">{filteredCount}</strong> / {totalCount} địa điểm
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="text-primary font-semibold hover:underline min-h-[36px] px-1.5 cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

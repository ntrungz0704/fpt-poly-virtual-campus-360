import type {
  BuildingCategory as SharedBuildingCategory,
  MapBuildingIconKey as SharedMapBuildingIconKey,
  TourNodeCategory as SharedTourNodeCategory,
} from "@fpt-campus/shared";
import type {
  BuildingCategory as PrismaBuildingCategory,
  MapBuildingIconKey as PrismaMapBuildingIconKey,
} from "@prisma/client";

const PRISMA_TO_SHARED_CATEGORY: Record<
  PrismaBuildingCategory,
  SharedBuildingCategory
> = {
  ACADEMIC: "academic",
  LAB: "lab",
  FACILITY: "facility",
};

const SHARED_TO_PRISMA_CATEGORY: Record<
  SharedBuildingCategory,
  PrismaBuildingCategory
> = {
  academic: "ACADEMIC",
  lab: "LAB",
  facility: "FACILITY",
};

const PRISMA_TO_SHARED_ICON: Record<
  PrismaMapBuildingIconKey,
  SharedMapBuildingIconKey
> = {
  INNOVATION: "innovation",
  IT_BUILDING: "it-building",
  DESIGN_STUDIO: "design-studio",
  ACADEMIC_HALL: "academic-hall",
  SPORTS: "sports",
};

const SHARED_TO_PRISMA_ICON: Record<
  SharedMapBuildingIconKey,
  PrismaMapBuildingIconKey
> = {
  innovation: "INNOVATION",
  "it-building": "IT_BUILDING",
  "design-studio": "DESIGN_STUDIO",
  "academic-hall": "ACADEMIC_HALL",
  sports: "SPORTS",
};

export function toSharedBuildingCategory(
  value: PrismaBuildingCategory,
): SharedBuildingCategory {
  return PRISMA_TO_SHARED_CATEGORY[value];
}

export function toPrismaBuildingCategory(
  value: SharedBuildingCategory,
): PrismaBuildingCategory {
  return SHARED_TO_PRISMA_CATEGORY[value];
}

export function toSharedMapIconKey(
  value: PrismaMapBuildingIconKey,
): SharedMapBuildingIconKey {
  return PRISMA_TO_SHARED_ICON[value];
}

export function toPrismaMapIconKey(
  value: SharedMapBuildingIconKey,
): PrismaMapBuildingIconKey {
  return SHARED_TO_PRISMA_ICON[value];
}

export function toSharedTourNodeCategory(value: string): SharedTourNodeCategory {
  if (value === "exterior" || value === "study" || value === "lab") {
    return value;
  }
  return "study";
}

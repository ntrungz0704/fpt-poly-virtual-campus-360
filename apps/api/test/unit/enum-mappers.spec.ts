import {
  toPrismaBuildingCategory,
  toPrismaMapIconKey,
  toSharedBuildingCategory,
  toSharedMapIconKey,
  toSharedTourNodeCategory,
} from "../../src/common/utils/enum-mappers";

describe("enum-mappers (R-05 bidirectional normalization)", () => {
  it("maps BuildingCategory losslessly between Prisma uppercase and shared lowercase", () => {
    const pairs = [
      ["ACADEMIC", "academic"],
      ["LAB", "lab"],
      ["FACILITY", "facility"],
    ] as const;

    for (const [prismaVal, sharedVal] of pairs) {
      expect(toSharedBuildingCategory(prismaVal)).toBe(sharedVal);
      expect(toPrismaBuildingCategory(sharedVal)).toBe(prismaVal);
    }
  });

  it("maps MapBuildingIconKey losslessly between Prisma SCREAMING_SNAKE and shared kebab-case", () => {
    const pairs = [
      ["INNOVATION", "innovation"],
      ["IT_BUILDING", "it-building"],
      ["DESIGN_STUDIO", "design-studio"],
      ["ACADEMIC_HALL", "academic-hall"],
      ["SPORTS", "sports"],
    ] as const;

    for (const [prismaVal, sharedVal] of pairs) {
      expect(toSharedMapIconKey(prismaVal)).toBe(sharedVal);
      expect(toPrismaMapIconKey(sharedVal)).toBe(prismaVal);
    }
  });

  it("normalizes TourNodeCategory safely with fallback to study", () => {
    expect(toSharedTourNodeCategory("exterior")).toBe("exterior");
    expect(toSharedTourNodeCategory("study")).toBe("study");
    expect(toSharedTourNodeCategory("lab")).toBe("lab");
    expect(toSharedTourNodeCategory("unknown")).toBe("study");
  });
});

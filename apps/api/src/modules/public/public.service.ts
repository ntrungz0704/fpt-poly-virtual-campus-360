import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DEFAULT_QTSC_CAMPUS_CODE,
  type BuildingCode,
  type CampusGeoPoint,
  type CampusLandmarkItem,
  type FloorPlanDto,
  type GeoLatLngTuple,
  type LocationCategoryGroup,
  type LocationTypeCode,
  type MediaGalleryItemDto,
  type NormCoord2D,
  type PublicBuildingDetailDto,
  type PublicBuildingDto,
  type PublicCampusResponseDto,
  type PublicEventsResponseDto,
  type PublicFloorLocationPinDto,
  type PublicFloorNodePinDto,
  type PublicFloorSummaryDto,
  type PublicLocationDetailDto,
  type PublicLocationSummaryDto,
  type PublicOpenDayFaqDto,
  type PublicOpenDaySessionDto,
  type PublicQuizQuestionDto,
  type PublicTourNodeDetailDto,
  type QuizVerifyItemResultDto,
  type QuizVerifyResponse,
  type TourHotspotDto,
  type TourNodeSummaryDto,
} from "@fpt-campus/shared";
import { Prisma, PublishStatus } from "@prisma/client";
import { PrismaService } from "../../common/adapters/prisma.service";
import {
  toSharedBuildingCategory,
  toSharedMapIconKey,
  toSharedTourNodeCategory,
} from "../../common/utils/enum-mappers";
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from "../storage/storage.adapter";
import type {
  PublicEventsQueryDto,
  PublicLocationsQueryDto,
  PublicTourNodeQueryDto,
  QuizVerifyDto,
} from "./dto/public-query.dto";

const TOUR_NODE_ELIGIBILITY_INCLUDE = {
  panoramaAsset: {
    select: {
      id: true,
      optimizedDesktopKey: true,
      optimizedMobileKey: true,
      thumbnailKey: true,
      isPreviewApproved: true,
      deletedAt: true,
    },
  },
  location: {
    select: {
      id: true,
      slug: true,
      name: true,
      floorId: true,
      status: true,
      deletedAt: true,
      floor: {
        select: {
          id: true,
          name: true,
          status: true,
          deletedAt: true,
        },
      },
      locationType: {
        select: {
          code: true,
        },
      },
      building: {
        select: {
          id: true,
          code: true,
          shortName: true,
          floorsLabel: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  },
} satisfies Prisma.TourNodeInclude;

type EligibleTourNodeCandidate = Prisma.TourNodeGetPayload<{
  include: typeof TOUR_NODE_ELIGIBILITY_INCLUDE;
}>;

const PUBLIC_BUILDING_INCLUDE = {
  coverMedia: {
    select: {
      id: true,
      optimizedDesktopKey: true,
      thumbnailKey: true,
      isPreviewApproved: true,
      deletedAt: true,
    },
  },
  defaultNode: {
    include: TOUR_NODE_ELIGIBILITY_INCLUDE,
  },
  floors: {
    where: {
      status: PublishStatus.PUBLISHED,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  },
} satisfies Prisma.BuildingInclude;

type PublicBuildingRecord = Prisma.BuildingGetPayload<{
  include: typeof PUBLIC_BUILDING_INCLUDE;
}>;

const PUBLIC_LOCATION_SUMMARY_INCLUDE = {
  building: {
    select: {
      id: true,
      code: true,
      name: true,
      floorsLabel: true,
      status: true,
      deletedAt: true,
    },
  },
  floor: {
    select: {
      id: true,
      name: true,
      status: true,
      deletedAt: true,
    },
  },
  locationType: {
    select: {
      code: true,
      filterGroup: true,
    },
  },
  primaryNode: {
    include: TOUR_NODE_ELIGIBILITY_INCLUDE,
  },
  locationMedia: {
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
    include: {
      mediaAsset: {
        select: {
          id: true,
          optimizedDesktopKey: true,
          thumbnailKey: true,
          isPreviewApproved: true,
          deletedAt: true,
        },
      },
    },
  },
} satisfies Prisma.LocationInclude;

type PublicLocationSummaryRecord = Prisma.LocationGetPayload<{
  include: typeof PUBLIC_LOCATION_SUMMARY_INCLUDE;
}>;

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_ADAPTER)
    private readonly storageAdapter: StorageAdapter,
  ) {}

  /**
   * D-2A2-03 mandatory isolation gate:
   * A TourNode is ONLY publicly exposable when it is PUBLISHED, not soft-deleted,
   * its panorama asset is not deleted and `isPreviewApproved === true`,
   * and its parent Location + Building are both PUBLISHED and not soft-deleted.
   */
  private isPublicTourNodeEligible(
    node: EligibleTourNodeCandidate | null | undefined,
  ): node is EligibleTourNodeCandidate {
    if (!node) {
      return false;
    }
    if (node.status !== PublishStatus.PUBLISHED || node.deletedAt !== null) {
      return false;
    }
    if (
      !node.panoramaAsset ||
      node.panoramaAsset.deletedAt !== null ||
      !node.panoramaAsset.isPreviewApproved
    ) {
      return false;
    }
    if (
      !node.location ||
      node.location.status !== PublishStatus.PUBLISHED ||
      node.location.deletedAt !== null
    ) {
      return false;
    }
    if (
      !node.location.building ||
      node.location.building.status !== PublishStatus.PUBLISHED ||
      node.location.building.deletedAt !== null
    ) {
      return false;
    }
    if (
      node.location.floor &&
      (node.location.floor.status !== PublishStatus.PUBLISHED ||
        node.location.floor.deletedAt !== null)
    ) {
      return false;
    }
    return true;
  }

  private safePublicUrl(objectKey: string | null | undefined): string {
    if (!objectKey) {
      return "";
    }
    try {
      return this.storageAdapter.getPublicUrl(objectKey) ?? "";
    } catch {
      return "";
    }
  }

  private safeNullablePublicUrl(
    objectKey: string | null | undefined,
  ): string | null {
    if (!objectKey) {
      return null;
    }
    try {
      return this.storageAdapter.getPublicUrl(objectKey);
    } catch {
      return null;
    }
  }

  private parseStringArray(val: Prisma.JsonValue): string[] {
    if (!Array.isArray(val)) {
      return [];
    }
    return val.filter((item): item is string => typeof item === "string");
  }

  private parseRouteWaypoints(val: Prisma.JsonValue): GeoLatLngTuple[] {
    if (!Array.isArray(val)) {
      return [];
    }
    const tuples: GeoLatLngTuple[] = [];
    for (const item of val) {
      if (
        Array.isArray(item) &&
        item.length === 2 &&
        typeof item[0] === "number" &&
        typeof item[1] === "number"
      ) {
        tuples.push([item[0], item[1]]);
      }
    }
    return tuples;
  }

  private parseNormPolygon(val: Prisma.JsonValue | null): NormCoord2D[] | null {
    if (!Array.isArray(val)) {
      return null;
    }
    const coords: NormCoord2D[] = [];
    for (const item of val) {
      if (
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).x === "number" &&
        typeof (item as Record<string, unknown>).y === "number"
      ) {
        coords.push({
          x: (item as Record<string, number>).x,
          y: (item as Record<string, number>).y,
        });
      }
    }
    return coords;
  }

  private parseCategoryGroup(value: string): LocationCategoryGroup {
    if (value === "lab" || value === "studio" || value === "common") {
      return value;
    }
    return "common";
  }

  private resolveSafeMediaAssetUrl(
    media:
      | {
          optimizedDesktopKey: string | null;
          thumbnailKey: string | null;
          isPreviewApproved: boolean;
          deletedAt: Date | null;
        }
      | null
      | undefined,
  ): string {
    if (!media || media.deletedAt !== null || !media.isPreviewApproved) {
      return "";
    }
    // Strict non-leak rule: NEVER return originalObjectKey in public DTOs.
    return this.safePublicUrl(media.optimizedDesktopKey ?? media.thumbnailKey);
  }

  private mapBuildingDto(
    building: PublicBuildingRecord,
    publishedNodeCount: number,
  ): PublicBuildingDto {
    const defaultNodeSlug = this.isPublicTourNodeEligible(building.defaultNode)
      ? building.defaultNode.slug
      : null;

    return {
      id: building.id,
      code: building.code as BuildingCode,
      slug: building.slug,
      name: building.name,
      shortName: building.shortName,
      category: toSharedBuildingCategory(building.category),
      categoryLabel: building.categoryLabel,
      floorsLabel: building.floorsLabel,
      summary: building.summary,
      description: building.description,
      highlights: this.parseStringArray(building.highlightsJson),
      coverUrl: this.resolveSafeMediaAssetUrl(building.coverMedia),
      defaultNodeSlug,
      lat: building.lat,
      lng: building.lng,
      addressNote: building.addressNote,
      statusNote: building.statusNote,
      mapIconKey: toSharedMapIconKey(building.mapIconKey),
      routeWaypoints: this.parseRouteWaypoints(building.routeWaypointsJson),
      gisX: building.gisX,
      gisY: building.gisY,
      floorCount: building.floors.length,
      publishedNodeCount,
    };
  }

  private async countPublishedNodesByBuildingIds(
    buildingIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (buildingIds.length === 0) {
      return counts;
    }

    const eligibleNodes = await this.prisma.tourNode.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
        panoramaAsset: {
          isPreviewApproved: true,
          deletedAt: null,
        },
        location: {
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
          buildingId: { in: buildingIds },
          building: {
            status: PublishStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
      include: TOUR_NODE_ELIGIBILITY_INCLUDE,
    });

    for (const node of eligibleNodes) {
      if (!this.isPublicTourNodeEligible(node)) {
        continue;
      }
      const bId = node.location.building.id;
      counts.set(bId, (counts.get(bId) ?? 0) + 1);
    }

    return counts;
  }

  private mapLocationSummary(
    loc: PublicLocationSummaryRecord,
  ): PublicLocationSummaryDto {
    const approvedMedia = loc.locationMedia.filter(
      (item) =>
        item.mediaAsset.deletedAt === null &&
        item.mediaAsset.isPreviewApproved,
    );
    const coverItem = approvedMedia[0];
    const imageUrl = coverItem
      ? this.resolveSafeMediaAssetUrl(coverItem.mediaAsset)
      : "";
    const primaryNodeSlug = this.isPublicTourNodeEligible(loc.primaryNode)
      ? loc.primaryNode.slug
      : null;

    return {
      id: loc.id,
      slug: loc.slug,
      code: loc.code,
      name: loc.name,
      buildingCode: loc.building.code as BuildingCode,
      buildingName: loc.building.name,
      floorLabel: loc.floor?.name ?? loc.building.floorsLabel,
      typeCode: loc.locationType.code as LocationTypeCode,
      category: this.parseCategoryGroup(loc.locationType.filterGroup),
      categoryLabel: loc.categoryLabel,
      shortDesc: loc.shortSummary,
      description: loc.description,
      highlights: this.parseStringArray(loc.highlightsJson),
      imageUrl,
      primaryNodeSlug,
      isPublicAccessible: loc.isPublicAccessible,
      restrictionNote: loc.restrictionNote,
      status: loc.status,
    };
  }

  private mapTourNodeSummary(
    node: EligibleTourNodeCandidate,
    quality: "desktop" | "mobile" = "desktop",
  ): TourNodeSummaryDto {
    const desktopUrl = this.safeNullablePublicUrl(
      node.panoramaAsset.optimizedDesktopKey,
    );
    const mobileUrl = this.safeNullablePublicUrl(
      node.panoramaAsset.optimizedMobileKey,
    );
    const thumbUrl = this.safePublicUrl(node.panoramaAsset.thumbnailKey);

    const panoramaUrl =
      quality === "mobile"
        ? (mobileUrl ?? desktopUrl ?? "")
        : (desktopUrl ?? mobileUrl ?? "");

    return {
      id: node.id,
      slug: node.slug,
      title: node.title,
      intro: node.intro,
      category: toSharedTourNodeCategory(node.category),
      buildingCode: node.location.building.code as BuildingCode,
      buildingLabel: node.location.building.shortName,
      floorLabel:
        node.location.floor?.name ?? node.location.building.floorsLabel,
      thumbUrl,
      panoramaUrl,
      fallbackMobileUrl: mobileUrl,
      initialYaw: node.initialYaw,
      initialPitch: node.initialPitch,
      initialFov: node.initialFov,
      headingOffsetDeg: node.headingOffsetDeg,
      floorPlanId: node.floorPlanId,
      floorNormX: node.floorNormX,
      floorNormY: node.floorNormY,
      linkedLocationSlug: node.location.slug,
      status: node.status,
    };
  }

  private parseCampusGeoPoint(val: Prisma.JsonValue): CampusGeoPoint {
    const obj = (typeof val === "object" && val !== null ? val : {}) as Record<
      string,
      unknown
    >;
    return {
      lat: typeof obj.lat === "number" ? obj.lat : 0,
      lng: typeof obj.lng === "number" ? obj.lng : 0,
      label: typeof obj.label === "string" ? obj.label : "",
      addressNote: typeof obj.addressNote === "string" ? obj.addressNote : "",
    };
  }

  private parseCampusLandmarks(val: Prisma.JsonValue): CampusLandmarkItem[] {
    if (!Array.isArray(val)) {
      return [];
    }
    return val
      .filter(
        (item): item is Prisma.JsonObject =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
      .map((item) => ({
        id: typeof item.id === "string" ? item.id : "",
        label: typeof item.label === "string" ? item.label : "",
        sublabel: typeof item.sublabel === "string" ? item.sublabel : "",
        lat: typeof item.lat === "number" ? item.lat : 0,
        lng: typeof item.lng === "number" ? item.lng : 0,
      }));
  }

  async getCampus(): Promise<PublicCampusResponseDto> {
    const campus =
      (await this.prisma.campus.findFirst({
        where: {
          code: DEFAULT_QTSC_CAMPUS_CODE,
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
        },
        include: {
          defaultEntryNode: {
            include: TOUR_NODE_ELIGIBILITY_INCLUDE,
          },
        },
      })) ??
      (await this.prisma.campus.findFirst({
        where: {
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
        },
        include: {
          defaultEntryNode: {
            include: TOUR_NODE_ELIGIBILITY_INCLUDE,
          },
        },
      }));

    if (!campus) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy thông tin campus công khai.",
      });
    }

    const buildings = await this.prisma.building.findMany({
      where: {
        campusId: campus.id,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: PUBLIC_BUILDING_INCLUDE,
    });

    const nodeCounts = await this.countPublishedNodesByBuildingIds(
      buildings.map((b) => b.id),
    );

    const defaultEntryNodeSlug = this.isPublicTourNodeEligible(
      campus.defaultEntryNode,
    )
      ? campus.defaultEntryNode.slug
      : null;

    return {
      campus: {
        id: campus.id,
        code: campus.code,
        name: campus.name,
        address: campus.address,
        defaultEntryNodeSlug,
        originPoint: this.parseCampusGeoPoint(campus.originPointJson),
        landmarks: this.parseCampusLandmarks(campus.landmarksJson),
      },
      buildings: buildings.map((b) =>
        this.mapBuildingDto(b, nodeCounts.get(b.id) ?? 0),
      ),
    };
  }

  async getBuildingBySlug(slug: string): Promise<PublicBuildingDetailDto> {
    const building = await this.prisma.building.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      include: PUBLIC_BUILDING_INCLUDE,
    });

    if (!building) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy tòa nhà công khai.",
      });
    }

    const nodeCounts = await this.countPublishedNodesByBuildingIds([building.id]);
    const floors = await this.findPublishedFloorsByBuildingId(building.id);

    return {
      building: this.mapBuildingDto(building, nodeCounts.get(building.id) ?? 0),
      floors,
    };
  }

  async getBuildingFloors(slug: string): Promise<PublicFloorSummaryDto[]> {
    const building = await this.prisma.building.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!building) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy tòa nhà công khai.",
      });
    }

    return this.findPublishedFloorsByBuildingId(building.id);
  }

  private async findPublishedFloorsByBuildingId(
    buildingId: string,
  ): Promise<PublicFloorSummaryDto[]> {
    const floors = await this.prisma.floor.findMany({
      where: {
        buildingId,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      orderBy: [{ levelIndex: "asc" }, { code: "asc" }],
      include: {
        activeFloorPlan: true,
        locations: {
          where: {
            status: PublishStatus.PUBLISHED,
            deletedAt: null,
          },
          orderBy: [{ code: "asc" }, { name: "asc" }],
          include: {
            locationType: {
              select: {
                filterGroup: true,
              },
            },
            primaryNode: {
              include: TOUR_NODE_ELIGIBILITY_INCLUDE,
            },
            tourNodes: {
              orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
              include: TOUR_NODE_ELIGIBILITY_INCLUDE,
            },
          },
        },
      },
    });

    return floors.map((floor) => {
      let activeFloorPlan: FloorPlanDto | null = null;
      if (floor.activeFloorPlan) {
        activeFloorPlan = {
          id: floor.activeFloorPlan.id,
          version: floor.activeFloorPlan.version,
          sourceFormat: floor.activeFloorPlan.sourceFormat,
          // Strict non-leak rule: expose renderObjectKey / thumbnailObjectKey, NEVER sourceObjectKey
          renderUrl: this.safePublicUrl(floor.activeFloorPlan.renderObjectKey),
          thumbUrl: this.safeNullablePublicUrl(
            floor.activeFloorPlan.thumbnailObjectKey,
          ),
          renderWidth: floor.activeFloorPlan.renderWidth,
          renderHeight: floor.activeFloorPlan.renderHeight,
          northOffsetDeg: floor.activeFloorPlan.northOffsetDeg,
          processingStatus: floor.activeFloorPlan.processingStatus,
        };
      }

      const locationPins: PublicFloorLocationPinDto[] = floor.locations.map(
        (loc) => ({
          id: loc.id,
          slug: loc.slug,
          code: loc.code,
          name: loc.name,
          shortDesc: loc.shortSummary,
          category: this.parseCategoryGroup(loc.locationType.filterGroup),
          categoryLabel: loc.categoryLabel,
          floorNormX: loc.floorNormX,
          floorNormY: loc.floorNormY,
          floorPolygonNorm: this.parseNormPolygon(loc.floorPolygonNorm),
          isPublicAccessible: loc.isPublicAccessible,
          restrictionNote: loc.restrictionNote,
          primaryNodeSlug: this.isPublicTourNodeEligible(loc.primaryNode)
            ? loc.primaryNode.slug
            : null,
        }),
      );

      const nodePins: PublicFloorNodePinDto[] = floor.locations
        .flatMap((loc) => loc.tourNodes)
        .filter((node) => this.isPublicTourNodeEligible(node))
        .map((node) => ({
          id: node.id,
          slug: node.slug,
          title: node.title,
          locationId: node.locationId,
          floorPlanId: node.floorPlanId,
          floorNormX: node.floorNormX,
          floorNormY: node.floorNormY,
          headingOffsetDeg: node.headingOffsetDeg,
          thumbUrl: this.safePublicUrl(node.panoramaAsset.thumbnailKey),
        }));

      return {
        id: floor.id,
        code: floor.code,
        name: floor.name,
        levelIndex: floor.levelIndex,
        requiresFloorPlan: floor.requiresFloorPlan,
        activeFloorPlan,
        locations: locationPins,
        nodes: nodePins,
      };
    });
  }

  async listLocations(
    query: PublicLocationsQueryDto,
  ): Promise<PublicLocationSummaryDto[]> {
    const trimmedSearch = query.q?.trim();
    const locationTypeFilter: Prisma.LocationTypeWhereInput = {};
    if (query.category && query.category !== "all") {
      locationTypeFilter.filterGroup = query.category;
    }
    if (query.typeCode) {
      locationTypeFilter.code = query.typeCode;
    }

    const locations = await this.prisma.location.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
        building: {
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
          ...(query.buildingCode ? { code: query.buildingCode } : {}),
        },
        ...(Object.keys(locationTypeFilter).length > 0
          ? { locationType: locationTypeFilter }
          : {}),
        ...(trimmedSearch
          ? {
              OR: [
                { name: { contains: trimmedSearch, mode: "insensitive" } },
                { code: { contains: trimmedSearch, mode: "insensitive" } },
                {
                  shortSummary: {
                    contains: trimmedSearch,
                    mode: "insensitive",
                  },
                },
                {
                  categoryLabel: {
                    contains: trimmedSearch,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ building: { sortOrder: "asc" } }, { code: "asc" }],
      include: PUBLIC_LOCATION_SUMMARY_INCLUDE,
    });

    return locations.map((loc) => this.mapLocationSummary(loc));
  }

  async getLocationBySlug(slug: string): Promise<PublicLocationDetailDto> {
    const location = await this.prisma.location.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
        building: {
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
        },
      },
      include: {
        ...PUBLIC_LOCATION_SUMMARY_INCLUDE,
        tourNodes: {
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          include: TOUR_NODE_ELIGIBILITY_INCLUDE,
        },
      },
    });

    if (!location) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy địa điểm công khai.",
      });
    }

    const summary = this.mapLocationSummary(location);

    const gallery: MediaGalleryItemDto[] = location.locationMedia
      .filter(
        (item) =>
          item.mediaAsset.deletedAt === null &&
          item.mediaAsset.isPreviewApproved,
      )
      .map((item) => ({
        id: item.mediaAsset.id,
        url: this.resolveSafeMediaAssetUrl(item.mediaAsset),
        thumbUrl: this.safeNullablePublicUrl(item.mediaAsset.thumbnailKey),
        isCover: item.isCover,
        caption: item.caption,
      }));

    const tourNodes = location.tourNodes
      .filter((node) => this.isPublicTourNodeEligible(node))
      .map((node) => ({
        id: node.id,
        slug: node.slug,
        title: node.title,
        thumbUrl: this.safePublicUrl(node.panoramaAsset.thumbnailKey),
      }));

    return {
      ...summary,
      gallery,
      tourNodes,
    };
  }

  async listTourNodes(): Promise<TourNodeSummaryDto[]> {
    const nodes = await this.prisma.tourNode.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
        panoramaAsset: {
          isPreviewApproved: true,
          deletedAt: null,
        },
        location: {
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
          building: {
            status: PublishStatus.PUBLISHED,
            deletedAt: null,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: TOUR_NODE_ELIGIBILITY_INCLUDE,
    });

    return nodes
      .filter((node) => this.isPublicTourNodeEligible(node))
      .map((node) => this.mapTourNodeSummary(node, "desktop"));
  }

  async getTourNodeBySlug(
    slug: string,
    query: PublicTourNodeQueryDto,
  ): Promise<PublicTourNodeDetailDto> {
    const node = await this.prisma.tourNode.findFirst({
      where: { slug },
      include: {
        ...TOUR_NODE_ELIGIBILITY_INCLUDE,
        location: {
          select: {
            ...TOUR_NODE_ELIGIBILITY_INCLUDE.location.select,
            tourNodes: {
              orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
              include: TOUR_NODE_ELIGIBILITY_INCLUDE,
            },
          },
        },
        hotspots: {
          orderBy: { createdAt: "asc" },
          include: {
            edge: {
              include: {
                toNode: {
                  include: TOUR_NODE_ELIGIBILITY_INCLUDE,
                },
              },
            },
          },
        },
      },
    });

    if (!this.isPublicTourNodeEligible(node)) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Không tìm thấy điểm tham quan 360° công khai.",
      });
    }

    const siblingNodes = node.location.tourNodes
      .filter((sibling) => this.isPublicTourNodeEligible(sibling))
      .map((sibling) => ({
        slug: sibling.slug,
        title: sibling.title,
      }));

    const hotspots: TourHotspotDto[] = [];
    for (const hotspot of node.hotspots) {
      if (hotspot.hotspotType === "SCENE_LINK") {
        // D-2A2-03: Never expose or emit SCENE_LINK targeting DRAFT/unapproved/soft-deleted TourNode
        if (!hotspot.edge || !this.isPublicTourNodeEligible(hotspot.edge.toNode)) {
          continue;
        }
        hotspots.push({
          id: hotspot.id,
          hotspotType: hotspot.hotspotType,
          edgeType: hotspot.edge.edgeType,
          yaw: hotspot.yaw,
          pitch: hotspot.pitch,
          title: hotspot.title,
          body: hotspot.body,
          targetNodeSlug: hotspot.edge.toNode.slug,
          targetEntryYaw: hotspot.edge.targetEntryYaw,
          targetEntryPitch: hotspot.edge.targetEntryPitch,
          targetFloorId: hotspot.edge.toNode.location.floorId,
          payload: this.sanitizeHotspotPayload(hotspot.payloadJson),
        });
      } else {
        hotspots.push({
          id: hotspot.id,
          hotspotType: hotspot.hotspotType,
          edgeType: null,
          yaw: hotspot.yaw,
          pitch: hotspot.pitch,
          title: hotspot.title,
          body: hotspot.body,
          targetNodeSlug: null,
          targetEntryYaw: null,
          targetEntryPitch: null,
          targetFloorId: null,
          payload: this.sanitizeHotspotPayload(hotspot.payloadJson),
        });
      }
    }

    return {
      node: this.mapTourNodeSummary(node, query.quality ?? "desktop"),
      location: {
        id: node.location.id,
        slug: node.location.slug,
        name: node.location.name,
        typeCode: node.location.locationType.code as LocationTypeCode,
        buildingCode: node.location.building.code as BuildingCode,
        floorId: node.location.floorId,
        siblingNodes,
      },
      hotspots,
    };
  }

  private sanitizeHotspotPayload(
    payloadJson: Prisma.JsonValue | null,
  ): Record<string, unknown> | null {
    if (
      typeof payloadJson !== "object" ||
      payloadJson === null ||
      Array.isArray(payloadJson)
    ) {
      return null;
    }
    const copy = { ...(payloadJson as Record<string, unknown>) };
    delete copy.correctIndex;
    delete copy.explanation;
    return copy;
  }

  async getEvents(query: PublicEventsQueryDto): Promise<PublicEventsResponseDto> {
    const event = query.eventKey
      ? await this.prisma.openDayEvent.findFirst({
          where: {
            eventKey: query.eventKey,
            status: PublishStatus.PUBLISHED,
            deletedAt: null,
          },
        })
      : ((await this.prisma.openDayEvent.findFirst({
          where: {
            isDefault: true,
            status: PublishStatus.PUBLISHED,
            deletedAt: null,
          },
        })) ??
        (await this.prisma.openDayEvent.findFirst({
          where: {
            status: PublishStatus.PUBLISHED,
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
        })));

    let sessions: PublicOpenDaySessionDto[] = [];
    let faqs: PublicOpenDayFaqDto[] = [];

    if (event) {
      // D-2A2-03 §3.3 (CRITICAL): Public endpoint MUST ONLY return sessions where isPublic === true
      const rawSessions = await this.prisma.openDaySession.findMany({
        where: {
          eventId: event.id,
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
          isPublic: true,
        },
        orderBy: [{ sortOrder: "asc" }, { startTimeLabel: "asc" }],
        include: {
          building: {
            select: {
              code: true,
              status: true,
              deletedAt: true,
            },
          },
          tourNode: {
            include: TOUR_NODE_ELIGIBILITY_INCLUDE,
          },
        },
      });

      sessions = rawSessions.map((session) => {
        const safeBuildingCode =
          session.building &&
          session.building.status === PublishStatus.PUBLISHED &&
          session.building.deletedAt === null
            ? (session.building.code as BuildingCode)
            : "INNOVATION";

        return {
          id: session.id,
          eventId: session.eventId,
          period: session.sessionPeriod,
          timeRange: session.timeRangeLabel,
          title: session.title,
          description: session.description,
          buildingCode: safeBuildingCode,
          locationLabel: session.customLocationLabel,
          nodeSlug: this.isPublicTourNodeEligible(session.tourNode)
            ? session.tourNode.slug
            : null,
          accessType: "public",
          hostUnit: session.hostUnit,
          sortOrder: session.sortOrder,
        };
      });

      const rawFaqs = await this.prisma.openDayFaq.findMany({
        where: {
          eventId: event.id,
          status: PublishStatus.PUBLISHED,
          deletedAt: null,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      faqs = rawFaqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
      }));
    }

    // D-2A2-03 §3.4: Query OpenDayQuizItem without inferring non-existent eventId column,
    // NEVER leak correctIndex or explanation, and mask tourNodeSlug when node is not eligible.
    const rawQuizzes = await this.prisma.openDayQuizItem.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        questionText: true,
        optionsJson: true,
        tourNode: {
          include: TOUR_NODE_ELIGIBILITY_INCLUDE,
        },
      },
    });

    const quizItems: PublicQuizQuestionDto[] = rawQuizzes.map((quiz) => ({
      id: quiz.id,
      tourNodeSlug: this.isPublicTourNodeEligible(quiz.tourNode)
        ? quiz.tourNode.slug
        : null,
      questionText: quiz.questionText,
      options: this.parseStringArray(quiz.optionsJson),
    }));

    return {
      event: event
        ? {
            id: event.id,
            eventKey: event.eventKey,
            title: event.title,
            subtitle: event.subtitle,
            dateLabel: event.dateLabel,
            timeLabel: event.timeLabel,
            eventDate: event.eventDate ? event.eventDate.toISOString() : null,
          }
        : null,
      sessions,
      faqs,
      quizItems,
    };
  }

  /**
   * Stateless quiz answer verification (OD-08): evaluates answers directly against
   * published quiz items without persisting quiz submissions or lead data.
   */
  async verifyQuiz(dto: QuizVerifyDto): Promise<QuizVerifyResponse> {
    const questionIds = Array.from(new Set(dto.items.map((item) => item.questionId)));

    const publishedQuizzes = await this.prisma.openDayQuizItem.findMany({
      where: {
        id: { in: questionIds },
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
        optionsJson: true,
        correctIndex: true,
        explanation: true,
      },
    });

    const quizById = new Map(publishedQuizzes.map((quiz) => [quiz.id, quiz]));

    const results: QuizVerifyItemResultDto[] = [];
    let correctCount = 0;

    for (const item of dto.items) {
      const quiz = quizById.get(item.questionId);
      if (!quiz) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: `Không tìm thấy câu hỏi quiz công khai: ${item.questionId}.`,
        });
      }

      const options = this.parseStringArray(quiz.optionsJson);
      if (item.selectedIndex < 0 || item.selectedIndex >= options.length) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: `Lựa chọn đáp án không hợp lệ cho câu hỏi ${item.questionId}.`,
        });
      }

      const isCorrect = item.selectedIndex === quiz.correctIndex;
      if (isCorrect) {
        correctCount += 1;
      }

      results.push({
        questionId: quiz.id,
        selectedIndex: item.selectedIndex,
        isCorrect,
        correctIndex: quiz.correctIndex,
        explanation: quiz.explanation,
      });
    }

    return {
      results,
      correctCount,
      total: results.length,
    };
  }
}

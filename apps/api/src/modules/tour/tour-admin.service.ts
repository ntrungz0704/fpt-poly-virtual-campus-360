import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/adapters/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import type { AuthenticatedUser } from "../../common/decorators/auth.decorators";
import type {
  BatchTourStudioDto,
  CreateTourNodeDto,
  SaveHotspotDto,
  UpdateTourNodeDto,
} from "./dto/tour-admin.dto";
import { HotspotType, Prisma, PublishStatus } from "@prisma/client";

@Injectable()
export class TourAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * List all tour nodes in admin CMS with panorama assets and hotspots.
   */
  async listNodes() {
    return this.prisma.tourNode.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      include: {
        panoramaAsset: {
          select: {
            id: true,
            originalObjectKey: true,
            optimizedDesktopKey: true,
            thumbnailKey: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            building: { select: { id: true, code: true, name: true } },
          },
        },
        hotspots: true,
      },
    });
  }

  /**
   * Get detail of a specific tour node by ID or slug.
   */
  async getNode(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const node = await this.prisma.tourNode.findFirst({
      where: isUuid
        ? { id: idOrSlug, deletedAt: null }
        : { slug: idOrSlug, deletedAt: null },
      include: {
        panoramaAsset: true,
        location: { include: { building: true } },
        hotspots: {
          include: {
            edge: {
              include: {
                toNode: {
                  select: { id: true, slug: true, title: true },
                },
              },
            },
          },
        },
      },
    });

    if (!node) {
      throw new NotFoundException(`Tour node ${idOrSlug} not found.`);
    }

    return node;
  }

  /**
   * Create a new tour node / scene.
   */
  async createNode(user: AuthenticatedUser, dto: CreateTourNodeDto) {
    // Check slug uniqueness
    const existing = await this.prisma.tourNode.findFirst({
      where: { slug: dto.slug, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Slug '${dto.slug}' already exists.`);
    }

    // Default location fallback if not provided
    let locationId = dto.locationId;
    if (!locationId) {
      const defaultLoc = await this.prisma.location.findFirst({
        where: { deletedAt: null },
      });
      if (!defaultLoc) {
        throw new BadRequestException(
          "No location found in database. Please create a location first.",
        );
      }
      locationId = defaultLoc.id;
    }

    const created = await this.prisma.tourNode.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        intro: dto.intro,
        category: dto.category ?? "study",
        locationId,
        panoramaAssetId: dto.panoramaAssetId,
        initialYaw: dto.initialYaw ?? 0,
        initialPitch: dto.initialPitch ?? 0,
        initialFov: dto.initialFov ?? 75,
        status: PublishStatus.DRAFT,
      },
      include: {
        panoramaAsset: true,
        location: true,
        hotspots: true,
      },
    });

    await this.auditLog.record({
      action: "TOUR_NODE_CREATE",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "TourNode",
      resourceId: created.id,
      diffJson: { title: dto.title, slug: dto.slug },
    });

    return created;
  }

  /**
   * Update tour node parameters (angles, FOV, titles, status).
   */
  async updateNode(user: AuthenticatedUser, id: string, dto: UpdateTourNodeDto) {
    const existing = await this.prisma.tourNode.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Tour node with ID ${id} not found.`);
    }

    const updated = await this.prisma.tourNode.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.intro !== undefined ? { intro: dto.intro } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.initialYaw !== undefined ? { initialYaw: dto.initialYaw } : {}),
        ...(dto.initialPitch !== undefined
          ? { initialPitch: dto.initialPitch }
          : {}),
        ...(dto.initialFov !== undefined ? { initialFov: dto.initialFov } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.status !== undefined
          ? { status: dto.status as PublishStatus }
          : {}),
      },
      include: {
        panoramaAsset: true,
        location: true,
        hotspots: true,
      },
    });

    await this.auditLog.record({
      action: "TOUR_NODE_UPDATE",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "TourNode",
      resourceId: id,
      diffJson: dto as Record<string, unknown>,
    });

    return updated;
  }

  /**
   * Add or update a hotspot on a tour node.
   */
  async saveHotspot(
    user: AuthenticatedUser,
    nodeId: string,
    dto: SaveHotspotDto,
  ) {
    const node = await this.prisma.tourNode.findUnique({
      where: { id: nodeId },
    });
    if (!node || node.deletedAt) {
      throw new NotFoundException(`Tour node ${nodeId} not found.`);
    }

    let hotspot;
    if (dto.id) {
      hotspot = await this.prisma.hotspot.update({
        where: { id: dto.id },
        data: {
          yaw: dto.yaw,
          pitch: dto.pitch,
          title: dto.title,
          body: dto.body ?? null,
          hotspotType: dto.hotspotType as HotspotType,
        },
      });
    } else {
      hotspot = await this.prisma.hotspot.create({
        data: {
          nodeId,
          yaw: dto.yaw,
          pitch: dto.pitch,
          title: dto.title,
          body: dto.body ?? null,
          hotspotType: dto.hotspotType as HotspotType,
        },
      });
    }

    await this.auditLog.record({
      action: dto.id ? "HOTSPOT_UPDATE" : "HOTSPOT_CREATE",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "Hotspot",
      resourceId: hotspot.id,
      diffJson: { nodeId, yaw: dto.yaw, pitch: dto.pitch, title: dto.title },
    });

    return hotspot;
  }

  /**
   * Delete a hotspot.
   */
  async deleteHotspot(
    user: AuthenticatedUser,
    nodeId: string,
    hotspotId: string,
  ) {
    const hotspot = await this.prisma.hotspot.findFirst({
      where: { id: hotspotId, nodeId },
    });
    if (!hotspot) {
      throw new NotFoundException(
        `Hotspot ${hotspotId} not found on node ${nodeId}.`,
      );
    }

    await this.prisma.hotspot.delete({ where: { id: hotspotId } });

    await this.auditLog.record({
      action: "HOTSPOT_DELETE",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "Hotspot",
      resourceId: hotspotId,
      diffJson: { nodeId, title: hotspot.title },
    });

    return { success: true, deletedId: hotspotId };
  }

  /**
   * Batch save entire Tour Studio configuration directly into PostgreSQL.
   */
  async batchSaveStudio(user: AuthenticatedUser, dto: BatchTourStudioDto) {
    const results = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const savedNodes = [];

      for (const scene of dto.scenes) {
        // Find existing node by slug
        let node = await tx.tourNode.findFirst({
          where: { slug: scene.slug, deletedAt: null },
        });

        if (node) {
          node = await tx.tourNode.update({
            where: { id: node.id },
            data: {
              title: scene.title,
              intro: scene.description ?? node.intro,
              initialYaw: scene.initialYaw ?? node.initialYaw,
              initialPitch: scene.initialPitch ?? node.initialPitch,
            },
          });
        }

        if (node && scene.hotspots && scene.hotspots.length > 0) {
          for (const hs of scene.hotspots) {
            if (hs.id) {
              const existingHs = await tx.hotspot.findUnique({
                where: { id: hs.id },
              });
              if (existingHs) {
                await tx.hotspot.update({
                  where: { id: hs.id },
                  data: {
                    yaw: hs.yaw,
                    pitch: hs.pitch,
                    title: hs.title,
                    body: hs.body ?? null,
                    hotspotType: hs.hotspotType as HotspotType,
                  },
                });
                continue;
              }
            }

            // Create new hotspot
            await tx.hotspot.create({
              data: {
                nodeId: node.id,
                yaw: hs.yaw,
                pitch: hs.pitch,
                title: hs.title,
                body: hs.body ?? null,
                hotspotType: hs.hotspotType as HotspotType,
              },
            });
          }
        }

        if (node) {
          savedNodes.push(node);
        }
      }

      return savedNodes;
    });

    await this.auditLog.record({
      action: "TOUR_STUDIO_BATCH_SAVE",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "TourStudio",
      resourceId: null,
      diffJson: { sceneCount: dto.scenes.length, savedCount: results.length },
    });

    return {
      success: true,
      message: `Đã lưu thành công ${results.length} cảnh tham quan vào CSDL.`,
      savedCount: results.length,
    };
  }

  /**
   * Publish tour node (or all nodes).
   */
  async publishTour(user: AuthenticatedUser, nodeIds?: string[]) {
    const whereClause =
      nodeIds && nodeIds.length > 0
        ? { id: { in: nodeIds }, deletedAt: null }
        : { deletedAt: null };

    const result = await this.prisma.tourNode.updateMany({
      where: whereClause,
      data: { status: PublishStatus.PUBLISHED },
    });

    await this.auditLog.record({
      action: "TOUR_PUBLISH",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "TourNode",
      resourceId: null,
      diffJson: { publishedCount: result.count },
    });

    return {
      success: true,
      message: `Đã xuất bản ${result.count} cảnh 360° lên cổng công khai Virtual Campus!`,
      publishedCount: result.count,
    };
  }

  /**
   * Unpublish tour nodes back to DRAFT for maintenance.
   */
  async unpublishTour(user: AuthenticatedUser, nodeIds?: string[]) {
    const whereClause =
      nodeIds && nodeIds.length > 0
        ? { id: { in: nodeIds }, deletedAt: null }
        : { deletedAt: null };

    const result = await this.prisma.tourNode.updateMany({
      where: whereClause,
      data: { status: PublishStatus.DRAFT },
    });

    await this.auditLog.record({
      action: "TOUR_UNPUBLISH",
      actorUserId: user.id,
      actorUsername: user.username ?? user.fullName,
      resourceType: "TourNode",
      resourceId: null,
      diffJson: { unpublishedCount: result.count },
    });

    return {
      success: true,
      message: `Đã chuyển ${result.count} cảnh 360° về chế độ Bản nháp (DRAFT).`,
      unpublishedCount: result.count,
    };
  }
}

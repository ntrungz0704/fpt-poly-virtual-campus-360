import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AI_PLACEHOLDER_BLOCKED_ERROR_CODE,
  evaluateAiPlaceholderGoLiveStatus,
  type ApiErrorDetail,
} from "@fpt-campus/shared";
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

const TOUR_PANORAMA_SAFE_SELECT = {
  id: true,
  assetKind: true,
  originalFilename: true,
  originalObjectKey: true,
  optimizedDesktopKey: true,
  optimizedMobileKey: true,
  thumbnailKey: true,
  isValid2To1: true,
  isPreviewApproved: true,
  processingStatus: true,
  cameraMetadata: true,
} satisfies Prisma.MediaAssetSelect;

interface PublishCandidateNode {
  id: string;
  slug: string;
  title: string;
  panoramaAsset: {
    id: string;
    deletedAt: Date | null;
    processingStatus: string;
    isValid2To1: boolean;
    isPreviewApproved: boolean;
    cameraMetadata: Prisma.JsonValue;
  } | null;
  location: {
    id: string;
    deletedAt: Date | null;
    status: PublishStatus;
    building: {
      id: string;
      deletedAt: Date | null;
      status: PublishStatus;
    } | null;
  } | null;
}

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
        panoramaAsset: {
          select: TOUR_PANORAMA_SAFE_SELECT,
        },
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
   * Enforces D-02 / DEC-M1-A Go-Live gates before any TourNode can transition to PUBLISHED.
   */
  private assertNodesReadyForPublish(nodes: PublishCandidateNode[]): void {
    if (nodes.length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Không có cảnh 360° hợp lệ để xuất bản.",
      });
    }

    const aiPlaceholderDetails: ApiErrorDetail[] = [];
    const readinessDetails: ApiErrorDetail[] = [];

    for (const node of nodes) {
      const metadata =
        typeof node.panoramaAsset?.cameraMetadata === "object" &&
        node.panoramaAsset?.cameraMetadata !== null &&
        !Array.isArray(node.panoramaAsset.cameraMetadata)
          ? (node.panoramaAsset.cameraMetadata as Record<string, unknown>)
          : null;

      const aiEval = evaluateAiPlaceholderGoLiveStatus({
        nodeId: node.id,
        nodeSlug: node.slug,
        cameraMetadata: metadata,
      });

      if (aiEval.isGoLiveBlocked && aiEval.validationIssue) {
        aiPlaceholderDetails.push({
          field: node.slug,
          message: aiEval.validationIssue.message,
        });
        continue;
      }

      if (
        !node.panoramaAsset ||
        node.panoramaAsset.deletedAt !== null ||
        node.panoramaAsset.processingStatus !== "READY" ||
        !node.panoramaAsset.isValid2To1 ||
        !node.panoramaAsset.isPreviewApproved
      ) {
        readinessDetails.push({
          field: node.slug,
          message: `Cảnh "${node.title}" có ảnh panorama chưa sẵn sàng (cần processingStatus=READY, tỷ lệ 2:1 hợp lệ và isPreviewApproved=true).`,
        });
      }

      if (
        !node.location ||
        node.location.deletedAt !== null ||
        node.location.status !== PublishStatus.PUBLISHED
      ) {
        readinessDetails.push({
          field: node.slug,
          message: `Cảnh "${node.title}" gắn với địa điểm chưa ở trạng thái PUBLISHED.`,
        });
      }

      if (
        !node.location?.building ||
        node.location.building.deletedAt !== null ||
        node.location.building.status !== PublishStatus.PUBLISHED
      ) {
        readinessDetails.push({
          field: node.slug,
          message: `Cảnh "${node.title}" thuộc tòa nhà chưa ở trạng thái PUBLISHED.`,
        });
      }
    }

    if (aiPlaceholderDetails.length > 0) {
      throw new UnprocessableEntityException({
        code: AI_PLACEHOLDER_BLOCKED_ERROR_CODE,
        message:
          "Không thể xuất bản Tour 360° vì có cảnh đang sử dụng ảnh AI synthetic placeholder. Bắt buộc thay thế bằng ảnh 360° QTSC thật trước khi Go-Live.",
        details: aiPlaceholderDetails,
      });
    }

    if (readinessDetails.length > 0) {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message:
          "Không thể xuất bản Tour 360° vì một số cảnh chưa đáp ứng điều kiện media/địa điểm công khai.",
        details: readinessDetails,
      });
    }
  }

  /**
   * Create a new tour node / scene.
   */
  async createNode(user: AuthenticatedUser, dto: CreateTourNodeDto) {
    const existing = await this.prisma.tourNode.findFirst({
      where: { slug: dto.slug, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `Slug '${dto.slug}' already exists.`,
      });
    }

    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: dto.panoramaAssetId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: `Không tìm thấy MediaAsset panorama '${dto.panoramaAssetId}'.`,
      });
    }
    if (asset.assetKind !== "PANORAMA_2_1") {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "MediaAsset của TourNode phải thuộc loại PANORAMA_2_1.",
      });
    }

    let locationId = dto.locationId;
    if (locationId) {
      const targetLocation = await this.prisma.location.findFirst({
        where: { id: locationId, deletedAt: null },
      });
      if (!targetLocation) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: `Không tìm thấy địa điểm '${locationId}'.`,
        });
      }
    } else {
      const defaultLoc = await this.prisma.location.findFirst({
        where: { deletedAt: null },
      });
      if (!defaultLoc) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "No location found in database. Please create a location first.",
        });
      }
      locationId = defaultLoc.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.tourNode.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          intro: dto.intro,
          category: dto.category ?? "study",
          locationId: locationId!,
          panoramaAssetId: dto.panoramaAssetId,
          initialYaw: dto.initialYaw ?? 0,
          initialPitch: dto.initialPitch ?? 0,
          initialFov: dto.initialFov ?? 75,
          status: PublishStatus.DRAFT,
        },
        include: {
          panoramaAsset: {
            select: TOUR_PANORAMA_SAFE_SELECT,
          },
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
        tx,
      });

      return created;
    });
  }

  /**
   * Update tour node parameters (angles, FOV, titles, status).
   */
  async updateNode(user: AuthenticatedUser, id: string, dto: UpdateTourNodeDto) {
    const existing = await this.prisma.tourNode.findUnique({
      where: { id },
      include: {
        panoramaAsset: {
          select: {
            id: true,
            deletedAt: true,
            processingStatus: true,
            isValid2To1: true,
            isPreviewApproved: true,
            cameraMetadata: true,
          },
        },
        location: {
          select: {
            id: true,
            deletedAt: true,
            status: true,
            building: {
              select: {
                id: true,
                deletedAt: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Tour node with ID ${id} not found.`);
    }

    if (dto.status === PublishStatus.PUBLISHED) {
      this.assertNodesReadyForPublish([existing]);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tourNode.update({
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
          panoramaAsset: {
            select: TOUR_PANORAMA_SAFE_SELECT,
          },
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
        tx,
      });

      return updated;
    });
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

    return this.prisma.$transaction(async (tx) => {
      let hotspot;
      if (dto.id) {
        const ownedHotspot = await tx.hotspot.findFirst({
          where: { id: dto.id, nodeId },
        });
        if (!ownedHotspot) {
          throw new NotFoundException({
            code: "NOT_FOUND",
            message: `Hotspot ${dto.id} not found on node ${nodeId}.`,
          });
        }

        hotspot = await tx.hotspot.update({
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
        hotspot = await tx.hotspot.create({
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
        tx,
      });

      return hotspot;
    });
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
   * Publish tour node (or all nodes) after enforcing Go-Live media & hierarchy guards.
   */
  async publishTour(user: AuthenticatedUser, nodeIds?: string[]) {
    const uniqueNodeIds =
      nodeIds && nodeIds.length > 0 ? Array.from(new Set(nodeIds)) : undefined;

    const whereClause = uniqueNodeIds
      ? { id: { in: uniqueNodeIds }, deletedAt: null }
      : { deletedAt: null };

    const candidateNodes = await this.prisma.tourNode.findMany({
      where: whereClause,
      include: {
        panoramaAsset: {
          select: {
            id: true,
            deletedAt: true,
            processingStatus: true,
            isValid2To1: true,
            isPreviewApproved: true,
            cameraMetadata: true,
          },
        },
        location: {
          select: {
            id: true,
            deletedAt: true,
            status: true,
            building: {
              select: {
                id: true,
                deletedAt: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (uniqueNodeIds && candidateNodes.length !== uniqueNodeIds.length) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Một hoặc nhiều cảnh 360° được chọn không tồn tại hoặc đã bị xóa.",
      });
    }

    this.assertNodesReadyForPublish(candidateNodes);

    const targetIds = candidateNodes.map((n) => n.id);
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tourNode.updateMany({
        where: { id: { in: targetIds }, deletedAt: null },
        data: { status: PublishStatus.PUBLISHED },
      });

      await this.auditLog.record({
        action: "TOUR_PUBLISH",
        actorUserId: user.id,
        actorUsername: user.username ?? user.fullName,
        resourceType: "TourNode",
        resourceId: targetIds.length === 1 ? targetIds[0] : null,
        diffJson: { publishedCount: updated.count, nodeIds: targetIds },
        tx,
      });

      return updated;
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
